const mongoose = require("mongoose");

const Address = require("../models/Address");
const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { findValidCoupon, normalizeCode } = require("./couponService");

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
    if (requestedItem.quantity > product.stock) {
      throw badRequest(`${product.item_name} has only ${product.stock} item(s) left.`);
    }
    if (Array.isArray(product.sizes) && product.sizes.length > 0 && !product.sizes.includes(requestedItem.selectedSize)) {
      throw badRequest(`Select a valid size for ${product.item_name}.`);
    }
    if (Array.isArray(product.colors) && product.colors.length > 0 && !product.colors.includes(requestedItem.selectedColor)) {
      throw badRequest(`Select a valid color for ${product.item_name}.`);
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

const finalizePaidOrder = async ({ userId, snapshot, paymentDetails }) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();

    for (const item of snapshot.items) {
      const stockUpdate = await Product.updateOne(
        { id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session },
      );
      if (stockUpdate.modifiedCount !== 1) {
        throw badRequest(`${item.itemName} is no longer available in the requested quantity.`, 409);
      }
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

    const [order] = await Order.create(
      [{
        orderNumber: createOrderNumber(),
        user: userId,
        items: snapshot.items,
        shippingAddress: snapshot.shippingAddress,
        paymentMethod: "RAZORPAY",
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        paymentDetails,
        priceSummary: snapshot.priceSummary,
        totalAmount: snapshot.totalAmount,
      }],
      { session },
    );

    await Cart.updateOne(
      { user: userId },
      { $set: { items: [] } },
      { session },
    );

    await session.commitTransaction();
    return order;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { badRequest, getCheckoutSnapshot, finalizePaidOrder };
