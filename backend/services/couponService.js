const Coupon = require("../models/Coupon");

const normalizeCode = (code) => String(code || "").trim().toUpperCase();

const validateCoupon = (coupon, subtotal) => {
  if (!coupon || !coupon.active || coupon.expiryDate <= new Date()) {
    return { error: "This coupon is invalid or expired." };
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return { error: "This coupon has reached its usage limit." };
  }
  if (subtotal < coupon.minimumAmount) {
    return { error: `Add ₹${(coupon.minimumAmount - subtotal).toLocaleString("en-IN")} more to use this coupon.` };
  }

  let discount = coupon.discountType === "PERCENTAGE"
    ? (subtotal * coupon.discountValue) / 100
    : coupon.discountValue;

  if (coupon.maximumDiscount !== null && coupon.maximumDiscount !== undefined) {
    discount = Math.min(discount, coupon.maximumDiscount);
  }

  discount = Math.min(Math.max(Math.floor(discount), 0), subtotal);
  return { discount };
};

const findValidCoupon = async (code, subtotal, session) => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return { error: "Enter a coupon code." };

  const query = Coupon.findOne({ code: normalizedCode });
  if (session) query.session(session);
  const coupon = await query;
  return { coupon, ...validateCoupon(coupon, subtotal) };
};

module.exports = { findValidCoupon, normalizeCode, validateCoupon };