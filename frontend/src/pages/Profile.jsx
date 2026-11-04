import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { clearUserSession, updateUser } from "../store/userAuthSlice";
import { setSessionStatus } from "../store/authSessionSlice";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";
import { adminApiUrl } from "../utils/adminApi";
import { userFetch } from "../utils/userApi";
import AccountNavigation from "../components/AccountNavigation";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.userAuth.user);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
    });
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await userFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      dispatch(updateUser(data.user));
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch(adminApiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to log out. Please try again.");
      }

      dispatch(clearUserSession());
      dispatch(bagActions.resetBag());
      dispatch(wishlistActions.resetWishlist());
      dispatch(setSessionStatus("unauthenticated"));
      navigate("/", { replace: true });
    } catch (requestError) {
      setLogoutError(requestError.message);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-7 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-medium [&_h1]:tracking-[-0.03em] [&_h1]:text-slate-950 sm:[&_h1]:text-4xl [&>p:last-child]:mt-2 [&>p:last-child]:text-sm [&>p:last-child]:text-slate-500">
        <p className="sk-eyebrow">My account</p>
        <h1>Welcome back, {user?.name || "StyleKart shopper"}</h1>
        <p>Manage your profile, saved addresses, orders, and wishlist.</p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-4 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 md:hidden"
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </header>

      <AccountNavigation />
      <section>
        {logoutError && (
          <p
            className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
            role="alert"
          >
            {logoutError}
          </p>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-950 [&_p]:mt-1 [&_p]:text-sm [&_p]:text-slate-500 [&>button]:rounded-xl [&>button]:bg-slate-950 [&>button]:px-4 [&>button]:py-2.5 [&>button]:text-sm [&>button]:font-black [&>button]:text-white">
            <div>
              <h2>Personal information</h2>
              <p>Keep your contact information up to date.</p>
            </div>
          </div>

          <form
            className="grid gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-bold [&_label]:text-slate-700 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:text-slate-900 [&_input]:outline-none focus:[&_input]:border-brand-500 focus:[&_input]:ring-4 focus:[&_input]:ring-brand-100 [&_button]:justify-self-start [&_button]:rounded-xl [&_button]:bg-slate-950 [&_button]:px-4 [&_button]:py-2.5 [&_button]:text-sm [&_button]:font-black [&_button]:text-white"
            onSubmit={handleSubmit}
          >
            <label htmlFor="profile-name">
              Full name
              <input
                id="profile-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label htmlFor="profile-email">
              Email address
              <input
                id="profile-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label htmlFor="profile-mobile">
              Mobile number
              <input
                id="profile-mobile"
                name="mobile"
                inputMode="numeric"
                maxLength="10"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
              />
            </label>

            {message && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {message}
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Profile;
