const express = require("express");
const {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
} = require("../controllers/wishlistController");
const { userProtect } = require("../middleware/authMiddleware");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();
const productField = allowBodyFields(["productId"], { productId: ["string"] });

router.use(userProtect);
router.get("/", getWishlist);
router.post("/items", productField, addWishlistItem);
router.delete("/items", productField, removeWishlistItem);
router.delete("/", clearWishlist);

module.exports = router;
