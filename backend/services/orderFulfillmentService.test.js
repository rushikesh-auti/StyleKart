const assert = require("node:assert/strict");
const test = require("node:test");

const {
  canTransitionOrderStatus,
  recordFulfillmentEvent,
} = require("./orderFulfillmentService");

test("fulfillment progression accepts only the existing adjacent transitions", () => {
  assert.equal(canTransitionOrderStatus("PLACED", "CONFIRMED"), true);
  assert.equal(canTransitionOrderStatus("CONFIRMED", "PROCESSING"), true);
  assert.equal(canTransitionOrderStatus("PROCESSING", "SHIPPED"), true);
  assert.equal(canTransitionOrderStatus("SHIPPED", "OUT_FOR_DELIVERY"), true);
  assert.equal(canTransitionOrderStatus("OUT_FOR_DELIVERY", "DELIVERED"), true);
  assert.equal(canTransitionOrderStatus("PLACED", "SHIPPED"), false);
  assert.equal(canTransitionOrderStatus("CANCELLED", "SHIPPED"), false);
});

test("fulfillment timestamps are recorded only for fulfillment events", () => {
  const occurredAt = new Date("2026-11-02T12:00:00.000Z");
  const order = { fulfillmentEvents: [] };

  recordFulfillmentEvent(order, "SHIPPED", occurredAt);
  recordFulfillmentEvent(order, "RETURN_REQUESTED", occurredAt);

  assert.deepEqual(order.fulfillmentEvents, [
    { status: "SHIPPED", occurredAt },
  ]);
});
