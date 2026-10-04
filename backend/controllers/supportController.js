const SupportMessage = require("../models/SupportMessage");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const allowedTopics = [
  "orders",
  "shipping",
  "returns",
  "payments",
  "account",
  "other",
];

const createSupportMessage = async (req, res, next) => {
  try {
    const { name, email, orderId = "", topic, message } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof topic !== "string" ||
      typeof message !== "string" ||
      typeof orderId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOrderId = orderId.trim();
    const cleanMessage = message.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters.",
      });
    }

    if (cleanEmail.length > 254 || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!allowedTopics.includes(topic)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid support topic.",
      });
    }

    if (cleanOrderId.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Order ID is too long.",
      });
    }

    if (cleanMessage.length < 10 || cleanMessage.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 10 and 3000 characters.",
      });
    }

    const supportMessage = await SupportMessage.create({
      name: cleanName,
      email: cleanEmail,
      orderId: cleanOrderId,
      topic,
      message: cleanMessage,
    });

    return res.status(201).json({
      success: true,
      message: "Your support request has been submitted.",
      data: {
        id: supportMessage._id,
        status: supportMessage.status,
        createdAt: supportMessage.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSupportMessage };