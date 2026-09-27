import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { userFetch } from "../utils/userApi";

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

      await userFetch(editingId ? `/addresses/${editingId}` : "/addresses", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(formData),
      });

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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-7 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.03em] [&_h1]:text-slate-950 sm:[&_h1]:text-4xl [&>p:last-child]:mt-2 [&>p:last-child]:text-sm [&>p:last-child]:text-slate-500">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
          My account
        </p>
        <h1>Saved addresses</h1>
        <p>Use a saved address during checkout.</p>
      </header>

      <section className="grid items-start gap-7 md:grid-cols-[210px_minmax(0,1fr)]">
        <nav className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white md:flex-col [&_a]:whitespace-nowrap [&_a]:border-r [&_a]:border-slate-200 [&_a]:px-4 [&_a]:py-3 [&_a]:text-sm [&_a]:font-bold [&_a]:text-slate-600 [&_a]:no-underline hover:[&_a]:bg-brand-50 md:[&_a]:border-b md:[&_a]:border-r-0">
          <Link to="/profile">Profile</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link className="bg-brand-50 text-brand-700" to="/addresses">
            Addresses
          </Link>
        </nav>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-950 [&_p]:mt-1 [&_p]:text-sm [&_p]:text-slate-500 [&>button]:rounded-xl [&>button]:bg-slate-950 [&>button]:px-4 [&>button]:py-2.5 [&>button]:text-sm [&>button]:font-black [&>button]:text-white">
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
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </p>
          )}

          {showForm && (
            <form
              className="mb-7 grid gap-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-5 [&_h3]:text-lg [&_h3]:font-black [&_h3]:text-slate-950 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-bold [&_label]:text-slate-700 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-3.5 [&_input]:py-2.5 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3.5 [&_select]:py-2.5"
              onSubmit={handleSubmit}
            >
              <h3>{editingId ? "Edit Address" : "Add New Address"}</h3>

              <div className="grid gap-4 sm:grid-cols-2">
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

                <label className="sm:col-span-2">
                  Address line 1
                  <input
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="sm:col-span-2">
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

              <label className="flex-row items-center [&_input]:h-4 [&_input]:w-4 [&_input]:accent-brand-600">
                <input
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />
                Make this my default address
              </label>

              <div className="flex flex-wrap gap-2 [&_button]:rounded-xl [&_button]:bg-slate-950 [&_button]:px-4 [&_button]:py-2.5 [&_button]:text-sm [&_button]:font-black [&_button]:text-white">
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Address"
                      : "Save Address"}
                </button>

                <button
                  type="button"
                  className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading && <p>Loading addresses...</p>}

          {!loading && addresses.length === 0 && !showForm && (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center [&_h3]:font-black [&_h3]:text-slate-950 [&_p]:mt-2 [&_p]:text-sm [&_p]:text-slate-500">
              <h3>No saved addresses</h3>
              <p>Add an address to make checkout faster.</p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {addresses.map((address) => (
              <article
                className="rounded-2xl border border-slate-200 p-5 [&_h3]:mb-2 [&_h3]:font-black [&_h3]:text-slate-950 [&_p]:my-1 [&_p]:text-sm [&_p]:leading-5 [&_p]:text-slate-600"
                key={address._id}
              >
                <div className="mb-4 flex items-center justify-between gap-3 [&_span]:rounded-lg [&_span]:bg-slate-100 [&_span]:px-2.5 [&_span]:py-1 [&_span]:text-xs [&_span]:font-black [&_span]:text-slate-600 [&_strong]:text-xs [&_strong]:font-black [&_strong]:text-emerald-700">
                  <span>{address.addressType}</span>

                  {address.isDefault && <strong>Default</strong>}
                </div>

                <h3>{address.fullName}</h3>
                <p>{address.addressLine1}</p>

                {address.addressLine2 && <p>{address.addressLine2}</p>}

                <p>
                  {address.city}, {address.state} - {address.pinCode}
                </p>

                <p>Mobile: {address.mobile}</p>

                <div className="mt-4 flex flex-wrap gap-4 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-xs [&_button]:font-black [&_button]:text-brand-700">
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(address._id)}
                    >
                      Make Default
                    </button>
                  )}

                  <button type="button" onClick={() => startEditing(address)}>
                    Edit
                  </button>

                  <button
                    type="button"
                    className="text-rose-600 hover:text-rose-700"
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
