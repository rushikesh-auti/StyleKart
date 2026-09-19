import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductForm from "../components/ProductForm";
import { adminFetch } from "../utils/adminApi";

const initialFormData = {
  item_name: "",
  company: "",
  brand: "",
  category: "",
  subcategory: "",
  description: "",
  image: "",
  original_price: "",
  current_price: "",
  discount_percentage: 0,
  stock: 0,
  sizes: [],
  colors: [],
  return_period: 14,
  delivery_date: "",
  rating: { stars: 0, count: 0 },
};

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "ratingStars" || name === "ratingCount") {
      const field = name === "ratingStars" ? "stars" : "count";
      setFormData((previous) => ({
        ...previous,
        rating: { ...previous.rating, [field]: value },
      }));
      return;
    }

    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await adminFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          id: `${formData.category.slice(0, 3).toUpperCase()}${Date.now()}`,
          original_price: Number(formData.original_price),
          current_price: Number(formData.current_price),
          discount_percentage: Number(formData.discount_percentage),
          stock: Number(formData.stock),
          return_period: Number(formData.return_period),
          rating: {
            stars: Number(formData.rating.stars),
            count: Number(formData.rating.count),
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to add product.");
      }

      navigate("/admin/products");
    } catch (submitError) {
      setError(submitError.message || "Unable to add product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container py-4">
      <div className="mb-4">
        <h1 className="mb-1">Add Product</h1>
        <p className="text-muted mb-0">
          Add a new product to your StyleKart catalog.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <ProductForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitText="Add Product"
            loading={saving}
            error={error}
          />
        </div>
      </div>
    </main>
  );
};

export default AddProduct;
