const express = require("express");
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");
const { userProtect } = require("../middleware/authMiddleware");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();

const cartItemFields = allowBodyFields(
  ["productId", "quantity", "selectedSize", "selectedColor"],
  {
    productId: ["string"],
    quantity: ["number"],
    selectedSize: ["string"],
    selectedColor: ["string"],
  },
);

router.use(userProtect);
router.get("/", getCart);
router.post("/items", cartItemFields, addCartItem);
router.patch("/items", cartItemFields, updateCartItem);
router.delete(
  "/items",
  allowBodyFields(
    ["productId", "selectedSize", "selectedColor"],
    {
      productId: ["string"],
      selectedSize: ["string"],
      selectedColor: ["string"],
    },
  ),
  removeCartItem,
);
router.delete("/", clearCart);

module.exports = router;
