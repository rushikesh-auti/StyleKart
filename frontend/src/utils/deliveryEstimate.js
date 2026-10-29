const terminalStatuses = [
  "CANCELLED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

const defaultMinDays = 2;
const defaultMaxDays = 4;
const readConfiguredDayCount = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue >= 1 && parsedValue <= 60
    ? parsedValue
    : fallback;
};
const configuredMinDays = readConfiguredDayCount(
  import.meta.env?.VITE_DELIVERY_MIN_DAYS,
  defaultMinDays,
);
const configuredMaxDays = readConfiguredDayCount(
  import.meta.env?.VITE_DELIVERY_MAX_DAYS,
  defaultMaxDays,
);

export const formatDeliveryDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return "";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatFulfillmentTimestamp = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : "";

export const formatFulfillmentDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
    : "";

export const getActiveDeliveryWindow = (order) => {
  if (!order || terminalStatuses.includes(order.orderStatus)) return null;

  const estimate = order.deliveryEstimate;
  const startDate =
    estimate?.revisedStartDate || estimate?.originalStartDate || "";
  const endDate = estimate?.revisedEndDate || estimate?.originalEndDate || "";
  if (!startDate || !endDate) return null;

  return {
    startDate,
    endDate,
    revised: Boolean(estimate?.revisedStartDate && estimate?.revisedEndDate),
  };
};

export const formatDeliveryWindow = (window) => {
  if (!window) return "";
  const start = formatDeliveryDate(window.startDate);
  const end = formatDeliveryDate(window.endDate);
  if (!start || !end) return "";
  return start === end ? start : `${start} – ${end}`;
};

export const getDeliveryDurationLabel = (estimate) => {
  const minDays = Number.isInteger(estimate?.minDays)
    ? estimate.minDays
    : configuredMinDays;
  const maxDays = Number.isInteger(estimate?.maxDays)
    ? estimate.maxDays
    : configuredMaxDays;
  if (minDays < 1 || maxDays < minDays || maxDays > 60) return "";

  const duration =
    minDays === maxDays
      ? `${minDays} ${minDays === 1 ? "day" : "days"}`
      : `${minDays}–${maxDays} days`;
  return `Estimated delivery in ${duration}`;
};
