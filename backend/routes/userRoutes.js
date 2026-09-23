const express = require("express");

const {
  getProfile,
  updateProfile,
} = require("../controllers/userController");

const { userProtect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", userProtect, getProfile);
router.put("/profile", userProtect, updateProfile);

module.exports = router;