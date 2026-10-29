const assert = require("node:assert/strict");
const test = require("node:test");

const {
  addCalendarDays,
  createDeliveryEstimate,
  createInitialDeliveryData,
  getCalendarDate,
  isCalendarDate,
  validateRevisedDeliveryWindow,
} = require("./deliveryEstimateService");

test("delivery estimates use configured calendar days from the placement date", () => {
  const estimate = createDeliveryEstimate(
    new Date("2026-10-28T12:00:00.000Z"),
    {
      timeZone: "Asia/Kolkata",
      minDays: 2,
      maxDays: 4,
    },
  );

  assert.deepEqual(estimate, {
    originalStartDate: "2026-10-30",
    originalEndDate: "2026-11-01",
    minDays: 2,
    maxDays: 4,
    revisedStartDate: "",
    revisedEndDate: "",
    revisedAt: undefined,
    delayReason: "",
  });
});

test("COD and captured Razorpay orders initialize estimate and placed/confirmed events", () => {
  const createdAt = new Date("2026-10-28T12:00:00.000Z");
  const config = {
    timeZone: "Asia/Kolkata",
    minDays: 2,
    maxDays: 4,
  };

  const codData = createInitialDeliveryData(createdAt, { config });
  const razorpayData = createInitialDeliveryData(createdAt, {
    confirmedAtCreation: true,
    config,
  });

  assert.deepEqual(codData.fulfillmentEvents.map(({ status }) => status), ["PLACED"]);
  assert.deepEqual(razorpayData.fulfillmentEvents.map(({ status }) => status), [
    "PLACED",
    "CONFIRMED",
  ]);
  assert.equal(codData.deliveryEstimate.originalStartDate, "2026-10-30");
  assert.equal(razorpayData.deliveryEstimate.originalEndDate, "2026-11-01");
  assert.equal(codData.deliveryEstimate.minDays, 2);
  assert.equal(razorpayData.deliveryEstimate.maxDays, 4);
});

test("orders placed on different dates receive distinct windows", () => {
  const config = { timeZone: "Asia/Kolkata", minDays: 2, maxDays: 4 };
  assert.deepEqual(
    [
      createDeliveryEstimate(new Date("2026-10-28T12:00:00.000Z"), config)
        .originalStartDate,
      createDeliveryEstimate(new Date("2026-11-05T12:00:00.000Z"), config)
        .originalStartDate,
    ],
    ["2026-10-30", "2026-11-07"],
  );
});

test("date conversion handles timezone boundaries, month end, and year end", () => {
  const config = { timeZone: "Asia/Kolkata", minDays: 2, maxDays: 4 };
  assert.equal(getCalendarDate(new Date("2026-10-28T18:29:59.999Z")), "2026-10-28");
  assert.equal(getCalendarDate(new Date("2026-10-28T18:30:00.000Z")), "2026-10-29");
  assert.equal(getCalendarDate(new Date("2026-12-31T19:00:00.000Z")), "2027-01-01");
  assert.equal(addCalendarDays("2026-10-30", 4), "2026-11-03");
  assert.equal(
    createDeliveryEstimate(new Date("2026-12-30T12:00:00.000Z"), config)
      .originalEndDate,
    "2027-01-03",
  );
});

test("calendar dates reject malformed or impossible values", () => {
  assert.equal(isCalendarDate("2028-02-29"), true);
  assert.equal(isCalendarDate("2027-02-29"), false);
  assert.equal(isCalendarDate("2027-2-09"), false);
});

test("invalid timestamps and date arithmetic inputs are rejected", () => {
  assert.throws(() => getCalendarDate("not-a-date"), /valid order creation date/);
  assert.throws(() => addCalendarDays("2027-02-30", 1), /valid calendar date/);
});

test("revised delivery windows must preserve the original and move later", () => {
  assert.deepEqual(
    validateRevisedDeliveryWindow({
      startDate: "2026-11-04",
      endDate: "2026-11-08",
      delayReason: "Sorting facility delay",
      originalStartDate: "2026-11-02",
      originalEndDate: "2026-11-04",
    }),
    {
      startDate: "2026-11-04",
      endDate: "2026-11-08",
      delayReason: "Sorting facility delay",
    },
  );
});

test("revised delivery windows reject regressions, invalid ranges, and empty reasons", () => {
  const original = {
    originalStartDate: "2026-11-02",
    originalEndDate: "2026-11-04",
  };
  assert.throws(
    () =>
      validateRevisedDeliveryWindow({
        ...original,
        startDate: "2026-11-01",
        endDate: "2026-11-05",
        delayReason: "Delay",
      }),
    /later estimate/,
  );
  assert.throws(
    () =>
      validateRevisedDeliveryWindow({
        ...original,
        startDate: "2026-11-06",
        endDate: "2026-11-05",
        delayReason: "Delay",
      }),
    /valid revised delivery date window/,
  );
  assert.throws(
    () =>
      validateRevisedDeliveryWindow({
        ...original,
        startDate: "2026-11-03",
        endDate: "2026-11-05",
        delayReason: " ",
      }),
    /delay reason/,
  );
});
