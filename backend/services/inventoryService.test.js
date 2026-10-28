const assert = require("node:assert/strict");
const test = require("node:test");

const Product = require("../models/Product");
const {
  createInventorySnapshotFilter,
  createVariantCombinations,
  deductInventory,
  getVariantStock,
} = require("./inventoryService");
const {
  getLegacyAttemptUpdate,
  getLegacyProductUpdate,
} = require("../scripts/migrateInventory");

test("stock lookup uses the exact active size and color variant", () => {
  const product = {
    inventoryVariants: [
      { size: "S", color: "Black", stock: 3, active: true },
      { size: "M", color: "Black", stock: 8, active: true },
      { size: "S", color: "Blue", stock: 0, active: true },
      { size: "S", color: "Red", stock: 9, active: false },
    ],
  };

  assert.equal(getVariantStock(product, "S", "Black"), 3);
  assert.equal(getVariantStock(product, "M", "Black"), 8);
  assert.equal(getVariantStock(product, "S", "Blue"), 0);
  assert.equal(getVariantStock(product, "S", "Red"), 0);
  assert.equal(getVariantStock(product, "L", "Black"), 0);
});

test("stock lookup handles products without size or color options", () => {
  assert.equal(
    getVariantStock({
      inventoryVariants: [{ size: "", color: "", stock: 6, active: true }],
    }),
    6,
  );
});

test("inventory snapshot guard compares normalized variant values", () => {
  const filter = createInventorySnapshotFilter("sku-1", [
    { size: "M", color: "Blue", stock: 5, active: true },
    { size: "L", color: "Blue", stock: 0, active: true },
  ]);

  assert.equal(filter.id, "sku-1");
  assert.deepEqual(filter.$expr.$eq[1], [
    ["M", "Blue", 5, true],
    ["L", "Blue", 0, true],
  ]);
  assert.deepEqual(filter.$expr.$eq[0].$map.in, [
    { $ifNull: ["$$variant.size", ""] },
    { $ifNull: ["$$variant.color", ""] },
    { $ifNull: ["$$variant.stock", 0] },
    { $ifNull: ["$$variant.active", true] },
  ]);
});

test("inventory deduction uses an atomic quantity condition", async () => {
  const originalUpdateOne = Product.updateOne;
  let updateArguments;
  Product.updateOne = async (...args) => {
    updateArguments = args;
    return { modifiedCount: 1 };
  };

  try {
    await deductInventory(
      [{
        productId: "sku-1",
        quantity: 3,
        selectedSize: "M",
        selectedColor: "Blue",
      }],
      {},
    );
  } finally {
    Product.updateOne = originalUpdateOne;
  }

  assert.deepEqual(
    updateArguments[0].inventoryVariants.$elemMatch,
    {
      size: "M",
      color: "Blue",
      active: true,
      stock: { $gte: 3 },
    },
  );
  assert.deepEqual(updateArguments[1].$inc, {
    "inventoryVariants.$[variant].stock": -3,
  });
});

test("inventory deduction rejects a quantity above the selected variant stock", async () => {
  const originalUpdateOne = Product.updateOne;
  const originalFindOne = Product.findOne;
  Product.updateOne = async () => ({ modifiedCount: 0 });
  Product.findOne = () => ({
    session: async () => ({
      item_name: "Test shirt",
      inventoryVariants: [
        { size: "M", color: "Blue", stock: 2, active: true },
      ],
    }),
  });

  try {
    await assert.rejects(
      deductInventory(
        [{
          productId: "sku-1",
          quantity: 3,
          selectedSize: "M",
          selectedColor: "Blue",
        }],
        {},
      ),
      /only 2 item\(s\) available/,
    );
  } finally {
    Product.updateOne = originalUpdateOne;
    Product.findOne = originalFindOne;
  }
});

test("variant generation creates every size and color combination", () => {
  assert.deepEqual(
    createVariantCombinations(["S", "M"], ["Black", "Blue"]),
    [
      { size: "S", color: "Black" },
      { size: "S", color: "Blue" },
      { size: "M", color: "Black" },
      { size: "M", color: "Blue" },
    ],
  );
});

test("legacy non-variant product migration preserves aggregate stock", () => {
  const update = getLegacyProductUpdate({
    _id: "product-id",
    stock: 12,
    sizes: [],
    colors: [],
  });

  assert.deepEqual(update.updateOne.update.$set.inventoryVariants, [
    { size: "", color: "", stock: 12, active: true },
  ]);
  assert.deepEqual(update.updateOne.update.$unset, { stock: "" });
});

test("legacy variant products keep stock unallocated until admin assignment", () => {
  const update = getLegacyProductUpdate({
    _id: "product-id",
    stock: 12,
    sizes: ["S", "M"],
    colors: ["Black"],
  });

  assert.deepEqual(update.updateOne.update.$set.inventoryVariants, [
    { size: "S", color: "Black", stock: 0, active: true },
    { size: "M", color: "Black", stock: 0, active: true },
  ]);
  assert.equal(update.updateOne.update.$set.legacyStockToAllocate, 12);
});

test("legacy payment attempts receive all missing required lifecycle fields", () => {
  const expiresAt = new Date("2025-01-01T00:00:00.000Z");
  const update = getLegacyAttemptUpdate(
    { _id: "attempt-id", expiresAt },
    new Date("2025-01-02T00:00:00.000Z"),
  );

  assert.deepEqual(update.updateOne.update.$set, {
    checkoutRequestId: "legacy:attempt-id",
    checkoutHash: "legacy",
    purgeAt: new Date(expiresAt.getTime() + 90 * 24 * 60 * 60 * 1000),
  });
});

test("complete payment attempts require no migration update", () => {
  assert.equal(
    getLegacyAttemptUpdate({
      _id: "attempt-id",
      checkoutRequestId: "request-key",
      checkoutHash: "hash",
      purgeAt: new Date(),
    }),
    null,
  );
});
