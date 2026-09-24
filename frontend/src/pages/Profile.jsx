import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { updateUser } from "../store/userAuthSlice";
import { userFetch } from "../utils/userApi";
import "../styles/account.css";

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((store) => store.userAuth.user);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  return (
    <main className="account-page">
      <header className="account-header">
        <p className="home-eyebrow">My account</p>
        <h1>Welcome back, {user?.name || "StyleKart shopper"}</h1>
        <p>Manage your profile, saved addresses, orders, and wishlist.</p>
      </header>

      <section className="account-layout">
        <nav className="account-navigation">
          <Link className="active" to="/profile">
            Profile
          </Link>
          <Link to="/orders">Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/addresses">Addresses</Link>
        </nav>

        <section className="account-content">
          <div className="account-section-heading">
            <div>
              <h2>Personal information</h2>
              <p>Keep your contact information up to date.</p>
            </div>
          </div>

          <form className="account-form" onSubmit={handleSubmit}>
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
              <p className="account-message success">{message}</p>
            )}

            {error && (
              <p className="account-message error">{error}</p>
            )}

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
};

export default Profile;