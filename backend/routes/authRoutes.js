const express = require("express");
const {
  registerUser,
  loginUser,
  loginAdmin,
  getCurrentUser,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;