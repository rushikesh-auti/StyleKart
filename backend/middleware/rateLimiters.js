const { rateLimit } = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign-in attempts. Please try again in 15 minutes.",
  },
});

const wardrobeUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many wardrobe image uploads. Try again in an hour.",
  },
});

module.exports = { authLimiter, wardrobeUploadLimiter };
