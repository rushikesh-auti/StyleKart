import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "https://stylekart-7x1q.onrender.com/api/products";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch products"
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Delete product
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete product"
        );
      }

      // Remove deleted product from UI
      setProducts((prevProducts) =>
        prevProducts.filter(
          (product) => product.id !== id
        )
      );

      setMessage("Product deleted successfully.");
    } catch (error) {
      setError(error.message);
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
    <div className="container-fluid mt-5 mb-5 px-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Admin Product Management
          </h2>

          <p className="text-muted mb-0">
            Manage StyleKart products
          </p>
        </div>

        <Link
          to="/admin/products/add"
          className="btn btn-primary"
        >
          + Add Product
        </Link>
      </div>

      {/* Success Message */}
      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">

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
                    <td
                      colSpan="7"
                      className="text-center py-5"
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>

                      {/* Image */}
                      <td>
                        <img
                          src={`/${product.image}`}
                          alt={product.item_name}
                          width="60"
                          height="75"
                          style={{
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      </td>

                      {/* ID */}
                      <td>
                        <strong>{product.id}</strong>
                      </td>

                      {/* Product */}
                      <td>
                        <strong>
                          {product.company}
                        </strong>

                        <br />

                        <small className="text-muted">
                          {product.item_name}
                        </small>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="badge text-bg-secondary">
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td>
                        <strong>
                          ₹{product.current_price}
                        </strong>

                        <br />

                        <small
                          className="text-muted"
                          style={{
                            textDecoration: "line-through",
                          }}
                        >
                          ₹{product.original_price}
                        </small>
                      </td>

                      {/* Stock */}
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

                      {/* Actions */}
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
                            onClick={() =>
                              handleDelete(product.id)
                            }
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

      {/* Product Count */}
      <div className="mt-3 text-muted">
        Total Products:{" "}
        <strong>{products.length}</strong>
      </div>

    </div>
  );
};

export default AdminProducts;