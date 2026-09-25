import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../utils/adminApi";

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]); const [search, setSearch] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const load = async () => { try { setLoading(true); const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""; const response = await adminFetch(`/admin/customers${query}`); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to load customers."); setCustomers(data.customers || []); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } };
  useEffect(() => {
    const loadInitialCustomers = async () => { try { setLoading(true); const response = await adminFetch("/admin/customers"); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to load customers."); setCustomers(data.customers || []); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } };
    loadInitialCustomers();
  }, []);
  return <main className="container py-5"><div className="d-flex justify-content-between align-items-center mb-4"><div><p className="text-muted mb-1">Admin operations</p><h1 className="h2 fw-bold mb-0">Customers</h1></div><Link to="/admin" className="btn btn-outline-dark">Dashboard</Link></div><div className="input-group mb-3"><input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or mobile" /><button className="btn btn-dark" onClick={load}>Search</button></div>{error && <div className="alert alert-danger">{error}</div>}<div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>Customer</th><th>Mobile</th><th>Joined</th><th className="text-end">Orders</th><th className="text-end">Total spent</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className="text-center py-5">Loading customers...</td></tr> : customers.length === 0 ? <tr><td colSpan="5" className="text-center py-5">No customers found.</td></tr> : customers.map((customer) => <tr key={customer._id}><td><strong>{customer.name}</strong><br /><small className="text-muted">{customer.email}</small></td><td>{customer.mobile || "—"}</td><td>{new Date(customer.createdAt).toLocaleDateString("en-IN")}</td><td className="text-end">{customer.orderCount}</td><td className="text-end">₹{customer.totalSpent.toLocaleString("en-IN")}</td></tr>)}</tbody></table></div></div></main>;
};
export default AdminCustomers;
