const validateProduct = (req, res, next) => {
  const {
    category,
    company,
    item_name,
    image,
    original_price,
    current_price,
    discount_percentage,
    rating,
  } = req.body;

  const allowedFields = [
    "id",
    "category",
    "subcategory",
    "brand",
    "company",
    "item_name",
    "description",
    "image",
    "imagePublicId",
    "images",
    "original_price",
    "current_price",
    "discount_percentage",
    "sizes",
    "colors",
    "inventoryVariants",
    "return_period",
    "delivery_date",
    "rating",
  ];

  const errors = {};

  const unexpectedFields = Object.keys(req.body).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unexpectedFields.length > 0) {
    errors.fields = "Request contains unsupported product fields";
  }

  if (req.method === "POST" && (!req.body.id || typeof req.body.id !== "string")) {
    errors.id = "Product id is required";
  }

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
    req.body.imagePublicId !== undefined &&
    typeof req.body.imagePublicId !== "string"
  ) {
    errors.imagePublicId = "Image public_id must be text";
  } else if (req.body.imagePublicId) {
    const validPublicId =
      /^stylekart\/products\/[A-Za-z0-9._/-]+$/.test(req.body.imagePublicId) &&
      !req.body.imagePublicId.includes("..");
    let isCloudinaryUrl = false;

    try {
      const imageUrl = new URL(image);
      isCloudinaryUrl =
        imageUrl.protocol === "https:" &&
        imageUrl.hostname === "res.cloudinary.com";
    } catch {
      isCloudinaryUrl = false;
    }

    if (!validPublicId || !isCloudinaryUrl) {
      errors.imagePublicId =
        "Cloudinary image metadata must include a valid product public_id and secure URL";
    }
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
    req.body.return_period !== undefined &&
    (typeof req.body.return_period !== "number" || req.body.return_period < 0)
  ) {
    errors.return_period = "Return period must be a valid non-negative number";
  }

  if (rating !== undefined) {
    if (typeof rating !== "object" || rating === null || Array.isArray(rating)) {
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

  const optionalTextFields = [
    "subcategory",
    "brand",
    "description",
    "delivery_date",
  ];
  const stringArrayFields = ["images", "sizes", "colors"];

  for (const field of optionalTextFields) {
    if (req.body[field] !== undefined && typeof req.body[field] !== "string") {
      errors[field] = `${field} must be text`;
    }
  }

  for (const field of stringArrayFields) {
    if (
      req.body[field] !== undefined &&
      (!Array.isArray(req.body[field]) ||
        req.body[field].some((value) => typeof value !== "string"))
    ) {
      errors[field] = `${field} must be an array of text values`;
    }
  }

  if (req.body.inventoryVariants === undefined) {
    errors.inventoryVariants = "Inventory quantities are required.";
  } else {
    const sizes = Array.isArray(req.body.sizes) ? req.body.sizes : [];
    const colors = Array.isArray(req.body.colors) ? req.body.colors : [];
    const sizeOptions = sizes.length ? sizes : [""];
    const colorOptions = colors.length ? colors : [""];
    const expected = new Set(
      sizeOptions.flatMap((size) =>
        colorOptions.map((color) => JSON.stringify([size, color])),
      ),
    );
    const received = new Set();
    const variants = req.body.inventoryVariants;

    if (!Array.isArray(variants) || variants.length !== expected.size) {
      errors.inventoryVariants =
        "Inventory must include one quantity for every size/color combination.";
    } else {
      for (const variant of variants) {
        if (
          !variant ||
          typeof variant !== "object" ||
          Array.isArray(variant) ||
          Object.keys(variant).some(
            (field) => !["size", "color", "stock"].includes(field),
          ) ||
          typeof variant.size !== "string" ||
          typeof variant.color !== "string" ||
          !Number.isInteger(variant.stock) ||
          variant.stock < 0
        ) {
          errors.inventoryVariants =
            "Each inventory variant must have a size, color, and non-negative whole-number stock.";
          break;
        }

        const key = JSON.stringify([variant.size, variant.color]);
        if (!expected.has(key) || received.has(key)) {
          errors.inventoryVariants =
            "Inventory variants must exactly match the product's unique size/color combinations.";
          break;
        }
        received.add(key);
      }

      if (!errors.inventoryVariants && received.size !== expected.size) {
        errors.inventoryVariants =
          "Inventory must include one quantity for every size/color combination.";
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

  req.productInput = Object.fromEntries(
    Object.entries(req.body).filter(([field]) => allowedFields.includes(field)),
  );

  if (req.method === "PUT") delete req.productInput.id;

  next();
};

module.exports = validateProduct;
