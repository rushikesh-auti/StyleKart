const express = require("express");

const {
  getAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} = require("../controllers/addressController");

const { userProtect } = require("../middleware/authMiddleware");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();

router.use(userProtect);

router.get("/", getAddresses);
const addressFields = [
  "fullName",
  "mobile",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "pinCode",
  "addressType",
  "isDefault",
];

const addressFieldTypes = {
  fullName: ["string"],
  mobile: ["string"],
  addressLine1: ["string"],
  addressLine2: ["string"],
  city: ["string"],
  state: ["string"],
  pinCode: ["string"],
  addressType: ["string"],
  isDefault: ["boolean"],
};

router.post("/", allowBodyFields(addressFields, addressFieldTypes), createAddress);
router.put("/:id", allowBodyFields(addressFields, addressFieldTypes), updateAddress);
router.put("/:id/default", allowBodyFields([]), setDefaultAddress);
router.delete("/:id", allowBodyFields([]), deleteAddress);

module.exports = router;