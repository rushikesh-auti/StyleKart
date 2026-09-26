const express = require("express");

const {
  getProfile,
  updateProfile,
} = require("../controllers/userController");

const { userProtect } = require("../middleware/authMiddleware");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();

router.get("/profile", userProtect, getProfile);
router.put(
  "/profile",
  userProtect,
  allowBodyFields(["name", "email", "mobile"], {
    name: ["string"],
    email: ["string"],
    mobile: ["string"],
  }),
  updateProfile,
);

module.exports = router;