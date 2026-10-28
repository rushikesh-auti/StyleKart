require("dotenv").config();

const mongoose = require("mongoose");

const createVariantCombinations = (sizes = [], colors = []) => {
  const sizeOptions = sizes.length ? sizes : [""];
  const colorOptions = colors.length ? colors : [""];
  return sizeOptions.flatMap((size) =>
    colorOptions.map((color) => ({ size, color, stock: 0, active: true })),
  );
};

const getLegacyProductUpdate = (product) => {
  const stock = Number.isInteger(product.stock) ? product.stock : 100;
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const hasOptions = sizes.length > 0 || colors.length > 0;
  const inventoryVariants = hasOptions
    ? createVariantCombinations(sizes, colors)
    : [{ size: "", color: "", stock, active: true }];
  const set = { inventoryVariants };
  if (hasOptions) set.legacyStockToAllocate = stock;

  return {
    updateOne: {
      filter: { _id: product._id, inventoryVariants: { $exists: false } },
      update: {
        $set: set,
        $unset: { stock: "" },
      },
    },
  };
};

const getLegacyAttemptUpdate = (attempt, now = new Date()) => {
  const set = {};

  if (
    typeof attempt.checkoutRequestId !== "string" ||
    !attempt.checkoutRequestId.trim()
  ) {
    set.checkoutRequestId = `legacy:${attempt._id}`;
  }
  if (
    typeof attempt.checkoutHash !== "string" ||
    !attempt.checkoutHash.trim()
  ) {
    set.checkoutHash = "legacy";
  }
  if (!attempt.purgeAt) {
    const expiresAt = attempt.expiresAt instanceof Date ? attempt.expiresAt : now;
    set.purgeAt = new Date(expiresAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  }

  if (Object.keys(set).length === 0) return null;
  return {
    updateOne: {
      filter: { _id: attempt._id },
      update: { $set: set },
    },
  };
};

const main = async () => {
  const apply = process.argv.includes("--apply");
  if (
    apply &&
    process.env.MONGODB_MIGRATION_CONFIRM !== "MIGRATE_STYLEKART_INVENTORY"
  ) {
    throw new Error(
      "Set MONGODB_MIGRATION_CONFIRM=MIGRATE_STYLEKART_INVENTORY to apply this migration.",
    );
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to inspect the inventory database.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const products = mongoose.connection.collection("products");
  const attempts = mongoose.connection.collection("paymentattempts");
  const legacyProducts = await products
    .find({ inventoryVariants: { $exists: false } })
    .toArray();
  const updates = legacyProducts.map(getLegacyProductUpdate);

  const legacyAttempts = await attempts
    .find({
      $or: [
        { checkoutRequestId: { $exists: false } },
        { checkoutRequestId: null },
        { checkoutRequestId: "" },
        { checkoutHash: { $exists: false } },
        { checkoutHash: null },
        { checkoutHash: "" },
        { purgeAt: { $exists: false } },
        { purgeAt: null },
      ],
    })
    .toArray();
  const attemptUpdates = legacyAttempts
    .map((attempt) => getLegacyAttemptUpdate(attempt))
    .filter(Boolean);

  const staleCreatedAttempts = await attempts.countDocuments({
    status: "CREATED",
    inventoryReservedAt: { $exists: false },
  });
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        legacyProducts: legacyProducts.length,
        variantProductsRequiringManualAllocation: legacyProducts.filter(
          (product) =>
            (product.sizes?.length || 0) > 0 ||
            (product.colors?.length || 0) > 0,
        ).length,
        legacyAttempts: legacyAttempts.length,
        oldCreatedAttemptsToInvalidate: staleCreatedAttempts,
      },
      null,
      2,
    ),
  );

  if (apply) {
    if (updates.length) await products.bulkWrite(updates, { ordered: false });
    if (attemptUpdates.length) {
      await attempts.bulkWrite(attemptUpdates, { ordered: false });
    }
    if (staleCreatedAttempts) {
      await attempts.updateMany(
        { status: "CREATED", inventoryReservedAt: { $exists: false } },
        {
          $set: {
            status: "FAILED",
            failureReason:
              "Legacy checkout invalidated during inventory migration; no inventory was reserved.",
          },
        },
      );
    }

    const indexes = await attempts.indexes();
    for (const index of indexes) {
      if (index.expireAfterSeconds !== undefined && index.key?.expiresAt) {
        await attempts.dropIndex(index.name);
      }
    }
    const productIndexes = await products.indexes();
    for (const index of productIndexes) {
      if (index.name !== "_id_" && index.key?.stock) {
        await products.dropIndex(index.name);
      }
    }
  }

  await mongoose.disconnect();
};

if (require.main === module) {
  main().catch(async (error) => {
    console.error("Inventory migration failed:", error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}

module.exports = {
  createVariantCombinations,
  getLegacyAttemptUpdate,
  getLegacyProductUpdate,
};
