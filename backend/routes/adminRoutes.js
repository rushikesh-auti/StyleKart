const express = require("express");

const {
  getDashboard,
  getLowStockProducts,
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  getCustomers,
  getCustomer,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/dashboard", getDashboard);
router.get("/inventory/low-stock", getLowStockProducts);

router.get("/orders", getAdminOrders);
router.get("/orders/:id", getAdminOrder);
router.put("/orders/:id/status", updateOrderStatus);

router.get("/customers", getCustomers);
router.get("/customers/:id", getCustomer);

module.exports = router;