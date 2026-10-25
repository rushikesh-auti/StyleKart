const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildOutfitPlans,
  getMissingSlots,
  getSlot,
  getValueScore,
} = require("./wardrobeRecommendationService");

const wardrobeItems = [
  {
    _id: "wardrobe-shirt",
    name: "White interview shirt",
    category: "shirts",
    color: "white",
    style: "formal",
    occasions: ["interview", "office"],
  },
  {
    _id: "wardrobe-trousers",
    name: "Navy trousers",
    category: "trousers",
    color: "navy",
    style: "formal",
    occasions: ["interview", "office"],
  },
];

const shoe = {
  id: "formal-shoe",
  category: "men",
  subcategory: "shoes",
  item_name: "Black Formal Shoes",
  description: "Leather office shoes",
  current_price: 2400,
  stock: 4,
  colors: ["Black"],
  sizes: ["8", "9"],
};

test("maps the catalog garment subcategory to a wardrobe outfit slot", () => {
  assert.equal(getSlot(shoe), "footwear");
  assert.equal(getSlot({ category: "men", subcategory: "t-shirts" }), "top");
});

test("completes a real wardrobe gap with an available in-budget catalog product", () => {
  const result = buildOutfitPlans({
    wardrobeItems,
    products: [shoe],
    occasion: "interview",
    budget: 3000,
  });
  assert.equal(result.plans.length, 1);
  assert.deepEqual(result.plans[0].ownedItems.map((item) => item._id).sort(), [
    "wardrobe-shirt",
    "wardrobe-trousers",
  ]);
  assert.deepEqual(result.plans[0].purchaseItems.map((item) => item.id), ["formal-shoe"]);
  assert.equal(result.plans[0].newPurchaseTotal, 2400);
  assert.match(result.plans[0].explanations[0].reasons.join(" "), /missing for this outfit/);
});

test("does not use unavailable products or exceed the overall purchase budget", () => {
  const result = buildOutfitPlans({
    wardrobeItems,
    products: [{ ...shoe, stock: 0 }],
    occasion: "interview",
    budget: 3000,
  });
  assert.equal(result.plans.length, 0);

  const budgetResult = buildOutfitPlans({
    wardrobeItems: [],
    products: [
      { ...shoe, current_price: 1800 },
      {
        ...shoe,
        id: "shirt",
        subcategory: "shirts",
        item_name: "Formal Shirt",
        current_price: 1800,
      },
      {
        ...shoe,
        id: "trousers",
        subcategory: "trousers",
        item_name: "Formal Trousers",
        current_price: 1800,
      },
    ],
    occasion: "interview",
    budget: 3000,
  });
  assert.equal(budgetResult.plans.length, 0);
});

test("selected products are included in generated alternatives", () => {
  const selected = { ...shoe, id: "selected-shoe" };
  const result = buildOutfitPlans({
    wardrobeItems,
    products: [selected],
    occasion: "interview",
    budget: 3000,
    selectedProduct: selected,
  });
  assert.ok(result.plans.length > 0);
  assert.ok(result.plans.every((plan) =>
    plan.purchaseItems.some((product) => product.id === "selected-shoe"),
  ));
});

test("reports missing categories and produces an explainable bounded score", () => {
  assert.deepEqual(getMissingSlots(wardrobeItems, "interview"), ["footwear"]);
  const evaluation = getValueScore({
    product: shoe,
    wardrobeItems,
    occasion: "interview",
    budget: 3000,
    outfitCount: 2,
  });
  assert.ok(evaluation.score >= 0 && evaluation.score <= 100);
  assert.equal(evaluation.factors.availability, 100);
  assert.ok(evaluation.reasons.length >= 2);
});

test("returns no combinations when the catalog cannot fill wardrobe gaps", () => {
  const result = buildOutfitPlans({
    wardrobeItems,
    products: [],
    occasion: "interview",
    budget: 5000,
  });
  assert.deepEqual(result.plans, []);
  assert.deepEqual(getMissingSlots(wardrobeItems, "interview"), ["footwear"]);
});
