const Product = require("../models/Product");
const PaymentAttempt = require("../models/PaymentAttempt");
const mongoose = require("mongoose");

const createInventoryError = (message, statusCode = 409) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const findInventoryVariant = (product, size = "", color = "") =>
  product.inventoryVariants?.find(
    (variant) =>
      variant.active &&
      variant.size === (size || "") &&
      variant.color === (color || ""),
  );

const getVariantStock = (product, size = "", color = "") =>
  findInventoryVariant(product, size, color)?.stock || 0;

const createInventorySnapshotFilter = (productId, inventoryVariants) => {
  return {
    id: productId,
    $expr: {
      $eq: [
        {
          $map: {
            input: { $ifNull: ["$inventoryVariants", []] },
            as: "variant",
            in: [
              { $ifNull: ["$$variant.size", ""] },
              { $ifNull: ["$$variant.color", ""] },
              { $ifNull: ["$$variant.stock", 0] },
              { $ifNull: ["$$variant.active", true] },
            ],
          },
        },
        inventoryVariants.map((variant) => [
          variant.size || "",
          variant.color || "",
          variant.stock ?? 0,
          variant.active ?? true,
        ]),
      ],
    },
  };
};

const updateStock = async (item, quantity, session) => {
  const size = item.selectedSize || "";
  const color = item.selectedColor || "";
  const updateOptions = {
    arrayFilters: [
      { "variant.size": size, "variant.color": color, "variant.active": true },
    ],
  };
  if (session) updateOptions.session = session;

  const result = await Product.updateOne(
    {
      id: item.productId,
      inventoryVariants: {
        $elemMatch: {
          size,
          color,
          active: true,
          stock: { $gte: quantity },
        },
      },
    },
    { $inc: { "inventoryVariants.$[variant].stock": -quantity } },
    updateOptions,
  );

  if (result.modifiedCount !== 1) {
    let productQuery = Product.findOne({ id: item.productId });
    if (session) productQuery = productQuery.session(session);
    const product = await productQuery;
    if (!product) {
      throw createInventoryError("A product in this order is no longer available.", 409);
    }

    const variant = findInventoryVariant(product, size, color);
    if (!variant) {
      throw createInventoryError(
        `Inventory is not configured for ${product.item_name}${size ? ` (size ${size})` : ""}${color ? ` (${color})` : ""}.`,
        409,
      );
    }

    throw createInventoryError(
      `${product.item_name} has only ${variant.stock} item(s) available for the selected options.`,
      409,
    );
  }
};

const deductInventory = async (items, session) => {
  for (const item of items) {
    await updateStock(item, item.quantity, session);
  }
};

const restoreInventory = async (items, session) => {
  const issues = [];

  for (const item of items) {
    const size = item.selectedSize || "";
    const color = item.selectedColor || "";
    const result = await Product.updateOne(
      {
        id: item.productId,
        inventoryVariants: { $elemMatch: { size, color } },
      },
      { $inc: { "inventoryVariants.$[variant].stock": item.quantity } },
      {
        session,
        arrayFilters: [{ "variant.size": size, "variant.color": color }],
      },
    );

    if (result.modifiedCount !== 1) {
      issues.push(
        `${item.itemName} (${item.productId}${size ? `, size ${size}` : ""}${color ? `, ${color}` : ""}) was unavailable when stock was restored.`,
      );
    }
  }

  return issues;
};

const releasePaymentReservation = async ({
  attemptId,
  status,
  failureReason = "",
}) => {
  const session = await mongoose.startSession();
  let released = false;
  try {
    await session.withTransaction(async () => {
      const attempt = await PaymentAttempt.findOne({
        _id: attemptId,
        status: "CREATED",
        inventoryReservedAt: { $exists: true },
        reservationReleasedAt: { $exists: false },
      }).session(session);
      if (!attempt) return;

      const attemptUpdate = await PaymentAttempt.updateOne(
        {
          _id: attempt._id,
          status: "CREATED",
          reservationReleasedAt: { $exists: false },
        },
        {
          $set: {
            status,
            reservationReleasedAt: new Date(),
            failureReason,
          },
        },
        { session },
      );
      if (attemptUpdate.modifiedCount !== 1) return;
      const inventoryRestoreIssues = await restoreInventory(
        attempt.snapshot.items,
        session,
      );
      if (inventoryRestoreIssues.length > 0) {
        await PaymentAttempt.updateOne(
          { _id: attempt._id, status, reservationReleasedAt: { $exists: true } },
          {
            $set: {
              failureReason: [...inventoryRestoreIssues, failureReason]
                .filter(Boolean)
                .join(" ")
                .slice(0, 1000),
            },
          },
          { session },
        );
      }
      released = true;
    });
    return released;
  } finally {
    await session.endSession();
  }
};

const createVariantCombinations = (sizes = [], colors = []) => {
  const sizeOptions = sizes.length ? sizes : [""];
  const colorOptions = colors.length ? colors : [""];
  return sizeOptions.flatMap((size) =>
    colorOptions.map((color) => ({ size, color })),
  );
};

module.exports = {
  createInventoryError,
  createVariantCombinations,
  createInventorySnapshotFilter,
  deductInventory,
  findInventoryVariant,
  getVariantStock,
  releasePaymentReservation,
  restoreInventory,
};
