const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const readline = require("readline/promises");
const Admin = require("../models/Admin");

dotenv.config();

const createAdmin = async () => {
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const name = (await prompt.question("Admin name: ")).trim();
    const email = (await prompt.question("Admin email: ")).trim().toLowerCase();
    const password = await prompt.question("Admin password: ", { hideEchoBack: true });

    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully.");
  } catch (error) {
    console.error("Failed to create admin:", error);
    process.exitCode = 1;
  } finally {
    prompt.close();
    await mongoose.disconnect();
  }
};

createAdmin();