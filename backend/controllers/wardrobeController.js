const Product = require("../models/Product");
const SavedOutfit = require("../models/SavedOutfit");
const WardrobeItem = require("../models/WardrobeItem");
const {
  buildOutfitPlans,
  getMissingSlots,
  getScoringFormula,
  getSlot,
  getValueScore,
} = require("../services/wardrobeRecommendationService");
const {
  cleanupWardrobeImage,
  isConfigured,
  isManagedWardrobeImage,
  uploadImageBuffer,
} = require("../services/cloudinaryAssetService");
const { getWardrobeImageFormat } = require("../services/wardrobeImageValidation");

const OCCASIONS = ["college", "office", "interview", "casual outing", "party", "wedding"];
const ITEM_FIELDS = [
  "name",
  "category",
  "color",
  "secondaryColor",
  "style",
  "occasions",
  "brand",
  "notes",
  "image",
  "imagePublicId",
];
const STYLES = ["casual", "smart-casual", "formal", "festive", "athletic"];

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const cleanString = (value, field, maxLength, required = false) => {
  if (typeof value !== "string") throw createError(`${field} must be text.`);
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maxLength) {
    throw createError(`${field} is required and must be ${maxLength} characters or fewer.`);
  }
  return cleaned;
};

const validateImage = (image, publicId, userId) => {
  const url = cleanString(image || "", "Image URL", 2048);
  const assetId = cleanString(publicId || "", "Image identifier", 255);
  if (!url && !assetId) return { image: "", imagePublicId: "" };
  if (!isManagedWardrobeImage(assetId, userId)) {
    throw createError("Wardrobe images must be uploaded to your private StyleKart image folder.");
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw createError("The uploaded wardrobe image URL is invalid.");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "res.cloudinary.com" ||
    !cloudName ||
    !parsed.pathname.startsWith(`/${cloudName}/image/upload/`) ||
    !parsed.pathname.includes(`/${assetId}.`)
  ) {
    throw createError("The wardrobe image URL does not match your uploaded image.");
  }
  return { image: url, imagePublicId: assetId };
};

const normalizeItemInput = (body, userId, partial = false) => {
  const input = {};
  for (const field of ITEM_FIELDS) {
    if (body[field] === undefined && partial) continue;
    if (field === "name") input.name = cleanString(body.name, "Name", 100, true);
    if (field === "category") input.category = cleanString(body.category, "Category", 40, true).toLowerCase();
    if (field === "color") input.color = cleanString(body.color, "Color", 40, true);
    if (field === "secondaryColor") input.secondaryColor = cleanString(body.secondaryColor || "", "Secondary color", 40);
    if (field === "style") {
      const style = body.style || "casual";
      if (!STYLES.includes(style)) throw createError("Choose a valid style.");
      input.style = style;
    }
    if (field === "occasions") {
      const occasions = body.occasions || [];
      if (!Array.isArray(occasions) || occasions.some((item) => typeof item !== "string")) {
        throw createError("Occasions must be a list of valid occasion names.");
      }
      const uniqueOccasions = [...new Set(occasions)];
      if (uniqueOccasions.length > 6 || uniqueOccasions.some((occasion) => !OCCASIONS.includes(occasion) && occasion !== "all")) {
        throw createError("Choose valid occasions.");
      }
      input.occasions = uniqueOccasions;
    }
    if (field === "brand") input.brand = cleanString(body.brand || "", "Brand", 80);
    if (field === "notes") input.notes = cleanString(body.notes || "", "Notes", 500);
  }
  if (!partial || body.image !== undefined || body.imagePublicId !== undefined) {
    Object.assign(
      input,
      validateImage(body.image || "", body.imagePublicId || "", userId),
    );
  }
  return input;
};

const getWardrobe = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const [items, total] = await Promise.all([
      WardrobeItem.find({ user: req.user.id })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WardrobeItem.countDocuments({ user: req.user.id }),
    ]);
    return res.status(200).json({
      success: true,
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return next(error);
  }
};

const createWardrobeItem = async (req, res, next) => {
  try {
    const input = normalizeItemInput(req.body, String(req.user.id));
    const item = await WardrobeItem.create({ ...input, user: req.user.id });
    return res.status(201).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

const updateWardrobeItem = async (req, res, next) => {
  try {
    const item = await WardrobeItem.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) throw createError("Wardrobe item was not found.", 404);
    const previousImage = item.imagePublicId;
    const input = normalizeItemInput(req.body, String(req.user.id), true);
    Object.assign(item, input);
    await item.save();
    if (previousImage && previousImage !== item.imagePublicId) {
      await cleanupWardrobeImage(previousImage, String(req.user.id));
    }
    return res.status(200).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

const deleteWardrobeItem = async (req, res, next) => {
  try {
    const item = await WardrobeItem.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!item) throw createError("Wardrobe item was not found.", 404);
    await cleanupWardrobeImage(item.imagePublicId, String(req.user.id));
    return res.status(200).json({ success: true, deleted: true });
  } catch (error) {
    return next(error);
  }
};

const uploadWardrobeItemImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "An image is required in the 'image' field." });
  }
  const { buffer, mimetype } = req.file;
  if (getWardrobeImageFormat(buffer) !== mimetype) {
    return res.status(400).json({
      success: false,
      message: "The selected file content does not match its declared image type.",
    });
  }
  if (!isConfigured()) {
    return res.status(503).json({ success: false, message: "Image uploads are not configured on this server." });
  }

  try {
    const result = await uploadImageBuffer(buffer, `stylekart/wardrobe/${req.user.id}`);
    return res.status(201).json({
      success: true,
      image: { secure_url: result.secure_url, public_id: result.public_id },
    });
  } catch (error) {
    console.error("Wardrobe image upload failed:", {
      status: error.http_code || undefined,
      code: error.code || undefined,
    });
    return res.status(502).json({
      success: false,
      message: "Cloudinary could not complete the wardrobe image upload. Please try again.",
    });
  }
};

const getWardrobePlans = async (req, res, next) => {
  try {
    const { occasion, budget, selectedProductId } = req.body;
    const parsedBudget = Number(budget);
    if (!OCCASIONS.includes(occasion)) throw createError("Choose a valid occasion.");
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0 || parsedBudget > 1000000) {
      throw createError("Budget must be between ₹0 and ₹10,00,000.");
    }
    if (selectedProductId !== undefined && (typeof selectedProductId !== "string" || selectedProductId.length > 100)) {
      throw createError("Selected product is invalid.");
    }

    const [wardrobeItems, products] = await Promise.all([
      WardrobeItem.find({ user: req.user.id }).sort({ updatedAt: -1 }).limit(100).lean(),
      Product.find({ stock: { $gt: 0 } })
        .select("id category subcategory item_name description image current_price stock sizes colors brand company")
        .sort({ current_price: 1 })
        .limit(300)
        .lean(),
    ]);
    const selectedProduct = selectedProductId
      ? products.find((product) => product.id === selectedProductId) ||
        (await Product.findOne({ id: selectedProductId, stock: { $gt: 0 } })
          .select("id category subcategory item_name description image current_price stock sizes colors brand company")
          .lean())
      : null;
    if (selectedProductId && !selectedProduct) {
      throw createError("The selected product is no longer available.", 409);
    }

    const { plans, validCombinationCount } = buildOutfitPlans({
      wardrobeItems,
      products,
      occasion,
      budget: parsedBudget,
      selectedProduct,
    });
    const missingSlots = getMissingSlots(wardrobeItems, occasion);
    const gaps = missingSlots.map((slot) => {
      const recommendations = products
        .filter((product) => {
          return getSlot(product) === slot && product.current_price <= parsedBudget;
        })
        .map((product) => ({
          product,
          evaluation: getValueScore({
            product,
            wardrobeItems,
            occasion,
            budget: parsedBudget,
            outfitCount: plans.filter((plan) =>
              plan.purchaseItems.some((entry) => entry.id === product.id),
            ).length,
          }),
        }))
        .sort((left, right) => right.evaluation.score - left.evaluation.score || left.product.current_price - right.product.current_price)
        .slice(0, 6)
        .map(({ product, evaluation }) => ({
          ...product,
          valueScore: evaluation.score,
          scoreFactors: evaluation.factors,
          reasons: [
            `Your saved wardrobe has no suitable ${slot} for ${occasion}.`,
            ...evaluation.reasons.slice(0, 2),
          ],
        }));
      return {
        category: slot,
        explanation: `No saved wardrobe item matches ${slot} for ${occasion}.`,
        recommendations,
      };
    });

    return res.status(200).json({
      success: true,
      occasion,
      budget: parsedBudget,
      wardrobeItems,
      plans,
      gaps,
      versatilityEstimate: {
        count: validCombinationCount,
        explanation: "Estimate of distinct valid combinations generated from your saved wardrobe and the current in-stock catalog; it is not a prediction of actual future wear.",
      },
      scoringFormula: getScoringFormula(),
    });
  } catch (error) {
    return next(error);
  }
};

const getSavedOutfits = async (req, res, next) => {
  try {
    const outfits = await SavedOutfit.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    const wardrobeIds = [...new Set(outfits.flatMap((outfit) => outfit.wardrobeItems.map(String)))];
    const productIds = [...new Set(outfits.flatMap((outfit) => outfit.productIds))];
    const [wardrobeItems, products] = await Promise.all([
      WardrobeItem.find({ _id: { $in: wardrobeIds }, user: req.user.id }).lean(),
      Product.find({ id: { $in: productIds } })
        .select("id item_name image current_price category subcategory stock sizes colors")
        .lean(),
    ]);
    const wardrobeMap = new Map(wardrobeItems.map((item) => [String(item._id), item]));
    const productMap = new Map(products.map((product) => [product.id, product]));
    return res.status(200).json({
      success: true,
      outfits: outfits.map((outfit) => ({
        ...outfit,
        wardrobeItems: outfit.wardrobeItems.map((id) => wardrobeMap.get(String(id)) || { _id: String(id), unavailable: true }),
        products: outfit.productIds.map((id) => productMap.get(id) || { id, unavailable: true }),
      })),
    });
  } catch (error) {
    return next(error);
  }
};

const saveOutfit = async (req, res, next) => {
  try {
    const { name, occasion, budget, wardrobeItemIds, productIds } = req.body;
    if (!OCCASIONS.includes(occasion)) throw createError("Choose a valid occasion.");
    const savedName = cleanString(name, "Outfit name", 100, true);
    const parsedBudget = Number(budget);
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0 || parsedBudget > 1000000) {
      throw createError("Budget must be between ₹0 and ₹10,00,000.");
    }
    if (
      !Array.isArray(wardrobeItemIds) ||
      !Array.isArray(productIds) ||
      wardrobeItemIds.length > 12 ||
      productIds.length > 12 ||
      wardrobeItemIds.some((id) => typeof id !== "string") ||
      productIds.some((id) => typeof id !== "string")
    ) {
      throw createError("Outfit must contain valid wardrobe and product item lists.");
    }
    const ownedIds = [...new Set(wardrobeItemIds.map(String))];
    const catalogIds = [...new Set(productIds.map(String))];
    if (ownedIds.length + catalogIds.length === 0 || [...ownedIds, ...catalogIds].some((id) => id.length > 100)) {
      throw createError("Choose at least one item for the outfit.");
    }
    const [ownedItems, catalogProducts] = await Promise.all([
      WardrobeItem.find({ _id: { $in: ownedIds }, user: req.user.id }).select("_id").lean(),
      Product.find({ id: { $in: catalogIds }, stock: { $gt: 0 } }).select("id current_price").lean(),
    ]);
    if (ownedItems.length !== ownedIds.length) throw createError("One or more wardrobe items are no longer available.", 409);
    if (catalogProducts.length !== catalogIds.length) throw createError("One or more products are no longer available.", 409);
    const total = catalogProducts.reduce((sum, product) => sum + product.current_price, 0);
    if (total > parsedBudget) throw createError("The selected outfit exceeds its saved budget.", 409);
    const outfit = await SavedOutfit.create({
      user: req.user.id,
      name: savedName,
      occasion,
      budget: parsedBudget,
      wardrobeItems: ownedIds,
      productIds: catalogIds,
    });
    return res.status(201).json({ success: true, outfit });
  } catch (error) {
    return next(error);
  }
};

const deleteSavedOutfit = async (req, res, next) => {
  try {
    const outfit = await SavedOutfit.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!outfit) throw createError("Saved outfit was not found.", 404);
    return res.status(200).json({ success: true, deleted: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createWardrobeItem,
  deleteSavedOutfit,
  deleteWardrobeItem,
  getSavedOutfits,
  getWardrobe,
  getWardrobePlans,
  saveOutfit,
  updateWardrobeItem,
  uploadWardrobeItemImage,
};
