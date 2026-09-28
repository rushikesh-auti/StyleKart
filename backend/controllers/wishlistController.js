const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeProductId = (value) => String(value || "").trim();

const respondWithWishlist = (res, wishlist, statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    productIds: wishlist?.productIds || [],
  });

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).lean();
    return respondWithWishlist(res, wishlist);
  } catch (error) {
    return next(error);
  }
};

const addWishlistItem = async (req, res, next) => {
  try {
    const productId = normalizeProductId(req.body.productId);

    if (!productId || productId.length > 100) {
      throw createError("A valid product is required.");
    }

    const product = await Product.exists({ id: productId });
    if (!product) {
      throw createError("This product is no longer available.", 404);
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $addToSet: { productIds: productId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    return respondWithWishlist(res, wishlist, 201);
  } catch (error) {
    return next(error);
  }
};

const removeWishlistItem = async (req, res, next) => {
  try {
    const productId = normalizeProductId(req.body.productId);

    if (!productId) {
      throw createError("A product is required.");
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { productIds: productId } },
      { new: true },
    );

    return respondWithWishlist(res, wishlist);
  } catch (error) {
    return next(error);
  }
};

const clearWishlist = async (req, res, next) => {
  try {
    await Wishlist.updateOne(
      { user: req.user.id },
      { $set: { productIds: [] } },
    );
    return respondWithWishlist(res, null);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
};
