const assert = require("node:assert/strict");
const test = require("node:test");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { getDashboard } = require("./adminController");

test("dashboard returns paid sales, complete stock counts, and analytics", async () => {
  const originals = {
    orderAggregate: Order.aggregate,
    orderCountDocuments: Order.countDocuments,
    orderFind: Order.find,
    productAggregate: Product.aggregate,
    productCountDocuments: Product.countDocuments,
    userCountDocuments: User.countDocuments,
  };
  const previewProducts = Array.from({ length: 8 }, (_, index) => ({
    id: `product-${index + 1}`,
    stock: index === 0 ? 0 : 1,
  }));
  let salesPipeline;
  let inventoryPipeline;
  let responseBody;
  let responseError;

  Order.aggregate = async (pipeline) => {
    salesPipeline = pipeline;
    return [
      {
        revenue: [{ totalRevenue: 12450 }],
        trends: [{ date: new Date().toISOString().slice(0, 10), revenue: 500 }],
        orderTrend: [{ date: new Date().toISOString().slice(0, 10), orders: 2 }],
        bestSellingProducts: [
          { productId: "product-1", name: "Everyday Tee", quantitySold: 9 },
        ],
        categoryPerformance: [{ category: "women", quantitySold: 12 }],
      },
    ];
  };
  Order.countDocuments = async (filter = {}) =>
    filter.orderStatus ? 3 : 24;
  Order.find = () => ({
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    limit() {
      return this;
    },
    select: async () => [],
  });
  Product.aggregate = async (pipeline) => {
    inventoryPipeline = pipeline;
    return [
      {
        summary: [{ lowStockCount: 11, outOfStockCount: 2 }],
        products: previewProducts,
      },
    ];
  };
  Product.countDocuments = async () => 40;
  User.countDocuments = async () => 18;

  try {
    await getDashboard(
      {},
      {
        json(body) {
          responseBody = body;
        },
      },
      (error) => {
        responseError = error;
      },
    );

    assert.equal(responseError, undefined);
    assert.equal(responseBody.success, true);
    assert.deepEqual(responseBody.metrics, {
      totalRevenue: 12450,
      totalOrders: 24,
      totalCustomers: 18,
      totalProducts: 40,
      pendingOrders: 3,
      lowStockCount: 11,
      outOfStockCount: 2,
    });
    assert.equal(responseBody.lowStockProducts.length, 8);
    assert.equal(responseBody.revenueTrend.length, 30);
    assert.equal(responseBody.orderTrend.length, 30);
    assert.equal(responseBody.bestSellingProducts[0].quantitySold, 9);
    assert.equal(responseBody.categoryPerformance[0].category, "women");

    const salesMatch = salesPipeline[0].$match;
    assert.ok(salesMatch.$or.some((filter) => filter.paymentStatus === "PAID"));
    const salesFacets = salesPipeline[1].$facet;
    assert.equal(salesFacets.revenue[0].$match.paymentStatus, "PAID");
    assert.deepEqual(
      salesFacets.revenue[0].$match.orderStatus.$nin,
      ["CANCELLED", "REFUNDED"],
    );
    assert.ok(salesFacets.orderTrend[0].$match.createdAt);
    assert.equal(salesFacets.orderTrend[0].$match.paymentStatus, undefined);
    assert.ok(
      salesFacets.trends.some((stage) => stage.$match?.createdAt),
    );
    assert.ok(
      inventoryPipeline[1].$facet.summary.some((stage) => stage.$group),
    );
  } finally {
    Order.aggregate = originals.orderAggregate;
    Order.countDocuments = originals.orderCountDocuments;
    Order.find = originals.orderFind;
    Product.aggregate = originals.productAggregate;
    Product.countDocuments = originals.productCountDocuments;
    User.countDocuments = originals.userCountDocuments;
  }
});
