const SLOT_ALIASES = {
  top: ["top", "tops", "shirt", "shirts", "tshirt", "tshirts", "t shirt", "t shirts", "tee", "tees", "blouse", "kurta", "sweater", "jacket", "jackets", "coat", "coats", "cardigan"],
  bottom: ["bottom", "bottoms", "trouser", "trousers", "pant", "pants", "jean", "jeans", "skirt", "shorts"],
  footwear: ["shoe", "shoes", "footwear", "sneaker", "sneakers", "sandal", "sandals", "heels", "boots"],
  onepiece: ["dress", "dresses", "jumpsuit", "jumpsuits", "romper"],
};

const occasionStyle = {
  college: { formality: 1, styles: ["casual", "smart-casual", "athletic"] },
  office: { formality: 2, styles: ["formal", "smart-casual"] },
  interview: { formality: 3, styles: ["formal"] },
  "casual outing": { formality: 1, styles: ["casual", "smart-casual"] },
  party: { formality: 2, styles: ["smart-casual", "festive", "formal"] },
  wedding: { formality: 3, styles: ["festive", "formal"] },
};

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getSlot = (item) => {
  const source = normalize(
    [item.category, item.subcategory, item.item_name, item.name].filter(Boolean).join(" "),
  );
  for (const [slot, aliases] of Object.entries(SLOT_ALIASES)) {
    if (aliases.some((alias) => new RegExp(`\\b${alias}\\b`).test(source))) {
      return slot;
    }
  }
  return "";
};

const getColors = (item) => {
  if (Array.isArray(item.colors)) return item.colors.filter(Boolean);
  return [item.color, item.secondaryColor].filter(Boolean);
};

const compatibleColor = (left, right) => {
  const color = normalize(left);
  const other = normalize(right);
  if (!color || !other) return 0.5;
  if (color === other) return 0.8;
  const neutrals = ["black", "white", "grey", "gray", "beige", "cream", "navy", "brown"];
  if (neutrals.some((entry) => color.includes(entry) || other.includes(entry))) return 1;
  const pairs = [
    ["blue", "orange"],
    ["red", "green"],
    ["yellow", "purple"],
    ["pink", "green"],
    ["teal", "coral"],
  ];
  return pairs.some(([first, second]) =>
    (color.includes(first) && other.includes(second)) ||
    (color.includes(second) && other.includes(first)),
  )
    ? 0.9
    : 0.45;
};

const hasOccasion = (item, occasion) => {
  if (item.occasions?.length) {
    return item.occasions.includes("all") || item.occasions.includes(occasion);
  }

  const target = occasionStyle[occasion];
  if (!target) return true;
  return !item.style || target.styles.includes(item.style);
};

const productOccasionFit = (product, occasion) => {
  const text = normalize(
    [product.subcategory, product.item_name, product.description].filter(Boolean).join(" "),
  );
  const formalTerms = /\b(formal|office|interview|blazer|dress shirt|trouser|oxford)\b/;
  const festiveTerms = /\b(festive|wedding|ethnic|party|occasion|elegant)\b/;
  const athleticTerms = /\b(running|sports|training|athletic)\b/;
  if (occasion === "interview" || occasion === "office") {
    return formalTerms.test(text) ? 1 : 0.35;
  }
  if (occasion === "wedding" || occasion === "party") {
    return festiveTerms.test(text) ? 1 : 0.55;
  }
  if (occasion === "college") {
    return athleticTerms.test(text) ? 0.8 : 1;
  }
  return 0.9;
};

const getProductCompatibility = (product, wardrobeItems, occasion) => {
  const productColors = getColors(product);
  const matchingItems = wardrobeItems.filter((item) => {
    const palette = getColors(item);
    return palette.some((color) =>
      productColors.some((productColor) => compatibleColor(color, productColor) >= 0.8),
    );
  });
  const colorFit = matchingItems.length
    ? Math.min(1, matchingItems.length / Math.max(wardrobeItems.length, 1))
    : wardrobeItems.length
      ? 0.35
      : 0.5;
  const occasionFit = productOccasionFit(product, occasion);
  const styleFit = wardrobeItems.length
    ? wardrobeItems.filter((item) =>
        !item.style || occasionStyle[occasion]?.styles.includes(item.style),
      ).length / wardrobeItems.length
    : 0.5;
  return { matchingItems, colorFit, occasionFit, styleFit };
};

const getValueScore = ({
  product,
  wardrobeItems,
  occasion,
  budget,
  outfitCount,
}) => {
  const { matchingItems, colorFit, occasionFit, styleFit } = getProductCompatibility(
    product,
    wardrobeItems,
    occasion,
  );
  const outfitFit = Math.min(100, outfitCount * 20);
  const complementFit = Math.min(100, matchingItems.length * 25 + colorFit * 25);
  const occasionScore = occasionFit * 100 * 0.75 + styleFit * 100 * 0.25;
  const budgetScore =
    budget > 0
      ? Math.max(0, 100 - (product.current_price / budget) * 100)
      : 100;
  const availabilityScore = product.stock > 0 ? 100 : 0;
  const score = Math.round(
    outfitFit * 0.35 +
      complementFit * 0.25 +
      occasionScore * 0.2 +
      budgetScore * 0.15 +
      availabilityScore * 0.05,
  );
  const reasons = [];
  if (matchingItems.length) {
    reasons.push(`Color palette complements ${matchingItems.length} saved wardrobe item(s).`);
  } else {
    reasons.push("Adds a color option to the selected outfit.");
  }
  reasons.push(
    occasionFit >= 0.8
      ? `Its catalog details suit a ${occasion} outfit.`
      : `Its occasion fit is less direct for ${occasion}; compare the style before buying.`,
  );
  if (budget > 0) {
    reasons.push(
      product.current_price <= budget
        ? `At ₹${product.current_price}, it is within your ₹${budget} budget.`
        : "It is over the selected budget and is not included in plans.",
    );
  }
  return {
    score,
    factors: {
      validOutfits: outfitFit,
      wardrobeComplement: complementFit,
      occasionAndStyle: Math.round(occasionScore),
      budgetFit: Math.round(budgetScore),
      availability: availabilityScore,
    },
    reasons,
  };
};

const getProductIdentity = (entry) =>
  entry.kind === "wardrobe" ? `wardrobe:${entry.item._id}` : `product:${entry.item.id}`;

const createCandidates = ({
  slot,
  wardrobeItems,
  products,
  occasion,
  budget,
  selectedProduct,
}) => {
  const owned = wardrobeItems
    .filter((item) => getSlot(item) === slot && hasOccasion(item, occasion))
    .slice(0, 4)
    .map((item) => ({ kind: "wardrobe", item, reason: "Already in your wardrobe." }));
  const selectedMatches = selectedProduct && getSlot(selectedProduct) === slot;
  if (owned.length && !selectedMatches) return owned;

  const available = products
    .filter(
      (product) =>
        product.stock > 0 &&
        getSlot(product) === slot &&
        product.current_price <= budget,
    )
    .sort((left, right) => {
      const leftScore = getValueScore({
        product: left,
        wardrobeItems,
        occasion,
        budget,
        outfitCount: 1,
      }).score;
      const rightScore = getValueScore({
        product: right,
        wardrobeItems,
        occasion,
        budget,
        outfitCount: 1,
      }).score;
      return rightScore - leftScore || left.current_price - right.current_price;
    });
  const selected = selectedMatches ? [selectedProduct] : [];
  const catalog = [...selected, ...available.filter((item) => item.id !== selectedProduct?.id)]
    .slice(0, selectedMatches ? 4 : owned.length ? 2 : 4);
  return [
    ...owned,
    ...catalog.map((item) => ({
      kind: "product",
      item,
      reason: selectedProduct?.id === item.id
        ? "Selected product, evaluated with your wardrobe."
        : `Fills the ${slot} category missing for this outfit.`,
    })),
  ];
};

const buildOutfitPlans = ({
  wardrobeItems,
  products,
  occasion,
  budget,
  selectedProduct,
  limit = 8,
}) => {
  const patterns = [
    ["top", "bottom", "footwear"],
    ["onepiece", "footwear"],
  ];
  const plans = [];
  for (const pattern of patterns) {
    const pools = pattern.map((slot) =>
      createCandidates({
        slot,
        wardrobeItems,
        products,
        occasion,
        budget,
        selectedProduct,
      }),
    );
    if (pools.some((pool) => pool.length === 0)) continue;

    const visit = (index, chosen) => {
      if (plans.length >= 100) return;
      if (index === pools.length) {
        const buys = chosen.filter((entry) => entry.kind === "product");
        const total = buys.reduce((sum, entry) => sum + entry.item.current_price, 0);
        if (total > budget) return;
        if (selectedProduct && !buys.some((entry) => entry.item.id === selectedProduct.id)) return;
        const productsInPlan = buys.map((entry) => entry.item);
        const explanations = buys.map((entry) => {
          const compatibility = getProductCompatibility(entry.item, wardrobeItems, occasion);
          return {
            productId: entry.item.id,
            reasons: [
              entry.reason,
              ...getValueScore({
                product: entry.item,
                wardrobeItems,
                occasion,
                budget,
                outfitCount: 1,
              }).reasons.slice(0, 2),
              compatibility.matchingItems.length
                ? `Works with ${compatibility.matchingItems.map((item) => item.name).slice(0, 2).join(" and ")}.`
                : "Chosen to complete a missing garment category.",
            ],
          };
        });
        const owned = chosen
          .filter((entry) => entry.kind === "wardrobe")
          .map((entry) => entry.item);
        const productIds = productsInPlan.map((product) => product.id);
        const planScore = productsInPlan.reduce(
          (sum, product) =>
            sum +
            getValueScore({
              product,
              wardrobeItems,
              occasion,
              budget,
              outfitCount: 1,
            }).score,
          0,
        );
        plans.push({
          id: [...owned.map((item) => `w-${item._id}`), ...productIds.map((id) => `p-${id}`)]
            .sort()
            .join("|"),
          occasion,
          style: occasionStyle[occasion]?.styles.join(" / ") || "versatile",
          ownedItems: owned,
          purchaseItems: productsInPlan,
          explanations,
          newPurchaseTotal: total,
          valueScore: productsInPlan.length
            ? Math.round(planScore / productsInPlan.length)
            : 100,
          versatilityEstimate: 1,
        });
        return;
      }

      for (const candidate of pools[index]) {
        visit(index + 1, [...chosen, candidate]);
        if (plans.length >= 100) return;
      }
    };

    visit(0, []);
  }

  const uniquePlans = [...new Map(plans.map((plan) => [plan.id, plan])).values()];
  uniquePlans.sort(
    (left, right) =>
      left.purchaseItems.length - right.purchaseItems.length ||
      right.valueScore - left.valueScore ||
      left.newPurchaseTotal - right.newPurchaseTotal ||
      left.id.localeCompare(right.id),
  );
  const selectedPlans = uniquePlans.slice(0, limit);
  const occurrenceCounts = new Map();
  for (const plan of uniquePlans) {
    for (const product of plan.purchaseItems) {
      occurrenceCounts.set(product.id, (occurrenceCounts.get(product.id) || 0) + 1);
    }
  }
  for (const plan of selectedPlans) {
    plan.versatilityEstimate = plan.purchaseItems.length
      ? Math.max(...plan.purchaseItems.map((product) => occurrenceCounts.get(product.id) || 0))
      : 1;
    plan.purchaseItems = plan.purchaseItems.map((product) => {
      const evaluation = getValueScore({
        product,
        wardrobeItems,
        occasion,
        budget,
        outfitCount: occurrenceCounts.get(product.id) || 1,
      });
      return {
        ...product,
        valueScore: evaluation.score,
        scoreFactors: evaluation.factors,
      };
    });
    plan.valueScore = plan.purchaseItems.length
      ? Math.round(
          plan.purchaseItems.reduce((sum, product) => sum + product.valueScore, 0) /
            plan.purchaseItems.length,
        )
      : 100;
  }
  return { plans: selectedPlans, validCombinationCount: uniquePlans.length };
};

const getMissingSlots = (wardrobeItems, occasion) => {
  const hasSlot = (slot) =>
    wardrobeItems.some((item) => getSlot(item) === slot && hasOccasion(item, occasion));
  if (hasSlot("onepiece")) {
    return hasSlot("footwear") ? [] : ["footwear"];
  }
  return ["top", "bottom", "footwear"].filter((slot) => !hasSlot(slot));
};

const getScoringFormula = () =>
  "0.35 × outfit combinations (20 points each, capped at 100) + 0.25 × wardrobe complement + 0.20 × occasion/style fit + 0.15 × budget fit + 0.05 × availability; each factor is normalized to 0–100.";

module.exports = {
  buildOutfitPlans,
  getMissingSlots,
  getProductCompatibility,
  getScoringFormula,
  getSlot,
  getValueScore,
};
