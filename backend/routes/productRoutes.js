const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const validateProduct = require("../middleware/validateProduct");

const router = express.Router();

router.get("/", getProducts);

router.get("/:id", getProductById);

router.post(
  "/",
  protect,
  validateProduct,
  createProduct
);

router.put(
  "/:id",
  protect,
  validateProduct,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  deleteProduct
);

module.exports = router;