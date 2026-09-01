import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://stylekart-7x1q.onrender.com/api/products";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: "",
    category: "men",
    company: "",
    item_name: "",
    description: "",
    image: "",
    original_price: "",
    current_price: "",
    discount_percentage: "",
    return_period: "",
    delivery_date: "",
    stock: "",
    ratingStars: "",
    ratingCount: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch product");
        }

        const product = data.product;

        setFormData({
          id: product.id || "",
          category: product.category || "men",
          company: product.company || "",
          item_name: product.item_name || "",
          description: product.description || "",
          image: product.image || "",
          original_price: product.original_price || "",
          current_price: product.current_price || "",
          discount_percentage: product.discount_percentage || "",
          return_period: product.return_period || "",
          delivery_date: product.delivery_date || "",
          stock: product.stock || "",
          ratingStars: product.rating?.stars || "",
          ratingCount: product.rating?.count || "",
        });
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update product
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const product = {
        id: formData.id,
        category: formData.category,
        company: formData.company,
        item_name: formData.item_name,
        description: formData.description,
        image: formData.image,
        original_price: Number(formData.original_price),
        current_price: Number(formData.current_price),
        discount_percentage: Number(formData.discount_percentage),
        return_period: Number(formData.return_period),
        delivery_date: formData.delivery_date,
        stock: Number(formData.stock),
        rating: {
          stars: Number(formData.ratingStars),
          count: Number(formData.ratingCount),
        },
      };

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      setMessage("Product updated successfully!");

      setTimeout(() => {
        navigate("/admin/products");
      }, 1000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>

        <p className="mt-2">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <h2 className="mb-4">Edit Product</h2>

      {message && (
        <div
          className={`alert ${
            message.includes("successfully")
              ? "alert-success"
              : "alert-danger"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Product ID */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Product ID</label>

            <input
              type="text"
              name="id"
              className="form-control"
              value={formData.id}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Category</label>

            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kids">Kids</option>
              <option value="beauty">Beauty</option>
            </select>
          </div>

          {/* Company */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Company</label>

            <input
              type="text"
              name="company"
              className="form-control"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </div>

          {/* Product Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Product Name</label>

            <input
              type="text"
              name="item_name"
              className="form-control"
              value={formData.item_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="col-12 mb-3">
            <label className="form-label">Description</label>

            <textarea
              name="description"
              className="form-control"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Image */}
          <div className="col-12 mb-3">
            <label className="form-label">Image Path</label>

            <input
              type="text"
              name="image"
              className="form-control"
              placeholder="images/men6.jpg"
              value={formData.image}
              onChange={handleChange}
              required
            />
          </div>

          {/* Original Price */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Original Price</label>

            <input
              type="number"
              name="original_price"
              className="form-control"
              value={formData.original_price}
              onChange={handleChange}
              required
            />
          </div>

          {/* Current Price */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Current Price</label>

            <input
              type="number"
              name="current_price"
              className="form-control"
              value={formData.current_price}
              onChange={handleChange}
              required
            />
          </div>

          {/* Discount */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Discount %</label>

            <input
              type="number"
              name="discount_percentage"
              className="form-control"
              value={formData.discount_percentage}
              onChange={handleChange}
              required
            />
          </div>

          {/* Return Period */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Return Period</label>

            <input
              type="number"
              name="return_period"
              className="form-control"
              value={formData.return_period}
              onChange={handleChange}
              required
            />
          </div>

          {/* Delivery */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Delivery Date</label>

            <input
              type="text"
              name="delivery_date"
              className="form-control"
              value={formData.delivery_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Stock */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Stock</label>

            <input
              type="number"
              name="stock"
              className="form-control"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>

          {/* Rating Stars */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Rating Stars</label>

            <input
              type="number"
              step="0.1"
              name="ratingStars"
              className="form-control"
              value={formData.ratingStars}
              onChange={handleChange}
              required
            />
          </div>

          {/* Rating Count */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Rating Count</label>

            <input
              type="number"
              name="ratingCount"
              className="form-control"
              value={formData.ratingCount}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? "Updating Product..." : "Update Product"}
        </button>

        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={() => navigate("/admin/products")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditProduct;