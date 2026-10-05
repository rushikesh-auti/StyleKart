const express = require("express");

const { createSupportMessage } = require("../controllers/supportController");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();

router.post(
  "/contact",
  allowBodyFields(
    ["name", "email", "orderId", "topic", "message"],
    {
      name: ["string"],
      email: ["string"],
      orderId: ["string"],
      topic: ["string"],
      message: ["string"],
    },
  ),
  createSupportMessage,
);

module.exports = router;