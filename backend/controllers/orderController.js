const mongoose = require("mongoose");

const Address = require("../models/Address");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { findValidCoupon, normalizeCode } = require("../services/couponService");

const createOrderNumber = () =>
  `SK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("orderNumber items totalAmount orderStatus paymentStatus createdAt");

    res.json({ success: true, orders });
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
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { addressId, items, paymentMethod = "COD", couponCode = "" } = req.body;

    if (
      typeof addressId !== "string" ||
      !mongoose.isValidObjectId(addressId) ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      throw badRequest("A delivery address and at least one cart item are required.");
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      throw badRequest("Select a valid payment method.");
    }

    if (paymentMethod === "ONLINE") {
      throw badRequest("Online payments are not available yet. Choose Cash on Delivery.");
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

    await session.startTransaction();

    const orderItems = [];
    let totalMrp = 0;
    let subtotal = 0;

    for (const requestedItem of requestedItems) {
      const product = await Product.findOne({ id: requestedItem.productId }).session(session);

      if (!product) {
        throw badRequest(`Product ${requestedItem.productId} is no longer available.`);
      }

      if (requestedItem.quantity > product.stock) {
        throw badRequest(`${product.item_name} has only ${product.stock} item(s) left.`);
      }

      if (product.sizes.length > 0 && !product.sizes.includes(requestedItem.selectedSize)) {
        throw badRequest(`Select a valid size for ${product.item_name}.`);
      }

      if (product.colors.length > 0 && !product.colors.includes(requestedItem.selectedColor)) {
        throw badRequest(`Select a valid color for ${product.item_name}.`);
      }

      const stockUpdate = await Product.updateOne(
        { _id: product._id, stock: { $gte: requestedItem.quantity } },
        { $inc: { stock: -requestedItem.quantity } },
        { session },
      );

      if (stockUpdate.modifiedCount !== 1) {
        throw badRequest(`${product.item_name} is no longer available in that quantity.`);
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
        user: req.user.id,
        items: orderItems,
        shippingAddress: address.toObject(),
        paymentMethod,
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

    await session.commitTransaction();

    res.status(201).json({ success: true, order: order[0] });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = { getOrders, getOrder, createOrder };