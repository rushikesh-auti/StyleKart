const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const test = require("node:test");

const Admin = require("../models/Admin");
const User = require("../models/User");
const googleIdentityService = require("../services/googleIdentityService");
const {
  googleLogin,
  loginUser,
  logoutUser,
  registerUser,
} = require("./authController");
const { authenticate } = require("../middleware/authMiddleware");

const createResponse = () => ({
  statusCode: 200,
  body: null,
  cookieName: "",
  cookieValue: "",
  cookieOptions: null,
  clearedCookie: null,
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  cookie(name, value, options) {
    this.cookieName = name;
    this.cookieValue = value;
    this.cookieOptions = options;
    return this;
  },
  clearCookie(name, options) {
    this.clearedCookie = { name, options };
    return this;
  },
});

test("shared login authenticates an admin and returns the verified role", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindById = Admin.findById;
  const originalFindUser = User.findOne;
  const originalSecret = process.env.JWT_SECRET;
  const password = "admin-password";
  const admin = {
    _id: "admin-account-id",
    name: "Store Admin",
    email: "admin@stylekart.test",
    role: "admin",
    password: await bcrypt.hash(password, 4),
  };
  const response = createResponse();
  let nextError;

  process.env.JWT_SECRET = "test-jwt-secret";
  Admin.findOne = async () => admin;
  User.findOne = () => ({
    select: async () => null,
  });

  try {
    await loginUser(
      { body: { email: admin.email, password } },
      response,
      (error) => {
        nextError = error;
      },
    );

    assert.equal(nextError, undefined);
    assert.equal(response.statusCode, 200);
    assert.equal(response.cookieName, "stylekart_session");
    assert.equal(response.cookieOptions.httpOnly, true);
    assert.deepEqual(response.body.user, {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: "admin",
    });
    assert.equal(response.body.admin.role, "admin");
    assert.equal(
      jwt.verify(response.cookieValue, process.env.JWT_SECRET).role,
      "admin",
    );
    Admin.findById = () => ({
      select: async () => ({ ...admin, password: undefined }),
    });
    const request = {
      headers: { cookie: `stylekart_session=${response.cookieValue}` },
    };
    let authenticated = false;
    await authenticate(request, response, () => {
      authenticated = true;
    });
    assert.equal(authenticated, true);
    assert.equal(request.user.role, "admin");
    assert.equal(request.user.id, admin._id);
  } finally {
    Admin.findOne = originalFindAdmin;
    Admin.findById = originalFindById;
    User.findOne = originalFindUser;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test("shared login authenticates a customer without granting an admin role", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const originalSecret = process.env.JWT_SECRET;
  const password = "customer-password";
  const user = {
    _id: "customer-account-id",
    name: "StyleKart Customer",
    email: "customer@stylekart.test",
    role: "user",
    password: await bcrypt.hash(password, 4),
  };
  const response = createResponse();

  process.env.JWT_SECRET = "test-jwt-secret";
  Admin.findOne = async () => null;
  User.findOne = () => ({
    select: async () => user,
  });

  try {
    await loginUser(
      { body: { email: user.email, password } },
      response,
      (error) => {
        throw error;
      },
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.user.role, "user");
    assert.equal(response.body.admin, undefined);
    assert.equal(
      jwt.verify(response.cookieValue, process.env.JWT_SECRET).role,
      "user",
    );
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test("registration remains customer-only and rejects an existing admin email", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const response = createResponse();
  let lookedUpCustomer = false;

  Admin.findOne = async () => ({ _id: "existing-admin" });
  User.findOne = async () => {
    lookedUpCustomer = true;
    return null;
  };

  try {
    await registerUser(
      {
        body: {
          name: "Admin Attempt",
          email: "admin@stylekart.test",
          password: "password123",
          confirmPassword: "password123",
        },
      },
      response,
      (error) => {
        throw error;
      },
    );

    assert.equal(response.statusCode, 409);
    assert.equal(lookedUpCustomer, false);
    assert.equal(response.cookieValue, "");
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
  }
});

test("registration creates a customer account and sets the shared session cookie", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const originalCreateUser = User.create;
  const originalSecret = process.env.JWT_SECRET;
  const response = createResponse();
  let createdAccount;

  process.env.JWT_SECRET = "test-jwt-secret";
  Admin.findOne = async () => null;
  User.findOne = async () => null;
  User.create = async (account) => {
    createdAccount = account;
    return { _id: "new-customer-id", ...account, role: "user" };
  };

  try {
    await registerUser(
      {
        body: {
          name: "New Customer",
          email: "new@stylekart.test",
          password: "password123",
          confirmPassword: "password123",
        },
      },
      response,
      (error) => {
        throw error;
      },
    );

    assert.equal(response.statusCode, 201);
    assert.equal(createdAccount.name, "New Customer");
    assert.equal(createdAccount.role, undefined);
    assert.equal(response.body.user.role, "user");
    assert.equal(response.cookieName, "stylekart_session");
    assert.equal(response.cookieOptions.httpOnly, true);
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
    User.create = originalCreateUser;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test("shared login reports invalid credentials without setting a session cookie", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const response = createResponse();
  const user = {
    _id: "customer-account-id",
    email: "customer@stylekart.test",
    role: "user",
    password: await bcrypt.hash("correct-password", 4),
  };

  Admin.findOne = async () => null;
  User.findOne = () => ({
    select: async () => user,
  });

  try {
    await loginUser(
      { body: { email: user.email, password: "wrong-password" } },
      response,
      (error) => {
        throw error;
      },
    );

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, "Invalid email or password");
    assert.equal(response.cookieName, "");
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
  }
});

test("Google login creates a customer account and issues the shared session cookie", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const originalCreateUser = User.create;
  const originalVerify = googleIdentityService.verifyGoogleCredential;
  const originalSecret = process.env.JWT_SECRET;
  const identity = {
    googleId: "google-subject-123",
    email: "customer@stylekart.test",
    name: "Google Customer",
  };
  const response = createResponse();
  let createdAccount;

  process.env.JWT_SECRET = "test-jwt-secret";
  Admin.findOne = async () => null;
  User.findOne = async () => null;
  User.create = async (account) => {
    createdAccount = account;
    return { _id: "google-customer-id", ...account };
  };
  googleIdentityService.verifyGoogleCredential = async (credential) => {
    assert.equal(credential, "verified-google-id-token");
    return identity;
  };

  try {
    await googleLogin(
      { body: { credential: "verified-google-id-token", role: "admin" } },
      response,
      (error) => {
        throw error;
      },
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(createdAccount, {
      name: identity.name,
      email: identity.email,
      googleId: identity.googleId,
      role: "user",
    });
    assert.equal(response.cookieName, "stylekart_session");
    assert.equal(response.cookieOptions.httpOnly, true);
    assert.deepEqual(response.body.user, {
      id: "google-customer-id",
      name: identity.name,
      email: identity.email,
      role: "user",
    });
    assert.equal(
      jwt.verify(response.cookieValue, process.env.JWT_SECRET).role,
      "user",
    );
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
    User.create = originalCreateUser;
    googleIdentityService.verifyGoogleCredential = originalVerify;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test("Google login signs in an existing linked customer without changing its account", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const originalCreateUser = User.create;
  const originalVerify = googleIdentityService.verifyGoogleCredential;
  const originalSecret = process.env.JWT_SECRET;
  const user = {
    _id: "linked-google-customer",
    name: "Linked Customer",
    email: "customer@stylekart.test",
    googleId: "google-subject-123",
    role: "user",
  };
  const response = createResponse();

  process.env.JWT_SECRET = "test-jwt-secret";
  Admin.findOne = async () => null;
  User.findOne = async (query) =>
    query.googleId === user.googleId ? user : null;
  User.create = async () => {
    throw new Error("A linked account must not be recreated.");
  };
  googleIdentityService.verifyGoogleCredential = async () => ({
    googleId: user.googleId,
    email: user.email,
    name: user.name,
  });

  try {
    await googleLogin({ body: { credential: "verified-token" } }, response, (error) => {
      throw error;
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.user.id, user._id);
    assert.equal(response.cookieName, "stylekart_session");
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
    User.create = originalCreateUser;
    googleIdentityService.verifyGoogleCredential = originalVerify;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test("Google login does not automatically link an existing password account", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const originalCreateUser = User.create;
  const originalVerify = googleIdentityService.verifyGoogleCredential;
  const response = createResponse();
  const passwordAccount = {
    _id: "password-customer",
    email: "customer@stylekart.test",
    role: "user",
  };

  Admin.findOne = async () => null;
  User.findOne = async (query) =>
    query.googleId ? null : passwordAccount;
  User.create = async () => {
    throw new Error("An existing account must not be linked automatically.");
  };
  googleIdentityService.verifyGoogleCredential = async () => ({
    googleId: "google-subject-123",
    email: passwordAccount.email,
    name: "Google Customer",
  });

  try {
    await googleLogin({ body: { credential: "verified-token" } }, response, (error) => {
      throw error;
    });

    assert.equal(response.statusCode, 409);
    assert.match(response.body.message, /Sign in with your password/);
    assert.equal(response.cookieName, "");
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
    User.create = originalCreateUser;
    googleIdentityService.verifyGoogleCredential = originalVerify;
  }
});

test("Google login rejects an email already assigned to an admin", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const originalVerify = googleIdentityService.verifyGoogleCredential;
  const response = createResponse();

  Admin.findOne = async () => ({ _id: "existing-admin", role: "admin" });
  User.findOne = async () => {
    throw new Error("Customer lookup should not run for an admin email.");
  };
  googleIdentityService.verifyGoogleCredential = async () => ({
    googleId: "google-subject-123",
    email: "admin@stylekart.test",
    name: "Google Admin",
  });

  try {
    await googleLogin({ body: { credential: "verified-token" } }, response, (error) => {
      throw error;
    });

    assert.equal(response.statusCode, 409);
    assert.equal(response.cookieName, "");
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
    googleIdentityService.verifyGoogleCredential = originalVerify;
  }
});

test("Google login rejects a duplicate email race instead of issuing a session", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const originalCreateUser = User.create;
  const originalVerify = googleIdentityService.verifyGoogleCredential;
  const response = createResponse();

  Admin.findOne = async () => null;
  User.findOne = async () => null;
  User.create = async () => {
    const error = new Error("Duplicate email");
    error.code = 11000;
    throw error;
  };
  googleIdentityService.verifyGoogleCredential = async () => ({
    googleId: "google-subject-123",
    email: "customer@stylekart.test",
    name: "Google Customer",
  });

  try {
    await googleLogin({ body: { credential: "verified-token" } }, response, (error) => {
      throw error;
    });

    assert.equal(response.statusCode, 409);
    assert.equal(response.cookieName, "");
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
    User.create = originalCreateUser;
    googleIdentityService.verifyGoogleCredential = originalVerify;
  }
});

test("password login rejects a passwordless Google account", async () => {
  const originalFindAdmin = Admin.findOne;
  const originalFindUser = User.findOne;
  const response = createResponse();
  const user = {
    _id: "google-customer-id",
    email: "customer@stylekart.test",
    role: "user",
  };

  Admin.findOne = async () => null;
  User.findOne = () => ({
    select: async () => user,
  });

  try {
    await loginUser(
      { body: { email: user.email, password: "any-password" } },
      response,
      (error) => {
        throw error;
      },
    );

    assert.equal(response.statusCode, 401);
    assert.equal(response.cookieName, "");
  } finally {
    Admin.findOne = originalFindAdmin;
    User.findOne = originalFindUser;
  }
});

test("the User model allows passwordless records only with a Google identity", async () => {
  const googleUser = new User({
    name: "Google Customer",
    email: "google@stylekart.test",
    googleId: "google-subject-123",
  });
  const passwordUser = new User({
    name: "Password Customer",
    email: "password@stylekart.test",
  });

  await googleUser.validate();
  await assert.rejects(passwordUser.validate(), (error) => {
    assert.ok(error.errors.password);
    return true;
  });
});

test("logout clears the existing shared session cookie", () => {
  const response = createResponse();

  logoutUser({}, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.clearedCookie.name, "stylekart_session");
  assert.equal(response.clearedCookie.options.httpOnly, true);
});
