import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { userFetch } from "../utils/userApi";
import "../styles/account.css";

const emptyAddress = {
  fullName: "",
  mobile: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pinCode: "",
  addressType: "Home",
  isDefault: false,
};

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState(emptyAddress);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await userFetch("/addresses");
      setAddresses(data.addresses || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyAddress);
    setEditingId("");
    setShowForm(false);
  };

  const startEditing = (address) => {
    setFormData({
      fullName: address.fullName,
      mobile: address.mobile,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
      addressType: address.addressType,
      isDefault: address.isDefault,
    });

    setEditingId(address._id);
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await userFetch(
        editingId ? `/addresses/${editingId}` : "/addresses",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(formData),
        },
      );

      await loadAddresses();
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      setError("");

      await userFetch(`/addresses/${addressId}/default`, {
        method: "PUT",
      });

      await loadAddresses();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteAddress = async (addressId) => {
    if (!window.confirm("Delete this address?")) {
      return;
    }

    try {
      setError("");

      await userFetch(`/addresses/${addressId}`, {
        method: "DELETE",
      });

      await loadAddresses();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="account-page">
      <header className="account-header">
        <p className="home-eyebrow">My account</p>
        <h1>Saved addresses</h1>
        <p>Use a saved address during checkout.</p>
      </header>

      <section className="account-layout">
        <nav className="account-navigation">
          <Link to="/profile">Profile</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link className="active" to="/addresses">
            Addresses
          </Link>
        </nav>

        <section className="account-content">
          <div className="account-section-heading">
            <div>
              <h2>Delivery addresses</h2>
              <p>{addresses.length} saved address(es)</p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add New Address
            </button>
          </div>

          {error && (
            <p className="account-message error">{error}</p>
          )}

          {showForm && (
            <form className="address-form" onSubmit={handleSubmit}>
              <h3>
                {editingId ? "Edit Address" : "Add New Address"}
              </h3>

              <div className="address-form-grid">
                <label>
                  Full name
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Mobile number
                  <input
                    name="mobile"
                    inputMode="numeric"
                    maxLength="10"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="full-width">
                  Address line 1
                  <input
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="full-width">
                  Address line 2
                  <input
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="Apartment, landmark, area"
                  />
                </label>

                <label>
                  City
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  State
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  PIN code
                  <input
                    name="pinCode"
                    inputMode="numeric"
                    maxLength="6"
                    value={formData.pinCode}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Address type
                  <select
                    name="addressType"
                    value={formData.addressType}
                    onChange={handleChange}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <label className="address-default-checkbox">
                <input
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />
                Make this my default address
              </label>

              <div className="address-form-actions">
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Address"
                      : "Save Address"}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading && <p>Loading addresses...</p>}

          {!loading && addresses.length === 0 && !showForm && (
            <div className="account-empty-state">
              <h3>No saved addresses</h3>
              <p>Add an address to make checkout faster.</p>
            </div>
          )}

          <div className="address-list">
            {addresses.map((address) => (
              <article className="address-card" key={address._id}>
                <div className="address-card-header">
                  <span>{address.addressType}</span>

                  {address.isDefault && (
                    <strong>Default</strong>
                  )}
                </div>

                <h3>{address.fullName}</h3>
                <p>{address.addressLine1}</p>

                {address.addressLine2 && (
                  <p>{address.addressLine2}</p>
                )}

                <p>
                  {address.city}, {address.state} - {address.pinCode}
                </p>

                <p>Mobile: {address.mobile}</p>

                <div className="address-card-actions">
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() =>
                        setDefaultAddress(address._id)
                      }
                    >
                      Make Default
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startEditing(address)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteAddress(address._id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default Addresses;