import { useEffect, useState } from "react";
import PropTypes from "prop-types";

import { adminFetch } from "../utils/adminApi";
import { createVariantCombinations } from "../utils/productInventory";

const categories = ["men", "women", "kids", "beauty"];
const MAX_IMAGE_SIZE_MB = (() => {
  const configuredValue = Number(import.meta.env.VITE_PRODUCT_IMAGE_MAX_SIZE_MB);
  return Number.isFinite(configuredValue) && configuredValue > 0
    ? Math.min(configuredValue, 20)
    : 5;
})();

const ProductForm = ({
  formData,
  onChange,
  onSubmit,
  submitText = "Save Product",
  loading = false,
  error = "",
  isEdit = false,
}) => {
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(
    () => () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    },
    [imagePreview],
  );

  const handleArrayChange = (event) => {
    const { name, value } = event.target;
    const nextOptions = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    onChange({
      target: {
        name,
        value: nextOptions,
      },
    });
    const sizes = name === "sizes" ? nextOptions : formData.sizes;
    const colors = name === "colors" ? nextOptions : formData.colors;
    const currentVariants = formData.inventoryVariants || [];
    const currentByKey = new Map(
      currentVariants.map((variant) => [
        JSON.stringify([variant.size || "", variant.color || ""]),
        variant,
      ]),
    );
    const inventoryVariants = createVariantCombinations(sizes, colors).map(
      ({ size, color }) => ({
        size,
        color,
        stock:
          currentByKey.get(JSON.stringify([size, color]))?.stock || 0,
      }),
    );
    onChange({ target: { name: "inventoryVariants", value: inventoryVariants } });
  };

  const updateVariantStock = (size, color, value) => {
    const variants = createVariantCombinations(formData.sizes, formData.colors);
    const currentByKey = new Map(
      (formData.inventoryVariants || []).map((variant) => [
        JSON.stringify([variant.size || "", variant.color || ""]),
        variant,
      ]),
    );
    const inventoryVariants = variants.map((variant) => {
      const current = currentByKey.get(
        JSON.stringify([variant.size, variant.color]),
      );
      return {
        ...variant,
        stock:
          variant.size === size && variant.color === color
            ? value
            : current?.stock || 0,
      };
    });
    onChange({ target: { name: "inventoryVariants", value: inventoryVariants } });
  };

  const inventoryRows = createVariantCombinations(
    formData.sizes,
    formData.colors,
  ).map(({ size, color }) => ({
    size,
    color,
    stock:
      formData.inventoryVariants?.find(
        (variant) => variant.size === size && variant.color === color,
      )?.stock ?? 0,
  }));
  const allocatedVariantStock = inventoryRows.reduce(
    (total, variant) => total + (Number(variant.stock) || 0),
    0,
  );
  const allocationTarget =
    Number.isInteger(formData.legacyStockToAllocate) &&
    formData.legacyStockToAllocate > 0
    ? formData.legacyStockToAllocate
    : null;

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const allowedTypes = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    };
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const validType =
      allowedTypes[file.type]?.includes(extension) &&
      file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024;

    if (!validType) {
      setUploadError(
        `Choose a JPEG, PNG, or WebP image with a matching extension, no larger than ${MAX_IMAGE_SIZE_MB} MB.`,
      );
      return;
    }

    setUploadError("");
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const response = await adminFetch("/admin/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.image?.secure_url || !data.image?.public_id) {
        throw new Error(data.message || "Unable to upload product image.");
      }

      onChange({
        target: { name: "image", value: data.image.secure_url },
      });
      onChange({
        target: { name: "imagePublicId", value: data.image.public_id },
      });
      setImagePreview(data.image.secure_url);
    } catch (uploadFailure) {
      setImagePreview("");
      setUploadError(uploadFailure.message || "Unable to upload product image.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setUploadError("");

    if (formData.imagePublicId) {
      try {
        const response = await adminFetch("/admin/upload", {
          method: "DELETE",
          body: JSON.stringify({ public_id: formData.imagePublicId }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok && response.status !== 409) {
          throw new Error(data.message || "Unable to remove uploaded image.");
        }
      } catch (removeFailure) {
        setUploadError(
          removeFailure.message || "Unable to remove uploaded image.",
        );
        return;
      }
    }

    setImagePreview("");
    onChange({ target: { name: "image", value: "" } });
    onChange({ target: { name: "imagePublicId", value: "" } });
  };

  const handleFormSubmit = (event) => {
    if (uploading || !formData.image) {
      event.preventDefault();
      if (!formData.image) {
        setUploadError("Choose and upload a product image before saving.");
      }
      return;
    }

    onSubmit(event);
  };

  const previewSource =
    imagePreview ||
    (formData.image
      ? /^https?:\/\//i.test(formData.image)
        ? formData.image
        : `/${formData.image.replace(/^\/+/, "")}`
      : "");

  return (
    <form onSubmit={handleFormSubmit} className="grid gap-5">
      {(error || uploadError) && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
          role="alert"
        >
          {uploadError || error}
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
            htmlFor="imageFile"
            className="mb-2 mt-4 block text-sm font-bold text-slate-700"
          >
            Choose a product image
          </label>
          <input
            id="imageFile"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleImageFileChange}
            disabled={uploading || loading}
            className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-700 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-slate-500" aria-live="polite">
            {uploading
              ? "Uploading image securely..."
              : `JPEG, PNG, or WebP; maximum size ${MAX_IMAGE_SIZE_MB} MB.`}
          </p>
        </div>

        {previewSource && (
          <div className="md:col-span-12">
            <div className="flex items-start gap-4 rounded-xl border border-slate-200 p-4">

              <img
                src={previewSource}
                alt="Product preview"
                className="h-[180px] w-[140px] rounded-xl object-cover"
                onError={(event) => {
                  event.currentTarget.classList.add("hidden");
                }}
              />
              <div className="flex flex-col items-start gap-2">
                <p className="text-xs text-slate-500">Image Preview</p>
                <button
                  type="button"
                  className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleRemoveImage}
                  disabled={uploading || loading}
                >
                  Remove image
                </button>
              </div>
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

        <div className="md:col-span-12">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h6 className="text-sm font-bold text-slate-700">
              Available inventory by variant
            </h6>
            <span className="text-xs text-slate-500">
              {allocatedVariantStock} available in total
            </span>
          </div>
          {Number.isInteger(allocationTarget) && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
              Allocate exactly {allocationTarget} unit(s) across these
              variants to complete the legacy inventory migration before
              saving.
            </p>
          )}
          {!Number.isInteger(allocationTarget) && isEdit && (
            <p className="mb-3 text-xs text-slate-500">
              Set the available quantity for each variant. New variants start
              at zero; quantities for removed variants are retired.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inventoryRows.map((variant) => (
              <label
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
                key={JSON.stringify([variant.size, variant.color])}
              >
                <span className="font-semibold text-slate-700">
                  {variant.size || variant.color
                    ? [variant.size && `Size ${variant.size}`, variant.color]
                        .filter(Boolean)
                        .join(" · ")
                    : "Standard item"}
                </span>
                <input
                  aria-label={`Stock for ${variant.size || "standard"} ${variant.color || ""}`}
                  className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm"
                  type="number"
                  min="0"
                  step="1"
                  value={variant.stock}
                  onChange={(event) =>
                    updateVariantStock(
                      variant.size,
                      variant.color,
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value),
                    )
                  }
                  required
                />
              </label>
            ))}
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
              disabled={loading || uploading || !formData.image}
            >
              {uploading ? "Uploading image..." : loading ? "Saving..." : submitText}
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
    imagePublicId: PropTypes.string,
    original_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    current_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    discount_percentage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,
    sizes: PropTypes.arrayOf(PropTypes.string).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    inventoryVariants: PropTypes.arrayOf(
      PropTypes.shape({
        size: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
      }),
    ).isRequired,
    legacyStockToAllocate: PropTypes.number,
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
