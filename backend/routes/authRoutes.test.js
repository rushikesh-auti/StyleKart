const assert = require("node:assert/strict");
const test = require("node:test");

const authRoutes = require("./authRoutes");
const { loginUser } = require("../controllers/authController");

const getRouteHandler = (path) => {
  const routeLayer = authRoutes.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods.post,
  );
  return routeLayer?.route.stack.at(-1)?.handle;
};

test("customer and legacy admin login paths share the unified login handler", () => {
  assert.equal(getRouteHandler("/login"), loginUser);
  assert.equal(getRouteHandler("/admin/login"), loginUser);
});

test("registration route remains separate from admin login", () => {
  const registration = authRoutes.stack.find(
    (layer) =>
      layer.route?.path === "/register" && layer.route.methods.post,
  );
  const adminLogin = authRoutes.stack.find(
    (layer) =>
      layer.route?.path === "/admin/login" && layer.route.methods.post,
  );

  assert.ok(registration);
  assert.ok(adminLogin);
  assert.notEqual(
    registration.route.stack.at(-1)?.handle,
    adminLogin.route.stack.at(-1)?.handle,
  );
});
