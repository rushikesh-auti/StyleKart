import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { adminFetch } from "../utils/adminApi";

const label = (value) => String(value || "").replaceAll("_", " ");

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "";

const ProductImage = ({ src, alt, className }) => (
  <div
    className={`relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-400 ${className}`}
  >
    <span>No image</span>
    {src && (
      <img
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        alt={alt}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    )}
  </div>
);

ProductImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
};

const AdminOrderDetailsModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await adminFetch(`/admin/orders/${orderId}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load order details.");
        }
        setOrder(data.order);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadOrder();
    return () => controller.abort();
  }, [orderId, reloadKey]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const address = order?.shippingAddress;
  const priceSummary = order?.priceSummary;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-order-details-heading"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brand-700">
              Order details
            </p>
            <h2
              className="mt-1 text-xl font-black text-slate-950 sm:text-2xl"
              id="admin-order-details-heading"
            >
              {order?.orderNumber || "Order"}
            </h2>
          </div>
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          {loading && (
            <p className="py-12 text-center text-sm text-slate-500" role="status">
              Loading order details...
            </p>
          )}
          {error && (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              role="alert"
            >
              <p className="font-bold">{error}</p>
              <button
                className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-black text-rose-800 hover:bg-rose-100"
                onClick={() => setReloadKey((key) => key + 1)}
                type="button"
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !error && order && (
            <div className="grid gap-6">
              <section>
                <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                  Purchased items ({order.items?.length || 0})
                </h3>
                {order.items?.length ? (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {order.items.map((item, index) => (
                      <article
                        className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4"
                        key={`${item.productId}-${index}`}
                      >
                        <ProductImage
                          src={item.image}
                          alt={item.itemName}
                          className="h-16 w-14"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900">
                            {item.itemName}
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Product ID: {item.productId}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            Qty {item.quantity}
                            {item.selectedSize && ` · Size ${item.selectedSize}`}
                            {item.selectedColor && ` · ${item.selectedColor}`}
                          </p>
                        </div>
                        <div className="text-sm sm:text-right">
                          <strong className="block text-slate-900">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </strong>
                          <span className="text-xs text-slate-500">
                            {formatCurrency(item.unitPrice)} each
                          </span>
                          {item.originalUnitPrice > item.unitPrice && (
                            <span className="block text-xs text-slate-400 line-through">
                              {formatCurrency(
                                item.originalUnitPrice * item.quantity,
                              )}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    No item details are available for this order.
                  </p>
                )}
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                    Customer
                  </h3>
                  <dl className="grid gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Name</dt>
                      <dd className="font-semibold text-slate-900">
                        {order.user?.name || address?.fullName || "Deleted user"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Email</dt>
                      <dd className="break-all text-slate-800">
                        {order.user?.email || "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Mobile</dt>
                      <dd className="text-slate-800">
                        {order.user?.mobile || address?.mobile || "Not available"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                    Shipping address
                  </h3>
                  {address ? (
                    <address className="text-sm not-italic leading-6 text-slate-800">
                      <strong>{address.fullName}</strong>
                      <br />
                      {address.addressLine1}
                      {address.addressLine2 && (
                        <>
                          <br />
                          {address.addressLine2}
                        </>
                      )}
                      <br />
                      {address.city}, {address.state} {address.pinCode}
                      <br />
                      {address.addressType && `${address.addressType} · `}
                      {address.mobile}
                    </address>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Shipping address unavailable.
                    </p>
                  )}
                </section>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                    Order and payment
                  </h3>
                  <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-sm">
                    <dt className="text-slate-500">Order status</dt>
                    <dd className="text-right font-bold text-slate-900">
                      {label(order.orderStatus)}
                    </dd>
                    <dt className="text-slate-500">Payment method</dt>
                    <dd className="text-right font-semibold text-slate-900">
                      {label(order.paymentMethod)}
                    </dd>
                    <dt className="text-slate-500">Payment status</dt>
                    <dd className="text-right font-semibold text-slate-900">
                      {label(order.paymentStatus)}
                    </dd>
                    {priceSummary && (
                      <>
                        <dt className="text-slate-500">Items subtotal</dt>
                        <dd className="text-right text-slate-900">
                          {formatCurrency(priceSummary.subtotal)}
                        </dd>
                        {priceSummary.discount > 0 && (
                          <>
                            <dt className="text-slate-500">Product discount</dt>
                            <dd className="text-right text-slate-900">
                              −{formatCurrency(priceSummary.discount)}
                            </dd>
                          </>
                        )}
                        {priceSummary.couponDiscount > 0 && (
                          <>
                            <dt className="text-slate-500">
                              Coupon{priceSummary.couponCode
                                ? ` (${priceSummary.couponCode})`
                                : ""}
                            </dt>
                            <dd className="text-right text-slate-900">
                              −{formatCurrency(priceSummary.couponDiscount)}
                            </dd>
                          </>
                        )}
                        <dt className="text-slate-500">Delivery</dt>
                        <dd className="text-right text-slate-900">
                          {formatCurrency(priceSummary.delivery)}
                        </dd>
                      </>
                    )}
                    <dt className="border-t border-slate-200 pt-2 font-black text-slate-950">
                      Order total
                    </dt>
                    <dd className="border-t border-slate-200 pt-2 text-right font-black text-slate-950">
                      {formatCurrency(order.totalAmount)}
                    </dd>
                  </dl>
                </section>

                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                    Cancellation and refund
                  </h3>
                  {order.orderStatus === "CANCELLED" ? (
                    <dl className="grid gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">
                          Cancellation reason
                        </dt>
                        <dd className="font-semibold text-slate-900">
                          {order.cancellationReason || "Not recorded"}
                        </dd>
                      </div>
                      {order.cancellationNote && (
                        <div>
                          <dt className="text-xs text-slate-500">
                            Cancellation note
                          </dt>
                          <dd className="text-slate-800">
                            {order.cancellationNote}
                          </dd>
                        </div>
                      )}
                      {order.cancellationInitiator && (
                        <div>
                          <dt className="text-xs text-slate-500">
                            Requested by
                          </dt>
                          <dd className="text-slate-800">
                            {label(order.cancellationInitiator)}
                          </dd>
                        </div>
                      )}
                      {order.cancelledAt && (
                        <div>
                          <dt className="text-xs text-slate-500">
                            Cancelled at
                          </dt>
                          <dd className="text-slate-800">
                            {formatDate(order.cancelledAt)}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs text-slate-500">Refund status</dt>
                        <dd className="font-semibold text-slate-900">
                          {label(order.refundStatus || "NOT_REQUIRED")}
                        </dd>
                      </div>
                      {order.refundProvider && (
                        <div>
                          <dt className="text-xs text-slate-500">
                            Refund provider
                          </dt>
                          <dd className="text-slate-800">
                            {label(order.refundProvider)}
                          </dd>
                        </div>
                      )}
                      {order.providerRefundId && (
                        <div>
                          <dt className="text-xs text-slate-500">
                            Refund reference
                          </dt>
                          <dd className="break-all text-slate-800">
                            {order.providerRefundId}
                          </dd>
                        </div>
                      )}
                      {order.refundAttemptedAt && (
                        <div>
                          <dt className="text-xs text-slate-500">
                            Last refund attempt
                          </dt>
                          <dd className="text-slate-800">
                            {formatDate(order.refundAttemptedAt)}
                          </dd>
                        </div>
                      )}
                      {order.refundFailureReason && (
                        <div>
                          <dt className="text-xs text-slate-500">
                            Refund issue
                          </dt>
                          <dd className="text-rose-700">
                            {order.refundFailureReason}
                          </dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-sm text-slate-500">
                      This order has not been cancelled.
                      {order.refundStatus &&
                        order.refundStatus !== "NOT_REQUIRED" &&
                        ` Refund status: ${label(order.refundStatus)}.`}
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

AdminOrderDetailsModal.propTypes = {
  orderId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AdminOrderDetailsModal;
