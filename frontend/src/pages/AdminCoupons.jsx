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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-500">
            Admin operations
          </p>
          <h1 className="text-2xl font-black text-slate-950">Coupons</h1>
        </div>
        <Link
          to="/admin"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
        >
          Back to dashboard
        </Link>
      </div>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}
      <form
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={createCoupon}
      >
        <h2 className="text-lg font-black text-slate-950">Create coupon</h2>
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Code
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                name="code"
                value={form.code}
                onChange={updateForm}
                required
              />
            </label>
          </div>
          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Minimum amount
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                type="number"
                min="0"
                name="minimumAmount"
                value={form.minimumAmount}
                onChange={updateForm}
              />
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Type
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                name="discountType"
                value={form.discountType}
                onChange={updateForm}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </select>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Discount
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                type="number"
                min="1"
                name="discountValue"
                value={form.discountValue}
                onChange={updateForm}
              />
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Usage limit
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                type="number"
                min="1"
                name="usageLimit"
                value={form.usageLimit}
                onChange={updateForm}
              />
            </label>
          </div>
          <div className="md:col-span-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Maximum discount
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                type="number"
                min="0"
                name="maximumDiscount"
                value={form.maximumDiscount}
                onChange={updateForm}
              />
            </label>
          </div>
          <div className="md:col-span-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Expiry date
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                type="datetime-local"
                name="expiryDate"
                value={form.expiryDate}
                onChange={updateForm}
                required
              />
            </label>
          </div>
        </div>
        <button
          className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600"
          type="submit"
        >
          Create coupon
        </button>
      </form>
      <div className="grid divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {coupons.map((coupon) => (
          <div
            className="flex items-center justify-between gap-3 bg-white px-4 py-3"
            key={coupon._id}
          >
            <div>
              <strong>{coupon.code}</strong>
              <div className="text-xs text-slate-500">
                {coupon.discountType === "PERCENTAGE"
                  ? `${coupon.discountValue}%`
                  : `₹${coupon.discountValue}`}{" "}
                discount · {coupon.usedCount}/{coupon.usageLimit} used · expires{" "}
                {new Date(coupon.expiryDate).toLocaleDateString("en-IN")}
              </div>
            </div>
            {coupon.active ? (
              <button
                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50"
                type="button"
                onClick={() => deactivateCoupon(coupon._id)}
              >
                Deactivate
              </button>
            ) : (
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                Inactive
              </span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
};

export default AdminCoupons;
