const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client();

const invalidCredential = () => {
  const error = new Error("Google credential is invalid or expired.");
  error.statusCode = 401;
  error.expose = true;
  return error;
};

const validateGooglePayload = (payload, clientId) => {
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    !payload.sub.trim() ||
    !payload.email ||
    typeof payload.email !== "string" ||
    payload.email_verified !== true ||
    !["accounts.google.com", "https://accounts.google.com"].includes(payload.iss) ||
    payload.aud !== clientId ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw invalidCredential();
  }

  const email = payload.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw invalidCredential();

  const name =
    typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : email.split("@")[0];

  return { googleId: payload.sub, email, name };
};

const verifyGoogleCredential = async (credential) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error = new Error("Google sign-in is not configured.");
    error.statusCode = 503;
    error.expose = true;
    throw error;
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
  } catch (error) {
    if (error.response || error.code) throw error;
    throw invalidCredential();
  }

  return validateGooglePayload(ticket.getPayload(), clientId);
};

module.exports = { verifyGoogleCredential, validateGooglePayload };
