const User = require("../models/User");

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const mobile = req.body.mobile?.trim() || "";

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        mobile,
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};