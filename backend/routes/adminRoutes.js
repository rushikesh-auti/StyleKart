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
const {
  uploadProductImage: parseProductImage,
} = require("../middleware/uploadProductImage");
const {
  deleteUnusedProductImage,
  uploadProductImage,
} = require("../controllers/productImageController");
const {
  allowBodyFields,
  allowQueryFields,
} = require("../middleware/requestSecurity");

const router = express.Router();

router.use(protect);

router.post("/upload", parseProductImage, uploadProductImage);
router.delete(
  "/upload",
  allowBodyFields(["public_id"], { public_id: ["string"] }),
  deleteUnusedProductImage,
);

router.get("/dashboard", getDashboard);
router.get(
  "/inventory/low-stock",
  allowQueryFields(["threshold"]),
  getLowStockProducts,
);

router.get(
  "/orders",
  allowQueryFields(["page", "limit", "search", "status"]),
  getAdminOrders,
);
router.get("/orders/:id", getAdminOrder);
router.put(
  "/orders/:id/status",
  allowBodyFields(["orderStatus"], { orderStatus: ["string"] }),
  updateOrderStatus,
);

router.get(
  "/customers",
  allowQueryFields(["page", "limit", "search"]),
  getCustomers,
);
router.get("/customers/:id", getCustomer);

module.exports = router;