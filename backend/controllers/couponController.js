const Coupon = require("../models/Coupon");
const { findValidCoupon, normalizeCode } = require("../services/couponService");

const getCouponInput = (body) => ({
  code: normalizeCode(body.code),
  minimumAmount: Number(body.minimumAmount),
  discountType: body.discountType,
  discountValue: Number(body.discountValue),
  maximumDiscount: body.maximumDiscount === "" || body.maximumDiscount === null
    ? null
    : Number(body.maximumDiscount),
  expiryDate: body.expiryDate,
  usageLimit: Number(body.usageLimit),
  active: body.active !== false,
});

const validateCouponInput = (input) => {
  if (!input.code || !/^[A-Z0-9_-]{3,30}$/.test(input.code)) return "Coupon code must be 3-30 letters, numbers, hyphens, or underscores.";
  if (!["PERCENTAGE", "FIXED"].includes(input.discountType)) return "Select a valid discount type.";
  if (!Number.isFinite(input.minimumAmount) || input.minimumAmount < 0 || !Number.isFinite(input.discountValue) || input.discountValue <= 0) return "Discount values must be valid positive numbers.";
  if (input.discountType === "PERCENTAGE" && input.discountValue > 100) return "Percentage discount cannot exceed 100.";
  if (input.maximumDiscount !== null && (!Number.isFinite(input.maximumDiscount) || input.maximumDiscount < 0)) return "Maximum discount must be valid.";
  if (!input.expiryDate || Number.isNaN(new Date(input.expiryDate).getTime())) return "A valid expiry date is required.";
  if (!Number.isInteger(input.usageLimit) || input.usageLimit < 1) return "Usage limit must be at least 1.";
  return "";
};

const validateCouponCode = async (req, res, next) => {
  try {
    const subtotal = Number(req.body.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) return res.status(400).json({ success: false, message: "Subtotal is invalid." });

    const result = await findValidCoupon(req.body.code, subtotal);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, code: normalizeCode(req.body.code), discount: result.discount });
  } catch (error) {
    next(error);
  }
};

const listCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) { next(error); }
};

const createCoupon = async (req, res, next) => {
  try {
    const input = getCouponInput(req.body);
    const validationError = validateCouponInput(input);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const coupon = await Coupon.create(input);
    res.status(201).json({ success: true, coupon });
  } catch (error) { next(error); }
};

const updateCoupon = async (req, res, next) => {
  try {
    const input = getCouponInput(req.body);
    const validationError = validateCouponInput(input);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    res.json({ success: true, coupon });
  } catch (error) { next(error); }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    res.json({ success: true, coupon });
  } catch (error) { next(error); }
};

module.exports = { validateCouponCode, listCoupons, createCoupon, updateCoupon, deleteCoupon };