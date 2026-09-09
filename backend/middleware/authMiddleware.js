const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Account = decoded.role === "admin" ? Admin : User;
    const account = await Account.findById(decoded.id).select("-password");

    if (!account || account.role !== decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Authenticated account is no longer available.",
      });
    }

    req.user = {
      id: account._id,
      name: account.name,
      email: account.email,
      role: account.role,
    };
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "CastError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication service is unavailable.",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access is required.",
    });
  }

  req.admin = req.user;
  next();
};

const protect = (req, res, next) =>
  authenticate(req, res, () => adminOnly(req, res, next));

module.exports = protect;
module.exports.authenticate = authenticate;
module.exports.adminOnly = adminOnly;