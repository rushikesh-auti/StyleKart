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
    <form onSubmit={onSubmit} className="product-form">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row g-3">
        {/* Basic Information */}
        <div className="col-12">
          <h5 className="mb-1">Basic Information</h5>
          <hr />
        </div>

        <div className="col-md-6">
          <label htmlFor="item_name" className="form-label">
            Product Name *
          </label>

          <input
            id="item_name"
            type="text"
            name="item_name"
            value={formData.item_name}
            onChange={onChange}
            className="form-control"
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="company" className="form-label">
            Company *
          </label>

          <input
            id="company"
            type="text"
            name="company"
            value={formData.company}
            onChange={onChange}
            className="form-control"
            placeholder="Enter company"
            required
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="brand" className="form-label">
            Brand
          </label>

          <input
            id="brand"
            type="text"
            name="brand"
            value={formData.brand}
            onChange={onChange}
            className="form-control"
            placeholder="Enter brand"
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="subcategory" className="form-label">
            Subcategory
          </label>

          <input
            id="subcategory"
            type="text"
            name="subcategory"
            value={formData.subcategory}
            onChange={onChange}
            className="form-control"
            placeholder="e.g. T-Shirts"
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="category" className="form-label">
            Category *
          </label>

          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={onChange}
            className="form-select"
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

        <div className="col-12">
          <label htmlFor="description" className="form-label">
            Description
          </label>

          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onChange}
            className="form-control"
            rows="4"
            placeholder="Enter product description"
          />
        </div>

        {/* Image */}
        <div className="col-12">
          <h5 className="mb-1 mt-3">Product Image</h5>
          <hr />
        </div>

        <div className="col-12">
          <label htmlFor="image" className="form-label">
            Image Path or URL *
          </label>

          <input
            id="image"
            type="text"
            name="image"
            value={formData.image}
            onChange={onChange}
            className="form-control"
            placeholder="images/product.jpg or https://example.com/product.jpg"
            required
          />
        </div>

        {formData.image && (
          <div className="col-12">
            <div className="border rounded p-3">
              <p className="small text-muted mb-2">Image Preview</p>

              <img
                src={
                  /^https?:\/\//i.test(formData.image)
                    ? formData.image
                    : `/${formData.image.replace(/^\/+/, "")}`
                }
                alt="Product preview"
                style={{
                  width: "140px",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "6px",
                }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="col-12">
          <h5 className="mb-1 mt-3">Pricing & Inventory</h5>
          <hr />
        </div>

        <div className="col-md-4">
          <label htmlFor="original_price" className="form-label">
            Original Price *
          </label>

          <input
            id="original_price"
            type="number"
            name="original_price"
            value={formData.original_price}
            onChange={onChange}
            className="form-control"
            min="0"
            step="0.01"
            placeholder="1999"
            required
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="current_price" className="form-label">
            Current Price *
          </label>

          <input
            id="current_price"
            type="number"
            name="current_price"
            value={formData.current_price}
            onChange={onChange}
            className="form-control"
            min="0"
            step="0.01"
            placeholder="999"
            required
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="discount_percentage" className="form-label">
            Discount (%)
          </label>

          <input
            id="discount_percentage"
            type="number"
            name="discount_percentage"
            value={formData.discount_percentage}
            onChange={onChange}
            className="form-control"
            min="0"
            max="100"
            step="1"
            placeholder="50"
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="stock" className="form-label">
            Stock *
          </label>

          <input
            id="stock"
            type="number"
            name="stock"
            value={formData.stock}
            onChange={onChange}
            className="form-control"
            min="0"
            step="1"
            required
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="return_period" className="form-label">
            Return Period (days)
          </label>

          <input
            id="return_period"
            type="number"
            name="return_period"
            value={formData.return_period}
            onChange={onChange}
            className="form-control"
            min="0"
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="delivery_date" className="form-label">
            Delivery Date
          </label>

          <input
            id="delivery_date"
            type="text"
            name="delivery_date"
            value={formData.delivery_date}
            onChange={onChange}
            className="form-control"
            placeholder="e.g. 25 Sep 2026"
          />
        </div>

        {/* Variants */}
        <div className="col-12">
          <h5 className="mb-1 mt-3">Variants</h5>
          <hr />
        </div>

        <div className="col-md-6">
          <label htmlFor="sizes" className="form-label">
            Sizes
          </label>

          <input
            id="sizes"
            type="text"
            name="sizes"
            value={formData.sizes.join(", ")}
            onChange={handleArrayChange}
            className="form-control"
            placeholder="S, M, L, XL"
          />

          <div className="form-text">Separate sizes with commas.</div>
        </div>

        <div className="col-md-6">
          <label htmlFor="colors" className="form-label">
            Colors
          </label>

          <input
            id="colors"
            type="text"
            name="colors"
            value={formData.colors.join(", ")}
            onChange={handleArrayChange}
            className="form-control"
            placeholder="Black, White, Blue"
          />

          <div className="form-text">Separate colors with commas.</div>
        </div>

        {/* Rating */}
        <div className="col-12">
          <h5 className="mb-1 mt-3">Rating</h5>
          <hr />
        </div>

        <div className="col-md-6">
          <label htmlFor="ratingStars" className="form-label">
            Rating Stars
          </label>

          <input
            id="ratingStars"
            type="number"
            name="ratingStars"
            value={formData.rating.stars}
            onChange={onChange}
            className="form-control"
            min="0"
            max="5"
            step="0.1"
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="ratingCount" className="form-label">
            Rating Count
          </label>

          <input
            id="ratingCount"
            type="number"
            name="ratingCount"
            value={formData.rating.count}
            onChange={onChange}
            className="form-control"
            min="0"
            step="1"
          />
        </div>

        {/* Submit */}
        <div className="col-12">
          <hr className="mt-4" />

          <div className="d-flex gap-2 justify-content-end">
            <button
              type="submit"
              className="btn btn-dark px-4"
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
