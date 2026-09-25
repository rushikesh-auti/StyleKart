import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { clearAdminSession } from "../store/adminAuthSlice";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const admin = useSelector((store) => store.adminAuth?.admin);

  const handleLogout = () => {
    dispatch(clearAdminSession());
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted mb-0">
            Welcome back{admin?.name ? `, ${admin.name}` : ""}. Manage your
            StyleKart store from here.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 fw-semibold">Products</h2>
              <p className="text-muted">
                Add, edit, delete, and manage products in your StyleKart
                catalog.
              </p>
              <Link to="/admin/products" className="btn btn-dark">
                Manage Products
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 fw-semibold">Coupons</h2>
              <p className="text-muted">
                Create, review, and deactivate promotional coupon codes.
              </p>
              <Link to="/admin/coupons" className="btn btn-outline-dark">
                Manage Coupons
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 fw-semibold">Add Product</h2>
              <p className="text-muted">
                Add a new fashion or beauty product to the StyleKart catalog.
              </p>
              <Link to="/admin/products/add" className="btn btn-outline-dark">
                Add Product
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 fw-semibold">Orders</h2>
              <p className="text-muted">
                View and manage customer orders from the admin panel.
              </p>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-5">
        <h2 className="h3 fw-semibold mb-3">Quick Actions</h2>
        <div className="list-group shadow-sm">
          <Link
            to="/admin/products"
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          >
            <span>View all products</span>
            <span aria-hidden="true">-&gt;</span>
          </Link>
          <Link
            to="/admin/products/add"
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          >
            <span>Add a new product</span>
            <span aria-hidden="true">-&gt;</span>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;
