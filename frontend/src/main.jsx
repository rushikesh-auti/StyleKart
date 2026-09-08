import React from "react";
import ReactDOM from "react-dom/client";

import App from "./routes/App.jsx";

import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { Provider } from "react-redux";
import myntraStore from "./store/index.js";

// Main Routes
import Home from "./routes/Home.jsx";
import Bag from "./routes/Bag.jsx";
import Wishlist from "./routes/Wishlist.jsx";

// Category Pages
import Men from "./pages/Men.jsx";
import Women from "./pages/Women.jsx";
import Kids from "./pages/Kids.jsx";
import Beauty from "./pages/Beauty.jsx";
import Categories from "./pages/Categories.jsx";

// Product Pages
import ProductDetails from "./pages/ProductDetails.jsx";

// Admin Pages
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import EditProduct from "./pages/EditProduct.jsx";

// Admin Protection
import AdminProtectedRoute from "./pages/AdminProtectedRoute.jsx";

// Router Configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,

    children: [
      // =========================
      // HOME
      // =========================
      {
        index: true,
        element: <Home />,
      },

      // =========================
      // CATEGORY PAGES
      // =========================
      {
        path: "men",
        element: <Men />,
      },
      {
        path: "women",
        element: <Women />,
      },
      {
        path: "kids",
        element: <Kids />,
      },
      {
        path: "beauty",
        element: <Beauty />,
      },
      {
        path: "categories",
        element: <Categories />,
      },

      // =========================
      // PRODUCT DETAILS
      // =========================
      {
        path: "product/:id",
        element: <ProductDetails />,
      },

      // =========================
      // WISHLIST
      // =========================
      {
        path: "wishlist",
        element: <Wishlist />,
      },

      // =========================
      // SHOPPING BAG
      // =========================
      {
        path: "bag",
        element: <Bag />,
      },

      // =========================
      // ADMIN LOGIN
      // =========================
      {
        path: "admin/login",
        element: <AdminLogin />,
      },

      // =========================
      // PROTECTED ADMIN ROUTES
      // =========================
      {
        element: <AdminProtectedRoute />,
        children: [
          // Admin Product Management
          {
            path: "admin/products",
            element: <AdminProducts />,
          },

          // Add Product
          {
            path: "admin/products/add",
            element: <AddProduct />,
          },

          // Edit Product
          {
            path: "admin/products/edit/:id",
            element: <EditProduct />,
          },
        ],
      },
    ],
  },
]);

// React Application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={myntraStore}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);
