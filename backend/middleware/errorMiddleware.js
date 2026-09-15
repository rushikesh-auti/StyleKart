const errorHandler = (err, req, res, next) => {
  console.error(err);

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

  res.status(err.statusCode || 500).json({
    success: false,
    message:
      err.message || "Internal server error",
  });
};

module.exports = errorHandler;