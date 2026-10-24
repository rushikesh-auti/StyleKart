const multer = require("multer");

const MAX_WARDROBE_IMAGE_BYTES = 4 * 1024 * 1024;
const extensionMimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_WARDROBE_IMAGE_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
  },
  fileFilter(req, file, callback) {
    const extension = file.originalname
      .slice(file.originalname.lastIndexOf("."))
      .toLowerCase();
    if (!extensionMimeTypes[extension] || extensionMimeTypes[extension] !== file.mimetype) {
      const error = new Error("Choose a JPEG, PNG, or WebP image with a matching file extension.");
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

const uploadWardrobeImage = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return res.status(415).json({
      success: false,
      message: "Content-Type must be multipart/form-data.",
    });
  }

  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Wardrobe images must be 4 MB or smaller."
            : error instanceof multer.MulterError
              ? "Upload must contain one image in the 'image' field and no extra fields."
              : error.statusCode === 400
                ? error.message
                : "Multipart upload is malformed.",
      });
    }
    return next();
  });
};

module.exports = { MAX_WARDROBE_IMAGE_BYTES, uploadWardrobeImage };
