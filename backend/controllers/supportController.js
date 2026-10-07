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

const allowedStatuses = [
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
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




const getAdminSupportMessages = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "",
      search = "",
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const filter = {};

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid support message status.",
        });
      }

      filter.status = status;
    }

    if (search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query must be 100 characters or fewer.",
      });
    }

    if (search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { orderId: searchRegex },
        { message: searchRegex },
      ];
    }

    const skip = (currentPage - 1) * pageLimit;

    const [messages, total] = await Promise.all([
      SupportMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      SupportMessage.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
        hasNextPage: currentPage * pageLimit < total,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};


const updateSupportMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid support message ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid support message status.",
      });
    }

    const supportMessage = await SupportMessage.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!supportMessage) {
      return res.status(404).json({
        success: false,
        message: "Support message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support message status updated successfully.",
      data: supportMessage,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createSupportMessage,
  getAdminSupportMessages,
  updateSupportMessageStatus,
};