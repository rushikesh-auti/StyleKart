export const createVariantCombinations = (sizes = [], colors = []) => {
  const sizeOptions = sizes.length ? sizes : [""];
  const colorOptions = colors.length ? colors : [""];
  return sizeOptions.flatMap((size) =>
    colorOptions.map((color) => ({ size, color })),
  );
};

export const getVariantStock = (product, size = "", color = "") =>
  product?.inventoryVariants?.find(
    (variant) =>
      variant.active !== false &&
      variant.size === (size || "") &&
      variant.color === (color || ""),
  )?.stock || 0;

export const getAvailableProductStock = (product) =>
  (product?.inventoryVariants || []).reduce(
    (total, variant) =>
      total + (variant.active !== false ? Number(variant.stock) || 0 : 0),
    0,
  );

export const hasAvailableVariant = (product, size = "", color = "") =>
  (product?.inventoryVariants || []).some(
    (variant) =>
      variant.active !== false &&
      variant.stock > 0 &&
      (!size || variant.size === size) &&
      (!color || variant.color === color),
  );
