import React from "react";
import ReactDOM from "react-dom/client";
import App from "./routes/App.jsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import myntraStore from "./store/index.js";

import Home from "./routes/Home.jsx";
import Bag from "./routes/Bag.jsx";
import Wishlist from "./routes/Wishlist.jsx";

import Men from "./pages/Men.jsx";
import Women from "./pages/Women.jsx";
import Kids from "./pages/Kids.jsx";
import Beauty from "./pages/Beauty.jsx";
import Categories from "./pages/Categories.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
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
        path: "/wishlist",
        element: <Wishlist />,
      },
      {
        path: "/bag",
        element: <Bag />,
      },
      {
        path: "/categories",
        element: <Categories />,
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