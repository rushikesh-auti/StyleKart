import { getVariantStock } from "./productInventory";

export const getCartSummary = (cartEntries, products) => {
  const lines = cartEntries
    .map((entry) => {
      const product = products.find(
        (item) => item.id === entry.productId,
      );

      if (!product) {
        return null;
      }

      const quantity = Math.max(Number(entry.quantity) || 1, 1);
      const availableStock = getVariantStock(
        product,
        entry.selectedSize,
        entry.selectedColor,
      );

      return {
        entry,
        product,
        quantity,
        availableStock,
        exceedsStock: quantity > availableStock,
        originalTotal: product.original_price * quantity,
        currentTotal: product.current_price * quantity,
      };
    })
    .filter(Boolean);

  const totalMrp = lines.reduce(
    (total, line) => total + line.originalTotal,
    0,
  );

  const subtotal = lines.reduce(
    (total, line) => total + line.currentTotal,
    0,
  );

  const discount = totalMrp - subtotal;
  const delivery = subtotal >= 999 || subtotal === 0 ? 0 : 99;

  return {
    lines,
    itemCount: lines.reduce(
      (total, line) => total + line.quantity,
      0,
    ),
    totalMrp,
    discount,
    subtotal,
    delivery,
    totalAmount: subtotal + delivery,
    savings: discount,
  };
};