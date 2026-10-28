const mongoose = require("mongoose");

const paymentAttemptItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    itemName: { type: String, required: true },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String, default: "" },
    selectedColor: { type: String, default: "" },
    unitPrice: { type: Number, required: true, min: 0 },
    originalUnitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const paymentAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    razorpayOrderId: { type: String, unique: true, sparse: true, index: true },
    checkoutRequestId: { type: String, required: true, trim: true },
    checkoutHash: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["CREATING", "CREATED", "PAID", "FAILED", "REFUNDED", "EXPIRED"],
      default: "CREATING",
      index: true,
    },
    snapshot: {
      items: { type: [paymentAttemptItemSchema], required: true },
      shippingAddress: {
        fullName: { type: String, required: true },
        mobile: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: "" },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pinCode: { type: String, required: true },
        addressType: { type: String, default: "Home" },
      },
      priceSummary: {
        totalMrp: { type: Number, required: true, min: 0 },
        discount: { type: Number, required: true, min: 0 },
        couponCode: { type: String, default: "" },
        couponDiscount: { type: Number, default: 0, min: 0 },
        delivery: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      },
      totalAmount: { type: Number, required: true, min: 0 },
    },
    razorpayPaymentId: { type: String, default: "" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    failureReason: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
    inventoryReservedAt: { type: Date },
    reservationReleasedAt: { type: Date },
    purgeAt: { type: Date, required: true },
    lateRefundStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING", "PROCESSED", "FAILED"],
      default: "NOT_REQUIRED",
    },
    lateRefundId: { type: String, default: "" },
    lateRefundRequestUncertain: { type: Boolean, default: false },
  },
  { timestamps: true },
);

paymentAttemptSchema.index({ user: 1, checkoutRequestId: 1 }, { unique: true });
paymentAttemptSchema.index({ status: 1, expiresAt: 1 });
paymentAttemptSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PaymentAttempt", paymentAttemptSchema);
