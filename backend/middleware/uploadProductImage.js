const multer = require("multer");

const MAX_FILE_SIZE_MB = (() => {
  const configuredValue = Number(process.env.PRODUCT_IMAGE_MAX_SIZE_MB);
  return Number.isFinite(configuredValue) && configuredValue > 0
    ? Math.min(configuredValue, 20)
    : 5;
})();

const extensionMimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1,
  },
  fileFilter(req, file, callback) {
    const extension = file.originalname
      .slice(file.originalname.lastIndexOf("."))
      .toLowerCase();
    const expectedMimeType = extensionMimeTypes[extension];

    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
      const error = new Error(
        "Choose a JPEG, PNG, or WebP image with a matching file extension.",
      );
      error.statusCode = 400;
      return callback(error);
    }

    return callback(null, true);
  },
});

const uploadProductImage = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return res.status(415).json({
      success: false,
      message: "Content-Type must be multipart/form-data.",
    });
  }

  upload.single("image")(req, res, (error) => {
    if (error) {
      const isFileTooLarge = error.code === "LIMIT_FILE_SIZE";
      const isMulterError = error instanceof multer.MulterError;

      return res.status(isFileTooLarge ? 413 : 400).json({
        success: false,
        message: isFileTooLarge
          ? `Image must be ${MAX_FILE_SIZE_MB} MB or smaller.`
          : isMulterError
            ? "Upload must contain one image in the 'image' field and no extra fields."
            : error.statusCode === 400
              ? error.message
              : "Multipart upload is malformed.",
      });
    }

    return next();
  });
};

module.exports = {
  MAX_FILE_SIZE_MB,
  uploadProductImage,
};
