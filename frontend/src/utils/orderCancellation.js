const cancellableStatuses = ["PLACED", "CONFIRMED", "PROCESSING"];

export const isOrderCancellable = (orderStatus) =>
  cancellableStatuses.includes(orderStatus);
