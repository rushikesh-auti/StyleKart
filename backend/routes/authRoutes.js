const express = require("express");
const {
  registerUser,
  loginUser,
  loginAdmin,
  getCurrentUser,
  logoutUser,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");
const { allowBodyFields, requireJsonObject } = require("../middleware/requestSecurity");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  requireJsonObject,
  allowBodyFields(["name", "email", "password", "confirmPassword"], {
    name: ["string"],
    email: ["string"],
    password: ["string"],
    confirmPassword: ["string"],
  }),
  registerUser,
);
router.post(
  "/login",
  authLimiter,
  requireJsonObject,
  allowBodyFields(["email", "password"], {
    email: ["string"],
    password: ["string"],
  }),
  loginUser,
);
router.post(
  "/admin/login",
  authLimiter,
  requireJsonObject,
  allowBodyFields(["email", "password"], {
    email: ["string"],
    password: ["string"],
  }),
  loginAdmin,
);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", allowBodyFields([]), logoutUser);

module.exports = router;
