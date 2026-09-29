import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAdminSession } from "../store/adminAuthSlice";
import { clearUserSession } from "../store/userAuthSlice";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";
import { adminApiUrl } from "../utils/adminApi";

const API_URL = adminApiUrl("/auth/admin/login");

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      dispatch(clearUserSession());
      dispatch(bagActions.resetBag());
      dispatch(wishlistActions.resetWishlist());
      dispatch(setAdminSession({ admin: data.admin }));

      // Redirect to the admin dashboard
      navigate("/admin", {
        replace: true,
      });
    } catch (error) {
      console.error("Admin login error:", error);

      setError(error.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-xl">
        <div className="w-full">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-soft">
            <div className="p-6 sm:p-8">
              <h2 className="text-center mb-2">Admin Login</h2>

              <p className="mb-6 text-center text-sm text-slate-500">
                Login to manage StyleKart products
              </p>

              {/* Error Message */}
              {error && (
                <div
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-3">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="admin@stylekart.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    name="password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white transition hover:bg-brand-700 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
