const validateProduct = (req, res, next) => {
  const {
    category,
    company,
    item_name,
    image,
    original_price,
    current_price,
    discount_percentage,
    stock,
    rating,
  } = req.body;

  const errors = {};

  if (!category || typeof category !== "string" || !category.trim()) {
    errors.category = "Category is required";
  }

  if (!company || typeof company !== "string" || !company.trim()) {
    errors.company = "Company is required";
  }

  if (!item_name || typeof item_name !== "string" || !item_name.trim()) {
    errors.item_name = "Product name is required";
  }

  if (!image || typeof image !== "string" || !image.trim()) {
    errors.image = "Product image is required";
  }

  if (
    original_price === undefined ||
    typeof original_price !== "number" ||
    original_price < 0
  ) {
    errors.original_price = "Original price must be a valid positive number";
  }

  if (
    current_price === undefined ||
    typeof current_price !== "number" ||
    current_price < 0
  ) {
    errors.current_price = "Current price must be a valid positive number";
  }

  if (
    original_price !== undefined &&
    current_price !== undefined &&
    typeof original_price === "number" &&
    typeof current_price === "number" &&
    current_price > original_price
  ) {
    errors.current_price =
      "Current price cannot be greater than original price";
  }

  if (
    discount_percentage !== undefined &&
    (typeof discount_percentage !== "number" ||
      discount_percentage < 0 ||
      discount_percentage > 100)
  ) {
    errors.discount_percentage =
      "Discount percentage must be between 0 and 100";
  }

  if (
    stock !== undefined &&
    (typeof stock !== "number" || stock < 0)
  ) {
    errors.stock = "Stock must be a valid non-negative number";
  }

  if (rating !== undefined) {
    if (typeof rating !== "object" || rating === null) {
      errors.rating = "Rating must be an object";
    } else {
      if (
        rating.stars !== undefined &&
        (typeof rating.stars !== "number" ||
          rating.stars < 0 ||
          rating.stars > 5)
      ) {
        errors.rating =
          "Rating stars must be between 0 and 5";
      }

      if (
        rating.count !== undefined &&
        (typeof rating.count !== "number" ||
          rating.count < 0)
      ) {
        errors.rating =
          "Rating count must be a non-negative number";
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Product validation failed",
      errors,
    });
  }

  next();
};

module.exports = validateProduct;