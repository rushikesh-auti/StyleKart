const deliveryEstimateConfig = require("../config/deliveryEstimate");

const getCalendarDate = (date, timeZone = deliveryEstimateConfig.timeZone) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) {
    throw new Error("A valid order creation date is required.");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const dateParts = Object.fromEntries(
    parts
      .filter(({ type }) => ["year", "month", "day"].includes(type))
      .map(({ type, value: partValue }) => [type, partValue]),
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

const addCalendarDays = (calendarDate, days) => {
  if (!isCalendarDate(calendarDate) || !Number.isInteger(days)) {
    throw new Error("A valid calendar date and whole-day duration are required.");
  }

  const value = new Date(`${calendarDate}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const isCalendarDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const validateRevisedDeliveryWindow = ({
  startDate,
  endDate,
  delayReason,
  originalStartDate,
  originalEndDate,
  previousStartDate = "",
  previousEndDate = "",
}) => {
  const normalizedStartDate = String(startDate || "").trim();
  const normalizedEndDate = String(endDate || "").trim();
  const normalizedDelayReason = String(delayReason || "").trim();
  if (
    !isCalendarDate(normalizedStartDate) ||
    !isCalendarDate(normalizedEndDate) ||
    normalizedStartDate > normalizedEndDate
  ) {
    const error = new Error("Enter a valid revised delivery date window.");
    error.statusCode = 400;
    throw error;
  }
  if (
    normalizedStartDate < originalStartDate ||
    normalizedEndDate < originalEndDate ||
    (normalizedStartDate === originalStartDate &&
      normalizedEndDate === originalEndDate) ||
    (previousStartDate && normalizedStartDate < previousStartDate) ||
    (previousEndDate && normalizedEndDate < previousEndDate)
  ) {
    const error = new Error("A revised delivery window must reflect a later estimate.");
    error.statusCode = 400;
    throw error;
  }
  if (!normalizedDelayReason || normalizedDelayReason.length > 500) {
    const error = new Error("Provide a delay reason of 1 to 500 characters.");
    error.statusCode = 400;
    throw error;
  }

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    delayReason: normalizedDelayReason,
  };
};

const createDeliveryEstimate = (
  createdAt = new Date(),
  config = deliveryEstimateConfig,
) => {
  const orderDate = getCalendarDate(createdAt, config.timeZone);

  return {
    originalStartDate: addCalendarDays(orderDate, config.minDays),
    originalEndDate: addCalendarDays(orderDate, config.maxDays),
    minDays: config.minDays,
    maxDays: config.maxDays,
    revisedStartDate: "",
    revisedEndDate: "",
    revisedAt: undefined,
    delayReason: "",
  };
};

const createInitialDeliveryData = (
  createdAt,
  { confirmedAtCreation = false, config = deliveryEstimateConfig } = {},
) => ({
  deliveryEstimate: createDeliveryEstimate(createdAt, config),
  fulfillmentEvents: [
    { status: "PLACED", occurredAt: createdAt },
    ...(confirmedAtCreation
      ? [{ status: "CONFIRMED", occurredAt: createdAt }]
      : []),
  ],
});

module.exports = {
  addCalendarDays,
  createDeliveryEstimate,
  createInitialDeliveryData,
  getCalendarDate,
  isCalendarDate,
  validateRevisedDeliveryWindow,
};
