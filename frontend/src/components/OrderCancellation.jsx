import PropTypes from "prop-types";
import { useState } from "react";

import { isOrderCancellable } from "../utils/orderCancellation";
import { userFetch } from "../utils/userApi";

const cancellationReasons = [
  "Ordered by mistake",
  "Found a better price",
  "Wrong item or size",
  "Delivery taking too long",
  "Changed my mind",
  "Other",
];
const OrderCancellation = ({ order, onCancelled, buttonClassName = "" }) => {
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationNote, setCancellationNote] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState("");
  const [cancellationSuccess, setCancellationSuccess] = useState("");

  const canCancel = isOrderCancellable(order.orderStatus);
  if (!canCancel && !cancellationSuccess && !cancellationError) return null;
  const reasonId = `cancellation-reason-${order._id}`;
  const noteId = `cancellation-note-${order._id}`;
  const headingId = `cancel-order-heading-${order._id}`;

  const cancelOrder = async (event) => {
    event.preventDefault();
    if (!cancellationReason || cancelling) return;

    try {
      setCancelling(true);
      setCancellationError("");
      setCancellationSuccess("");
      const data = await userFetch(`/orders/${order._id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: cancellationReason,
          note: cancellationNote,
        }),
      });
      onCancelled(data.order);
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

  return (
    <>
      {cancellationSuccess && (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
          role="status"
        >
          {cancellationSuccess}
        </p>
      )}
      {cancellationError && !showCancellation && (
        <p
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
          role="alert"
        >
          {cancellationError}
        </p>
      )}
      {canCancel && (
        <button
          className={`${buttonClassName} rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-black text-rose-700 hover:bg-rose-50`}
          onClick={() => {
            setCancellationError("");
            setShowCancellation(true);
          }}
          type="button"
        >
          Cancel order
        </button>
      )}
      {canCancel && showCancellation && (
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
            aria-labelledby={headingId}
            onSubmit={cancelOrder}
          >
            <h2
              id={headingId}
              className="text-xl font-black text-slate-950"
            >
              Cancel this order?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This action cannot be undone. Select a reason to continue.
            </p>
            <label
              className="mt-5 block text-sm font-bold text-slate-700"
              htmlFor={reasonId}
            >
              Cancellation reason
            </label>
            <select
              id={reasonId}
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
              htmlFor={noteId}
            >
              Note (optional)
            </label>
            <textarea
              id={noteId}
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              maxLength={500}
              value={cancellationNote}
              onChange={(event) => setCancellationNote(event.target.value)}
            />
            {cancellationError && (
              <p
                className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"
                role="alert"
              >
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
    </>
  );
};

OrderCancellation.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    orderStatus: PropTypes.string.isRequired,
  }).isRequired,
  onCancelled: PropTypes.func.isRequired,
  buttonClassName: PropTypes.string,
};

export default OrderCancellation;
