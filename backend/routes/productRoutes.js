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
const {
  allowBodyFields,
  allowQueryFields,
  requireJsonObject,
} = require("../middleware/requestSecurity");

const router = express.Router();

router.get(
  "/",
  allowQueryFields([
    "page",
    "limit",
    "search",
    "category",
    "brand",
    "subcategory",
    "minPrice",
    "maxPrice",
    "minDiscount",
    "minRating",
    "size",
    "color",
    "availability",
    "sort",
  ]),
  getProducts,
);

router.get("/:id", getProductById);

router.post(
  "/",
  protect,
  requireJsonObject,
  validateProduct,
  createProduct
);

router.put(
  "/:id",
  protect,
  requireJsonObject,
  validateProduct,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  allowBodyFields([]),
  deleteProduct
);

module.exports = router;
