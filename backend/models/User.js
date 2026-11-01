const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required() {
        return !this.googleId;
      },
      select: false,
    },
    googleId: {
      type: String,
      trim: true,
      immutable: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
