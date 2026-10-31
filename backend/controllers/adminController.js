const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { generateInvoicePdf } = require("../services/invoiceService");
const { attemptOrderRefund } = require("../services/orderRefundService");
const { restoreInventory } = require("../services/inventoryService");
const {
  validateRevisedDeliveryWindow,
} = require("../services/deliveryEstimateService");
const {
  canTransitionOrderStatus,
  recordFulfillmentEvent,
} = require("../services/orderFulfillmentService");

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

const queryDashboardInventory = (threshold, limit) =>
  Product.aggregate([
    { $set: { stock: availableStockExpression } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              lowStockCount: {
                $sum: { $cond: [{ $lte: ["$stock", threshold] }, 1, 0] },
              },
              outOfStockCount: {
                $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] },
              },
            },
          },
        ],
        products: [
          { $match: { $expr: { $lte: ["$stock", threshold] } } },
          { $sort: { stock: 1, createdAt: -1 } },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              id: 1,
              company: 1,
              item_name: 1,
              category: 1,
              current_price: 1,
              stock: 1,
            },
          },
        ],
      },
    },
  ]);

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
    const trendStart = new Date();
    trendStart.setUTCHours(0, 0, 0, 0);
    trendStart.setUTCDate(trendStart.getUTCDate() - 29);
    const paidSalesFilter = {
      paymentStatus: "PAID",
      orderStatus: { $nin: ["CANCELLED", "REFUNDED"] },
    };

    const [salesResult, totalOrders, totalCustomers, totalProducts, pendingOrders, inventoryResult, recentOrders] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            $or: [
              paidSalesFilter,
              { createdAt: { $gte: trendStart } },
            ],
          },
        },
        {
          $facet: {
            revenue: [
              { $match: paidSalesFilter },
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: "$totalAmount" },
                },
              },
              { $project: { _id: 0, totalRevenue: 1 } },
            ],
            trends: [
              {
                $match: {
                  ...paidSalesFilter,
                  createdAt: { $gte: trendStart },
                },
              },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$createdAt",
                    },
                  },
                  revenue: { $sum: "$totalAmount" },
                  orders: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
              {
                $project: {
                  _id: 0,
                  date: "$_id",
                  revenue: 1,
                  orders: 1,
                },
              },
            ],
            orderTrend: [
              { $match: { createdAt: { $gte: trendStart } } },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$createdAt",
                    },
                  },
                  orders: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
              {
                $project: {
                  _id: 0,
                  date: "$_id",
                  orders: 1,
                },
              },
            ],
            bestSellingProducts: [
              { $match: paidSalesFilter },
              { $unwind: "$items" },
              {
                $group: {
                  _id: "$items.productId",
                  name: { $first: "$items.itemName" },
                  quantitySold: { $sum: "$items.quantity" },
                },
              },
              { $sort: { quantitySold: -1, _id: 1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 0,
                  productId: "$_id",
                  name: 1,
                  quantitySold: 1,
                },
              },
            ],
            categoryPerformance: [
              { $match: paidSalesFilter },
              { $unwind: "$items" },
              {
                $lookup: {
                  from: Product.collection.name,
                  localField: "items.productId",
                  foreignField: "id",
                  as: "product",
                },
              },
              { $unwind: "$product" },
              {
                $group: {
                  _id: "$product.category",
                  quantitySold: { $sum: "$items.quantity" },
                },
              },
              { $sort: { quantitySold: -1, _id: 1 } },
              { $limit: 6 },
              {
                $project: {
                  _id: 0,
                  category: "$_id",
                  quantitySold: 1,
                },
              },
            ],
          },
        },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: ["PLACED", "CONFIRMED", "PROCESSING"] } }),
      queryDashboardInventory(lowStockThreshold, 8),
      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(6)
        .select("orderNumber user totalAmount orderStatus paymentStatus createdAt"),
    ]);
    const sales = salesResult[0] || {};
    const inventory = inventoryResult[0] || {};
    const inventorySummary = inventory.summary?.[0] || {};
    const revenueByDate = new Map(
      (sales.trends || []).map((trend) => [trend.date, trend]),
    );
    const ordersByDate = new Map(
      (sales.orderTrend || []).map((trend) => [trend.date, trend.orders]),
    );
    const dailyTrends = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(trendStart);
      date.setUTCDate(date.getUTCDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const revenueTrend = revenueByDate.get(dateKey);

      return {
        date: dateKey,
        revenue: revenueTrend?.revenue || 0,
        orders: ordersByDate.get(dateKey) || 0,
      };
    });

    res.json({
      success: true,
      metrics: {
        totalRevenue: sales.revenue?.[0]?.totalRevenue || 0,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockCount: inventorySummary.lowStockCount || 0,
        outOfStockCount: inventorySummary.outOfStockCount || 0,
      },
      revenueTrend: dailyTrends.map(({ date, revenue }) => ({ date, revenue })),
      orderTrend: dailyTrends.map(({ date, orders }) => ({ date, orders })),
      bestSellingProducts: sales.bestSellingProducts || [],
      categoryPerformance: sales.categoryPerformance || [],
      lowStockProducts: inventory.products || [],
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
          "orderNumber user items totalAmount orderStatus paymentStatus paymentMethod createdAt deliveryEstimate fulfillmentEvents deliveryTracking cancellationReason cancellationNote cancelledAt cancelledBy cancellationInitiator inventoryRestoreIssues refundStatus refundProvider providerRefundId refundFailureReason",
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
    const hasTrackingReference = Object.prototype.hasOwnProperty.call(
      req.body,
      "trackingReference",
    );
    const revisionFields = [
      "revisedDeliveryStartDate",
      "revisedDeliveryEndDate",
      "delayReason",
    ];
    const hasRevision = revisionFields.some((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field),
    );
    if (!nextStatus && !hasTrackingReference && !hasRevision) {
      throw createError("Provide a status or a tracking update.");
    }
    if (!mongoose.isValidObjectId(req.params.id)) throw createError("Order not found.", 404);

    await session.startTransaction();
    const order = await Order.findById(req.params.id).session(session);
    if (!order) throw createError("Order not found.", 404);

    if (
      nextStatus &&
      !canTransitionOrderStatus(order.orderStatus, nextStatus)
    ) {
      throw createError(`Cannot change an ${order.orderStatus} order to ${nextStatus}.`);
    }

    const effectiveStatus = nextStatus || order.orderStatus;
    if (hasTrackingReference) {
      if (!order.deliveryTracking) order.deliveryTracking = {};
      const trackingReference = req.body.trackingReference.trim();
      if (trackingReference.length > 100) {
        throw createError("Tracking reference must be 100 characters or fewer.");
      }
      if (
        trackingReference &&
        !["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(effectiveStatus)
      ) {
        throw createError("A tracking reference can only be recorded after shipment.");
      }
      order.deliveryTracking.trackingReference = trackingReference;
      order.deliveryTracking.mode = "MANUAL";
    }

    if (hasRevision) {
      if (
        revisionFields.some(
          (field) => !Object.prototype.hasOwnProperty.call(req.body, field),
        )
      ) {
        throw createError("Provide both revised delivery dates and a delay reason.");
      }
      if (
        ["CANCELLED", "DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(
          effectiveStatus,
        )
      ) {
        throw createError("A delivery estimate cannot be revised for this order status.");
      }

      if (!order.deliveryEstimate) order.deliveryEstimate = {};
      const { deliveryEstimate } = order;
      if (!deliveryEstimate.originalStartDate || !deliveryEstimate.originalEndDate) {
        throw createError("This order does not have an original delivery estimate.");
      }
      const revisedWindow = validateRevisedDeliveryWindow({
        startDate: req.body.revisedDeliveryStartDate,
        endDate: req.body.revisedDeliveryEndDate,
        delayReason: req.body.delayReason,
        originalStartDate: deliveryEstimate.originalStartDate,
        originalEndDate: deliveryEstimate.originalEndDate,
        previousStartDate: deliveryEstimate.revisedStartDate,
        previousEndDate: deliveryEstimate.revisedEndDate,
      });

      deliveryEstimate.revisedStartDate = revisedWindow.startDate;
      deliveryEstimate.revisedEndDate = revisedWindow.endDate;
      deliveryEstimate.revisedAt = new Date();
      deliveryEstimate.delayReason = revisedWindow.delayReason;
    }

    if (nextStatus === "RETURNED") await restoreOrderStock(order, session);

    if (nextStatus) {
      const occurredAt = new Date();
      order.orderStatus = nextStatus;
      recordFulfillmentEvent(order, nextStatus, occurredAt);
      if (nextStatus === "DELIVERED" && order.paymentMethod === "COD") {
        order.paymentStatus = "PAID";
      }
      if (nextStatus === "REFUNDED") order.paymentStatus = "REFUNDED";
    }
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
        "orderNumber items totalAmount orderStatus paymentStatus paymentMethod createdAt deliveryEstimate fulfillmentEvents deliveryTracking cancellationReason cancellationNote cancelledAt cancellationInitiator refundStatus providerRefundId",
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
