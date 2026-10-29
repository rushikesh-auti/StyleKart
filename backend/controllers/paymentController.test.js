const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

const Order = require("../models/Order");
const PaymentAttempt = require("../models/PaymentAttempt");
const paymentCheckoutService = require("../services/paymentCheckoutService");
const inventoryService = require("../services/inventoryService");
const razorpayClient = require("../services/razorpayClient");

test("a failed Razorpay payment releases its reservation without creating an order", async () => {
  const originals = {
    findAttempt: PaymentAttempt.findOne,
    findOrder: Order.findOne,
    createOrder: Order.create,
    getRazorpayClient: razorpayClient.getRazorpayClient,
    releaseReservation: inventoryService.releasePaymentReservation,
    finalizePaidOrder: paymentCheckoutService.finalizePaidOrder,
  };
  const keySecret = "test-key-secret";
  const attempt = {
    _id: "attempt-id",
    status: "CREATED",
    inventoryReservedAt: new Date("2026-10-28T12:00:00.000Z"),
    amount: 10000,
    currency: "INR",
  };
  let orderCreationAttempted = false;
  let reservationReleased = false;

  PaymentAttempt.findOne = async () => attempt;
  Order.create = async () => {
    orderCreationAttempted = true;
    throw new Error("A failed payment must not create an order.");
  };
  razorpayClient.getRazorpayClient = () => ({
    keySecret,
    client: {
      payments: {
        fetch: async () => ({
          order_id: "razorpay-order-id",
          amount: attempt.amount,
          currency: attempt.currency,
          status: "failed",
        }),
      },
    },
  });
  inventoryService.releasePaymentReservation = async () => {
    reservationReleased = true;
  };

  try {
    const { verifyRazorpayPayment } = require("./paymentController");
    const paymentId = "razorpay-payment-id";
    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(`razorpay-order-id|${paymentId}`)
      .digest("hex");
    let responseError;

    await verifyRazorpayPayment(
      {
        user: { id: "customer-id" },
        body: {
          razorpay_order_id: "razorpay-order-id",
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        },
      },
      {},
      (error) => {
        responseError = error;
      },
    );

    assert.equal(responseError?.statusCode, 409);
    assert.match(responseError.message, /payment failed/i);
    assert.equal(reservationReleased, true);
    assert.equal(orderCreationAttempted, false);
  } finally {
    PaymentAttempt.findOne = originals.findAttempt;
    Order.create = originals.createOrder;
    Order.findOne = originals.findOrder;
    razorpayClient.getRazorpayClient = originals.getRazorpayClient;
    inventoryService.releasePaymentReservation = originals.releaseReservation;
    paymentCheckoutService.finalizePaidOrder = originals.finalizePaidOrder;
    delete require.cache[require.resolve("./paymentController")];
  }
});

test("a captured Razorpay payment finalizes an order before acknowledging success", async () => {
  const originals = {
    findAttempt: PaymentAttempt.findOne,
    findOrder: Order.findOne,
    getRazorpayClient: razorpayClient.getRazorpayClient,
    finalizePaidOrder: paymentCheckoutService.finalizePaidOrder,
  };
  const keySecret = "test-key-secret";
  const attempt = {
    _id: "attempt-id",
    status: "CREATED",
    inventoryReservedAt: new Date("2026-10-28T12:00:00.000Z"),
    expiresAt: new Date(Date.now() + 60_000),
    amount: 10000,
    currency: "INR",
    snapshot: { items: [] },
  };
  const order = {
    _id: "order-id",
    orderStatus: "CONFIRMED",
    deliveryEstimate: {
      originalStartDate: "2026-10-30",
      originalEndDate: "2026-11-01",
      minDays: 2,
      maxDays: 4,
    },
  };
  let finalizationCount = 0;

  PaymentAttempt.findOne = async () => attempt;
  Order.findOne = async () => null;
  razorpayClient.getRazorpayClient = () => ({
    keySecret,
    client: {
      payments: {
        fetch: async () => ({
          order_id: "razorpay-order-id",
          amount: attempt.amount,
          currency: attempt.currency,
          status: "captured",
        }),
      },
    },
  });
  paymentCheckoutService.finalizePaidOrder = async () => {
    finalizationCount += 1;
    return order;
  };

  try {
    delete require.cache[require.resolve("./paymentController")];
    const { verifyRazorpayPayment } = require("./paymentController");
    const paymentId = "razorpay-payment-id";
    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(`razorpay-order-id|${paymentId}`)
      .digest("hex");
    let responseStatus;
    let responseBody;
    const response = {
      status(status) {
        responseStatus = status;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };

    await verifyRazorpayPayment(
      {
        user: { id: "customer-id" },
        body: {
          razorpay_order_id: "razorpay-order-id",
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        },
      },
      response,
      (error) => {
        throw error;
      },
    );

    assert.equal(responseStatus, 201);
    assert.equal(responseBody.order, order);
    assert.equal(finalizationCount, 1);
    assert.equal(order.deliveryEstimate.minDays, 2);
  } finally {
    PaymentAttempt.findOne = originals.findAttempt;
    Order.findOne = originals.findOrder;
    razorpayClient.getRazorpayClient = originals.getRazorpayClient;
    paymentCheckoutService.finalizePaidOrder = originals.finalizePaidOrder;
    delete require.cache[require.resolve("./paymentController")];
  }
});
