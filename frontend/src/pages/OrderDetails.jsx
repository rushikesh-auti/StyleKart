import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import OrderCancellation from "../components/OrderCancellation";
import { isOrderCancellable } from "../utils/orderCancellation";
import { userFetch } from "../utils/userApi";
import {
  getDeliveryDurationLabel,
  formatDeliveryWindow,
  formatFulfillmentDate,
  formatFulfillmentTimestamp,
  getActiveDeliveryWindow,
} from "../utils/deliveryEstimate";

const timeline = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
const label = (value) => String(value || "").replaceAll("_", " ");

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
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

  const currentIndex = timeline.indexOf(order.orderStatus);
  const timelineIndex =
    currentIndex >= 0
      ? currentIndex
      : ["RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(order.orderStatus)
        ? timeline.indexOf("DELIVERED")
        : 0;
  const deliveryWindow = getActiveDeliveryWindow(order);
  const deliveredEvent = order.fulfillmentEvents?.find(
    (event) => event.status === "DELIVERED",
  );

  const paymentLabel =
    order.paymentMethod === "RAZORPAY"
      ? "Razorpay"
      : order.paymentMethod === "COD"
        ? "Cash on Delivery"
        : "Online payment";
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
        <p>Placed on {formatFulfillmentDate(order.createdAt)}</p>
      </header>
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-5 [&>h2]:text-lg [&>h2]:font-black [&>h2]:text-slate-950 [&_a]:text-sm [&_a]:font-bold [&_a]:text-brand-700">
          {order.orderStatus === "CANCELLED" ? (
            <section className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              <h2 className="mb-2 text-base font-black">Cancelled</h2>
              <p>
                {order.cancellationReason || "Cancellation requested"}
                {order.cancelledAt &&
                  ` · ${formatFulfillmentTimestamp(order.cancelledAt)}`}
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
              <div className="mb-8 grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 [&>div]:grid [&>div]:justify-items-center [&>div]:gap-2 [&>div]:text-center [&>div]:text-[11px] [&>div]:font-black [&>div]:text-slate-400 [&_span]:z-10 [&_span]:grid [&_span]:h-8 [&_span]:w-8 [&_span]:place-items-center [&_span]:rounded-full [&_span]:bg-slate-200 [&_span]:text-slate-500">
                {timeline.map((status, index) => {
                  const event = order.fulfillmentEvents?.find(
                    (item) => item.status === status,
                  );
                  const reached = index <= timelineIndex;
                  return (
                    <div
                      className={reached ? "!text-brand-700" : "text-slate-400"}
                      key={status}
                    >
                      <span
                        className={
                          reached
                            ? "!bg-brand-600 !text-white"
                            : "bg-slate-200 text-slate-500"
                        }
                      >
                        {index + 1}
                      </span>
                      <strong>{label(status)}</strong>
                      {event?.occurredAt && (
                        <small className="font-medium text-slate-500">
                          {formatFulfillmentTimestamp(event.occurredAt)}
                        </small>
                      )}
                    </div>
                  );
                })}
              </div>
              {deliveryWindow && (
                <section className="mb-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                  <h3 className="font-black">
                    {deliveryWindow.revised
                      ? "Revised delivery estimate"
                      : getDeliveryDurationLabel(order.deliveryEstimate)}
                  </h3>
                  <p className="mt-1">
                    Expected delivery: {formatDeliveryWindow(deliveryWindow)}
                  </p>
                  {deliveryWindow.revised && (
                    <p className="mt-2 text-xs text-emerald-900">
                      {getDeliveryDurationLabel(order.deliveryEstimate)} from
                      {" "}order placement. Original estimate:{" "}
                      {formatDeliveryWindow({
                        startDate: order.deliveryEstimate?.originalStartDate,
                        endDate: order.deliveryEstimate?.originalEndDate,
                      })}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-emerald-800">
                    This is a configurable estimate, not a live carrier update.
                  </p>
                  {deliveryWindow.revised && order.deliveryEstimate?.delayReason && (
                    <p className="mt-2 text-xs text-emerald-900">
                      Update: {order.deliveryEstimate.delayReason}
                    </p>
                  )}
                  {order.deliveryTracking?.trackingReference && (
                    <p className="mt-2 text-xs font-bold">
                      Internal/manual tracking reference:{" "}
                      {order.deliveryTracking.trackingReference}
                    </p>
                  )}
                </section>
              )}
              {order.orderStatus === "DELIVERED" && deliveredEvent?.occurredAt && (
                <p className="mb-7 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  Delivered on {formatFulfillmentDate(deliveredEvent.occurredAt)}
                </p>
              )}
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
          {deliveryWindow && (
            <p>
              <span>
                {deliveryWindow.revised
                  ? "Revised estimate"
                  : getDeliveryDurationLabel(order.deliveryEstimate)}
              </span>
              <strong>Expected {formatDeliveryWindow(deliveryWindow)}</strong>
            </p>
          )}
          {deliveryWindow?.revised && order.deliveryEstimate?.delayReason && (
            <p className="text-xs text-amber-700">
              Revised estimate: {order.deliveryEstimate.delayReason}
            </p>
          )}
          {order.orderStatus === "DELIVERED" && deliveredEvent?.occurredAt && (
            <p>
              <span>Delivered</span>
              <strong>{formatFulfillmentTimestamp(deliveredEvent.occurredAt)}</strong>
            </p>
          )}
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
          <div className="mt-4">
            <OrderCancellation
              order={order}
              onCancelled={setOrder}
              buttonClassName="w-full"
            />
          </div>
          {isOrderCancellable(order.orderStatus) ? (
            <p className="mt-2 text-xs text-slate-500">
              Orders can be cancelled before they are shipped.
            </p>
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
    </main>
  );
};

export default OrderDetails;
