import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../utils/adminApi";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const label = (value) => String(value || "").replaceAll("_", " ");

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await adminFetch("/admin/dashboard");
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load dashboard.");
        setData(result);
      } catch (requestError) {
        setError(requestError.message);
      }
    };
    load();
  }, []);

  if (error) return <main className="container py-5"><div className="alert alert-danger">{error}</div></main>;
  if (!data) return <main className="container py-5 text-center"><h1 className="h4">Loading dashboard...</h1></main>;

  const cards = [
    ["Total Revenue", money(data.metrics.totalRevenue), "success"],
    ["Total Orders", data.metrics.totalOrders, "primary"],
    ["Customers", data.metrics.totalCustomers, "info"],
    ["Products", data.metrics.totalProducts, "dark"],
    ["Pending Orders", data.metrics.pendingOrders, "warning"],
    ["Low Stock", data.metrics.lowStockCount, "danger"],
  ];

  return <main className="container py-5">
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"><div><p className="text-muted mb-1">Admin operations</p><h1 className="h2 fw-bold mb-1">Store dashboard</h1><p className="text-muted mb-0">Monitor sales, stock, customers, and fulfilment.</p></div><div className="d-flex flex-wrap gap-2"><Link to="/admin/orders" className="btn btn-dark">Manage Orders</Link><Link to="/admin/products/add" className="btn btn-outline-dark">Add Product</Link></div></div>
    <div className="row g-3 mb-5">{cards.map(([title, value, tone]) => <div className="col-6 col-lg-4" key={title}><div className="card h-100 border-0 shadow-sm"><div className="card-body"><p className="text-muted small text-uppercase fw-bold mb-2">{title}</p><p className={`display-6 fw-bold text-${tone} mb-0`}>{value}</p></div></div></div>)}</div>
    <div className="row g-4"><section className="col-lg-7"><div className="card border-0 shadow-sm h-100"><div className="card-body p-4"><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h5 mb-0">Recent orders</h2><Link to="/admin/orders" className="small">View all</Link></div><div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="text-end">Amount</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order._id}><td>{order.orderNumber}</td><td>{order.user?.name || "Deleted user"}</td><td><span className="badge text-bg-secondary">{label(order.orderStatus)}</span></td><td className="text-end">{money(order.totalAmount)}</td></tr>)}</tbody></table></div></div></div></section><section className="col-lg-5"><div className="card border-0 shadow-sm h-100"><div className="card-body p-4"><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h5 mb-0">Low stock</h2><Link to="/admin/inventory" className="small">Open inventory</Link></div>{data.lowStockProducts.length ? <div className="list-group list-group-flush">{data.lowStockProducts.map((product) => <div className="list-group-item px-0 d-flex justify-content-between align-items-center" key={product.id}><span><strong>{product.company}</strong><br /><small className="text-muted">{product.item_name}</small></span><span className={product.stock === 0 ? "badge text-bg-danger" : "badge text-bg-warning"}>{product.stock} left</span></div>)}</div> : <p className="text-muted mb-0">All products have healthy stock.</p>}</div></div></section></div>
    <section className="mt-4 d-flex flex-wrap gap-2"><Link to="/admin/products" className="btn btn-outline-dark">Products</Link><Link to="/admin/customers" className="btn btn-outline-dark">Customers</Link><Link to="/admin/coupons" className="btn btn-outline-dark">Coupons</Link></section>
  </main>;
};

export default AdminDashboard;
