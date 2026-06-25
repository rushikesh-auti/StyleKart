const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    category: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    item_name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      required: true,
    },

    original_price: {
      type: Number,
      required: true,
    },

    current_price: {
      type: Number,
      required: true,
    },

    discount_percentage: {
      type: Number,
      default: 0,
    },

    return_period: {
      type: Number,
      default: 14,
    },

    delivery_date: {
      type: String,
    },

    stock: {
      type: Number,
      default: 100,
    },

    rating: {
      stars: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);