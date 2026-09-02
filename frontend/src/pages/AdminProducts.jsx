import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "https://stylekart-7x1q.onrender.com/api/products";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch products");
      }

      setProducts(data.products || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete product");
      }

      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== id),
      );

      setMessage("Product deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h4>Loading products...</h4>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 mb-5 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Product Management</h2>
          <p className="text-muted mb-0">Manage StyleKart products</p>
        </div>

        <Link to="/admin/products/add" className="btn btn-primary">
          + Add Product
        </Link>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
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
                          width="70"
                          height="90"
                          style={{
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      </td>

                      <td className="fw-semibold">{product.id}</td>

                      <td>
                        <div className="fw-semibold">{product.item_name}</div>
                        <small className="text-muted">{product.company}</small>
                      </td>

                      <td>
                        <span className="badge text-bg-secondary">
                          {product.category}
                        </span>
                      </td>

                      <td>
                        <div className="fw-semibold">
                          ₹{product.current_price}
                        </div>

                        <small className="text-muted text-decoration-line-through">
                          ₹{product.original_price}
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
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
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
      </div>

      <div className="mt-3 text-muted">
        Total Products: <strong>{products.length}</strong>
      </div>
    </div>
  );
};

export default AdminProducts;
