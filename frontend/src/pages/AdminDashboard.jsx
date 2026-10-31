import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBagShopping,
  FaBoxOpen,
  FaBoxesStacked,
  FaGauge,
  FaUsers,
} from "react-icons/fa6";
import { adminFetch } from "../utils/adminApi";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const label = (value) => String(value || "").replaceAll("_", " ");
const dayLabel = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

const TrendChart = ({ title, points, field, color, formatValue }) => {
  const maximum = Math.max(
    1,
    ...points.map((point) => Number(point[field] || 0)),
  );
  const chartPoints = points
    .map((point, index) => {
      const x =
        points.length < 2 ? 300 : 24 + (index * 552) / (points.length - 1);
      const y = 158 - (Number(point[field] || 0) / maximum) * 128;
      return `${x},${y}`;
    })
    .join(" ");
  const total = points.reduce(
    (sum, point) => sum + Number(point[field] || 0),
    0,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">Last 30 days by order date</p>
        </div>
        <p className="text-sm font-black text-slate-900">
          {formatValue(total)}
        </p>
      </div>
      {points.length ? (
        <>
          <svg
            viewBox="0 0 600 190"
            className="h-44 w-full overflow-visible"
            role="img"
            aria-label={`${title}, total ${formatValue(total)}, from ${dayLabel(points[0].date)} through ${dayLabel(points[points.length - 1].date)}`}
          >
            <line x1="24" y1="30" x2="576" y2="30" stroke="#e2e8f0" />
            <line x1="24" y1="94" x2="576" y2="94" stroke="#e2e8f0" />
            <line x1="24" y1="158" x2="576" y2="158" stroke="#e2e8f0" />
            <polyline
              fill="none"
              points={chartPoints}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          </svg>
          <div className="flex justify-between text-[11px] font-medium text-slate-400">
            <span>{dayLabel(points[0].date)}</span>
            <span>{dayLabel(points[points.length - 1].date)}</span>
          </div>
        </>
      ) : (
        <p className="py-12 text-center text-sm text-slate-500">
          No trend data for this period.
        </p>
      )}
    </section>
  );
};

TrendChart.propTypes = {
  title: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      revenue: PropTypes.number,
      orders: PropTypes.number,
    }),
  ).isRequired,
  field: PropTypes.oneOf(["revenue", "orders"]).isRequired,
  color: PropTypes.string.isRequired,
  formatValue: PropTypes.func.isRequired,
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await adminFetch("/admin/dashboard", {
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unable to load dashboard.");
        }
        setData(result);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to load dashboard.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadDashboard();
    return () => controller.abort();
  }, [retryCount]);

  if (loading && !data)
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div
          className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500"
          role="status"
        >
          Loading store dashboard...
        </div>
      </main>
    );
  if (error && !data)
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-rose-700" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Try again
          </button>
        </div>
      </main>
    );

  const cards = [
    {
      title: "Paid revenue",
      value: money(data.metrics.totalRevenue),
      description: "Collected, excluding cancelled and refunded orders",
      icon: FaGauge,
      to: "/admin/orders",
      accent: "bg-brand-50 text-brand-700",
    },
    {
      title: "Total orders",
      value: Number(data.metrics.totalOrders || 0).toLocaleString("en-IN"),
      description: "All orders",
      icon: FaBagShopping,
      to: "/admin/orders",
      accent: "bg-sky-50 text-sky-700",
    },
    {
      title: "Customers",
      value: Number(data.metrics.totalCustomers || 0).toLocaleString("en-IN"),
      description: "Registered customer accounts",
      icon: FaUsers,
      to: "/admin/customers",
      accent: "bg-violet-50 text-violet-700",
    },
    {
      title: "Products",
      value: Number(data.metrics.totalProducts || 0).toLocaleString("en-IN"),
      description: "Products in the catalog",
      icon: FaBoxOpen,
      to: "/admin/products",
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Pending orders",
      value: Number(data.metrics.pendingOrders || 0).toLocaleString("en-IN"),
      description: "Placed, confirmed, or processing",
      icon: FaBagShopping,
      to: "/admin/orders",
      accent: "bg-amber-50 text-amber-800",
    },
    {
      title: "Low stock",
      value: Number(data.metrics.lowStockCount || 0).toLocaleString("en-IN"),
      description: "Five or fewer units available",
      icon: FaBoxesStacked,
      to: "/admin/inventory",
      accent: "bg-orange-50 text-orange-800",
    },
    {
      title: "Out of stock",
      value: Number(data.metrics.outOfStockCount || 0).toLocaleString("en-IN"),
      description: "No active variant stock",
      icon: FaBoxesStacked,
      to: "/admin/inventory",
      accent: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <main className="px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">
            Store overview
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Store dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor paid sales, order activity, customers, and inventory from
            one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/products/add"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Add product
          </Link>
          <Link
            to="/admin/orders"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Review orders
          </Link>
        </div>
      </div>

      {error && (
        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 font-bold hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      <section
        aria-label="Store key metrics"
        className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map(({ title, value, description, icon: Icon, to, accent }) => (
          <Link
            key={title}
            to={to}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-slate-500">
                {title}
              </p>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accent}`}>
                <Icon aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {value}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </Link>
        ))}
      </section>

      <section className="mb-7 grid gap-4 xl:grid-cols-2">
        <TrendChart
          title="Revenue trend"
          points={data.revenueTrend || []}
          field="revenue"
          color="#db2777"
          formatValue={money}
        />
        <TrendChart
          title="Order trend"
          points={data.orderTrend || []}
          field="orders"
          color="#0f172a"
          formatValue={(value) => Number(value || 0).toLocaleString("en-IN")}
        />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
            <div>
              <h2 className="text-base font-black text-slate-950">Recent orders</h2>
              <p className="mt-1 text-xs text-slate-500">Latest activity across the store</p>
            </div>
            <Link
              to="/admin/orders"
              className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm [&_td]:border-t [&_td]:border-slate-100 [&_td]:px-3 [&_td]:py-3 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-400">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      No orders have been placed yet.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order._id} className="text-slate-700">
                      <td className="whitespace-nowrap font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="min-w-32">
                        {order.user?.name || "Deleted user"}
                      </td>
                      <td>
                        <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          {label(order.orderStatus)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-right font-bold">
                        {money(order.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">Inventory alerts</h2>
              <p className="mt-1 text-xs text-slate-500">Products needing attention</p>
            </div>
            <Link
              to="/admin/inventory"
              className="rounded-lg px-2 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              All stock
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
                    {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No products are at or below the low-stock threshold.
            </p>
          )}
        </section>
      </div>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-black text-slate-950">Best-selling products</h2>
            <p className="mt-1 text-xs text-slate-500">Units in paid, non-refunded orders</p>
          </div>
          {data.bestSellingProducts?.length ? (
            <ol className="divide-y divide-slate-100">
              {data.bestSellingProducts.map((product, index) => (
                <li
                  key={product.productId}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                    {product.name}
                  </span>
                  <span className="whitespace-nowrap text-xs font-bold text-slate-500">
                    {Number(product.quantitySold || 0).toLocaleString("en-IN")} sold
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No paid product sales to rank yet.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-black text-slate-950">Category performance</h2>
            <p className="mt-1 text-xs text-slate-500">
              Units sold by each product&apos;s current category
            </p>
          </div>
          {data.categoryPerformance?.length ? (
            <ul className="space-y-4">
              {data.categoryPerformance.map((category) => (
                <li key={category.category}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold capitalize text-slate-700">
                      {category.category}
                    </span>
                    <span className="font-bold text-slate-900">
                      {Number(category.quantitySold || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <progress
                    className="h-2 w-full accent-brand-600"
                    max={Math.max(
                      ...data.categoryPerformance.map((item) =>
                        Number(item.quantitySold || 0),
                      ),
                      1,
                    )}
                    value={Number(category.quantitySold || 0)}
                    aria-label={`${category.category} units sold`}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              Category performance will appear after paid sales.
            </p>
          )}
        </section>
      </section>
    </main>
  );
};
export default AdminDashboard;
