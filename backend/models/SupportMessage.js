const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    orderId: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    topic: {
      type: String,
      required: true,
      enum: [
        "orders",
        "shipping",
        "returns",
        "payments",
        "account",
        "other",
      ],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "NEW",
    },
  },
  { timestamps: true }
);

supportMessageSchema.index({ status: 1, createdAt: -1 });
supportMessageSchema.index({ email: 1, createdAt: -1 });

const SupportMessage = mongoose.model(
  "SupportMessage",
  supportMessageSchema
);

module.exports = SupportMessage;