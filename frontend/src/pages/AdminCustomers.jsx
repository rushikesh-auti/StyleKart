import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../utils/adminApi";

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      const query = search.trim()
        ? `?search=${encodeURIComponent(search.trim())}`
        : "";
      const response = await adminFetch(`/admin/customers${query}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load customers.");
      setCustomers(data.customers || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const loadInitialCustomers = async () => {
      try {
        setLoading(true);
        const response = await adminFetch("/admin/customers");
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load customers.");
        setCustomers(data.customers || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitialCustomers();
  }, []);
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-500">
            Admin operations
          </p>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
            Customers
          </h1>
        </div>
        <Link
          to="/admin"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
        >
          Dashboard
        </Link>
      </div>
      <div className="mb-5 flex gap-2">
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, or mobile"
        />
        <button
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-brand-600"
          onClick={load}
        >
          Search
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
                <th>Customer</th>
                <th>Mobile</th>
                <th>Joined</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <strong>{customer.name}</strong>
                      <br />
                      <small className="text-slate-500">{customer.email}</small>
                    </td>
                    <td>{customer.mobile || "—"}</td>
                    <td>
                      {new Date(customer.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="text-right">{customer.orderCount}</td>
                    <td className="text-right">
                      ₹{customer.totalSpent.toLocaleString("en-IN")}
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
export default AdminCustomers;
