import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../utils/adminApi";

const statusNames = [
  "",
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];
const transitions = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: "RETURN_REQUESTED",
  RETURN_REQUESTED: "RETURNED",
  RETURNED: "REFUNDED",
};
const label = (value) => String(value || "").replaceAll("_", " ");

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) query.set("status", status);
      if (search.trim()) query.set("search", search.trim());
      const response = await adminFetch(`/admin/orders?${query}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load orders.");
      setOrders(data.orders || []);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const loadInitialOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const query = new URLSearchParams({ page: String(page), limit: "20" });
        if (status) query.set("status", status);
        const response = await adminFetch(`/admin/orders?${query}`);
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load orders.");
        setOrders(data.orders || []);
        setPagination(data.pagination);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitialOrders();
  }, [page, status]);
  const update = async (order, orderStatus) => {
    try {
      const response = await adminFetch(`/admin/orders/${order._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ orderStatus }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to update order.");
      setOrders((current) =>
        current.map((item) =>
          item._id === order._id ? { ...item, ...data.order } : item,
        ),
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-500">
            Admin operations
          </p>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
            Orders
          </h1>
        </div>
        <Link
          to="/admin"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
        >
          Dashboard
        </Link>
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number, name, or mobile"
          />
        </div>
        <div className="md:col-span-3">
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            {statusNames.map((item) => (
              <option value={item} key={item}>
                {item ? label(item) : "All statuses"}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <button
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-brand-600"
            onClick={() => {
              setPage(1);
              load();
            }}
          >
            Search
          </button>
        </div>
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
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      <br />
                      <small className="text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </small>
                    </td>
                    <td>
                      {order.user?.name || "Deleted user"}
                      <br />
                      <small className="text-slate-500">
                        {order.user?.email}
                      </small>
                    </td>
                    <td>
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      )}
                    </td>
                    <td>₹{order.totalAmount.toLocaleString("en-IN")}</td>
                    <td>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                        {label(order.orderStatus)}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {transitions[order.orderStatus] && (
                          <button
                            className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black text-white hover:bg-brand-600"
                            onClick={() =>
                              update(order, transitions[order.orderStatus])
                            }
                          >
                            {label(transitions[order.orderStatus])}
                          </button>
                        )}
                        {["PLACED", "CONFIRMED", "PROCESSING"].includes(
                          order.orderStatus,
                        ) && (
                          <button
                            className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50"
                            onClick={() => update(order, "CANCELLED")}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {pagination?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
            disabled={page === pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};
export default AdminOrders;
