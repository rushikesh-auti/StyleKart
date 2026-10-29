const assert = require("node:assert/strict");
const test = require("node:test");

const adminRoutes = require("./adminRoutes");
const { adminOnly } = require("../middleware/authMiddleware");

test("admin order status route remains behind admin route protection", () => {
  const protectionLayer = adminRoutes.stack.find(
    (layer) => layer.name === "protect",
  );
  const statusRoute = adminRoutes.stack.find(
    (layer) =>
      layer.route?.path === "/orders/:id/status" &&
      layer.route.methods.put,
  );

  assert.ok(protectionLayer);
  assert.ok(statusRoute);
});

test("non-admin users are rejected by the admin authorization guard", () => {
  let responseStatus;
  let responseBody;
  let nextCalled = false;
  const response = {
    status(status) {
      responseStatus = status;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  adminOnly(
    { user: { id: "customer-id", role: "user" } },
    response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(responseStatus, 403);
  assert.equal(responseBody.message, "Admin access is required.");
  assert.equal(nextCalled, false);
});
