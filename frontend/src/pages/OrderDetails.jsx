import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { userFetch } from "../utils/userApi";

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
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      </main>
    );
  if (!order)
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p>Loading order...</p>
      </main>
    );

  const currentIndex =
    {
      PLACED: 0,
      CONFIRMED: 1,
      PROCESSING: 1,
      SHIPPED: 2,
      OUT_FOR_DELIVERY: 2,
      DELIVERED: 3,
    }[order.orderStatus] ?? 0;

  const paymentLabel =
    order.paymentMethod === "RAZORPAY"
      ? "Razorpay"
      : order.paymentMethod === "COD"
        ? "Cash on Delivery"
        : "Online payment";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-7 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.03em] [&_h1]:text-slate-950 sm:[&_h1]:text-4xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
          {order.orderStatus === "PLACED"
            ? "Order confirmed"
            : "Order tracking"}
        </p>
        <h1>Order {order.orderNumber}</h1>
        <p>Placed on {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
      </header>
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-5 [&>h2]:text-lg [&>h2]:font-black [&>h2]:text-slate-950 [&_a]:text-sm [&_a]:font-bold [&_a]:text-brand-700">
          <h2>Tracking timeline</h2>
          <div className="mb-8 grid grid-cols-4 [&>div]:relative [&>div]:grid [&>div]:justify-items-center [&>div]:gap-2 [&>div]:text-center [&>div]:text-[11px] [&>div]:font-black [&>div]:text-slate-400 [&_span]:z-10 [&_span]:grid [&_span]:h-8 [&_span]:w-8 [&_span]:place-items-center [&_span]:rounded-full [&_span]:bg-slate-200 [&_span]:text-slate-500">
            {timeline.map((status, index) => (
              <div
                className={
                  index <= currentIndex ? "!text-brand-700" : "text-slate-400"
                }
                key={status}
              >
                <span
                  className={
                    index <= currentIndex
                      ? "!bg-brand-600 !text-white"
                      : "bg-slate-200 text-slate-500"
                  }
                >
                  {index + 1}
                </span>
                <strong>{status}</strong>
              </div>
            ))}
          </div>
          <h2>Items</h2>
          {order.items.map((item) => (
            <div
              className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 py-3 last:border-b-0 [&_img]:h-[78px] [&_img]:w-[62px] [&_img]:rounded-lg [&_img]:bg-slate-100 [&_img]:object-cover [&_p]:mt-1 [&_p]:text-xs [&_p]:leading-5 [&_p]:text-slate-500"
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
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-5 [&>h2]:text-lg [&>h2]:font-black [&>h2]:text-slate-950 [&>p]:my-3 [&>p]:flex [&>p]:justify-between [&>p]:gap-4 [&>p]:text-sm [&>p]:text-slate-600 [&_hr]:my-4 [&_hr]:border-slate-200">
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
            <strong>{paymentLabel}</strong>
          </p>
          <p className="text-base font-black text-slate-950">
            <span>Total</span>
            <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
          </p>
          <Link
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white no-underline hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
            to="/orders"
          >
            Back to orders
          </Link>
        </aside>
      </section>
    </main>
  );
};

export default OrderDetails;
