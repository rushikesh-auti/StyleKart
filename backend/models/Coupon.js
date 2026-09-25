const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    minimumAmount: { type: Number, default: 0, min: 0 },
    discountType: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maximumDiscount: { type: Number, default: null, min: 0 },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1, active: 1, expiryDate: 1 });

module.exports = mongoose.model("Coupon", couponSchema);