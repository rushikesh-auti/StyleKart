const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subcategory: {
      type: String,
      default: "",
      trim: true,
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    item_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    original_price: {
      type: Number,
      required: true,
      min: 0,
    },
    current_price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      default: 100,
      min: 0,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    return_period: {
      type: Number,
      default: 14,
      min: 0,
    },
    delivery_date: {
      type: String,
      default: "",
    },
    rating: {
      stars: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({
  category: 1,
  current_price: 1,
  discount_percentage: -1,
});
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ category: 1, "rating.stars": -1, "rating.count": -1 });
productSchema.index({ category: 1, stock: 1 });
productSchema.index({ category: 1, sizes: 1, current_price: 1 });
productSchema.index({ category: 1, colors: 1, current_price: 1 });
productSchema.index({ current_price: 1 });
productSchema.index({ discount_percentage: -1 });
productSchema.index({ stock: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ company: 1 });
productSchema.index(
  {
    item_name: "text",
    company: "text",
    brand: "text",
    category: "text",
    subcategory: "text",
  },
  {
    name: "product_catalogue_text",
    weights: { item_name: 10, brand: 5, company: 3, category: 2, subcategory: 2 },
  },
);

module.exports = mongoose.model("Product", productSchema);
