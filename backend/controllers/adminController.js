const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { generateInvoicePdf } = require("../services/invoiceService");
const { attemptOrderRefund } = require("../services/orderRefundService");
const { restoreInventory } = require("../services/inventoryService");

const availableStockExpression = {
  $sum: {
    $map: {
      input: {
        $filter: {
          input: { $ifNull: ["$inventoryVariants", []] },
          as: "variant",
          cond: { $eq: ["$$variant.active", true] },
        },
      },
      as: "variant",
      in: "$$variant.stock",
    },
  },
};

const queryLowStockProducts = (threshold, limit) => {
  const pipeline = [
    { $set: { stock: availableStockExpression } },
    { $match: { $expr: { $lte: ["$stock", threshold] } } },
    { $sort: { stock: 1, createdAt: -1 } },
  ];
  if (limit) pipeline.push({ $limit: limit });
  return Product.aggregate(pipeline);
};

const allowedTransitions = {
  PLACED: ["CONFIRMED"],
  CONFIRMED: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parsePage = (value) => Math.max(parseInt(value, 10) || 1, 1);
const parseLimit = (value) => Math.min(Math.max(parseInt(value, 10) || 20, 1), 100);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDashboard = async (req, res, next) => {
  try {
    const lowStockThreshold = 5;
    const [revenueResult, totalOrders, totalCustomers, totalProducts, pendingOrders, lowStockProducts, recentOrders] = await Promise.all([
      Order.aggregate([
        { $match: { orderStatus: { $nin: ["CANCELLED", "REFUNDED"] } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: ["PLACED", "CONFIRMED", "PROCESSING"] } }),
      queryLowStockProducts(lowStockThreshold, 8),
      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(6)
        .select("orderNumber user totalAmount orderStatus paymentStatus createdAt"),
    ]);

    res.json({
      success: true,
      metrics: {
        totalRevenue: revenueResult[0]?.totalRevenue || 0,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockProducts = async (req, res, next) => {
  try {
    const threshold = Math.min(Math.max(Number(req.query.threshold) || 5, 0), 100);
    const products = await queryLowStockProducts(threshold);

    res.json({ success: true, threshold, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

const getAdminOrders = async (req, res, next) => {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const filter = {};
    const search = req.query.search?.trim();
    const status = req.query.status?.trim();

    if (status) filter.orderStatus = status;
    if (search) {
      const pattern = new RegExp(escapeRegex(search).slice(0, 100), "i");
      filter.$or = [
        { orderNumber: pattern },
        { "shippingAddress.fullName": pattern },
        { "shippingAddress.mobile": pattern },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email mobile")
        .populate("cancelledBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "orderNumber user items totalAmount orderStatus paymentStatus paymentMethod createdAt cancellationReason cancellationNote cancelledAt cancelledBy cancellationInitiator inventoryRestoreIssues refundStatus refundProvider providerRefundId refundFailureReason",
        ),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    next(error);
  }
};

const getAdminOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError("Order not found.", 404);
    const order = await Order.findById(req.params.id).populate("user", "name email mobile createdAt");
    if (!order) throw createError("Order not found.", 404);
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const getAdminOrderInvoice = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw createError("Order not found.", 404);
    }

    const order = await Order.findById(req.params.id).populate("user", "name email mobile createdAt");
    if (!order) throw createError("Order not found.", 404);

    const pdf = await generateInvoicePdf(order);
    const invoiceNumber = order.invoiceNumber || order.orderNumber || `INV-${String(order._id).slice(-12)}`;
    const safeFileName = String(invoiceNumber)
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName || "stylekart-invoice"}.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(pdf);
  } catch (error) {
    next(error);
  }
};

const restoreOrderStock = async (order, session) => {
  if (!order.inventoryDeducted || order.inventoryRestoredAt) return;

  order.inventoryRestoreIssues = await restoreInventory(order.items, session);
  order.inventoryRestoredAt = new Date();
};

const updateOrderStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const nextStatus = String(req.body.orderStatus || "").trim();
    if (!nextStatus) throw createError("Select an order status.");
    if (!mongoose.isValidObjectId(req.params.id)) throw createError("Order not found.", 404);

    await session.startTransaction();
    const order = await Order.findById(req.params.id).session(session);
    if (!order) throw createError("Order not found.", 404);

    if (!allowedTransitions[order.orderStatus]?.includes(nextStatus)) {
      throw createError(`Cannot change an ${order.orderStatus} order to ${nextStatus}.`);
    }

    if (nextStatus === "RETURNED") await restoreOrderStock(order, session);

    order.orderStatus = nextStatus;
    if (nextStatus === "DELIVERED" && order.paymentMethod === "COD") order.paymentStatus = "PAID";
    if (nextStatus === "REFUNDED") order.paymentStatus = "REFUNDED";
    await order.save({ session });
    await session.commitTransaction();

    res.json({ success: true, message: "Order status updated successfully.", order });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};

const retryOrderRefund = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw createError("Order not found.", 404);
    }

    const order = await Order.findById(req.params.id);
    if (!order) throw createError("Order not found.", 404);
    if (
      order.orderStatus !== "CANCELLED" ||
      !["PENDING", "FAILED", "PROCESSING"].includes(order.refundStatus)
    ) {
      throw createError("This order does not have a retryable refund.", 409);
    }

    const updatedOrder = await attemptOrderRefund(order._id);
    res.json({
      success: true,
      message:
        updatedOrder.refundStatus === "PROCESSED"
          ? "Refund confirmed as processed by Razorpay."
          : updatedOrder.refundStatus === "FAILED"
            ? "Refund failed. Review the provider status before retrying."
            : "Refund status reconciled; it is still pending.",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const filter = { role: "user" };
    const search = req.query.search?.trim();

    if (search) {
      const pattern = new RegExp(escapeRegex(search).slice(0, 100), "i");
      filter.$or = [{ name: pattern }, { email: pattern }, { mobile: pattern }];
    }

    const [customers, total] = await Promise.all([
      User.find(filter).select("name email mobile createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);

    const stats = await Order.aggregate([
      { $match: { user: { $in: customers.map((customer) => customer._id) } } },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $in: ["$orderStatus", ["CANCELLED", "REFUNDED"]] }, 0, "$totalAmount"],
            },
          },
        },
      },
    ]);
    const statsByCustomer = new Map(stats.map((stat) => [String(stat._id), stat]));
    const results = customers.map((customer) => ({
      ...customer.toObject(),
      orderCount: statsByCustomer.get(String(customer._id))?.orderCount || 0,
      totalSpent: statsByCustomer.get(String(customer._id))?.totalSpent || 0,
    }));

    res.json({ success: true, customers: results, pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError("Customer not found.", 404);
    const customer = await User.findOne({ _id: req.params.id, role: "user" }).select("name email mobile createdAt");
    if (!customer) throw createError("Customer not found.", 404);
    const orders = await Order.find({ user: customer._id })
      .sort({ createdAt: -1 })
      .select(
        "orderNumber items totalAmount orderStatus paymentStatus paymentMethod createdAt cancellationReason cancellationNote cancelledAt cancellationInitiator refundStatus providerRefundId",
      );
    res.json({ success: true, customer, orders });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getLowStockProducts,
  getAdminOrders,
  getAdminOrder,
  getAdminOrderInvoice,
  updateOrderStatus,
  retryOrderRefund,
  getCustomers,
  getCustomer,
};
