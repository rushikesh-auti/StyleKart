const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");

const Order = require("./Order");

test("delivery estimates and fulfillment history survive order document serialization", async () => {
  const createdAt = new Date("2026-10-28T12:00:00.000Z");
  const order = new Order({
    orderNumber: "SK-EDD-TEST",
    user: new mongoose.Types.ObjectId(),
    items: [{
      productId: "test-product",
      itemName: "Test product",
      quantity: 1,
      unitPrice: 100,
      originalUnitPrice: 100,
    }],
    shippingAddress: {
      fullName: "Test Customer",
      mobile: "9999999999",
      addressLine1: "1 Test Street",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
    },
    paymentMethod: "COD",
    createdAt,
    deliveryEstimate: {
      originalStartDate: "2026-10-30",
      originalEndDate: "2026-11-01",
      minDays: 2,
      maxDays: 4,
    },
    fulfillmentEvents: [{ status: "PLACED", occurredAt: createdAt }],
    priceSummary: {
      totalMrp: 100,
      discount: 0,
      delivery: 0,
      subtotal: 100,
    },
    totalAmount: 100,
  });

  await order.validate();
  const refreshedOrderData = order.toObject();
  assert.equal(refreshedOrderData.createdAt.toISOString(), createdAt.toISOString());
  assert.equal(refreshedOrderData.deliveryEstimate.originalStartDate, "2026-10-30");
  assert.equal(refreshedOrderData.deliveryEstimate.originalEndDate, "2026-11-01");
  assert.equal(refreshedOrderData.deliveryEstimate.minDays, 2);
  assert.equal(refreshedOrderData.deliveryEstimate.maxDays, 4);
  assert.deepEqual(
    refreshedOrderData.fulfillmentEvents.map(({ status }) => status),
    ["PLACED"],
  );
});
