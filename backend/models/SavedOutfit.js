const mongoose = require("mongoose");

const savedOutfitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    occasion: {
      type: String,
      required: true,
      enum: ["college", "office", "interview", "casual outing", "party", "wedding"],
    },
    budget: {
      type: Number,
      min: 0,
      max: 1000000,
      default: 0,
    },
    wardrobeItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WardrobeItem",
      },
    ],
    productIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

savedOutfitSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("SavedOutfit", savedOutfitSchema);
