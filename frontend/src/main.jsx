import React from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { Provider } from "react-redux";

import styleKartStore from "./store/index.js";

import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import App from "./routes/App.jsx";

import Home from "./routes/Home.jsx";
import Bag from "./routes/Bag.jsx";
import Wishlist from "./routes/Wishlist.jsx";

import Men from "./pages/Men.jsx";
import Women from "./pages/Women.jsx";
import Kids from "./pages/Kids.jsx";
import Beauty from "./pages/Beauty.jsx";
import Categories from "./pages/Categories.jsx";

import ProductDetails from "./pages/ProductDetails.jsx";

import UserLogin from "./pages/UserLogin.jsx";
import Profile from "./pages/Profile.jsx";
import Orders from "./pages/Orders.jsx";

import AdminLogin from "./pages/AdminLogin.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import EditProduct from "./pages/EditProduct.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminProtectedRoute from "./pages/AdminProtectedRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,

    children: [
      {
        index: true,
        element: <Home />,
      },

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

      {
        path: "/product/:id",
        element: <ProductDetails />,
      },

      {
        path: "/wishlist",
        element: <Wishlist />,
      },

      {
        path: "/bag",
        element: <Bag />,
      },

      // User authentication
      {
        path: "/login",
        element: <UserLogin />,
      },

      // Protected user routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/profile",
            element: <Profile />,
          },
          {
            path: "/orders",
            element: <Orders />,
          },
        ],
      },

      // Admin login
      {
        path: "/admin/login",
        element: <AdminLogin />,
      },

      // Protected admin routes
      {
        element: <AdminProtectedRoute />,
        children: [
          {
            path: "/admin/products",
            element: <AdminProducts />,
          },
          {
            path: "/admin/products/add",
            element: <AddProduct />,
          },
          {
            path: "/admin/products/edit/:id",
            element: <EditProduct />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={styleKartStore}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);
