import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://stylekart-7x1q.onrender.com/api/products";

const AddProduct = () => {
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

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit product
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const product = {
        id: formData.id.trim(),
        category: formData.category,
        company: formData.company.trim(),
        item_name: formData.item_name.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        original_price: Number(formData.original_price),
        current_price: Number(formData.current_price),
        discount_percentage: Number(formData.discount_percentage),
        return_period: Number(formData.return_period),
        delivery_date: formData.delivery_date.trim(),
        stock: Number(formData.stock),

        rating: {
          stars: Number(formData.ratingStars),
          count: Number(formData.ratingCount),
        },
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add product");
      }

      setMessage("Product added successfully!");

      // Redirect to admin products page
      setTimeout(() => {
        navigate("/admin/products");
      }, 1000);
    } catch (error) {
      console.error("Add Product Error:", error);
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">

          <div className="card shadow-sm">
            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Add New Product</h2>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/admin/products")}
                >
                  Back
                </button>
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

              <form onSubmit={handleSubmit}>

                {/* Product ID */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Product ID
                    </label>

                    <input
                      type="text"
                      name="id"
                      className="form-control"
                      placeholder="MEN006"
                      value={formData.id}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Category
                    </label>

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
                </div>

                {/* Company + Product Name */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Company
                    </label>

                    <input
                      type="text"
                      name="company"
                      className="form-control"
                      placeholder="Roadster"
                      value={formData.company}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Product Name
                    </label>

                    <input
                      type="text"
                      name="item_name"
                      className="form-control"
                      placeholder="Casual Polo T-Shirt"
                      value={formData.item_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">
                    Description
                  </label>

                  <textarea
                    name="description"
                    className="form-control"
                    rows="4"
                    placeholder="Enter product description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Image */}
                <div className="mb-3">
                  <label className="form-label">
                    Image Path
                  </label>

                  <input
                    type="text"
                    name="image"
                    className="form-control"
                    placeholder="images/men6.jpg"
                    value={formData.image}
                    onChange={handleChange}
                    required
                  />

                  <small className="text-muted">
                    Example: images/men6.jpg
                  </small>
                </div>

                {/* Price */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Original Price
                    </label>

                    <input
                      type="number"
                      name="original_price"
                      className="form-control"
                      placeholder="1499"
                      min="0"
                      value={formData.original_price}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Current Price
                    </label>

                    <input
                      type="number"
                      name="current_price"
                      className="form-control"
                      placeholder="799"
                      min="0"
                      value={formData.current_price}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Discount %
                    </label>

                    <input
                      type="number"
                      name="discount_percentage"
                      className="form-control"
                      placeholder="47"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Return + Delivery + Stock */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Return Period
                    </label>

                    <input
                      type="number"
                      name="return_period"
                      className="form-control"
                      placeholder="14"
                      min="0"
                      value={formData.return_period}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Delivery Date
                    </label>

                    <input
                      type="text"
                      name="delivery_date"
                      className="form-control"
                      placeholder="5 Days"
                      value={formData.delivery_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Stock
                    </label>

                    <input
                      type="number"
                      name="stock"
                      className="form-control"
                      placeholder="50"
                      min="0"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Rating */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Rating Stars
                    </label>

                    <input
                      type="number"
                      step="0.1"
                      name="ratingStars"
                      className="form-control"
                      placeholder="4.5"
                      min="0"
                      max="5"
                      value={formData.ratingStars}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Rating Count
                    </label>

                    <input
                      type="number"
                      name="ratingCount"
                      className="form-control"
                      placeholder="1000"
                      min="0"
                      value={formData.ratingCount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Adding Product..." : "Add Product"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => navigate("/admin/products")}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddProduct;