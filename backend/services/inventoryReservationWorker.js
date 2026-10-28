const PaymentAttempt = require("../models/PaymentAttempt");
const { releasePaymentReservation } = require("./inventoryService");

const WORKER_INTERVAL_MS = 15_000;
const BATCH_SIZE = 100;
const CREATING_TIMEOUT_MS = 5 * 60 * 1000;

let workerTimer;
let workerRunning = false;

const processExpiredReservations = async () => {
  if (workerRunning) return;
  workerRunning = true;

  try {
    const now = new Date();
    const expiredAttempts = await PaymentAttempt.find({
      status: "CREATED",
      expiresAt: { $lte: now },
      inventoryReservedAt: { $exists: true },
      reservationReleasedAt: { $exists: false },
    })
      .select("_id")
      .limit(BATCH_SIZE)
      .lean();

    for (const attempt of expiredAttempts) {
      await releasePaymentReservation({
        attemptId: attempt._id,
        status: "EXPIRED",
        failureReason: "Checkout reservation expired before payment confirmation.",
      });
    }

    const staleBefore = new Date(now.getTime() - CREATING_TIMEOUT_MS);
    await PaymentAttempt.updateMany(
      { status: "CREATING", createdAt: { $lte: staleBefore } },
      {
        $set: {
          status: "FAILED",
          failureReason: "Checkout setup did not complete.",
        },
      },
    );
  } finally {
    workerRunning = false;
  }
};

const startInventoryReservationWorker = () => {
  if (workerTimer) return;

  workerTimer = setInterval(() => {
    processExpiredReservations().catch((error) => {
      console.error("Inventory reservation cleanup failed:", error.message);
    });
  }, WORKER_INTERVAL_MS);
  workerTimer.unref();
  processExpiredReservations().catch((error) => {
    console.error("Initial inventory reservation cleanup failed:", error.message);
  });
};

module.exports = {
  processExpiredReservations,
  startInventoryReservationWorker,
};
