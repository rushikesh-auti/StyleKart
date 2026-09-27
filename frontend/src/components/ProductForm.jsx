import PropTypes from "prop-types";

const categories = ["men", "women", "kids", "beauty"];

const ProductForm = ({
  formData,
  onChange,
  onSubmit,
  submitText = "Save Product",
  loading = false,
  error = "",
}) => {
  const handleArrayChange = (event) => {
    const { name, value } = event.target;

    onChange({
      target: {
        name,
        value: value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {error && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-12">
        {/* Basic Information */}
        <div className="md:col-span-12">
          <h5 className="mb-1">Basic Information</h5>
          <hr />
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="item_name"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Product Name *
          </label>

          <input
            id="item_name"
            type="text"
            name="item_name"
            value={formData.item_name}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="company"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Company *
          </label>

          <input
            id="company"
            type="text"
            name="company"
            value={formData.company}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            placeholder="Enter company"
            required
          />
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="brand"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Brand
          </label>

          <input
            id="brand"
            type="text"
            name="brand"
            value={formData.brand}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            placeholder="Enter brand"
          />
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="subcategory"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Subcategory
          </label>

          <input
            id="subcategory"
            type="text"
            name="subcategory"
            value={formData.subcategory}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            placeholder="e.g. T-Shirts"
          />
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Category *
          </label>

          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            required
          >
            <option value="">Select category</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-12">
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            rows="4"
            placeholder="Enter product description"
          />
        </div>

        {/* Image */}
        <div className="md:col-span-12">
          <h5 className="mb-1 mt-5 text-sm font-black text-slate-950">
            Product Image
          </h5>
          <hr />
        </div>

        <div className="md:col-span-12">
          <label
            htmlFor="image"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Image Path or URL *
          </label>

          <input
            id="image"
            type="text"
            name="image"
            value={formData.image}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            placeholder="images/product.jpg or https://example.com/product.jpg"
            required
          />
        </div>

        {formData.image && (
          <div className="md:col-span-12">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-xs text-slate-500">Image Preview</p>

              <img
                src={
                  /^https?:\/\//i.test(formData.image)
                    ? formData.image
                    : `/${formData.image.replace(/^\/+/, "")}`
                }
                alt="Product preview"
                className="h-[180px] w-[140px] rounded-xl object-cover"
                onError={(event) => {
                  event.currentTarget.classList.add("hidden");
                }}
              />
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="md:col-span-12">
          <h5 className="mb-1 mt-5 text-sm font-black text-slate-950">
            Pricing & Inventory
          </h5>
          <hr />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="original_price"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Original Price *
          </label>

          <input
            id="original_price"
            type="number"
            name="original_price"
            value={formData.original_price}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            min="0"
            step="0.01"
            placeholder="1999"
            required
          />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="current_price"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Current Price *
          </label>

          <input
            id="current_price"
            type="number"
            name="current_price"
            value={formData.current_price}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            min="0"
            step="0.01"
            placeholder="999"
            required
          />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="discount_percentage"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Discount (%)
          </label>

          <input
            id="discount_percentage"
            type="number"
            name="discount_percentage"
            value={formData.discount_percentage}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            min="0"
            max="100"
            step="1"
            placeholder="50"
          />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="stock"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Stock *
          </label>

          <input
            id="stock"
            type="number"
            name="stock"
            value={formData.stock}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            min="0"
            step="1"
            required
          />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="return_period"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Return Period (days)
          </label>

          <input
            id="return_period"
            type="number"
            name="return_period"
            value={formData.return_period}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            min="0"
          />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="delivery_date"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Delivery Date
          </label>

          <input
            id="delivery_date"
            type="text"
            name="delivery_date"
            value={formData.delivery_date}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            placeholder="e.g. 25 Sep 2026"
          />
        </div>

        {/* Variants */}
        <div className="md:col-span-12">
          <h5 className="mb-1 mt-5 text-sm font-black text-slate-950">
            Variants
          </h5>
          <hr />
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="sizes"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Sizes
          </label>

          <input
            id="sizes"
            type="text"
            name="sizes"
            value={formData.sizes.join(", ")}
            onChange={handleArrayChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            placeholder="S, M, L, XL"
          />

          <div className="mt-1 text-xs text-slate-500">
            Separate sizes with commas.
          </div>
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="colors"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Colors
          </label>

          <input
            id="colors"
            type="text"
            name="colors"
            value={formData.colors.join(", ")}
            onChange={handleArrayChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            placeholder="Black, White, Blue"
          />

          <div className="mt-1 text-xs text-slate-500">
            Separate colors with commas.
          </div>
        </div>

        {/* Rating */}
        <div className="md:col-span-12">
          <h5 className="mb-1 mt-5 text-sm font-black text-slate-950">
            Rating
          </h5>
          <hr />
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="ratingStars"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Rating Stars
          </label>

          <input
            id="ratingStars"
            type="number"
            name="ratingStars"
            value={formData.rating.stars}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            min="0"
            max="5"
            step="0.1"
          />
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="ratingCount"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Rating Count
          </label>

          <input
            id="ratingCount"
            type="number"
            name="ratingCount"
            value={formData.rating.count}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            min="0"
            step="1"
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-12">
          <hr className="mt-4" />

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-brand-600"
              disabled={loading}
            >
              {loading ? "Saving..." : submitText}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

ProductForm.propTypes = {
  formData: PropTypes.shape({
    item_name: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    subcategory: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    original_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    current_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    discount_percentage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,
    stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sizes: PropTypes.arrayOf(PropTypes.string).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    return_period: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    delivery_date: PropTypes.string.isRequired,
    rating: PropTypes.shape({
      stars: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      count: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    }).isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitText: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  isEdit: PropTypes.bool,
};

export default ProductForm;
