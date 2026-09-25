import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { bagActions } from "../store/bagSlice";
import { getCartSummary } from "../utils/cartCalculations";
import { userFetch } from "../utils/userApi";
import "../styles/checkout.css";

const steps = ["Cart", "Address", "Delivery", "Payment", "Confirmation"];

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const bagEntries = useSelector((state) => state.bag || []);
  const products = useSelector((state) => state.items || []);
  const summary = getCartSummary(bagEntries, products);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("COD");
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
        const savedAddresses = data.addresses || [];
        setAddresses(savedAddresses);
        setSelectedAddressId(
          savedAddresses.find((address) => address.isDefault)?._id ||
            savedAddresses[0]?._id ||
            "",
        );
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const goNext = () => {
    setError("");
    if (step === 1 && summary.lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (step === 2 && !selectedAddressId) {
      setError("Select a delivery address to continue.");
      return;
    }
    setStep((currentStep) => Math.min(currentStep + 1, 4));
  };

  const placeOrder = async () => {
    try {
      setSubmitting(true);
      setError("");
      const data = await userFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
          couponCode,
          items: summary.lines.map(({ entry, quantity }) => ({
            productId: entry.productId,
            quantity,
            selectedSize: entry.selectedSize,
            selectedColor: entry.selectedColor,
          })),
        }),
      });

      dispatch(bagActions.clearBag());
      navigate(`/orders/${data.order._id}?confirmed=1`);
    } catch (requestError) {
      setError(requestError.message);
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
      <main className="checkout-page">
        <p>Loading checkout...</p>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <p className="home-eyebrow">Secure checkout</p>
        <h1>Complete your order</h1>
        <div className="checkout-steps" aria-label="Checkout progress">
          {steps.map((label, index) => (
            <span className={index + 1 <= step ? "active" : ""} key={label}>
              {index + 1}. {label}
            </span>
          ))}
        </div>
      </header>

      {error && (
        <p className="checkout-error" role="alert">
          {error}
        </p>
      )}

      <section className="checkout-layout">
        <div className="checkout-panel">
          {step === 1 && (
            <>
              <h2>Review cart</h2>
              {summary.lines.map(({ entry, product, quantity }) => (
                <div className="checkout-line" key={entry.key}>
                  <img src={product.image} alt="" />
                  <div>
                    <strong>{product.item_name}</strong>
                    <p>
                      Qty {quantity}
                      {entry.selectedSize && ` · Size ${entry.selectedSize}`}
                      {entry.selectedColor && ` · ${entry.selectedColor}`}
                    </p>
                  </div>
                  <strong>
                    ₹
                    {(product.current_price * quantity).toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}
              <form className="checkout-coupon" onSubmit={applyCoupon}>
                <label htmlFor="coupon-code">Coupon code</label>
                <div>
                  <input
                    id="coupon-code"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      setCouponDiscount(0);
                      setCouponMessage("");
                    }}
                    placeholder="Enter code"
                  />
                  <button type="submit" disabled={couponLoading || !couponCode}>
                    {couponLoading ? "Checking..." : "Apply"}
                  </button>
                </div>
                {couponMessage && (
                  <p
                    className={
                      couponDiscount ? "coupon-success" : "coupon-error"
                    }
                  >
                    {couponMessage}
                  </p>
                )}
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="checkout-panel-heading">
                <h2>Delivery address</h2>
                <Link to="/addresses">Manage addresses</Link>
              </div>
              {addresses.length === 0 ? (
                <p>
                  No saved address yet.{" "}
                  <Link to="/addresses">Add one before checkout.</Link>
                </p>
              ) : (
                <div className="address-choice-list">
                  {addresses.map((address) => (
                    <label
                      className={`address-choice ${selectedAddressId === address._id ? "selected" : ""}`}
                      key={address._id}
                    >
                      <input
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
              <h2>Delivery method</h2>
              <label className="delivery-choice selected">
                <input type="radio" checked readOnly />{" "}
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
              <h2>Payment method</h2>
              <label className="delivery-choice selected">
                <input
                  type="radio"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />{" "}
                <span>
                  <strong>Cash on Delivery</strong>
                  <br />
                  Pay when your order arrives.
                </span>
              </label>
              <label className="delivery-choice disabled">
                <input type="radio" disabled />{" "}
                <span>
                  <strong>Online payment</strong>
                  <br />
                  Coming soon. No payment will be processed online yet.
                </span>
              </label>
            </>
          )}

          <div className="checkout-actions">
            {step > 1 && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setStep((currentStep) => currentStep - 1)}
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" className="primary-button" onClick={goNext}>
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={submitting}
                onClick={placeOrder}
              >
                {submitting ? "Placing order..." : "Place order"}
              </button>
            )}
          </div>
        </div>

        <aside className="checkout-summary">
          <h2>Price details</h2>
          <p>
            <span>MRP</span>
            <strong>₹{summary.totalMrp.toLocaleString("en-IN")}</strong>
          </p>
          {couponDiscount > 0 && (
            <p>
              <span>Coupon discount</span>
              <strong className="discount">
                -₹{couponDiscount.toLocaleString("en-IN")}
              </strong>
            </p>
          )}
          <p>
            <span>Discount</span>
            <strong className="discount">
              -₹{summary.discount.toLocaleString("en-IN")}
            </strong>
          </p>
          <p>
            <span>Delivery</span>
            <strong>
              {summary.delivery ? `₹${summary.delivery}` : "FREE"}
            </strong>
          </p>
          <hr />
          <p className="total">
            <span>Total</span>
            <strong>
              ₹{(summary.totalAmount - couponDiscount).toLocaleString("en-IN")}
            </strong>
          </p>
        </aside>
      </section>
    </main>
  );
};

export default Checkout;
