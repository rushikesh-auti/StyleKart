const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const PaymentAttempt = require("../models/PaymentAttempt");
const {
  badRequest,
  getCheckoutSnapshot,
  finalizePaidOrder,
} = require("../services/paymentCheckoutService");
const {
  deductInventory,
  releasePaymentReservation,
} = require("../services/inventoryService");
const { getRazorpayClient } = require("../services/razorpayClient");

const RESERVATION_DURATION_MS = 15 * 60 * 1000;
const ATTEMPT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const REFUND_PAGE_SIZE = 100;
const MAX_REFUND_PAGES = 100;

const getCheckoutRequestHash = (snapshot) =>
  crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");

const getProviderErrorMessage = (error) =>
  String(error?.error?.description || error?.message || "Payment provider error.")
    .replace(/\s+/g, " ")
    .slice(0, 300);

const getValidSignature = (keySecret, orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
};

const markAttemptFailed = async (attempt, failureReason) => {
  if (attempt.status === "CREATED" && attempt.inventoryReservedAt) {
    await releasePaymentReservation({
      attemptId: attempt._id,
      status: "FAILED",
      failureReason,
    });
    return;
  }

  await PaymentAttempt.updateOne(
    { _id: attempt._id, status: { $in: ["CREATING", "CREATED"] } },
    { $set: { status: "FAILED", failureReason } },
  );
};

const getExistingCheckoutResponse = async (attempt, checkoutHash, keyId) => {
  if (attempt.checkoutHash !== checkoutHash) {
    throw badRequest(
      "This checkout request key was already used with different order details.",
      409,
    );
  }
  if (attempt.status === "CREATED" && attempt.expiresAt > new Date()) {
    return {
      success: true,
      keyId,
      orderId: attempt.razorpayOrderId,
      amount: attempt.amount,
      currency: attempt.currency,
      totalAmount: attempt.snapshot.totalAmount,
    };
  }
  if (attempt.status === "CREATING") {
    throw badRequest("This checkout session is still being prepared. Try again shortly.", 409);
  }
  throw badRequest("This checkout session has expired. Start a new checkout.", 409);
};

const createRazorpayOrder = async (req, res, next) => {
  let attempt;
  try {
    const { checkoutRequestId } = req.body;
    if (
      typeof checkoutRequestId !== "string" ||
      checkoutRequestId.trim().length < 16 ||
      checkoutRequestId.trim().length > 100
    ) {
      throw badRequest("A valid checkout request key is required. Refresh and try again.");
    }

    const snapshot = await getCheckoutSnapshot({
      userId: req.user.id,
      addressId: req.body.addressId,
      items: req.body.items,
      couponCode: req.body.couponCode || "",
    });
    const checkoutHash = getCheckoutRequestHash(snapshot);
    const { client, keyId } = getRazorpayClient();
    const existing = await PaymentAttempt.findOne({
      user: req.user.id,
      checkoutRequestId: checkoutRequestId.trim(),
    });
    if (existing) {
      return res.json(
        await getExistingCheckoutResponse(existing, checkoutHash, keyId),
      );
    }

    const createdAt = new Date();
    try {
      [attempt] = await PaymentAttempt.create([{
        user: req.user.id,
        checkoutRequestId: checkoutRequestId.trim(),
        checkoutHash,
        amount: Math.round(snapshot.totalAmount * 100),
        currency: "INR",
        status: "CREATING",
        snapshot,
        expiresAt: new Date(createdAt.getTime() + RESERVATION_DURATION_MS),
        purgeAt: new Date(createdAt.getTime() + ATTEMPT_RETENTION_MS),
      }]);
    } catch (error) {
      if (error.code !== 11000) throw error;
      const concurrentAttempt = await PaymentAttempt.findOne({
        user: req.user.id,
        checkoutRequestId: checkoutRequestId.trim(),
      });
      if (!concurrentAttempt) throw error;
      return res.json(
        await getExistingCheckoutResponse(concurrentAttempt, checkoutHash, keyId),
      );
    }

    let razorpayOrder;
    try {
      razorpayOrder = await client.orders.create({
        amount: attempt.amount,
        currency: "INR",
        receipt: `stylekart_${String(attempt._id).slice(-20)}`,
        notes: {
          userId: String(req.user.id),
          source: "StyleKart web checkout",
        },
      });
    } catch (providerError) {
      await markAttemptFailed(attempt, getProviderErrorMessage(providerError));
      const error = new Error(
        `Unable to create the Razorpay order: ${getProviderErrorMessage(providerError)}`,
      );
      error.statusCode = 502;
      error.expose = true;
      throw error;
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await deductInventory(snapshot.items, session);
        const updated = await PaymentAttempt.updateOne(
          { _id: attempt._id, status: "CREATING" },
          {
            $set: {
              razorpayOrderId: razorpayOrder.id,
              currency: razorpayOrder.currency || "INR",
              status: "CREATED",
              inventoryReservedAt: new Date(),
              expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
            },
          },
          { session },
        );
        if (updated.modifiedCount !== 1) {
          throw badRequest("Checkout setup expired before inventory was reserved.", 409);
        }
      });
    } catch (reservationError) {
      await markAttemptFailed(attempt, reservationError.message);
      throw reservationError;
    } finally {
      await session.endSession();
    }

    res.status(201).json({
      success: true,
      keyId,
      orderId: razorpayOrder.id,
      amount: attempt.amount,
      currency: razorpayOrder.currency || "INR",
      totalAmount: snapshot.totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

const findLateRefund = async (client, paymentId, attemptId) => {
  for (let page = 0; page < MAX_REFUND_PAGES; page += 1) {
    const response = await client.payments.fetchMultipleRefund(paymentId, {
      count: REFUND_PAGE_SIZE,
      skip: page * REFUND_PAGE_SIZE,
    });
    if (!Array.isArray(response?.items)) {
      throw new Error("Razorpay returned an invalid refund listing.");
    }
    const found = response.items.find(
      (refund) =>
        refund.payment_id === paymentId &&
        refund.notes?.stylekart_attempt_id === String(attemptId) &&
        refund.notes?.stylekart_purpose === "late_checkout_payment",
    );
    if (found) return found;
    if (response.items.length < REFUND_PAGE_SIZE) return null;
  }
  throw new Error("Razorpay refund history is too large to reconcile safely.");
};

const refundCapturedPaymentWithoutOrder = async ({
  client,
  attempt,
  paymentId,
  amount,
}) => {
  const existingRefund = await findLateRefund(client, paymentId, attempt._id);
  let refund = existingRefund;

  if (!refund && attempt.lateRefundRequestUncertain) {
    await PaymentAttempt.updateOne(
      { _id: attempt._id },
      {
        $set: {
          lateRefundStatus: "PENDING",
          failureReason:
            "The provider has not confirmed the earlier refund request; reconcile it before retrying.",
        },
      },
    );
    return;
  }

  if (!refund) {
    const refundClaim = await PaymentAttempt.updateOne(
      {
        _id: attempt._id,
        lateRefundRequestUncertain: { $ne: true },
        lateRefundStatus: { $in: ["NOT_REQUIRED", "FAILED"] },
      },
      {
        $set: {
          lateRefundRequestUncertain: true,
          lateRefundStatus: "PENDING",
        },
      },
    );
    if (refundClaim.modifiedCount !== 1) return;
    refund = await client.payments.refund(paymentId, {
      amount,
      receipt: `skl_${String(attempt._id).replace(/-/g, "").slice(0, 24)}`,
      notes: {
        stylekart_attempt_id: String(attempt._id),
        stylekart_purpose: "late_checkout_payment",
      },
    });
  }

  const refundStatus =
    refund.status === "processed"
      ? "PROCESSED"
      : refund.status === "failed"
        ? "FAILED"
        : "PENDING";
  await PaymentAttempt.updateOne(
    { _id: attempt._id },
    {
      $set: {
        status: refundStatus === "PROCESSED" ? "REFUNDED" : attempt.status,
        lateRefundStatus: refundStatus,
        lateRefundId: refund.id || "",
        lateRefundRequestUncertain: refundStatus === "PENDING",
        failureReason:
          refundStatus === "FAILED"
            ? "Razorpay marked the late payment refund as failed."
            : "",
      },
    },
  );
};

const verifyRazorpayPayment = async (req, res, next) => {
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  try {
    if (
      [razorpayOrderId, razorpayPaymentId, razorpaySignature].some(
        (value) => typeof value !== "string" || !value.trim(),
      )
    ) {
      throw badRequest("Incomplete Razorpay payment response.");
    }

    const attempt = await PaymentAttempt.findOne({
      user: req.user.id,
      razorpayOrderId,
    });
    if (!attempt) throw badRequest("Payment session was not found or has expired.", 404);

    if (attempt.status === "PAID" && attempt.order) {
      const existingOrder = await Order.findById(attempt.order);
      await Cart.updateOne({ user: req.user.id }, { $set: { items: [] } });
      return res.json({ success: true, order: existingOrder });
    }

    const { client, keySecret } = getRazorpayClient();
    if (!getValidSignature(keySecret, razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      await markAttemptFailed(attempt, "Signature verification failed.");
      throw badRequest("Payment verification failed.");
    }

    const payment = await client.payments.fetch(razorpayPaymentId);
    if (
      payment.order_id !== razorpayOrderId ||
      Number(payment.amount) !== Number(attempt.amount) ||
      payment.currency !== attempt.currency
    ) {
      throw badRequest("Payment details do not match this checkout.");
    }

    let confirmedPayment = payment;
    if (payment.status === "authorized") {
      confirmedPayment = await client.payments.capture(
        razorpayPaymentId,
        attempt.amount,
        attempt.currency,
      );
    }

    if (confirmedPayment.status === "failed") {
      await markAttemptFailed(attempt, "Razorpay confirmed that payment failed.");
      throw badRequest("Razorpay payment failed. Your inventory reservation has been released.", 409);
    }
    if (confirmedPayment.status !== "captured") {
      throw badRequest("Payment has not been captured yet. Please try again.", 409);
    }

    const existingByPayment = await Order.findOne({
      user: req.user.id,
      "paymentDetails.razorpayOrderId": razorpayOrderId,
    });
    if (existingByPayment) {
      await PaymentAttempt.updateOne(
        { _id: attempt._id, status: "CREATED" },
        {
          $set: {
            status: "PAID",
            razorpayPaymentId,
            order: existingByPayment._id,
          },
        },
      );
      await Cart.updateOne({ user: req.user.id }, { $set: { items: [] } });
      return res.json({ success: true, order: existingByPayment });
    }

    if (attempt.status === "CREATED" && attempt.expiresAt > new Date()) {
      try {
        const order = await finalizePaidOrder({
          userId: req.user.id,
          snapshot: attempt.snapshot,
          paymentDetails: { razorpayOrderId, razorpayPaymentId },
          paymentAttemptId: attempt._id,
        });
        return res.status(201).json({ success: true, order });
      } catch (orderError) {
        const concurrentOrder = await Order.findOne({
          user: req.user.id,
          "paymentDetails.razorpayOrderId": razorpayOrderId,
        });
        if (concurrentOrder) {
          return res.json({ success: true, order: concurrentOrder });
        }

        await releasePaymentReservation({
          attemptId: attempt._id,
          status: "FAILED",
          failureReason: orderError.message,
        });
        await refundCapturedPaymentWithoutOrder({
          client,
          attempt,
          paymentId: razorpayPaymentId,
          amount: attempt.amount,
        });
        throw badRequest(
          "Payment was received, but the order could not be finalized. A refund was requested or is being reconciled.",
          409,
        );
      }
    }

    if (attempt.status === "CREATED") {
      await releasePaymentReservation({
        attemptId: attempt._id,
        status: "EXPIRED",
        failureReason: "Payment was captured after the inventory reservation expired.",
      });
    }
    await refundCapturedPaymentWithoutOrder({
      client,
      attempt,
      paymentId: razorpayPaymentId,
      amount: attempt.amount,
    });
    throw badRequest(
      "Payment was captured after the inventory reservation expired. A refund was requested or is being reconciled.",
      409,
    );
  } catch (error) {
    next(error);
  }
};

const releaseFailedRazorpayReservation = async (req, res, next) => {
  try {
    const { razorpay_order_id: razorpayOrderId, razorpay_payment_id: paymentId } =
      req.body;
    if (
      typeof razorpayOrderId !== "string" ||
      typeof paymentId !== "string" ||
      !razorpayOrderId ||
      !paymentId
    ) {
      throw badRequest("A Razorpay order and payment reference are required.");
    }

    const attempt = await PaymentAttempt.findOne({
      user: req.user.id,
      razorpayOrderId,
      status: "CREATED",
      inventoryReservedAt: { $exists: true },
    });
    if (!attempt) {
      return res.json({ success: true, released: false });
    }

    const { client } = getRazorpayClient();
    const payment = await client.payments.fetch(paymentId);
    if (
      payment.order_id !== razorpayOrderId ||
      Number(payment.amount) !== attempt.amount ||
      payment.currency !== attempt.currency ||
      payment.status !== "failed"
    ) {
      throw badRequest("Razorpay has not confirmed this payment as failed.", 409);
    }

    const released = await releasePaymentReservation({
      attemptId: attempt._id,
      status: "FAILED",
      failureReason: "Razorpay confirmed that payment failed.",
    });
    return res.json({ success: true, released });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  releaseFailedRazorpayReservation,
  verifyRazorpayPayment,
};
