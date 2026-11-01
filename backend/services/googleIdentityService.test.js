const assert = require("node:assert/strict");
const test = require("node:test");
const { OAuth2Client } = require("google-auth-library");

const {
  validateGooglePayload,
  verifyGoogleCredential,
} = require("./googleIdentityService");

const validPayload = () => ({
  sub: "google-subject-123",
  email: "Customer@stylekart.test",
  email_verified: true,
  iss: "https://accounts.google.com",
  aud: "stylekart-google-client-id",
  exp: Math.floor(Date.now() / 1000) + 60,
  name: " Google Customer ",
});

test("Google payload validation returns only the verified customer identity", () => {
  assert.deepEqual(
    validateGooglePayload(validPayload(), "stylekart-google-client-id"),
    {
      googleId: "google-subject-123",
      email: "customer@stylekart.test",
      name: "Google Customer",
    },
  );
});

test("Google payload validation requires verified email and trusted token claims", () => {
  const invalidPayloads = [
    { email_verified: false },
    { iss: "https://attacker.example" },
    { aud: "another-client-id" },
    { exp: Math.floor(Date.now() / 1000) - 1 },
    { sub: "" },
  ];

  for (const invalidClaims of invalidPayloads) {
    assert.throws(
      () =>
        validateGooglePayload(
          { ...validPayload(), ...invalidClaims },
          "stylekart-google-client-id",
        ),
      { statusCode: 401 },
    );
  }
});

test("Google payload validation uses a verified email local part when name is missing", () => {
  const payload = validPayload();
  delete payload.name;

  assert.equal(
    validateGooglePayload(payload, "stylekart-google-client-id").name,
    "customer",
  );
});

test("Google credential verification uses the configured audience", async () => {
  const originalVerify = OAuth2Client.prototype.verifyIdToken;
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  let verifiedOptions;

  process.env.GOOGLE_CLIENT_ID = "stylekart-google-client-id";
  OAuth2Client.prototype.verifyIdToken = async (options) => {
    verifiedOptions = options;
    return { getPayload: () => validPayload() };
  };

  try {
    const identity = await verifyGoogleCredential("google-id-token");
    assert.deepEqual(verifiedOptions, {
      idToken: "google-id-token",
      audience: "stylekart-google-client-id",
    });
    assert.equal(identity.googleId, "google-subject-123");
  } finally {
    OAuth2Client.prototype.verifyIdToken = originalVerify;
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
  }
});

test("Google credential verification reports a missing server client ID", async () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;

  try {
    await assert.rejects(verifyGoogleCredential("google-id-token"), {
      statusCode: 503,
    });
  } finally {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
  }
});
