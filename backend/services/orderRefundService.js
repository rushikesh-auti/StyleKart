const crypto = require("crypto");

const Order = require("../models/Order");
const { getRazorpayClient } = require("./razorpayClient");

const REFUND_LOCK_TIMEOUT_MS = 10 * 60 * 1000;
const REFUND_PAGE_SIZE = 100;
const MAX_REFUND_PAGES = 100;

const createError = (message, statusCode = 409) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getProviderErrorMessage = (error) =>
  String(
    error?.error?.description ||
      error?.error?.reason ||
      error?.message ||
      "Refund provider is temporarily unavailable.",
  )
    .replace(/\s+/g, " ")
    .slice(0, 500);

const findCancellationRefund = async (client, paymentId, orderId) => {
  for (let page = 0; page < MAX_REFUND_PAGES; page += 1) {
    const response = await client.payments.fetchMultipleRefund(paymentId, {
      count: REFUND_PAGE_SIZE,
      skip: page * REFUND_PAGE_SIZE,
    });
    const refunds = response?.items;

    if (!Array.isArray(refunds)) {
      throw new Error("Razorpay returned an invalid refund listing.");
    }

    const match = refunds.find(
      (refund) =>
        refund.payment_id === paymentId &&
        refund.notes?.stylekart_order_id === String(orderId) &&
        refund.notes?.stylekart_purpose === "order_cancellation",
    );
    if (match) return match;
    if (refunds.length < REFUND_PAGE_SIZE) return null;
  }

  throw new Error("Razorpay refund history is too large to reconcile safely.");
};

const getRefundState = (refund, expectedAmount, paymentId) => {
  if (
    !refund?.id ||
    refund.payment_id !== paymentId ||
    Number(refund.amount) !== expectedAmount
  ) {
    throw new Error("Razorpay returned refund details that do not match this order.");
  }

  if (refund.status === "processed") return "PROCESSED";
  if (refund.status === "failed") return "FAILED";
  return "PENDING";
};

const saveRefundResult = async ({
  orderId,
  processingToken,
  refundStatus,
  providerRefundId = "",
  failureReason = "",
  clearRequestUncertain = false,
}) => {
  const update = {
    refundStatus,
    providerRefundId,
    refundFailureReason: failureReason,
  };
  if (clearRequestUncertain) update.refundRequestUncertain = false;
  if (refundStatus === "PROCESSED") update.paymentStatus = "REFUNDED";

  await Order.updateOne(
    {
      _id: orderId,
      refundStatus: "PROCESSING",
      refundProcessingToken: processingToken,
    },
    {
      $set: update,
      $unset: {
        refundProcessingStartedAt: "",
        refundProcessingToken: "",
      },
    },
  );
};

const attemptOrderRefund = async (orderId) => {
  const processingToken = crypto.randomUUID();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - REFUND_LOCK_TIMEOUT_MS);
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      orderStatus: "CANCELLED",
      paymentMethod: "RAZORPAY",
      paymentStatus: { $in: ["PAID", "REFUNDED"] },
      $or: [
        { refundStatus: { $in: ["PENDING", "FAILED"] } },
        {
          refundStatus: "PROCESSING",
          refundProcessingStartedAt: { $lte: staleBefore },
        },
      ],
    },
    {
      $set: {
        refundStatus: "PROCESSING",
        refundProcessingStartedAt: now,
        refundProcessingToken: processingToken,
        refundAttemptedAt: now,
        refundFailureReason: "",
        refundProvider: "RAZORPAY",
      },
    },
    { new: true },
  );

  if (!order) return Order.findById(orderId);

  let failureStatus = "PENDING";

  try {
    const paymentId = order.paymentDetails?.razorpayPaymentId;
    const razorpayOrderId = order.paymentDetails?.razorpayOrderId;
    const amount = Math.round(Number(order.totalAmount) * 100);

    if (!paymentId || !razorpayOrderId || !Number.isSafeInteger(amount) || amount < 1) {
      failureStatus = "FAILED";
      throw new Error("Verified payment details are unavailable for this order.");
    }

    const { client } = getRazorpayClient();
    const payment = await client.payments.fetch(paymentId);

    if (
      payment.id !== paymentId ||
      payment.order_id !== razorpayOrderId ||
      payment.status !== "captured" ||
      Number(payment.amount) !== amount ||
      payment.currency !== "INR"
    ) {
      failureStatus = "FAILED";
      throw new Error("The verified Razorpay payment does not match this order.");
    }

    const existingRefund = await findCancellationRefund(
      client,
      paymentId,
      order._id,
    );
    let refund = existingRefund;

    if (refund?.status === "failed") {
      refund = null;
    }

    if (!refund) {
      if (order.refundRequestUncertain) {
        await saveRefundResult({
          orderId: order._id,
          processingToken,
          refundStatus: "PENDING",
          providerRefundId: order.providerRefundId || "",
          failureReason:
            "Razorpay has not confirmed the earlier refund request. Check its dashboard before authorizing another refund.",
        });
        return Order.findById(orderId);
      }

      const requestStarted = await Order.updateOne(
        {
          _id: order._id,
          refundStatus: "PROCESSING",
          refundProcessingToken: processingToken,
        },
        {
          $set: {
            refundRequestUncertain: true,
            refundRequestStartedAt: new Date(),
          },
        },
      );
      if (requestStarted.modifiedCount !== 1) {
        throw new Error("Refund processing ownership changed before submission.");
      }

      let createdRefund;
      try {
        createdRefund = await client.payments.refund(paymentId, {
          amount,
          receipt: `skc_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`,
          notes: {
            stylekart_order_id: String(order._id),
            stylekart_purpose: "order_cancellation",
          },
        });
      } catch (error) {
        if (Number(error?.statusCode) >= 400 && Number(error?.statusCode) < 500) {
          failureStatus = "FAILED";
          await Order.updateOne(
            {
              _id: order._id,
              refundStatus: "PROCESSING",
              refundProcessingToken: processingToken,
            },
            { $set: { refundRequestUncertain: false } },
          );
        }
        throw error;
      }

      refund = createdRefund;
    }

    const refundStatus = getRefundState(refund, amount, paymentId);
    await saveRefundResult({
      orderId: order._id,
      processingToken,
      refundStatus,
      providerRefundId: refund.id,
      clearRequestUncertain: true,
      failureReason:
        refundStatus === "FAILED"
          ? "Razorpay marked the refund as failed. Retry after confirming the provider state."
          : "",
    });
  } catch (error) {
    if (error?.statusCode === 503 && error?.expose) failureStatus = "FAILED";
    await saveRefundResult({
      orderId: order._id,
      processingToken,
      refundStatus: failureStatus,
      providerRefundId: order.providerRefundId || "",
      failureReason: getProviderErrorMessage(error),
    });
  }

  return Order.findById(orderId);
};

module.exports = { attemptOrderRefund };
