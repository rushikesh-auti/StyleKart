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
      limit = 24,
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

    const filter = {};

    if (category?.trim()) {
      filter.category = category.trim().toLowerCase();
    }

    if (subcategory?.trim()) {
      filter.subcategory = new RegExp(
        escapeRegex(subcategory.trim()),
        "i",
      );
    }

    if (brand?.trim()) {
      const brandPattern = new RegExp(escapeRegex(brand.trim()), "i");

      filter.$or = [
        { brand: brandPattern },
        { company: brandPattern },
      ];
    }

    if (search?.trim()) {
      const searchPattern = new RegExp(
        escapeRegex(search.trim().slice(0, 100)),
        "i",
      );

      filter.$or = [
        { item_name: searchPattern },
        { company: searchPattern },
        { brand: searchPattern },
        { category: searchPattern },
        { subcategory: searchPattern },
      ];
    }

    const parsedMinPrice = parseNumber(minPrice);
    const parsedMaxPrice = parseNumber(maxPrice);

    if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
      filter.current_price = {};

      if (parsedMinPrice !== undefined) {
        filter.current_price.$gte = parsedMinPrice;
      }

      if (parsedMaxPrice !== undefined) {
        filter.current_price.$lte = parsedMaxPrice;
      }
    }

    const parsedMinDiscount = parseNumber(minDiscount);

    if (parsedMinDiscount !== undefined) {
      filter.discount_percentage = { $gte: parsedMinDiscount };
    }

    const parsedMinRating = parseNumber(minRating);

    if (parsedMinRating !== undefined) {
      filter["rating.stars"] = { $gte: parsedMinRating };
    }

    if (size?.trim()) {
      filter.sizes = new RegExp(escapeRegex(size.trim()), "i");
    }

    if (color?.trim()) {
      filter.colors = new RegExp(escapeRegex(color.trim()), "i");
    }

    if (availability === "in-stock") {
      filter.stock = { $gt: 0 };
    }

    if (availability === "out-of-stock") {
      filter.stock = 0;
    }

    const sortOptions = {
      recommended: {
        "rating.stars": -1,
        "rating.count": -1,
        discount_percentage: -1,
        createdAt: -1,
      },
      newest: { createdAt: -1 },
      price_asc: { current_price: 1 },
      price_desc: { current_price: -1 },
      rating: { "rating.stars": -1, "rating.count": -1 },
      discount: { discount_percentage: -1 },
    };

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.min(
      Math.max(parseInt(limit, 10) || 24, 1),
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

    const totalPages = Math.max(Math.ceil(total / pageLimit), 1);

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
    const product = await Product.create(req.body);

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
      req.body,
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