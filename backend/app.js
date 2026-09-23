const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const addressRoutes = require("./routes/addressRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StyleKart API is running",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);

app.use(errorHandler);

module.exports = app;