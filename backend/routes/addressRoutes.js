const express = require("express");

const {
  getAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} = require("../controllers/addressController");

const { userProtect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(userProtect);

router.get("/", getAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.put("/:id/default", setDefaultAddress);
router.delete("/:id", deleteAddress);

module.exports = router;