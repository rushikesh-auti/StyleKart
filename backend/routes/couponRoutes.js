const express = require("express");

const { createCoupon, deleteCoupon, listCoupons, updateCoupon, validateCouponCode } = require("../controllers/couponController");
const { protect, userProtect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/validate", userProtect, validateCouponCode);
router.use(protect);
router.get("/", listCoupons);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;