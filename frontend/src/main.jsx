import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import styleKartStore from "./store/index.js";

import "./index.css";

import App from "./routes/App.jsx";

import Home from "./routes/Home.jsx";
import Bag from "./routes/Bag.jsx";
import Wishlist from "./routes/Wishlist.jsx";

import Men from "./pages/Men.jsx";
import Women from "./pages/Women.jsx";
import Kids from "./pages/Kids.jsx";
import Beauty from "./pages/Beauty.jsx";
import Categories from "./pages/Categories.jsx";
import ProductListing from "./pages/ProductListing.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import HelpContact from "./pages/HelpContact.jsx";

import UserLogin from "./pages/UserLogin.jsx";
import Profile from "./pages/Profile.jsx";
import Orders from "./pages/Orders.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import Addresses from "./pages/Addresses.jsx";

import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import EditProduct from "./pages/EditProduct.jsx";
import AdminCoupons from "./pages/AdminCoupons.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminCustomers from "./pages/AdminCustomers.jsx";
import AdminInventory from "./pages/AdminInventory.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminProtectedRoute from "./pages/AdminProtectedRoute.jsx";
import CustomerOnlyRoute from "./components/CustomerOnlyRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // PUBLIC ROUTES

      {
        index: true,
        element: <Home />,
      },
      {
        path: "/products",
        element: <ProductListing />,
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
        path: "/contact",
        element: <HelpContact />,
      },
      {
        path: "/login",
        element: <UserLogin />,
      },

      // CUSTOMER-ONLY ROUTES

      {
        element: <CustomerOnlyRoute />,
        children: [
          {
            path: "/wishlist",
            element: <Wishlist />,
          },
        ],
      },

      // PROTECTED CUSTOMER ROUTES

      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/bag",
            element: <Bag />,
          },
          {
            path: "/profile",
            element: <Profile />,
          },
          {
            path: "/addresses",
            element: <Addresses />,
          },
          {
            path: "/orders",
            element: <Orders />,
          },
          {
            path: "/orders/:id",
            element: <OrderDetails />,
          },
        ],
      },

      // CHECKOUT

      {
        path: "/checkout",
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <Checkout />,
          },
        ],
      },

      // ADMIN PUBLIC ROUTE

      {
        path: "/admin/login",
        element: <AdminLogin />,
      },

      // PROTECTED ADMIN ROUTES

      {
        element: <AdminProtectedRoute />,
        children: [
          {
            path: "/admin",
            element: <AdminDashboard />,
          },
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
          {
            path: "/admin/coupons",
            element: <AdminCoupons />,
          },
          {
            path: "/admin/orders",
            element: <AdminOrders />,
          },
          {
            path: "/admin/customers",
            element: <AdminCustomers />,
          },
          {
            path: "/admin/inventory",
            element: <AdminInventory />,
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
