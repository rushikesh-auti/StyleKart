import { useEffect, useState } from "react";

const API_URL = "https://stylekart-7x1q.onrender.com/api/products";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="container mt-5">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Product Management</h2>

        <button className="btn btn-primary">
          + Add Product
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
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
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <img
                    src={`/${product.image}`}
                    alt={product.item_name}
                    width="60"
                    height="70"
                    style={{ objectFit: "cover" }}
                  />
                </td>

                <td>{product.id}</td>

                <td>
                  <strong>{product.company}</strong>
                  <br />
                  <small>{product.item_name}</small>
                </td>

                <td>{product.category}</td>

                <td>₹{product.current_price}</td>

                <td>{product.stock}</td>

                <td>
                  <button className="btn btn-sm btn-warning me-2">
                    Edit
                  </button>

                  <button className="btn btn-sm btn-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;