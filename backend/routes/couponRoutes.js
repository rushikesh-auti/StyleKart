const express = require("express");

const { createCoupon, deleteCoupon, listCoupons, updateCoupon, validateCouponCode } = require("../controllers/couponController");
const { protect, userProtect } = require("../middleware/authMiddleware");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();

router.post(
  "/validate",
  userProtect,
  allowBodyFields(["code", "subtotal"], {
    code: ["string"],
    subtotal: ["number", "string"],
  }),
  validateCouponCode,
);
router.use(protect);
router.get("/", listCoupons);
const couponFields = [
  "code",
  "minimumAmount",
  "discountType",
  "discountValue",
  "maximumDiscount",
  "expiryDate",
  "usageLimit",
  "active",
];
const couponFieldTypes = {
  code: ["string"],
  minimumAmount: ["number", "string"],
  discountType: ["string"],
  discountValue: ["number", "string"],
  maximumDiscount: ["number", "string", "null"],
  expiryDate: ["string"],
  usageLimit: ["number", "string"],
  active: ["boolean"],
};

router.post("/", allowBodyFields(couponFields, couponFieldTypes), createCoupon);
router.put("/:id", allowBodyFields(couponFields, couponFieldTypes), updateCoupon);
router.delete("/:id", allowBodyFields([]), deleteCoupon);

module.exports = router;