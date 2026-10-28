const Product = require("../models/Product");
const Order = require("../models/Order");
const PaymentAttempt = require("../models/PaymentAttempt");
const { cleanupProductImage } = require("../services/cloudinaryAssetService");
const {
  createInventorySnapshotFilter,
  createVariantCombinations,
} = require("../services/inventoryService");

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      brand,
      subcategory,
      minPrice,
      maxPrice,
      minDiscount,
      minRating,
      size,
      color,
      availability,
      sort = "recommended",
    } = req.query;

    const conditions = [];

    if (category?.trim()) {
      conditions.push({
        category: category.trim().toLowerCase(),
      });
    }

    if (subcategory?.trim()) {
      conditions.push({
        subcategory: new RegExp(
          escapeRegex(subcategory.trim()),
          "i",
        ),
      });
    }

    if (brand?.trim()) {
      const brandPattern = new RegExp(
        escapeRegex(brand.trim()),
        "i",
      );

      conditions.push({
        $or: [
          { brand: brandPattern },
          { company: brandPattern },
        ],
      });
    }

    if (search?.trim()) {
      conditions.push({
        $text: { $search: search.trim().slice(0, 100) },
      });
    }

    const parsedMinPrice = parseNumber(minPrice);
    const parsedMaxPrice = parseNumber(maxPrice);

    if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
      const priceFilter = {};

      if (parsedMinPrice !== undefined) {
        priceFilter.$gte = parsedMinPrice;
      }

      if (parsedMaxPrice !== undefined) {
        priceFilter.$lte = parsedMaxPrice;
      }

      conditions.push({
        current_price: priceFilter,
      });
    }

    const parsedMinDiscount = parseNumber(minDiscount);

    if (parsedMinDiscount !== undefined) {
      conditions.push({
        discount_percentage: {
          $gte: parsedMinDiscount,
        },
      });
    }

    const parsedMinRating = parseNumber(minRating);

    if (parsedMinRating !== undefined) {
      conditions.push({
        "rating.stars": {
          $gte: parsedMinRating,
        },
      });
    }

    if (size?.trim()) {
      conditions.push({
        sizes: new RegExp(escapeRegex(size.trim()), "i"),
      });
    }

    if (color?.trim()) {
      conditions.push({
        colors: new RegExp(escapeRegex(color.trim()), "i"),
      });
    }

    if (availability === "in-stock") {
      conditions.push({
        $expr: {
          $gt: [
            {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$inventoryVariants", []] },
                      as: "variant",
                      cond: { $eq: ["$$variant.active", true] },
                    },
                  },
                  as: "variant",
                  in: "$$variant.stock",
                },
              },
            },
            0,
          ],
        },
      });
    }

    if (availability === "out-of-stock") {
      conditions.push({
        $expr: {
          $eq: [
            {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$inventoryVariants", []] },
                      as: "variant",
                      cond: { $eq: ["$$variant.active", true] },
                    },
                  },
                  as: "variant",
                  in: "$$variant.stock",
                },
              },
            },
            0,
          ],
        },
      });
    }

    const filter =
      conditions.length > 0
        ? { $and: conditions }
        : {};

    const sortOptions = {
      recommended: {
        "rating.stars": -1,
        "rating.count": -1,
        discount_percentage: -1,
        createdAt: -1,
      },
      newest: {
        createdAt: -1,
      },
      price_asc: {
        current_price: 1,
      },
      price_desc: {
        current_price: -1,
      },
      rating: {
        "rating.stars": -1,
        "rating.count": -1,
      },
      discount: {
        discount_percentage: -1,
      },
    };

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.min(
      Math.max(parseInt(limit, 10) || 12, 1),
      100,
    );
    const skip = (currentPage - 1) * pageLimit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions[sort] || sortOptions.recommended)
        .skip(skip)
        .limit(pageLimit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.max(
      Math.ceil(total / pageLimit),
      1,
    );

    res.status(200).json({
      success: true,
      count: products.length,
      products,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).select(
      "+legacyStockToAllocate",
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const productInput = {
      ...req.productInput,
      inventoryVariants: (req.productInput.inventoryVariants || []).map(
        (variant) => ({ ...variant, active: true }),
      ),
    };
    const product = await Product.create(productInput);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    await cleanupProductImage(req.productInput.imagePublicId);
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const existingProduct = await Product.findOne({ id: req.params.id }).select(
      "+legacyStockToAllocate",
    );

    if (!existingProduct) {
      await cleanupProductImage(req.productInput.imagePublicId);
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      req.productInput.image !== undefined &&
      req.productInput.image !== existingProduct.image &&
      req.productInput.imagePublicId === undefined
    ) {
      req.productInput.imagePublicId = "";
    }

    const submittedVariants = req.productInput.inventoryVariants || [];
    const expectedCombinations = createVariantCombinations(
      req.productInput.sizes || existingProduct.sizes,
      req.productInput.colors || existingProduct.colors,
    );
    const submittedKeys = new Set(
      submittedVariants.map((variant) =>
        JSON.stringify([variant.size, variant.color]),
      ),
    );
    const expectedKeys = new Set(
      expectedCombinations.map(({ size, color }) =>
        JSON.stringify([size, color]),
      ),
    );
    if (
      submittedVariants.length !== expectedKeys.size ||
      [...expectedKeys].some((key) => !submittedKeys.has(key))
    ) {
      const error = new Error(
        "Inventory must include every size/color combination before saving.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (existingProduct.legacyStockToAllocate > 0) {
      const allocated = submittedVariants.reduce(
        (total, variant) => total + variant.stock,
        0,
      );
      if (allocated !== existingProduct.legacyStockToAllocate) {
        const error = new Error(
          `Allocate exactly ${existingProduct.legacyStockToAllocate} legacy item(s) across the variants before saving.`,
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const submittedWithActiveState = submittedVariants.map((variant) => ({
      ...variant,
      active: true,
    }));
    const retainedInactiveVariants = existingProduct.inventoryVariants
      .filter(
        (variant) =>
          !expectedKeys.has(JSON.stringify([variant.size, variant.color])),
      )
      .map((variant) => ({
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        active: false,
      }));

    const productUpdate = {
      ...req.productInput,
      inventoryVariants: [
        ...submittedWithActiveState,
        ...retainedInactiveVariants,
      ],
    };
    const updateOperation = { $set: productUpdate };
    if (Number.isInteger(existingProduct.legacyStockToAllocate)) {
      updateOperation.$unset = { legacyStockToAllocate: "" };
    }

    const inventorySnapshot = existingProduct.inventoryVariants.map(
      ({ size, color, stock, active }) => ({ size, color, stock, active }),
    );
    const product = await Product.findOneAndUpdate(
      createInventorySnapshotFilter(req.params.id, inventorySnapshot),
      updateOperation,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!product) {
      await cleanupProductImage(req.productInput.imagePublicId);
      const currentProduct = await Product.exists({ id: req.params.id });
      return res.status(currentProduct ? 409 : 404).json({
        success: false,
        message: currentProduct
          ? "Inventory changed while this product was being edited. Refresh and try again."
          : "Product not found",
      });
    }

    await cleanupProductImage(existingProduct.imagePublicId);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    await cleanupProductImage(req.productInput.imagePublicId);
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const activeAttempt = await PaymentAttempt.findOne({
      status: { $in: ["CREATING", "CREATED"] },
      "snapshot.items.productId": req.params.id,
    }).select("_id");
    if (activeAttempt) {
      const error = new Error(
        "This product cannot be deleted while a payment checkout is active.",
      );
      error.statusCode = 409;
      throw error;
    }

    const product = await Product.findOneAndDelete({
      id: req.params.id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await cleanupProductImage(product.imagePublicId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
