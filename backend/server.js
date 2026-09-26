require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const requiredEnvironment = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);

if (missingEnvironment.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvironment.join(", ")}`);
}

const PORT = Number(process.env.PORT) || 5000;

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
