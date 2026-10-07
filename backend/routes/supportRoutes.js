const express = require("express");

const {
  createSupportMessage,
  getAdminSupportMessages,
  updateSupportMessageStatus,
} = require("../controllers/supportController");

const { protect } = require("../middleware/authMiddleware");
const {
  allowBodyFields,
  allowQueryFields,
} = require("../middleware/requestSecurity");

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


// GET /api/support/admin/messages
router.get(
  "/admin/messages",
  protect,
  allowQueryFields(["page", "limit", "status", "search"]),
  getAdminSupportMessages,
);

// PATCH /api/support/admin/messages/:id/status
router.patch(
  "/admin/messages/:id/status",
  protect,
  allowBodyFields(
    ["status"],
    {
      status: ["string"],
    },
  ),
  updateSupportMessageStatus,
);

module.exports = router;