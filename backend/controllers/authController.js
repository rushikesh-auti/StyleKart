const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");

const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.COOKIE_SAME_SITE || "lax").toLowerCase(),
  path: "/",
});

const setAuthCookie = (res, token) => {
  res.cookie("stylekart_session", token, authCookieOptions());
};

const createToken = (account) =>
  jwt.sign(
    {
      id: account._id,
      role: account.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );

const registerUser = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
    });

    setAuthCookie(res, createToken(user));
    return res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const [admin, user] = await Promise.all([
      Admin.findOne({ email }),
      User.findOne({ email }).select("+password"),
    ]);
    const [validAdminPassword, validUserPassword] = await Promise.all([
      admin ? bcrypt.compare(password, admin.password) : false,
      user ? bcrypt.compare(password, user.password) : false,
    ]);
    const account = validAdminPassword && admin.role === "admin"
      ? admin
      : validUserPassword && user.role === "user"
        ? user
        : null;

    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    setAuthCookie(res, createToken(account));
    const authenticatedAccount = {
      id: account._id,
      name: account.name,
      email: account.email,
      role: account.role,
    };

    return res.status(200).json({
      success: true,
      user: authenticatedAccount,
      ...(account.role === "admin" ? { admin: authenticatedAccount } : {}),
    });
  } catch (error) {
    return next(error);
  }
};

const loginAdmin = loginUser;

const getCurrentUser = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

const logoutUser = (req, res) => {
  res.clearCookie("stylekart_session", authCookieOptions());
  res.status(200).json({ success: true, message: "Logged out successfully." });
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  getCurrentUser,
  logoutUser,
};