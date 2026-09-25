import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { adminFetch } from "../utils/adminApi";

const initialForm = {
  code: "",
  minimumAmount: 0,
  discountType: "PERCENTAGE",
  discountValue: 10,
  maximumDiscount: 500,
  expiryDate: "",
  usageLimit: 100,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCoupons = async () => {
    const response = await adminFetch("/coupons");
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Unable to load coupons.");
    setCoupons(data.coupons || []);
  };

  useEffect(() => {
    loadCoupons().catch((requestError) => setError(requestError.message));
  }, []);

  const updateForm = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const createCoupon = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      const response = await adminFetch("/coupons", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to create coupon.");
      setForm(initialForm);
      setMessage("Coupon created.");
      await loadCoupons();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deactivateCoupon = async (id) => {
    try {
      const response = await adminFetch(`/coupons/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to deactivate coupon.");
      setCoupons((currentCoupons) =>
        currentCoupons.map((coupon) =>
          coupon._id === id ? data.coupon : coupon,
        ),
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-muted mb-1">Admin operations</p>
          <h1 className="h3 mb-0">Coupons</h1>
        </div>
        <Link to="/admin" className="btn btn-outline-dark">
          Back to dashboard
        </Link>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <form
        className="card border-0 shadow-sm p-4 mb-4"
        onSubmit={createCoupon}
      >
        <h2 className="h5">Create coupon</h2>
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">
              Code
              <input
                className="form-control"
                name="code"
                value={form.code}
                onChange={updateForm}
                required
              />
            </label>
          </div>
          <div className="col-md-3">
            <label className="form-label">
              Minimum amount
              <input
                className="form-control"
                type="number"
                min="0"
                name="minimumAmount"
                value={form.minimumAmount}
                onChange={updateForm}
              />
            </label>
          </div>
          <div className="col-md-2">
            <label className="form-label">
              Type
              <select
                className="form-select"
                name="discountType"
                value={form.discountType}
                onChange={updateForm}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </select>
            </label>
          </div>
          <div className="col-md-2">
            <label className="form-label">
              Discount
              <input
                className="form-control"
                type="number"
                min="1"
                name="discountValue"
                value={form.discountValue}
                onChange={updateForm}
              />
            </label>
          </div>
          <div className="col-md-2">
            <label className="form-label">
              Usage limit
              <input
                className="form-control"
                type="number"
                min="1"
                name="usageLimit"
                value={form.usageLimit}
                onChange={updateForm}
              />
            </label>
          </div>
          <div className="col-md-4">
            <label className="form-label">
              Maximum discount
              <input
                className="form-control"
                type="number"
                min="0"
                name="maximumDiscount"
                value={form.maximumDiscount}
                onChange={updateForm}
              />
            </label>
          </div>
          <div className="col-md-4">
            <label className="form-label">
              Expiry date
              <input
                className="form-control"
                type="datetime-local"
                name="expiryDate"
                value={form.expiryDate}
                onChange={updateForm}
                required
              />
            </label>
          </div>
        </div>
        <button className="btn btn-dark mt-4" type="submit">
          Create coupon
        </button>
      </form>
      <div className="list-group">
        {coupons.map((coupon) => (
          <div
            className="list-group-item d-flex justify-content-between align-items-center gap-3"
            key={coupon._id}
          >
            <div>
              <strong>{coupon.code}</strong>
              <div className="text-muted small">
                {coupon.discountType === "PERCENTAGE"
                  ? `${coupon.discountValue}%`
                  : `₹${coupon.discountValue}`}{" "}
                discount · {coupon.usedCount}/{coupon.usageLimit} used · expires{" "}
                {new Date(coupon.expiryDate).toLocaleDateString("en-IN")}
              </div>
            </div>
            {coupon.active ? (
              <button
                className="btn btn-sm btn-outline-danger"
                type="button"
                onClick={() => deactivateCoupon(coupon._id)}
              >
                Deactivate
              </button>
            ) : (
              <span className="badge text-bg-secondary">Inactive</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
};

export default AdminCoupons;
