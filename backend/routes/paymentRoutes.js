const express = require("express");
const { createRazorpayOrder, verifyRazorpayPayment } = require("../controllers/paymentController");
const { userProtect } = require("../middleware/authMiddleware");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();
router.use(userProtect);
router.post(
  "/razorpay/order",
  allowBodyFields(["addressId", "items", "couponCode"], {
    addressId: ["string"],
    items: ["array"],
    couponCode: ["string"],
  }),
  createRazorpayOrder,
);
router.post(
  "/razorpay/verify",
  allowBodyFields(["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"], {
    razorpay_order_id: ["string"],
    razorpay_payment_id: ["string"],
    razorpay_signature: ["string"],
  }),
  verifyRazorpayPayment,
);
module.exports = router;
