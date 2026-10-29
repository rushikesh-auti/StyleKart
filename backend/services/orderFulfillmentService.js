const fulfillmentStatuses = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const allowedTransitions = {
  PLACED: ["CONFIRMED"],
  CONFIRMED: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const canTransitionOrderStatus = (currentStatus, nextStatus) =>
  Boolean(allowedTransitions[currentStatus]?.includes(nextStatus));

const recordFulfillmentEvent = (order, status, occurredAt) => {
  if (!fulfillmentStatuses.includes(status)) return;
  if (!Array.isArray(order.fulfillmentEvents)) order.fulfillmentEvents = [];
  order.fulfillmentEvents.push({ status, occurredAt });
};

module.exports = {
  allowedTransitions,
  canTransitionOrderStatus,
  recordFulfillmentEvent,
};
