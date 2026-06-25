require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const data = require("../items.json");

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Product.deleteMany();

    await Product.insertMany(data.items);

    console.log(` ${data.items.length} Products Imported`);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedProducts();