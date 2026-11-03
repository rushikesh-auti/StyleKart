const assert = require("node:assert/strict");
const test = require("node:test");

const Address = require("../models/Address");
const Product = require("../models/Product");
const { getCheckoutSnapshot } = require("./paymentCheckoutService");

test("checkout snapshot loads product details and calculates the payable total", async () => {
  const originalAddressFindOne = Address.findOne;
  const originalProductFindOne = Product.findOne;
  const address = {
    fullName: "Test Customer",
    mobile: "9876543210",
    addressLine1: "1 Test Street",
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411001",
    addressType: "Home",
  };
  const product = {
    id: "shirt-1",
    item_name: "Test Shirt",
    image: "shirt.jpg",
    original_price: 100,
    current_price: 80,
    sizes: ["M"],
    colors: ["Blue"],
    inventoryVariants: [
      { size: "M", color: "Blue", stock: 3, active: true },
    ],
  };

  Address.findOne = () => ({ lean: async () => address });
  Product.findOne = () => ({ lean: async () => product });

  try {
    const snapshot = await getCheckoutSnapshot({
      userId: "507f1f77bcf86cd799439011",
      addressId: "507f1f77bcf86cd799439012",
      items: [
        {
          productId: "shirt-1",
          quantity: 2,
          selectedSize: "M",
          selectedColor: "Blue",
        },
      ],
    });

    assert.deepEqual(snapshot.items, [
      {
        productId: "shirt-1",
        itemName: "Test Shirt",
        image: "shirt.jpg",
        quantity: 2,
        selectedSize: "M",
        selectedColor: "Blue",
        unitPrice: 80,
        originalUnitPrice: 100,
      },
    ]);
    assert.deepEqual(snapshot.priceSummary, {
      totalMrp: 200,
      discount: 40,
      couponCode: "",
      couponDiscount: 0,
      delivery: 99,
      subtotal: 160,
    });
    assert.equal(snapshot.totalAmount, 259);
    assert.equal(snapshot.shippingAddress.fullName, "Test Customer");
  } finally {
    Address.findOne = originalAddressFindOne;
    Product.findOne = originalProductFindOne;
  }
});
