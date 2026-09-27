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
      <main className="mx-auto w-full max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-xl font-black text-slate-950">
          Loading products...
        </h1>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-black tracking-[-0.03em] text-slate-950">
            Admin Product Management
          </h1>
          <p className="text-slate-500">Manage StyleKart products</p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/products/add"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-brand-700"
          >
            Add Product
          </Link>
          <button
            type="button"
            className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600 hover:bg-rose-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm [&_td]:px-4 [&_td]:py-3 [&_tbody_tr]:border-b [&_tbody_tr]:border-slate-100">
            <thead className="bg-slate-950 text-left text-xs uppercase tracking-wider text-white [&_th]:px-4 [&_th]:py-3">
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
                    className="px-4 py-12 text-center text-slate-500"
                  >
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
                        className="h-[75px] w-[60px] rounded-lg object-cover"
                      />
                    </td>
                    <td>
                      <strong>{product.id}</strong>
                    </td>
                    <td>
                      <strong>{product.company}</strong>
                      <br />
                      <small className="text-slate-500">
                        {product.item_name}
                      </small>
                    </td>
                    <td>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                        {product.category}
                      </span>
                    </td>
                    <td>
                      <strong>Rs. {product.current_price}</strong>
                      <br />
                      <small className="text-xs text-slate-400 line-through">
                        Rs. {product.original_price}
                      </small>
                    </td>
                    <td>
                      <span
                        className={
                          product.stock > 0
                            ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700"
                            : "inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800 hover:bg-amber-200"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-700"
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

      <p className="mt-4 text-sm text-slate-500">
        Total Products: <strong>{products.length}</strong>
      </p>
    </main>
  );
};

export default AdminProducts;
