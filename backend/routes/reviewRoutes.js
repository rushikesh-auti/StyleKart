const express = require("express");

const { createReview, deleteReview, getReviews, updateReview } = require("../controllers/reviewController");
const { userProtect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/product/:productId", getReviews);
router.post("/product/:productId", userProtect, createReview);
router.put("/:id", userProtect, updateReview);
router.delete("/:id", userProtect, deleteReview);

module.exports = router;