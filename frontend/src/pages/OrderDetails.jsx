import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { userFetch } from "../utils/userApi";

const timeline = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];
const cancellationReasons = [
  "Ordered by mistake",
  "Found a better price",
  "Wrong item or size",
  "Delivery taking too long",
  "Changed my mind",
  "Other",
];
const cancellableStatuses = ["PLACED", "CONFIRMED", "PROCESSING"];
const label = (value) => String(value || "").replaceAll("_", " ");

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationNote, setCancellationNote] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState("");
  const [cancellationSuccess, setCancellationSuccess] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

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
  const canCancel = cancellableStatuses.includes(order.orderStatus);

  const cancelOrder = async (event) => {
    event.preventDefault();
    if (!cancellationReason || cancelling) return;

    try {
      setCancelling(true);
      setCancellationError("");
      setCancellationSuccess("");
      const data = await userFetch(`/orders/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: cancellationReason,
          note: cancellationNote,
        }),
      });
      setOrder(data.order);
      setShowCancellation(false);
      setCancellationReason("");
      setCancellationNote("");
      setCancellationSuccess(data.message || "Order cancelled successfully.");
    } catch (requestError) {
      setCancellationError(requestError.message);
    } finally {
      setCancelling(false);
    }
  };

  const downloadInvoice = async () => {
    if (downloadingInvoice) return;

    try {
      setDownloadingInvoice(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/orders/${id}/invoice`,
        {
          credentials: "include",
          headers: {
            Accept: "application/pdf",
          },
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Unable to download the invoice.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition") || "";
      const match = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
      const fileName = match?.[1] || `${order.orderNumber || "stylekart-invoice"}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-7 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.03em] [&_h1]:text-slate-950 sm:[&_h1]:text-4xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
          {order.orderStatus === "CANCELLED"
            ? "Order cancelled"
            : order.orderStatus === "PLACED"
              ? "Order confirmed"
              : "Order tracking"}
        </p>
        <h1>Order {order.orderNumber}</h1>
        <p>Placed on {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
      </header>
      {cancellationSuccess && (
        <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {cancellationSuccess}
        </p>
      )}
      {cancellationError && (
        <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {cancellationError}
        </p>
      )}
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-5 [&>h2]:text-lg [&>h2]:font-black [&>h2]:text-slate-950 [&_a]:text-sm [&_a]:font-bold [&_a]:text-brand-700">
          {order.orderStatus === "CANCELLED" ? (
            <section className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              <h2 className="mb-2 text-base font-black">Cancelled</h2>
              <p>
                {order.cancellationReason || "Cancellation requested"}
                {order.cancelledAt &&
                  ` · ${new Date(order.cancelledAt).toLocaleString("en-IN")}`}
              </p>
              {order.cancellationNote && (
                <p className="mt-2 text-rose-800">{order.cancellationNote}</p>
              )}
              {order.paymentMethod === "RAZORPAY" && (
                <p className="mt-3 font-bold">
                  Refund status: {label(order.refundStatus || "PENDING")}
                  {order.providerRefundId && ` · Ref ${order.providerRefundId}`}
                </p>
              )}
            </section>
          ) : (
            <>
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
            </>
          )}
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
          <p>
            <span>Payment status</span>
            <strong>{label(order.paymentStatus)}</strong>
          </p>
          <p className="text-base font-black text-slate-950">
            <span>Total</span>
            <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
              onClick={downloadInvoice}
              disabled={downloadingInvoice}
              type="button"
            >
              {downloadingInvoice ? "Preparing invoice..." : "Download invoice"}
            </button>
            <Link
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 no-underline transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
              to="/orders"
            >
              Back to orders
            </Link>
          </div>
          {canCancel ? (
            <div className="mt-4">
              <button
                className="w-full rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-black text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  setCancellationError("");
                  setShowCancellation(true);
                }}
              >
                Cancel order
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Orders can be cancelled before they are shipped.
              </p>
            </div>
          ) : (
            order.orderStatus !== "CANCELLED" && (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                {["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
                  order.orderStatus,
                )
                  ? "This order has shipped or been delivered and can no longer be cancelled."
                  : "This order is not eligible for cancellation in its current status."}
              </p>
            )
          )}
        </aside>
      </section>
      {showCancellation && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancelling) {
              setShowCancellation(false);
            }
          }}
        >
          <form
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-heading"
            onSubmit={cancelOrder}
          >
            <h2
              id="cancel-order-heading"
              className="text-xl font-black text-slate-950"
            >
              Cancel this order?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This action cannot be undone. Select a reason to continue.
            </p>
            <label
              className="mt-5 block text-sm font-bold text-slate-700"
              htmlFor="cancellation-reason"
            >
              Cancellation reason
            </label>
            <select
              id="cancellation-reason"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              required
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
            >
              <option value="">Choose a reason</option>
              {cancellationReasons.map((reason) => (
                <option value={reason} key={reason}>
                  {reason}
                </option>
              ))}
            </select>
            <label
              className="mt-4 block text-sm font-bold text-slate-700"
              htmlFor="cancellation-note"
            >
              Note (optional)
            </label>
            <textarea
              id="cancellation-note"
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              maxLength={500}
              value={cancellationNote}
              onChange={(event) => setCancellationNote(event.target.value)}
            />
            {cancellationError && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                {cancellationError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
                disabled={cancelling}
                onClick={() => setShowCancellation(false)}
              >
                Keep order
              </button>
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
                disabled={!cancellationReason || cancelling}
              >
                {cancelling ? "Cancelling..." : "Confirm cancellation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default OrderDetails;
