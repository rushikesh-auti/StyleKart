const express = require("express");

const { createOrder, getOrder, getOrders } = require("../controllers/orderController");
const { userProtect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(userProtect);
router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id", getOrder);

module.exports = router;