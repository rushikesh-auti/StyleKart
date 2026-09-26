const express = require("express");

const { createReview, deleteReview, getReviews, updateReview } = require("../controllers/reviewController");
const { userProtect } = require("../middleware/authMiddleware");
const { allowBodyFields } = require("../middleware/requestSecurity");

const router = express.Router();

router.get("/product/:productId", getReviews);
const reviewFields = ["rating", "title", "comment"];
const reviewFieldTypes = {
  rating: ["number", "string"],
  title: ["string"],
  comment: ["string"],
};

router.post(
  "/product/:productId",
  userProtect,
  allowBodyFields(reviewFields, reviewFieldTypes),
  createReview,
);
router.put(
  "/:id",
  userProtect,
  allowBodyFields(reviewFields, reviewFieldTypes),
  updateReview,
);
router.delete("/:id", userProtect, allowBodyFields([]), deleteReview);

module.exports = router;