import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../utils/adminApi";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const label = (value) => String(value || "").replaceAll("_", " ");

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/admin/dashboard")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Unable to load dashboard.");
        setData(result);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  if (error)
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      </main>
    );
  if (!data)
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-sm font-bold text-slate-500">
        Loading dashboard…
      </main>
    );

  const cards = [
    ["Total Revenue", money(data.metrics.totalRevenue)],
    ["Total Orders", data.metrics.totalOrders],
    ["Customers", data.metrics.totalCustomers],
    ["Products", data.metrics.totalProducts],
    ["Pending Orders", data.metrics.pendingOrders],
    ["Low Stock", data.metrics.lowStockCount],
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
            Admin operations
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
            Store dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor sales, stock, customers and fulfilment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/support"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700"
          >
            Support inbox
          </Link>
          <Link
            to="/admin/orders"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600"
          >
            Manage orders
          </Link>
          <Link
            to="/admin/products/add"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Add product
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([title, value]) => (
          <article
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              {title}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="text-xs font-black text-brand-700"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm [&_td]:border-t [&_td]:border-slate-100 [&_td]:px-3 [&_td]:py-3 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:uppercase [&_th]:text-slate-400">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.user?.name || "Deleted user"}</td>
                    <td>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                        {label(order.orderStatus)}
                      </span>
                    </td>
                    <td className="text-right font-bold">
                      {money(order.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Low stock</h2>
            <Link
              to="/admin/inventory"
              className="text-xs font-black text-brand-700"
            >
              Inventory
            </Link>
          </div>
          {data.lowStockProducts.length ? (
            <div className="divide-y divide-slate-100">
              {data.lowStockProducts.map((product) => (
                <div
                  className="flex items-center justify-between gap-3 py-3"
                  key={product.id}
                >
                  <span>
                    <strong className="text-sm text-slate-950">
                      {product.company}
                    </strong>
                    <br />
                    <small className="text-slate-500">
                      {product.item_name}
                    </small>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${product.stock === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}
                  >
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              All products have healthy stock.
            </p>
          )}
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/admin/support"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700"
        >
          Support inbox
        </Link>
        <Link
          to="/admin/products"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700"
        >
          Products
        </Link>
        <Link
          to="/admin/customers"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700"
        >
          Customers
        </Link>
        <Link
          to="/admin/coupons"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700"
        >
          Coupons
        </Link>
      </div>
    </main>
  );
};
export default AdminDashboard;
