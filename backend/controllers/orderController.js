const crypto = require("crypto");
const mongoose = require("mongoose");

const Address = require("../models/Address");
const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { generateInvoicePdf } = require("../services/invoiceService");
const { findValidCoupon, normalizeCode } = require("../services/couponService");
const { attemptOrderRefund } = require("../services/orderRefundService");
const {
  deductInventory,
  restoreInventory,
} = require("../services/inventoryService");

const cancellationReasons = [
  "Ordered by mistake",
  "Found a better price",
  "Wrong item or size",
  "Delivery taking too long",
  "Changed my mind",
  "Other",
];
const cancellableStatuses = ["PLACED", "CONFIRMED", "PROCESSING"];
const customerOrderProjection =
  "-inventoryDeducted -inventoryRestoreIssues -refundFailureReason -refundRequestStartedAt -refundRequestUncertain";

const createOrderNumber = () =>
  `SK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const createInvoiceNumber = () =>
  `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "orderNumber items totalAmount orderStatus paymentStatus paymentMethod createdAt cancellationReason cancellationNote cancelledAt cancellationInitiator refundStatus providerRefundId",
      );

    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

const getOrderInvoice = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

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

const getOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).select(customerOrderProjection);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { reason, note = "" } = req.body;
    const orderId = req.params.id;

    if (!mongoose.isValidObjectId(orderId)) {
      throw badRequest("Order identifier is invalid.");
    }
    if (typeof reason !== "string" || !cancellationReasons.includes(reason)) {
      throw badRequest("Select a valid cancellation reason.");
    }
    if (typeof note !== "string" || note.trim().length > 500) {
      throw badRequest("Cancellation note must be 500 characters or fewer.");
    }

    let shouldAttemptRefund = false;

    await session.withTransaction(async () => {
      const existingOrder = await Order.findOne({
        _id: orderId,
        user: req.user.id,
      }).session(session);

      if (!existingOrder) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      if (existingOrder.orderStatus === "CANCELLED") {
        return;
      }

      if (!cancellableStatuses.includes(existingOrder.orderStatus)) {
        const error = new Error(
          "This order can no longer be cancelled because it has been shipped or completed.",
        );
        error.statusCode = 409;
        throw error;
      }

      const now = new Date();
      const refundFields = {};
      const refundStatus =
        existingOrder.paymentMethod === "RAZORPAY" &&
        existingOrder.paymentStatus === "PAID"
          ? "PENDING"
          : "NOT_REQUIRED";
      if (refundStatus === "PENDING") refundFields.refundProvider = "RAZORPAY";
      const cancellationUpdate = await Order.updateOne(
        {
          _id: orderId,
          user: req.user.id,
          orderStatus: existingOrder.orderStatus,
          inventoryRestoredAt: { $exists: false },
        },
        {
          $set: {
            orderStatus: "CANCELLED",
            cancellationReason: reason,
            cancellationNote: note.trim(),
            cancelledAt: now,
            cancelledBy: req.user.id,
            cancellationInitiator: "CUSTOMER",
            inventoryRestoreIssues: [],
            inventoryRestoredAt: now,
            refundStatus,
            ...refundFields,
          },
        },
        { session },
      );

      if (cancellationUpdate.modifiedCount !== 1) {
        const error = new Error(
          "The order changed while cancellation was being processed. Refresh and try again.",
        );
        error.statusCode = 409;
        throw error;
      }

      if (existingOrder.inventoryDeducted) {
        const inventoryRestoreIssues = await restoreInventory(
          existingOrder.items,
          session,
        );
        if (inventoryRestoreIssues.length > 0) {
          await Order.updateOne(
            { _id: orderId },
            { $set: { inventoryRestoreIssues } },
            { session },
          );
        }
      }

      shouldAttemptRefund = refundStatus === "PENDING";
    });

    if (shouldAttemptRefund) {
      await attemptOrderRefund(orderId);
    }

    const customerOrder = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    }).select(customerOrderProjection);

    res.json({
      success: true,
      message:
        customerOrder.refundStatus === "FAILED"
          ? "Order cancelled. The refund needs attention and can be retried by support."
          : customerOrder.refundStatus === "PENDING" ||
              customerOrder.refundStatus === "PROCESSING"
            ? "Order cancelled. The refund is being processed."
            : "Order cancelled successfully.",
      order: customerOrder,
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const {
      addressId,
      items,
      paymentMethod = "COD",
      couponCode = "",
      idempotencyKey,
    } = req.body;

    if (
      typeof addressId !== "string" ||
      !mongoose.isValidObjectId(addressId) ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      throw badRequest("A delivery address and at least one cart item are required.");
    }

    if (paymentMethod !== "COD") {
      throw badRequest("Use the Razorpay checkout for online payments or choose Cash on Delivery.");
    }
    if (
      typeof idempotencyKey !== "string" ||
      idempotencyKey.trim().length < 16 ||
      idempotencyKey.trim().length > 100
    ) {
      throw badRequest("A valid checkout request key is required. Refresh and try again.");
    }

    const address = await Address.findOne({ _id: addressId, user: req.user.id }).session(session);

    if (!address) {
      throw badRequest("Select one of your saved delivery addresses.");
    }

    const allowedItemFields = [
      "productId",
      "quantity",
      "selectedSize",
      "selectedColor",
    ];
    const requestedItems = items.map((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        Object.keys(item).some((field) => !allowedItemFields.includes(field)) ||
        typeof item.productId !== "string" ||
        typeof item.quantity !== "number" ||
        (item.selectedSize !== undefined && typeof item.selectedSize !== "string") ||
        (item.selectedColor !== undefined && typeof item.selectedColor !== "string")
      ) {
        return null;
      }

      return {
        productId: item.productId.trim(),
        quantity: item.quantity,
        selectedSize: item.selectedSize?.trim() || "",
        selectedColor: item.selectedColor?.trim() || "",
      };
    });

    if (requestedItems.some((item) =>
      !item ||
      !item.productId ||
      item.productId.length > 100 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    )) {
      throw badRequest("Cart items contain an invalid quantity or product.");
    }

    if (typeof couponCode !== "string" || couponCode.length > 30) {
      throw badRequest("Coupon code is invalid.");
    }

    const requestHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          addressId,
          items: [...requestedItems].sort((a, b) =>
            `${a.productId}:${a.selectedSize}:${a.selectedColor}`.localeCompare(
              `${b.productId}:${b.selectedSize}:${b.selectedColor}`,
            ),
          ),
          couponCode: normalizeCode(couponCode),
          paymentMethod,
        }),
      )
      .digest("hex");
    const existingOrder = await Order.findOne({
      user: req.user.id,
      idempotencyKey: idempotencyKey.trim(),
    }).select("+idempotencyHash");
    if (existingOrder) {
      if (existingOrder.idempotencyHash !== requestHash) {
        throw badRequest(
          "This checkout request key was already used for different order details.",
          409,
        );
      }
      await Cart.updateOne({ user: req.user.id }, { $set: { items: [] } });
      return res.json({ success: true, order: existingOrder });
    }

    await session.startTransaction();

    const orderItems = [];
    let totalMrp = 0;
    let subtotal = 0;

    for (const requestedItem of requestedItems) {
      const product = await Product.findOne({ id: requestedItem.productId }).session(session);

      if (!product) {
        throw badRequest(`Product ${requestedItem.productId} is no longer available.`);
      }

      if (product.sizes.length > 0 && !product.sizes.includes(requestedItem.selectedSize)) {
        throw badRequest(`Select a valid size for ${product.item_name}.`);
      }

      if (product.colors.length > 0 && !product.colors.includes(requestedItem.selectedColor)) {
        throw badRequest(`Select a valid color for ${product.item_name}.`);
      }

      const variant = product.inventoryVariants.find(
        (inventoryVariant) =>
          inventoryVariant.active &&
          inventoryVariant.size === requestedItem.selectedSize &&
          inventoryVariant.color === requestedItem.selectedColor,
      );
      if (!variant) {
        throw badRequest(
          `Inventory is not configured for ${product.item_name} and the selected options.`,
          409,
        );
      }

      totalMrp += product.original_price * requestedItem.quantity;
      subtotal += product.current_price * requestedItem.quantity;
      orderItems.push({
        productId: product.id,
        itemName: product.item_name,
        image: product.image,
        quantity: requestedItem.quantity,
        selectedSize: requestedItem.selectedSize,
        selectedColor: requestedItem.selectedColor,
        unitPrice: product.current_price,
        originalUnitPrice: product.original_price,
      });
    }

    await deductInventory(orderItems, session);

    let couponDiscount = 0;
    let appliedCouponCode = "";

    if (couponCode) {
      const couponResult = await findValidCoupon(couponCode, subtotal, session);
      if (couponResult.error) {
        throw badRequest(couponResult.error);
      }

      const normalizedCouponCode = normalizeCode(couponCode);
      const couponUsage = await Coupon.updateOne(
        {
          code: normalizedCouponCode,
          active: true,
          expiryDate: { $gt: new Date() },
          usedCount: { $lt: couponResult.coupon.usageLimit },
        },
        { $inc: { usedCount: 1 } },
        { session },
      );

      if (couponUsage.modifiedCount !== 1) {
        throw badRequest("This coupon is no longer available.");
      }

      couponDiscount = couponResult.discount;
      appliedCouponCode = normalizedCouponCode;
    }

    const discount = totalMrp - subtotal;
    const delivery = subtotal >= 999 ? 0 : 99;
    const order = await Order.create(
      [{
        orderNumber: createOrderNumber(),
        idempotencyKey: idempotencyKey.trim(),
        idempotencyHash: requestHash,
        invoiceNumber: createInvoiceNumber(),
        user: req.user.id,
        items: orderItems,
        shippingAddress: address.toObject(),
        paymentMethod,
        inventoryDeducted: true,
        priceSummary: {
          totalMrp,
          discount,
          couponCode: appliedCouponCode,
          couponDiscount,
          delivery,
          subtotal,
        },
        totalAmount: subtotal - couponDiscount + delivery,
      }],
      { session },
    );

    await Cart.updateOne(
      { user: req.user.id },
      { $set: { items: [] } },
      { session },
    );

    await session.commitTransaction();

    res.status(201).json({ success: true, order: order[0] });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (error.code === 11000 && req.body.idempotencyKey) {
      const concurrentOrder = await Order.findOne({
        user: req.user.id,
        idempotencyKey: req.body.idempotencyKey,
      });
      if (concurrentOrder) {
        const requestHash = crypto
          .createHash("sha256")
          .update(
            JSON.stringify({
              addressId: req.body.addressId,
              items: (Array.isArray(req.body.items) ? req.body.items : [])
                .map((item) => ({
                  productId: String(item?.productId || "").trim(),
                  quantity: item?.quantity,
                  selectedSize: String(item?.selectedSize || "").trim(),
                  selectedColor: String(item?.selectedColor || "").trim(),
                }))
                .sort((a, b) =>
                  `${a.productId}:${a.selectedSize}:${a.selectedColor}`.localeCompare(
                    `${b.productId}:${b.selectedSize}:${b.selectedColor}`,
                  ),
                ),
              couponCode: normalizeCode(String(req.body.couponCode || "")),
              paymentMethod: req.body.paymentMethod || "COD",
            }),
          )
          .digest("hex");
        const storedOrder = await Order.findById(concurrentOrder._id).select(
          "+idempotencyHash",
        );
        if (storedOrder?.idempotencyHash === requestHash) {
          return res.json({ success: true, order: concurrentOrder });
        }
      }
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getOrders,
  getOrder,
  getOrderInvoice,
  createOrder,
  cancelOrder,
};