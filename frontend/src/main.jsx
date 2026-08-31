import React from "react";
import ReactDOM from "react-dom/client";
import App from "./routes/App.jsx";

import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import {
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

import { Provider } from "react-redux";
import myntraStore from "./store/index.js";

// Routes
import Home from "./routes/Home.jsx";
import Bag from "./routes/Bag.jsx";
import Wishlist from "./routes/Wishlist.jsx";

// Pages
import Men from "./pages/Men.jsx";
import Women from "./pages/Women.jsx";
import Kids from "./pages/Kids.jsx";
import Beauty from "./pages/Beauty.jsx";
import Categories from "./pages/Categories.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";

// Admin Pages
import AdminProducts from "./pages/AdminProducts.jsx";
import AddProduct from "./pages/AddProduct.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,

    children: [
      // Home
      {
        path: "/",
        element: <Home />,
      },

      // Categories
      {
        path: "/men",
        element: <Men />,
      },
      {
        path: "/women",
        element: <Women />,
      },
      {
        path: "/kids",
        element: <Kids />,
      },
      {
        path: "/beauty",
        element: <Beauty />,
      },
      {
        path: "/categories",
        element: <Categories />,
      },

      // Product
      {
        path: "/product/:id",
        element: <ProductDetails />,
      },

      // Wishlist
      {
        path: "/wishlist",
        element: <Wishlist />,
      },

      // Bag
      {
        path: "/bag",
        element: <Bag />,
      },

      // Admin - Product Management
      {
        path: "/admin/products",
        element: <AdminProducts />,
      },

      // Admin - Add Product
      {
        path: "/admin/products/add",
        element: <AddProduct />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={myntraStore}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);