const cloudinary = require("../config/cloudinary");
const Order = require("../models/Order");
const PaymentAttempt = require("../models/PaymentAttempt");
const Product = require("../models/Product");

const isManagedProductImage = (publicId) =>
  typeof publicId === "string" &&
  /^stylekart\/products\/[A-Za-z0-9._/-]+$/.test(publicId) &&
  !publicId.includes("..");

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const uploadImageBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "stylekart/products",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        unique_filename: true,
        overwrite: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      },
    );

    uploadStream.end(buffer);
  });

const deleteProductImageIfUnused = async (publicId) => {
  if (!isManagedProductImage(publicId)) {
    return { deleted: false, referenced: false };
  }

  const escapedPublicId = publicId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const imageUrlPattern = new RegExp(
    `${escapedPublicId}(?:\\.[a-zA-Z0-9]+)?(?:$|[?#])`,
  );
  const references = await Promise.all([
    Product.exists({
      $or: [
        { imagePublicId: publicId },
        { image: imageUrlPattern },
        { images: imageUrlPattern },
      ],
    }),
    Order.exists({ "items.image": imageUrlPattern }),
    PaymentAttempt.exists({ "snapshot.items.image": imageUrlPattern }),
  ]);

  if (references.some(Boolean)) {
    return { deleted: false, referenced: true };
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  return {
    deleted: result.result === "ok",
    referenced: false,
  };
};

const cleanupProductImage = async (publicId) => {
  if (!isManagedProductImage(publicId) || !isConfigured()) return;

  try {
    await deleteProductImageIfUnused(publicId);
  } catch {
    console.error("Unable to clean up an unused StyleKart product image.");
  }
};

module.exports = {
  deleteProductImageIfUnused,
  isConfigured,
  isManagedProductImage,
  uploadImageBuffer,
  cleanupProductImage,
};
