const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;

  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Request body contains invalid JSON.",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "A resource identifier is invalid.",
    });
  }

  if (err.name === "ValidationError") {
    const errors = {};

    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0];

    return res.status(409).json({
      success: false,
      message: `${duplicateField || "Field"} already exists`,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal server error." : err.message,
  });
};

module.exports = { errorHandler, notFound };
