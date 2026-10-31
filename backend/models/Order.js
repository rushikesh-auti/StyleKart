const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
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

const fulfillmentEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
      required: true,
    },
    occurredAt: { type: Date, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, trim: true },
    idempotencyHash: { type: String, select: false },
    invoiceNumber: { type: String, unique: true, sparse: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      minlength: 1,
    },
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
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "RAZORPAY"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    paymentDetails: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
    },
    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
        "REFUNDED",
      ],
      default: "PLACED",
    },
    deliveryEstimate: {
      originalStartDate: { type: String, default: "" },
      originalEndDate: { type: String, default: "" },
      minDays: { type: Number, min: 1, max: 60 },
      maxDays: { type: Number, min: 1, max: 60 },
      revisedStartDate: { type: String, default: "" },
      revisedEndDate: { type: String, default: "" },
      revisedAt: { type: Date },
      delayReason: { type: String, trim: true, maxlength: 500, default: "" },
    },
    fulfillmentEvents: {
      type: [fulfillmentEventSchema],
      default: [],
    },
    deliveryTracking: {
      mode: { type: String, enum: ["MANUAL"], default: "MANUAL" },
      trackingReference: { type: String, trim: true, maxlength: 100, default: "" },
    },
    cancellationReason: {
      type: String,
      enum: [
        "Ordered by mistake",
        "Found a better price",
        "Wrong item or size",
        "Delivery taking too long",
        "Changed my mind",
        "Other",
      ],
    },
    cancellationNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancellationInitiator: {
      type: String,
      enum: ["CUSTOMER", "ADMIN"],
    },
    inventoryDeducted: { type: Boolean, default: true },
    inventoryRestoredAt: { type: Date },
    inventoryRestoreIssues: { type: [String], default: [] },
    refundStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING", "PROCESSING", "PROCESSED", "FAILED"],
      default: "NOT_REQUIRED",
    },
    refundProvider: { type: String, enum: ["RAZORPAY"] },
    providerRefundId: { type: String, default: "" },
    refundAttemptedAt: { type: Date },
    refundRequestStartedAt: { type: Date },
    refundRequestUncertain: { type: Boolean, default: false },
    refundProcessingStartedAt: { type: Date, select: false },
    refundProcessingToken: { type: String, default: "", select: false },
    refundFailureReason: { type: String, default: "", maxlength: 500 },
    priceSummary: {
      totalMrp: { type: Number, required: true, min: 0 },
      discount: { type: Number, required: true, min: 0 },
      couponCode: { type: String, default: "" },
      couponDiscount: { type: Number, default: 0, min: 0 },
      delivery: { type: Number, required: true, min: 0 },
      subtotal: { type: Number, required: true, min: 0 },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
orderSchema.index(
  { "paymentDetails.razorpayOrderId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "paymentDetails.razorpayOrderId": { $type: "string" },
    },
  },
);

module.exports = mongoose.model("Order", orderSchema);
