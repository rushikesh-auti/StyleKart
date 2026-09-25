const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ user: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);