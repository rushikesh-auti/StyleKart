const Razorpay = require("razorpay");

const getRazorpayClient = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  const placeholder =
    !keyId ||
    !keySecret ||
    keyId.includes("xxxxxxxx") ||
    keySecret.includes("xxxxxxxx");

  if (placeholder) {
    const error = new Error(
      "Razorpay is not configured. Add valid Test Mode RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET values to backend/.env and restart the backend.",
    );
    error.statusCode = 503;
    error.expose = true;
    throw error;
  }

  return {
    client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    keyId,
    keySecret,
  };
};

module.exports = { getRazorpayClient };
