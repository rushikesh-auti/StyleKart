import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { userFetch } from "../utils/userApi";
import "../styles/checkout.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    userFetch("/orders")
      .then((data) => setOrders(data.orders || []))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <main className="account-page">
      <header className="account-header">
        <p className="home-eyebrow">My account</p>
        <h1>My orders</h1>
        <p>Track your StyleKart purchases.</p>
      </header>
      <section className="account-content order-list">
        {error && <p className="account-message error">{error}</p>}
        {!error && orders.length === 0 && (
          <p>
            No orders yet. <Link to="/products">Start shopping</Link>.
          </p>
        )}
        {orders.map((order) => (
          <Link
            className="order-list-item"
            to={`/orders/${order._id}`}
            key={order._id}
          >
            <div>
              <strong>{order.orderNumber}</strong>
              <span>
                {new Date(order.createdAt).toLocaleDateString("en-IN")} ·{" "}
                {order.items.length} item(s)
              </span>
            </div>
            <div>
              <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
              <span className="order-status">{order.orderStatus}</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default Orders;
