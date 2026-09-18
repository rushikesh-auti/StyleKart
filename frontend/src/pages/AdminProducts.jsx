import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { clearAdminSession } from "../store/adminAuthSlice";
import { adminFetch } from "../utils/adminApi";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await adminFetch("/products");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch products");
        }

        setProducts(data.products || []);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await adminFetch(`/products/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete product");
      }

      setProducts((previous) =>
        previous.filter((product) => product.id !== id),
      );
      setMessage("Product deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete product");
    }
  };

  const handleLogout = () => {
    dispatch(clearAdminSession());
    navigate("/admin/login", { replace: true });
  };

  if (loading) {
    return (
      <main className="container py-5 text-center">
        <h1 className="h4">Loading products...</h1>
      </main>
    );
  }

  return (
    <main className="container-fluid py-5 px-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Admin Product Management</h1>
          <p className="text-muted mb-0">Manage StyleKart products</p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin" className="btn btn-outline-secondary">
            Dashboard
          </Link>
          <Link to="/admin/products/add" className="btn btn-primary">
            Add Product
          </Link>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Image</th>
                <th>ID</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img
                        src={`/${product.image}`}
                        alt={product.item_name}
                        width="60"
                        height="75"
                        style={{ objectFit: "cover", borderRadius: "6px" }}
                      />
                    </td>
                    <td>
                      <strong>{product.id}</strong>
                    </td>
                    <td>
                      <strong>{product.company}</strong>
                      <br />
                      <small className="text-muted">{product.item_name}</small>
                    </td>
                    <td>
                      <span className="badge text-bg-secondary">
                        {product.category}
                      </span>
                    </td>
                    <td>
                      <strong>Rs. {product.current_price}</strong>
                      <br />
                      <small className="text-muted text-decoration-line-through">
                        Rs. {product.original_price}
                      </small>
                    </td>
                    <td>
                      <span
                        className={
                          product.stock > 0
                            ? "badge text-bg-success"
                            : "badge text-bg-danger"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="btn btn-sm btn-warning"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-muted">
        Total Products: <strong>{products.length}</strong>
      </p>
    </main>
  );
};

export default AdminProducts;
