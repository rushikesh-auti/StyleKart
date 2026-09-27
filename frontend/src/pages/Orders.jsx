import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { userFetch } from "../utils/userApi";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    userFetch("/orders")
      .then((data) => setOrders(data.orders || []))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-7 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.03em] [&_h1]:text-slate-950 sm:[&_h1]:text-4xl [&>p:last-child]:mt-2 [&>p:last-child]:text-sm [&>p:last-child]:text-slate-500">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
          My account
        </p>
        <h1>My orders</h1>
        <p>Track your StyleKart purchases.</p>
      </header>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </p>
        )}
        {!error && orders.length === 0 && (
          <p>
            No orders yet. <Link to="/products">Start shopping</Link>.
          </p>
        )}
        {orders.map((order) => (
          <Link
            className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 text-slate-900 no-underline hover:border-brand-300 hover:bg-brand-50/30 sm:flex-row sm:items-center sm:justify-between [&_span]:text-sm [&_span]:text-slate-500"
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
              <span className="text-xs font-black uppercase tracking-wide text-brand-700">
                {order.orderStatus}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default Orders;
