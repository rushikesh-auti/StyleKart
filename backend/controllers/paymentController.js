const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const PaymentAttempt = require("../models/PaymentAttempt");
const { badRequest, getCheckoutSnapshot, finalizePaidOrder } = require("../services/paymentCheckoutService");

const getRazorpayClient = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  const placeholder = !keyId || !keySecret || keyId.includes("xxxxxxxx") || keySecret.includes("xxxxxxxx");

  if (placeholder) {
    const error = new Error("Razorpay is not configured. Add valid Test Mode RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET values to backend/.env and restart the backend.");
    error.statusCode = 503;
    error.expose = true;
    throw error;
  }

  return { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId, keySecret };
};

const createRazorpayOrder = async (req, res, next) => {
  try {
    const snapshot = await getCheckoutSnapshot({
      userId: req.user.id,
      addressId: req.body.addressId,
      items: req.body.items,
      couponCode: req.body.couponCode || "",
    });

    const amount = Math.round(snapshot.totalAmount * 100);
    const { client, keyId } = getRazorpayClient();

    let razorpayOrder;
    try {
      razorpayOrder = await client.orders.create({
        amount,
        currency: "INR",
        receipt: `stylekart_${Date.now()}`,
        notes: { userId: String(req.user.id), source: "StyleKart web checkout" },
      });
    } catch (providerError) {
      const providerMessage = providerError?.error?.description || providerError?.error?.reason || providerError?.message || "Razorpay rejected the order request.";
      const error = new Error(`Unable to create the Razorpay order: ${providerMessage}`);
      error.statusCode = 502;
      error.expose = true;
      throw error;
    }

    await PaymentAttempt.create({
      user: req.user.id,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: razorpayOrder.currency || "INR",
      snapshot,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      keyId,
      orderId: razorpayOrder.id,
      amount,
      currency: razorpayOrder.currency || "INR",
      totalAmount: snapshot.totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

const verifyRazorpayPayment = async (req, res, next) => {
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  try {
    if ([razorpayOrderId, razorpayPaymentId, razorpaySignature].some((value) => typeof value !== "string" || !value.trim())) {
      throw badRequest("Incomplete Razorpay payment response.");
    }

    const attempt = await PaymentAttempt.findOne({ user: req.user.id, razorpayOrderId });
    if (!attempt) throw badRequest("Payment session was not found or has expired.", 404);

    if (attempt.status === "PAID" && attempt.order) {
      const existingOrder = await Order.findById(attempt.order);
      await Cart.updateOne({ user: req.user.id }, { $set: { items: [] } });
      return res.json({ success: true, order: existingOrder });
    }
    if (attempt.status !== "CREATED") throw badRequest("This payment session can no longer be used.", 409);

    const { client, keySecret } = getRazorpayClient();
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
    const signatureMatches = expectedSignature.length === razorpaySignature.length && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature));

    if (!signatureMatches) {
      attempt.status = "FAILED";
      attempt.failureReason = "Signature verification failed";
      await attempt.save();
      throw badRequest("Payment verification failed.");
    }

    let payment = await client.payments.fetch(razorpayPaymentId);
    if (payment.order_id !== razorpayOrderId || Number(payment.amount) !== Number(attempt.amount) || payment.currency !== attempt.currency) {
      throw badRequest("Payment details do not match this checkout.");
    }
    if (payment.status === "authorized") {
      payment = await client.payments.capture(razorpayPaymentId, attempt.amount, attempt.currency);
    }
    if (payment.status !== "captured") throw badRequest("Payment has not been captured yet. Please try again.", 409);

    const existingByPayment = await Order.findOne({ user: req.user.id, "paymentDetails.razorpayOrderId": razorpayOrderId });
    if (existingByPayment) {
      attempt.status = "PAID";
      attempt.razorpayPaymentId = razorpayPaymentId;
      attempt.order = existingByPayment._id;
      attempt.failureReason = "";
      await attempt.save();
      await Cart.updateOne({ user: req.user.id }, { $set: { items: [] } });
      return res.json({ success: true, order: existingByPayment });
    }

    let order;
    try {
      order = await finalizePaidOrder({
        userId: req.user.id,
        snapshot: attempt.toObject().snapshot,
        paymentDetails: { razorpayOrderId, razorpayPaymentId },
      });
    } catch (orderError) {
      const concurrentOrder = await Order.findOne({ user: req.user.id, "paymentDetails.razorpayOrderId": razorpayOrderId });
      if (concurrentOrder) {
        attempt.status = "PAID";
        attempt.razorpayPaymentId = razorpayPaymentId;
        attempt.order = concurrentOrder._id;
        await attempt.save();
        await Cart.updateOne({ user: req.user.id }, { $set: { items: [] } });
        return res.json({ success: true, order: concurrentOrder });
      }

      try {
        await client.payments.refund(razorpayPaymentId, { amount: attempt.amount, notes: { reason: "StyleKart order could not be finalized" } });
        attempt.status = "REFUNDED";
        attempt.failureReason = orderError.message;
      } catch (refundError) {
        attempt.status = "FAILED";
        attempt.failureReason = `${orderError.message}. Automatic refund failed: ${refundError.message}`;
      }
      await attempt.save();
      const error = new Error("Payment was received, but the order could not be finalized. A refund has been requested.");
      error.statusCode = 409;
      throw error;
    }

    attempt.status = "PAID";
    attempt.razorpayPaymentId = razorpayPaymentId;
    attempt.order = order._id;
    attempt.failureReason = "";
    await attempt.save();

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
