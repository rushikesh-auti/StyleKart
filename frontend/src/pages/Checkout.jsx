import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaCreditCard, FaMoneyBillWave, FaShieldHalved } from "react-icons/fa6";

import { bagActions } from "../store/bagSlice";
import { getCartSummary } from "../utils/cartCalculations";
import { loadRazorpay } from "../utils/razorpay";
import { userFetch } from "../utils/userApi";

const steps = ["Cart", "Address", "Delivery", "Payment"];
const buttonPrimary =
  "rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60";
const buttonSecondary =
  "rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const bagEntries = useSelector((state) => state.bag || []);
  const products = useSelector((state) => state.items || []);
  const user = useSelector((state) => state.userAuth?.user);
  const summary = getCartSummary(bagEntries, products);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    userFetch("/addresses")
      .then((data) => {
        const saved = data.addresses || [];
        setAddresses(saved);
        setSelectedAddressId(
          saved.find((address) => address.isDefault)?._id ||
            saved[0]?._id ||
            "",
        );
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const requestItems = useMemo(
    () =>
      summary.lines.map(({ entry, quantity }) => ({
        productId: entry.productId,
        quantity,
        selectedSize: entry.selectedSize || "",
        selectedColor: entry.selectedColor || "",
      })),
    [summary.lines],
  );

  const invalidVariant = summary.lines.find(
    ({ entry, product }) =>
      ((product.sizes?.length || 0) > 0 &&
        !product.sizes.includes(entry.selectedSize)) ||
      ((product.colors?.length || 0) > 0 &&
        !product.colors.includes(entry.selectedColor)),
  );

  const goNext = () => {
    setError("");
    if (step === 1 && summary.lines.length === 0)
      return setError("Your cart is empty.");
    if (step === 1 && invalidVariant)
      return setError(
        `Choose the required size/color for ${invalidVariant.product.item_name} before checkout.`,
      );
    if (step === 2 && !selectedAddressId)
      return setError("Select a delivery address to continue.");
    setStep((current) => Math.min(current + 1, 4));
  };

  const completeOrder = (order) => {
    dispatch(bagActions.resetBag());
    navigate(`/orders/${order._id}?confirmed=1`);
  };

  const placeCodOrder = async () => {
    const data = await userFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        addressId: selectedAddressId,
        paymentMethod: "COD",
        couponCode,
        items: requestItems,
      }),
    });
    completeOrder(data.order);
  };

  const placeRazorpayOrder = async () => {
    await loadRazorpay();
    const paymentOrder = await userFetch("/payments/razorpay/order", {
      method: "POST",
      body: JSON.stringify({
        addressId: selectedAddressId,
        couponCode,
        items: requestItems,
      }),
    });

    await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "StyleKart",
        description: "Secure StyleKart order payment",
        order_id: paymentOrder.orderId,
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: "#db2777" },
        modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
        handler: async (response) => {
          try {
            const verification = await userFetch("/payments/razorpay/verify", {
              method: "POST",
              body: JSON.stringify(response),
            });
            completeOrder(verification.order);
            resolve();
          } catch (verificationError) {
            reject(verificationError);
          }
        },
      });
      checkout.on("payment.failed", (response) => {
        reject(
          new Error(
            response?.error?.description ||
              "Razorpay payment failed. Please try again.",
          ),
        );
      });
      checkout.open();
    });
  };

  const placeOrder = async () => {
    if (invalidVariant) {
      setError(
        `Choose the required size/color for ${invalidVariant.product.item_name} before checkout.`,
      );
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      if (paymentMethod === "RAZORPAY") await placeRazorpayOrder();
      else await placeCodOrder();
    } catch (requestError) {
      setError(requestError.message || "Unable to complete checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  const applyCoupon = async (event) => {
    event.preventDefault();
    try {
      setCouponLoading(true);
      setCouponMessage("");
      const data = await userFetch("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponCode, subtotal: summary.subtotal }),
      });
      setCouponCode(data.code);
      setCouponDiscount(data.discount || 0);
      setCouponMessage(
        `Coupon applied: save ₹${(data.discount || 0).toLocaleString("en-IN")}`,
      );
    } catch (requestError) {
      setCouponDiscount(0);
      setCouponMessage(requestError.message);
    } finally {
      setCouponLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-sm font-semibold text-slate-500">
        Loading checkout…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand-600">
          <FaShieldHalved /> Secure checkout
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
          Complete your order
        </h1>
        <div
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Checkout progress"
        >
          {steps.map((label, index) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${index + 1 <= step ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"}`}
            >
              {index + 1}. {label}
            </span>
          ))}
        </div>
      </header>

      {error && (
        <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      )}

      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {step === 1 && (
            <>
              <h2 className="mb-5 text-lg font-black text-slate-950">
                Review cart
              </h2>
              <div className="divide-y divide-slate-100">
                {summary.lines.map(({ entry, product, quantity }) => (
                  <div
                    className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-3 py-3"
                    key={entry.key}
                  >
                    <img
                      className="h-[78px] w-[62px] rounded-lg bg-slate-100 object-cover"
                      src={`/${String(product.image || "").replace(/^\/+/, "")}`}
                      alt=""
                    />
                    <div>
                      <strong className="text-sm text-slate-950">
                        {product.item_name}
                      </strong>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Qty {quantity}
                        {entry.selectedSize && ` · Size ${entry.selectedSize}`}
                        {entry.selectedColor && ` · ${entry.selectedColor}`}
                      </p>
                    </div>
                    <strong className="text-sm text-slate-950">
                      ₹
                      {(product.current_price * quantity).toLocaleString(
                        "en-IN",
                      )}
                    </strong>
                  </div>
                ))}
              </div>
              <form
                className="mt-6 border-t border-slate-100 pt-5"
                onSubmit={applyCoupon}
              >
                <label
                  htmlFor="coupon-code"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Coupon code
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon-code"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      setCouponDiscount(0);
                      setCouponMessage("");
                    }}
                    placeholder="Enter code"
                  />
                  <button
                    className="rounded-xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-60"
                    type="submit"
                    disabled={couponLoading || !couponCode}
                  >
                    {couponLoading ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponMessage && (
                  <p
                    className={`mt-2 text-sm font-bold ${couponDiscount ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {couponMessage}
                  </p>
                )}
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-5 flex items-start justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950">
                  Delivery address
                </h2>
                <Link
                  className="text-sm font-bold text-brand-700"
                  to="/addresses"
                >
                  Manage addresses
                </Link>
              </div>
              {addresses.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No saved address yet.{" "}
                  <Link className="font-bold text-brand-700" to="/addresses">
                    Add one before checkout.
                  </Link>
                </p>
              ) : (
                <div className="grid gap-3">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm leading-6 text-slate-700 ${selectedAddressId === address._id ? "border-brand-400 bg-brand-50" : "border-slate-300"}`}
                    >
                      <input
                        className="mt-1 accent-brand-600"
                        type="radio"
                        name="address"
                        checked={selectedAddressId === address._id}
                        onChange={() => setSelectedAddressId(address._id)}
                      />
                      <span>
                        <strong>
                          {address.fullName} · {address.addressType}
                        </strong>
                        <br />
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                        <br />
                        {address.city}, {address.state} - {address.pinCode}
                        <br />
                        Mobile: {address.mobile}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-5 text-lg font-black text-slate-950">
                Delivery method
              </h2>
              <label className="flex gap-3 rounded-xl border border-brand-300 bg-brand-50 p-4 text-sm leading-6 text-slate-700">
                <input
                  className="mt-1 accent-brand-600"
                  type="radio"
                  checked
                  readOnly
                />
                <span>
                  <strong>Standard delivery</strong>
                  <br />
                  Arrives in 3-5 business days ·{" "}
                  {summary.delivery === 0 ? "Free" : `₹${summary.delivery}`}
                </span>
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="mb-5 text-lg font-black text-slate-950">
                Payment method
              </h2>
              <div className="grid gap-3">
                <label
                  className={`flex cursor-pointer gap-4 rounded-2xl border p-4 ${paymentMethod === "RAZORPAY" ? "border-brand-400 bg-brand-50" : "border-slate-200"}`}
                >
                  <input
                    className="mt-1 accent-brand-600"
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "RAZORPAY"}
                    onChange={() => setPaymentMethod("RAZORPAY")}
                  />
                  <FaCreditCard className="mt-1 text-brand-600" />
                  <span className="text-sm leading-6 text-slate-600">
                    <strong className="block text-slate-950">
                      Pay securely with Razorpay
                    </strong>
                    UPI, cards, net banking and supported wallets through
                    Razorpay Checkout.
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer gap-4 rounded-2xl border p-4 ${paymentMethod === "COD" ? "border-brand-400 bg-brand-50" : "border-slate-200"}`}
                >
                  <input
                    className="mt-1 accent-brand-600"
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  <FaMoneyBillWave className="mt-1 text-emerald-600" />
                  <span className="text-sm leading-6 text-slate-600">
                    <strong className="block text-slate-950">
                      Cash on Delivery
                    </strong>
                    Pay when your order arrives.
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {step > 1 && (
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setStep((current) => current - 1)}
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" className={buttonPrimary} onClick={goNext}>
                Continue
              </button>
            ) : (
              <button
                type="button"
                className={buttonPrimary}
                disabled={submitting || !selectedAddressId}
                onClick={placeOrder}
              >
                {submitting
                  ? "Processing…"
                  : paymentMethod === "RAZORPAY"
                    ? "Pay with Razorpay"
                    : "Place COD Order"}
              </button>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="mb-5 text-lg font-black text-slate-950">
            Price details
          </h2>
          <div className="grid gap-3 text-sm text-slate-600">
            <p className="flex justify-between gap-4">
              <span>MRP</span>
              <strong className="text-slate-950">
                ₹{summary.totalMrp.toLocaleString("en-IN")}
              </strong>
            </p>
            <p className="flex justify-between gap-4">
              <span>Discount</span>
              <strong className="text-emerald-700">
                −₹{summary.discount.toLocaleString("en-IN")}
              </strong>
            </p>
            {couponDiscount > 0 && (
              <p className="flex justify-between gap-4">
                <span>Coupon</span>
                <strong className="text-emerald-700">
                  −₹{couponDiscount.toLocaleString("en-IN")}
                </strong>
              </p>
            )}
            <p className="flex justify-between gap-4">
              <span>Delivery</span>
              <strong className="text-slate-950">
                {summary.delivery ? `₹${summary.delivery}` : "FREE"}
              </strong>
            </p>
          </div>
          <hr className="my-4 border-slate-200" />
          <p className="flex justify-between gap-4 text-base font-black text-slate-950">
            <span>Total</span>
            <strong>
              ₹
              {Math.max(0, summary.totalAmount - couponDiscount).toLocaleString(
                "en-IN",
              )}
            </strong>
          </p>
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            Your payable amount is recalculated and verified on the server.
          </p>
        </aside>
      </section>
    </main>
  );
};

export default Checkout;
