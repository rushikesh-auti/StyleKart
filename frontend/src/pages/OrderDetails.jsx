import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { userFetch } from "../utils/userApi";
import "../styles/checkout.css";

const timeline = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    userFetch(`/orders/${id}`)
      .then((data) => setOrder(data.order))
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  if (error)
    return (
      <main className="checkout-page">
        <p className="checkout-error">{error}</p>
      </main>
    );
  if (!order)
    return (
      <main className="checkout-page">
        <p>Loading order...</p>
      </main>
    );

  const currentIndex = timeline.indexOf(order.orderStatus);

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <p className="home-eyebrow">
          {order.orderStatus === "PLACED"
            ? "Order confirmed"
            : "Order tracking"}
        </p>
        <h1>Order {order.orderNumber}</h1>
        <p>Placed on {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
      </header>
      <section className="order-detail-layout">
        <div className="checkout-panel">
          <h2>Tracking timeline</h2>
          <div className="order-timeline">
            {timeline.map((status, index) => (
              <div
                className={index <= currentIndex ? "complete" : ""}
                key={status}
              >
                <span>{index + 1}</span>
                <strong>{status}</strong>
              </div>
            ))}
          </div>
          <h2>Items</h2>
          {order.items.map((item) => (
            <div
              className="checkout-line"
              key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
            >
              <img src={item.image} alt="" />
              <div>
                <strong>{item.itemName}</strong>
                <p>
                  Qty {item.quantity}
                  {item.selectedSize && ` · Size ${item.selectedSize}`}
                  {item.selectedColor && ` · ${item.selectedColor}`}
                </p>
              </div>
              <strong>
                ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
              </strong>
            </div>
          ))}
        </div>
        <aside className="checkout-summary">
          <h2>Delivery and total</h2>
          <p>
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.addressLine1}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
            {order.shippingAddress.pinCode}
            <br />
            {order.shippingAddress.mobile}
          </p>
          <hr />
          <p>
            <span>Payment</span>
            <strong>Cash on Delivery</strong>
          </p>
          <p className="total">
            <span>Total</span>
            <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
          </p>
          <Link className="primary-button" to="/orders">
            Back to orders
          </Link>
        </aside>
      </section>
    </main>
  );
};

export default OrderDetails;
