const mongoose = require("mongoose");

const Address = require("../models/Address");
const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const PaymentAttempt = require("../models/PaymentAttempt");
const { findValidCoupon, normalizeCode } = require("./couponService");
const {
  createInventoryError,
  getVariantStock,
} = require("./inventoryService");
const {
  createInitialDeliveryData,
} = require("./deliveryEstimateService");

const badRequest = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createOrderNumber = () =>
  `SK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw badRequest("At least one valid cart item is required.");
  }

  const normalized = items.map((item) => ({
    productId: String(item?.productId || "").trim(),
    quantity: Number(item?.quantity),
    selectedSize: String(item?.selectedSize || "").trim(),
    selectedColor: String(item?.selectedColor || "").trim(),
  }));

  if (normalized.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw badRequest("Cart items contain an invalid quantity or product.");
  }

  return normalized;
};

const getCheckoutSnapshot = async ({ userId, addressId, items, couponCode = "" }) => {
  if (!addressId || !mongoose.isValidObjectId(addressId)) {
    throw badRequest("Select a valid delivery address.");
  }

  const requestedItems = normalizeItems(items);
  const address = await Address.findOne({ _id: addressId, user: userId }).lean();

  if (!address) {
    throw badRequest("Select one of your saved delivery addresses.");
  }

  const orderItems = [];
  let totalMrp = 0;
  let subtotal = 0;

  for (const requestedItem of requestedItems) {
    const product = await Product.findOne({ id: requestedItem.productId }).lean();

    if (!product) throw badRequest(`Product ${requestedItem.productId} is no longer available.`);
    if (Array.isArray(product.sizes) && product.sizes.length > 0 && !product.sizes.includes(requestedItem.selectedSize)) {
      throw badRequest(`Select a valid size for ${product.item_name}.`);
    }
    if (Array.isArray(product.colors) && product.colors.length > 0 && !product.colors.includes(requestedItem.selectedColor)) {
      throw badRequest(`Select a valid color for ${product.item_name}.`);
    }
    const availableStock = getVariantStock(
      product,
      requestedItem.selectedSize,
      requestedItem.selectedColor,
    );
    if (availableStock < requestedItem.quantity) {
      if (!product.inventoryVariants?.some((variant) =>
        variant.active &&
        variant.size === requestedItem.selectedSize &&
        variant.color === requestedItem.selectedColor,
      )) {
        throw createInventoryError(
          `Inventory is not configured for ${product.item_name} and the selected options.`,
          409,
        );
      }
      throw createInventoryError(
        `${product.item_name} has only ${availableStock} item(s) available for the selected options.`,
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

  let couponDiscount = 0;
  let appliedCouponCode = "";
  if (String(couponCode || "").trim()) {
    const couponResult = await findValidCoupon(couponCode, subtotal);
    if (couponResult.error) throw badRequest(couponResult.error);
    couponDiscount = couponResult.discount;
    appliedCouponCode = normalizeCode(couponCode);
  }

  const discount = totalMrp - subtotal;
  const delivery = subtotal >= 999 ? 0 : 99;
  const totalAmount = subtotal - couponDiscount + delivery;
  if (totalAmount <= 0) throw badRequest("Order amount must be greater than zero.");

  return {
    items: orderItems,
    shippingAddress: {
      fullName: address.fullName,
      mobile: address.mobile,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
      addressType: address.addressType || "Home",
    },
    priceSummary: {
      totalMrp,
      discount,
      couponCode: appliedCouponCode,
      couponDiscount,
      delivery,
      subtotal,
    },
    totalAmount,
  };
};

const finalizePaidOrder = async ({
  userId,
  snapshot,
  paymentDetails,
  paymentAttemptId,
}) => {
  const session = await mongoose.startSession();
  try {
    let order;
    await session.withTransaction(async () => {
      const attempt = await PaymentAttempt.findOne({
        _id: paymentAttemptId,
        user: userId,
        status: "CREATED",
        inventoryReservedAt: { $exists: true },
        expiresAt: { $gt: new Date() },
      }).session(session);
      if (!attempt) {
        throw badRequest(
          "The payment reservation expired or is no longer available.",
          409,
        );
      }

      const existingOrder = await Order.findOne({
        user: userId,
        "paymentDetails.razorpayOrderId": paymentDetails.razorpayOrderId,
      }).session(session);
      if (existingOrder) {
        order = existingOrder;
        await PaymentAttempt.updateOne(
          { _id: attempt._id, status: "CREATED" },
          {
            $set: {
              status: "PAID",
              razorpayPaymentId: paymentDetails.razorpayPaymentId,
              order: existingOrder._id,
            },
          },
          { session },
        );
        return;
      }

      if (snapshot.priceSummary.couponCode) {
        const couponUsage = await Coupon.updateOne(
          {
            code: snapshot.priceSummary.couponCode,
            active: true,
            expiryDate: { $gt: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] },
          },
          { $inc: { usedCount: 1 } },
          { session },
        );
        if (couponUsage.modifiedCount !== 1) {
          throw badRequest("This coupon is no longer available.", 409);
        }
      }

      const placedAt = new Date();
      const initialDeliveryData = createInitialDeliveryData(placedAt, {
        confirmedAtCreation: true,
      });
      const [createdOrder] = await Order.create(
        [{
          orderNumber: createOrderNumber(),
          idempotencyKey: `razorpay:${paymentDetails.razorpayOrderId}`,
          user: userId,
          items: snapshot.items,
          shippingAddress: snapshot.shippingAddress,
          paymentMethod: "RAZORPAY",
          inventoryDeducted: true,
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          createdAt: placedAt,
          ...initialDeliveryData,
          paymentDetails,
          priceSummary: snapshot.priceSummary,
          totalAmount: snapshot.totalAmount,
        }],
        { session },
      );

      const attemptUpdate = await PaymentAttempt.updateOne(
        {
          _id: attempt._id,
          status: "CREATED",
          inventoryReservedAt: { $exists: true },
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            status: "PAID",
            razorpayPaymentId: paymentDetails.razorpayPaymentId,
            order: createdOrder._id,
          },
        },
        { session },
      );
      if (attemptUpdate.modifiedCount !== 1) {
        throw badRequest("Payment reservation changed while finalizing the order.", 409);
      }

      await Cart.updateOne(
        { user: userId },
        { $set: { items: [] } },
        { session },
      );
      order = createdOrder;
    });

    return order;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { badRequest, getCheckoutSnapshot, finalizePaidOrder };
