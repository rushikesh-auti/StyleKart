const assert = require("node:assert/strict");
const test = require("node:test");

const orderRoutes = require("./orderRoutes");

test("customer order list and details routes remain behind user authentication", () => {
  const protectionLayer = orderRoutes.stack.find(
    (layer) => layer.name === "userProtect",
  );
  const orderListRoute = orderRoutes.stack.find(
    (layer) => layer.route?.path === "/" && layer.route.methods.get,
  );
  const orderDetailsRoute = orderRoutes.stack.find(
    (layer) => layer.route?.path === "/:id" && layer.route.methods.get,
  );

  assert.ok(protectionLayer);
  assert.ok(orderListRoute);
  assert.ok(orderDetailsRoute);
});
