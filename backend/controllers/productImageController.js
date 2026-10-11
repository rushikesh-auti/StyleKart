const {
  deleteProductImageIfUnused,
  isConfigured,
  isManagedProductImage,
  uploadImageBuffer,
} = require("../services/cloudinaryAssetService");

const getImageFormat = (buffer) => {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return "";
};

const getCloudinaryUploadFailure = (error) => {
  if (error.http_code === 401) {
    return {
      status: 503,
      code: "CLOUDINARY_CREDENTIALS_REJECTED",
      message:
        "Image upload is temporarily unavailable. Please try again later. If the problem continues, contact support.",
    };
  }

  if (error.http_code === 403) {
    return {
      status: 502,
      code: "CLOUDINARY_UPLOAD_FORBIDDEN",
      message:
        "Cloudinary denied the image upload. Verify the backend API credentials, upload permissions, and Cloudinary account status.",
    };
  }

  if (error.http_code === 400) {
    return {
      status: 422,
      code: "CLOUDINARY_IMAGE_REJECTED",
      message:
        "Cloudinary could not process this image. Try exporting it as a valid JPEG, PNG, or WebP file and upload it again.",
    };
  }

  if (error.http_code >= 500) {
    return {
      status: 502,
      code: "CLOUDINARY_TEMPORARILY_UNAVAILABLE",
      message: "Cloudinary is temporarily unavailable. Please try again shortly.",
    };
  }

  if (error.code) {
    return {
      status: 502,
      code: "CLOUDINARY_CONNECTION_FAILED",
      message:
        "Could not connect to Cloudinary. Check the backend server's internet connection and try again.",
    };
  }

  return {
    status: 502,
    code: "CLOUDINARY_UPLOAD_FAILED",
    message: "Cloudinary could not complete the upload. Please try again.",
  };
};

const getSafeCloudinaryErrorMessage = (error) => {
  const message =
    typeof error?.error?.message === "string"
      ? error.error.message
      : typeof error?.message === "string"
        ? error.message
        : "";
  const secrets = [
    process.env.CLOUDINARY_API_SECRET,
    process.env.CLOUDINARY_API_KEY,
  ].filter((secret) => typeof secret === "string" && secret.length >= 8);

  return secrets
    .reduce(
      (safeMessage, secret) =>
        safeMessage.replaceAll(secret, "[REDACTED]"),
      message,
    )
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 300);
};

const uploadProductImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "An image is required in the 'image' field.",
    });
  }

  if (getImageFormat(req.file.buffer) !== req.file.mimetype) {
    return res.status(400).json({
      success: false,
      code: "IMAGE_CONTENT_MISMATCH",
      message:
        "The selected file's content does not match its extension or declared type. Export it as a real JPEG, PNG, or WebP image; changing only the filename is not enough.",
    });
  }

  if (!isConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Image uploads are not configured on this server.",
    });
  }

  try {
    const result = await uploadImageBuffer(req.file.buffer);

    return res.status(201).json({
      success: true,
      image: {
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    const failure = getCloudinaryUploadFailure(error);
    console.error("Product image upload failed:", {
      reason:
        failure.code === "CLOUDINARY_CREDENTIALS_REJECTED"
          ? "Cloudinary rejected the configured backend credentials. Verify the cloud name, API key, and API secret in backend/.env."
          : failure.code,
      status: error.http_code || undefined,
      code: error.code || undefined,
      providerMessage: getSafeCloudinaryErrorMessage(error) || undefined,
    });
    return res.status(failure.status).json({
      success: false,
      code: failure.code,
      message: failure.message,
    });
  }
};

const deleteUnusedProductImage = async (req, res) => {
  const { public_id: publicId } = req.body || {};

  if (typeof publicId !== "string" || !publicId.trim()) {
    return res.status(400).json({
      success: false,
      message: "A Cloudinary public_id is required.",
    });
  }

  if (!isManagedProductImage(publicId)) {
    return res.status(400).json({
      success: false,
      message: "Only StyleKart product images can be removed.",
    });
  }

  if (!isConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Image uploads are not configured on this server.",
    });
  }

  try {
    const result = await deleteProductImageIfUnused(publicId);

    if (result.referenced) {
      return res.status(409).json({
        success: false,
        message: "This image is still referenced by a product.",
      });
    }

    return res.status(200).json({
      success: true,
      deleted: result.deleted,
    });
  } catch {
    console.error("Cloudinary product image cleanup failed.");
    return res.status(502).json({
      success: false,
      message: "Image cleanup failed. Please try again.",
    });
  }
};

module.exports = {
  deleteUnusedProductImage,
  getCloudinaryUploadFailure,
  uploadProductImage,
};
