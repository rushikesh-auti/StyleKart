const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/Review");

const reviewInput = (body) => ({
  rating: Number(body.rating),
  title: String(body.title || "").trim(),
  comment: String(body.comment || "").trim(),
});

const validateReview = ({ rating, title, comment }) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Rating must be a whole number from 1 to 5.";
  }
  if (!title || title.length > 120 || !comment || comment.length > 1000) {
    return "Review title and comment are required and must be within the allowed length.";
  }
  return "";
};

const hasPurchasedProduct = async (userId, productId) => {
  const order = await Order.findOne({
    user: userId,
    orderStatus: "DELIVERED",
    "items.productId": productId,
  }).select("_id");

  return Boolean(order);
};

const refreshProductRating = async (productId) => {
  const [summary] = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: "$productId", stars: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { id: productId },
    {
      rating: summary
        ? { stars: Number(summary.stars.toFixed(1)), count: summary.count }
        : { stars: 0, count: 0 },
    },
  );
};

const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.productId }).select("id");
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    if (!(await hasPurchasedProduct(req.user.id, product.id))) {
      return res.status(403).json({ success: false, message: "You can review a product after a delivered purchase." });
    }

    const input = reviewInput(req.body);
    const validationError = validateReview(input);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const review = await Review.create({ productId: product.id, user: req.user.id, ...input });
    await refreshProductRating(product.id);
    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const input = reviewInput(req.body);
    const validationError = validateReview(input);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      input,
      { new: true, runValidators: true },
    );
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    await refreshProductRating(review.productId);
    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    await refreshProductRating(review.productId);
    res.json({ success: true, message: "Review deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReviews, createReview, updateReview, deleteReview };