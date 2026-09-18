import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProductForm from "../components/ProductForm";
import { adminApiUrl, adminFetch } from "../utils/adminApi";

const emptyFormData = {
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
  rating: {
    stars: 0,
    count: 0,
  },
};

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(adminApiUrl(`/products/${id}`));

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load product.");
        }

        if (!data.product) {
          throw new Error("Product not found.");
        }

        const product = data.product;

        setFormData({
          item_name: product.item_name || "",
          company: product.company || "",
          brand: product.brand || "",
          category: product.category || "",
          subcategory: product.subcategory || "",
          description: product.description || "",
          image: product.image || "",
          original_price: product.original_price ?? "",
          current_price: product.current_price ?? "",
          discount_percentage: product.discount_percentage ?? 0,
          stock: product.stock ?? 0,
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          colors: Array.isArray(product.colors) ? product.colors : [],
          return_period: product.return_period ?? 14,
          delivery_date: product.delivery_date || "",
          rating: {
            stars: product.rating?.stars ?? 0,
            count: product.rating?.count ?? 0,
          },
        });
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "ratingStars") {
      setFormData((previous) => ({
        ...previous,
        rating: {
          ...previous.rating,
          stars: value,
        },
      }));

      return;
    }

    if (name === "ratingCount") {
      setFormData((previous) => ({
        ...previous,
        rating: {
          ...previous.rating,
          count: value,
        },
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const payload = {
        ...formData,
        original_price: Number(formData.original_price),
        current_price: Number(formData.current_price),
        discount_percentage: Number(formData.discount_percentage),
        stock: Number(formData.stock),
        return_period: Number(formData.return_period),
        rating: {
          stars: Number(formData.rating.stars),
          count: Number(formData.rating.count),
        },
      };

      const response = await adminFetch(adminApiUrl(`/products/${id}`), {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update product.");
      }

      navigate("/admin/products");
    } catch (submitError) {
      setError(submitError.message || "Unable to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="container py-5">
        <div className="text-center">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading product"
          />
          <p className="text-muted mt-3">Loading product...</p>
        </div>
      </main>
    );
  }

  if (error && !formData.item_name) {
    return (
      <main className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>

        <button
          type="button"
          className="btn btn-dark"
          onClick={() => navigate("/admin/products")}
        >
          Back to Products
        </button>
      </main>
    );
  }

  return (
    <main className="container py-4">
      <div className="mb-4">
        <h1 className="mb-1">Edit Product</h1>
        <p className="text-muted mb-0">
          Update the details of your StyleKart product.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <ProductForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitText="Update Product"
            loading={saving}
            error={error}
            isEdit
          />
        </div>
      </div>
    </main>
  );
}

export default EditProduct;
