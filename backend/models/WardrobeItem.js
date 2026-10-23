const mongoose = require("mongoose");

const wardrobeItemSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 40,
    },
    color: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    secondaryColor: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40,
    },
    style: {
      type: String,
      enum: ["casual", "smart-casual", "formal", "festive", "athletic"],
      default: "casual",
    },
    occasions: {
      type: [String],
      enum: ["college", "office", "interview", "casual outing", "party", "wedding", "all"],
      default: [],
    },
    brand: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    image: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2048,
    },
    imagePublicId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 255,
    },
  },
  { timestamps: true },
);

wardrobeItemSchema.index({ user: 1, category: 1, updatedAt: -1 });

module.exports = mongoose.model("WardrobeItem", wardrobeItemSchema);
