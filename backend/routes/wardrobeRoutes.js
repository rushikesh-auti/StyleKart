const express = require("express");
const {
  createWardrobeItem,
  deleteSavedOutfit,
  deleteWardrobeItem,
  getSavedOutfits,
  getWardrobe,
  getWardrobePlans,
  saveOutfit,
  updateWardrobeItem,
  uploadWardrobeItemImage,
} = require("../controllers/wardrobeController");
const { userProtect } = require("../middleware/authMiddleware");
const { uploadWardrobeImage } = require("../middleware/uploadWardrobeImage");
const { wardrobeUploadLimiter } = require("../middleware/rateLimiters");
const { allowBodyFields, allowQueryFields } = require("../middleware/requestSecurity");

const router = express.Router();

router.use(userProtect);
router.get("/", allowQueryFields(["page", "limit"]), getWardrobe);
router.post(
  "/upload",
  wardrobeUploadLimiter,
  uploadWardrobeImage,
  uploadWardrobeItemImage,
);
router.post(
  "/plans",
  allowBodyFields(
    ["occasion", "budget", "selectedProductId"],
    { occasion: ["string"], budget: ["number", "string"], selectedProductId: ["string"] },
  ),
  getWardrobePlans,
);
router.get("/saved", getSavedOutfits);
router.post(
  "/saved",
  allowBodyFields(
    ["name", "occasion", "budget", "wardrobeItemIds", "productIds"],
    {
      name: ["string"],
      occasion: ["string"],
      budget: ["number", "string"],
      wardrobeItemIds: ["array"],
      productIds: ["array"],
    },
  ),
  saveOutfit,
);
router.delete("/saved/:id", deleteSavedOutfit);
router.post(
  "/",
  allowBodyFields(
    [
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
    ],
    {
      name: ["string"],
      category: ["string"],
      color: ["string"],
      secondaryColor: ["string"],
      style: ["string"],
      occasions: ["array"],
      brand: ["string"],
      notes: ["string"],
      image: ["string"],
      imagePublicId: ["string"],
    },
  ),
  createWardrobeItem,
);
router.put(
  "/:id",
  allowBodyFields(
    [
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
    ],
    {
      name: ["string"],
      category: ["string"],
      color: ["string"],
      secondaryColor: ["string"],
      style: ["string"],
      occasions: ["array"],
      brand: ["string"],
      notes: ["string"],
      image: ["string"],
      imagePublicId: ["string"],
    },
  ),
  updateWardrobeItem,
);
router.delete("/:id", deleteWardrobeItem);

module.exports = router;
