const express = require("express");

const {
  createOrder,
  getOrder,
  getOrderInvoice,
  getOrders,
  cancelOrder,
} = require("../controllers/orderController");
const { userProtect } = require("../middleware/authMiddleware");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();

router.use(userProtect);
router.get("/", getOrders);
router.patch(
  "/:id/cancel",
  allowBodyFields(["reason", "note"], {
    reason: ["string"],
    note: ["string"],
  }),
  cancelOrder,
);
router.post(
  "/",
  allowBodyFields(["addressId", "items", "paymentMethod", "couponCode"], {
    addressId: ["string"],
    items: ["array"],
    paymentMethod: ["string"],
    couponCode: ["string"],
  }),
  createOrder,
);
router.get("/:id/invoice", getOrderInvoice);
router.get("/:id", getOrder);

module.exports = router;