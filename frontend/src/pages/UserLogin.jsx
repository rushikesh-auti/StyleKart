import { useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setUserSession } from "../store/userAuthSlice";
import { clearAdminSession } from "../store/adminAuthSlice";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";
import { adminApiUrl } from "../utils/adminApi";

const UserLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = isRegistering
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      const response = await fetch(
        adminApiUrl(isRegistering ? "/auth/register" : "/auth/login"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to authenticate");
      }

      dispatch(clearAdminSession());
      dispatch(bagActions.resetBag());
      dispatch(wishlistActions.resetWishlist());
      dispatch(setUserSession({ user: data.user }));
      await Promise.all([
        dispatch(bagActions.loadUserCart()),
        dispatch(wishlistActions.loadUserWishlist()),
      ]);
      const destination = location.state?.from || "/";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-xl">
        <div className="w-full">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6 sm:p-8">
              <h1 className="mb-2 text-2xl font-black text-slate-950">
                {isRegistering ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mb-6 text-slate-500">
                {isRegistering
                  ? "Join StyleKart and start shopping."
                  : "Sign in to continue shopping."}
              </p>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {isRegistering && (
                  <div className="mb-3">
                    <label
                      className="mb-2 block text-sm font-bold text-slate-700"
                      htmlFor="name"
                    >
                      Name
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label
                    className="mb-2 block text-sm font-bold text-slate-700"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="mb-2 block text-sm font-bold text-slate-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    id="password"
                    name="password"
                    type="password"
                    minLength={isRegistering ? 8 : undefined}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                {isRegistering && (
                  <div className="mb-4">
                    <label
                      className="mb-2 block text-sm font-bold text-slate-700"
                      htmlFor="confirmPassword"
                    >
                      Confirm password
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      minLength={8}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                )}
                <button
                  className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white transition hover:bg-brand-700 disabled:opacity-60"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : isRegistering
                      ? "Create account"
                      : "Login"}
                </button>
              </form>

              <button
                className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-black text-brand-700 hover:bg-brand-50"
                type="button"
                onClick={() => {
                  setIsRegistering((current) => !current);
                  setError("");
                }}
              >
                {isRegistering
                  ? "Already have an account? Login"
                  : "New to StyleKart? Create an account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UserLogin;
