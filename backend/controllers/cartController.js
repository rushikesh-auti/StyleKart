const Cart = require("../models/Cart");
const Product = require("../models/Product");

const badRequest = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeText = (value) => String(value || "").trim();

const toClientItem = (item) => ({
  key: `${item.productId}::${item.selectedSize || ""}::${item.selectedColor || ""}`,
  productId: item.productId,
  quantity: item.quantity,
  selectedSize: item.selectedSize || "",
  selectedColor: item.selectedColor || "",
});

const respondWithCart = (res, cart, status = 200) =>
  res.status(status).json({
    success: true,
    items: (cart?.items || []).map(toClientItem),
  });

const validateVariant = (product, selectedSize, selectedColor) => {
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    if (!product.sizes.includes(selectedSize)) {
      throw badRequest(`Select a valid size for ${product.item_name}.`);
    }
  } else if (selectedSize) {
    throw badRequest(`${product.item_name} does not use size variants.`);
  }

  if (Array.isArray(product.colors) && product.colors.length > 0) {
    if (!product.colors.includes(selectedColor)) {
      throw badRequest(`Select a valid color for ${product.item_name}.`);
    }
  } else if (selectedColor) {
    throw badRequest(`${product.item_name} does not use color variants.`);
  }
};

const normalizeRequestedItem = (body) => ({
  productId: normalizeText(body.productId),
  quantity: Number(body.quantity),
  selectedSize: normalizeText(body.selectedSize),
  selectedColor: normalizeText(body.selectedColor),
});

const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).lean();
    return respondWithCart(res, cart);
  } catch (error) {
    return next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const requested = normalizeRequestedItem(req.body);

    if (
      !requested.productId ||
      requested.productId.length > 100 ||
      !Number.isInteger(requested.quantity) ||
      requested.quantity < 1
    ) {
      throw badRequest("A valid product and quantity are required.");
    }

    const product = await Product.findOne({ id: requested.productId }).lean();
    if (!product) throw badRequest("This product is no longer available.", 404);
    if (product.stock <= 0) throw badRequest(`${product.item_name} is out of stock.`, 409);

    validateVariant(product, requested.selectedSize, requested.selectedColor);

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      try {
        cart = await Cart.create({ user: req.user.id, items: [] });
      } catch (error) {
        if (error.code === 11000) {
          cart = await Cart.findOne({ user: req.user.id });
        } else {
          throw error;
        }
      }
    }

    const existingItem = cart.items.find(
      (item) =>
        item.productId === requested.productId &&
        item.selectedSize === requested.selectedSize &&
        item.selectedColor === requested.selectedColor,
    );

    const nextQuantity = (existingItem?.quantity || 0) + requested.quantity;
    if (nextQuantity > product.stock) {
      throw badRequest(`${product.item_name} has only ${product.stock} item(s) available.`, 409);
    }

    if (existingItem) {
      existingItem.quantity = nextQuantity;
    } else {
      cart.items.push(requested);
    }

    await cart.save();
    return respondWithCart(res, cart, 201);
  } catch (error) {
    return next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const requested = normalizeRequestedItem(req.body);

    if (
      !requested.productId ||
      !Number.isInteger(requested.quantity) ||
      requested.quantity < 1
    ) {
      throw badRequest("A valid product and quantity are required.");
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) throw badRequest("Cart item was not found.", 404);

    const item = cart.items.find(
      (cartItem) =>
        cartItem.productId === requested.productId &&
        cartItem.selectedSize === requested.selectedSize &&
        cartItem.selectedColor === requested.selectedColor,
    );
    if (!item) throw badRequest("Cart item was not found.", 404);

    const product = await Product.findOne({ id: requested.productId }).lean();
    if (!product) throw badRequest("This product is no longer available.", 404);
    validateVariant(product, requested.selectedSize, requested.selectedColor);

    if (requested.quantity > product.stock) {
      throw badRequest(`${product.item_name} has only ${product.stock} item(s) available.`, 409);
    }

    item.quantity = requested.quantity;
    await cart.save();
    return respondWithCart(res, cart);
  } catch (error) {
    return next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const productId = normalizeText(req.body.productId);
    const selectedSize = normalizeText(req.body.selectedSize);
    const selectedColor = normalizeText(req.body.selectedColor);

    if (!productId) throw badRequest("A product is required.");

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return respondWithCart(res, null);

    const before = cart.items.length;
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.productId === productId &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
        ),
    );

    if (cart.items.length === before) {
      throw badRequest("Cart item was not found.", 404);
    }

    await cart.save();
    return respondWithCart(res, cart);
  } catch (error) {
    return next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await Cart.updateOne({ user: req.user.id }, { $set: { items: [] } });
    return res.status(200).json({ success: true, items: [] });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
