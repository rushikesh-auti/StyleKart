const readDayCount = (name, fallback, minimum = 0) => {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === "") return fallback;
  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${name} must be a whole number.`);
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < minimum || value > 60) {
    throw new Error(`${name} must be between ${minimum} and 60.`);
  }

  return value;
};

const deliveryEstimateConfig = Object.freeze({
  timeZone: "Asia/Kolkata",
  minDays: readDayCount("DELIVERY_MIN_DAYS", 2, 1),
  maxDays: readDayCount("DELIVERY_MAX_DAYS", 4, 1),
});

if (deliveryEstimateConfig.minDays > deliveryEstimateConfig.maxDays) {
  throw new Error(
    "DELIVERY_MIN_DAYS cannot be greater than DELIVERY_MAX_DAYS.",
  );
}

module.exports = deliveryEstimateConfig;
