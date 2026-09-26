const Product = require("../models/Product");

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
        stock: { $gt: 0 },
      });
    }

    if (availability === "out-of-stock") {
      conditions.push({
        stock: 0,
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
    const product = await Product.findOne({
      id: req.params.id,
    });

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

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.productInput);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      req.productInput,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({
      id: req.params.id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

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
  createProduct,
  updateProduct,
  deleteProduct,
};
