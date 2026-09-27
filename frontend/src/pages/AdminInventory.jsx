import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../utils/adminApi";

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [threshold, setThreshold] = useState(5);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      const response = await adminFetch(
        `/admin/inventory/low-stock?threshold=${threshold}`,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load inventory.");
      setProducts(data.products || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const loadInitialInventory = async () => {
      try {
        setLoading(true);
        const response = await adminFetch(
          "/admin/inventory/low-stock?threshold=5",
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load inventory.");
        setProducts(data.products || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitialInventory();
  }, []);
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-500">
            Admin operations
          </p>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
            Low-stock inventory
          </h1>
        </div>
        <Link
          to="/admin"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
        >
          Dashboard
        </Link>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label htmlFor="threshold" className="font-semibold">
          Show stock at or below
        </label>
        <input
          id="threshold"
          className="w-24 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          type="number"
          min="0"
          max="100"
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
        />
        <button
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-brand-600"
          onClick={load}
        >
          Apply
        </button>
      </div>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm [&_td]:px-4 [&_td]:py-3 [&_tbody_tr]:border-b [&_tbody_tr]:border-slate-100">
            <thead className="bg-slate-950 text-left text-xs uppercase tracking-wider text-white [&_th]:px-4 [&_th]:py-3">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="text-right">Price</th>
                <th className="text-right">Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No low-stock products.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.company}</strong>
                      <br />
                      <small className="text-slate-500">
                        {product.item_name}
                      </small>
                    </td>
                    <td>{product.category}</td>
                    <td className="text-right">
                      ₹{product.current_price.toLocaleString("en-IN")}
                    </td>
                    <td className="text-right">
                      <span
                        className={
                          product.stock === 0
                            ? "inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700"
                            : "inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50"
                      >
                        Update stock
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};
export default AdminInventory;
