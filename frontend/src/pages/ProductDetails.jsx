import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaStar } from "react-icons/fa";

import HomeItem from "../components/HomeItem";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";
import { adminApiUrl } from "../utils/adminApi";
import { getProducts } from "../utils/productApi";
import { userFetch } from "../utils/userApi";
import {
  addRecentlyViewedProduct,
  getRecentlyViewedProducts,
} from "../utils/recentlyViewed";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const bagItems = useSelector((store) => store.bag || []);
  const wishlistItems = useSelector((store) => store.wishlist || []);
  const currentUser = useSelector((store) => store.userAuth?.user);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [editingReviewId, setEditingReviewId] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);

        const response = await fetch(adminApiUrl(`/products/${id}`));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load product.");
        }

        if (!data.product) {
          throw new Error("Product not found.");
        }

        if (!active) {
          return;
        }

        const loadedProduct = data.product;
        const galleryImages = [
          ...(loadedProduct.images || []),
          loadedProduct.image,
        ].filter(Boolean);

        setProduct(loadedProduct);
        setSelectedImage(galleryImages[0] || "");
        setSelectedSize("");
        setSelectedColor("");
        setQuantity(1);

        addRecentlyViewedProduct(loadedProduct);
        setRecentlyViewedProducts(getRecentlyViewedProducts(loadedProduct.id));
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || "Unable to load product. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    fetch(adminApiUrl(`/reviews/product/${id}`))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load reviews.");
        setReviews(data.reviews || []);
      })
      .catch((requestError) => setReviewError(requestError.message));
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadRelatedProducts = async () => {
      if (!product?.category) {
        return;
      }

      try {
        const data = await getProducts({
          category: product.category,
          limit: 5,
          sort: "recommended",
        });

        if (!active) {
          return;
        }

        setRelatedProducts(
          (data.products || [])
            .filter((item) => item.id !== product.id)
            .slice(0, 4),
        );
      } catch {
        if (active) {
          setRelatedProducts([]);
        }
      }
    };

    loadRelatedProducts();

    return () => {
      active = false;
    };
  }, [product?.id, product?.category]);

  const galleryImages = useMemo(() => {
    if (!product) {
      return [];
    }

    return [...(product.images || []), product.image].filter(
      (image, index, images) => image && images.indexOf(image) === index,
    );
  }, [product]);

  if (loading) {
    return (
      <main className="grid min-h-[50vh] place-items-center gap-4 px-4 text-center [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-slate-950 [&_a]:font-black [&_a]:text-brand-700">
        <h1>Loading product...</h1>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="grid min-h-[50vh] place-items-center gap-4 px-4 text-center [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-slate-950 [&_a]:font-black [&_a]:text-brand-700">
        <h1>{error || "Product not found"}</h1>
        <Link to="/products">Back to products</Link>
      </main>
    );
  }

  const isInBag = bagItems.some(
    (item) =>
      item.productId === product.id &&
      item.selectedSize === selectedSize &&
      item.selectedColor === selectedColor,
  );
  const isInWishlist = wishlistItems.includes(product.id);
  const isOutOfStock = product.stock <= 0;
  const needsSizeSelection = product.sizes?.length > 0;
  const needsColorSelection = product.colors?.length > 0;

  const stockMessage = isOutOfStock
    ? "Out of stock"
    : product.stock <= 5
      ? `Only ${product.stock} left`
      : "In stock";

  const updateQuantity = (nextQuantity) => {
    if (nextQuantity >= 1 && nextQuantity <= product.stock) {
      setQuantity(nextQuantity);
    }
  };

  const addToCart = () => {
    if (!currentUser) {
      navigate("/login", { state: { from: `/product/${product.id}` } });
      return;
    }

    if (needsSizeSelection && !selectedSize) {
      setSelectionError("Please select a size before adding to cart.");
      return;
    }

    if (needsColorSelection && !selectedColor) {
      setSelectionError("Please select a color before adding to cart.");
      return;
    }

    setSelectionError("");
    dispatch(
      bagActions.addToBag({
        productId: product.id,
        quantity,
        selectedSize,
        selectedColor,
      }),
    );
  };

  const toggleWishlist = () => {
    if (isInWishlist) {
      dispatch(wishlistActions.removeFromWishlist(product.id));
      return;
    }

    dispatch(wishlistActions.addToWishlist(product.id));
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      setReviewSubmitting(true);
      setReviewError("");
      await userFetch(
        editingReviewId
          ? `/reviews/${editingReviewId}`
          : `/reviews/product/${product.id}`,
        {
          method: editingReviewId ? "PUT" : "POST",
          body: JSON.stringify(reviewForm),
        },
      );
      const response = await fetch(
        adminApiUrl(`/reviews/product/${product.id}`),
      );
      const data = await response.json();
      setReviews(data.reviews || []);
      setReviewForm({ rating: 5, title: "", comment: "" });
      setEditingReviewId("");
    } catch (requestError) {
      setReviewError(requestError.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      setReviewError("");
      await userFetch(`/reviews/${reviewId}`, { method: "DELETE" });
      setReviews((currentReviews) =>
        currentReviews.filter((review) => review._id !== reviewId),
      );
    } catch (requestError) {
      setReviewError(requestError.message);
    }
  };

  const imagePath = `/${String(selectedImage || product.image).replace(
    /^\/+/,
    "",
  )}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-12">
        <div className="grid gap-4 sm:grid-cols-[80px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-none sm:flex-col">
            {galleryImages.map((image) => (
              <button
                key={image}
                type="button"
                className={`min-w-[64px] overflow-hidden rounded-xl border-2 bg-slate-100 p-0 sm:min-w-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover ${
                  selectedImage === image
                    ? "border-brand-500"
                    : "border-transparent"
                }`}
                onClick={() => setSelectedImage(image)}
                aria-label={`View ${product.item_name}`}
              >
                <img src={`/${String(image).replace(/^\/+/, "")}`} alt="" />
              </button>
            ))}
          </div>

          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={imagePath}
              alt={product.item_name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="[&_h1]:mt-2 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.035em] [&_h1]:text-slate-950 sm:[&_h1]:text-4xl">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {product.brand || product.company}
          </p>

          <h1>{product.item_name}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 [&_svg]:text-amber-400">
            <FaStar />
            <strong>{product.rating?.stars?.toFixed(1) || "0.0"}</strong>
            <span>{product.rating?.count || 0} ratings</span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3 [&_strong]:text-3xl [&_strong]:font-black [&_strong]:text-slate-950 [&_span]:text-slate-400 [&_span]:line-through [&_em]:text-sm [&_em]:font-black [&_em]:not-italic [&_em]:text-emerald-700">
            <strong>₹{product.current_price?.toLocaleString("en-IN")}</strong>

            {product.original_price > product.current_price && (
              <span>₹{product.original_price?.toLocaleString("en-IN")}</span>
            )}

            {product.discount_percentage > 0 && (
              <em>{product.discount_percentage}% OFF</em>
            )}
          </div>

          <p
            className={`mt-2 text-sm font-black ${
              isOutOfStock
                ? "text-rose-600"
                : product.stock <= 5
                  ? "text-amber-700"
                  : "text-emerald-700"
            }`}
          >
            {stockMessage}
          </p>

          {product.description && (
            <p className="mt-6 border-t border-slate-200 pt-5 text-sm leading-7 text-slate-600">
              {product.description}
            </p>
          )}

          {needsSizeSelection && (
            <section className="mt-6">
              <div className="flex items-center justify-between gap-3 [&_h2]:text-sm [&_h2]:font-black [&_h2]:text-slate-950 [&_span]:text-xs [&_span]:text-slate-500">
                <h2>Select size</h2>
                <span>Required</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
                      selectedSize === size
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-300 bg-white text-slate-900 hover:border-brand-300"
                    }`}
                    onClick={() => {
                      setSelectedSize(size);
                      setSelectionError("");
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </section>
          )}

          {product.colors?.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between gap-3 [&_h2]:text-sm [&_h2]:font-black [&_h2]:text-slate-950 [&_span]:text-xs [&_span]:text-slate-500">
                <h2>Select color</h2>
                <span>{selectedColor || "Required"}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
                      selectedColor === color
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-300 bg-white text-slate-900 hover:border-brand-300"
                    }`}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6">
            <div className="flex items-center justify-between gap-3 [&_h2]:text-sm [&_h2]:font-black [&_h2]:text-slate-950 [&_span]:text-xs [&_span]:text-slate-500">
              <h2>Quantity</h2>
              <span>{product.stock} available</span>
            </div>

            <div className="mt-3 inline-flex items-center overflow-hidden rounded-xl border border-slate-300 [&_button]:grid [&_button]:h-10 [&_button]:w-11 [&_button]:place-items-center [&_button]:bg-white [&_button]:font-black [&_button]:text-slate-900 [&_span]:grid [&_span]:h-10 [&_span]:w-11 [&_span]:place-items-center [&_span]:border-x [&_span]:border-slate-300 [&_span]:font-black">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => updateQuantity(quantity - 1)}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                disabled={quantity >= product.stock}
                onClick={() => updateQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </section>

          {selectionError && (
            <p className="mt-4 text-sm font-bold text-rose-600">
              {selectionError}
            </p>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white hover:bg-brand-600 disabled:bg-slate-100 disabled:text-slate-400"
              disabled={isOutOfStock || isInBag}
              onClick={addToCart}
            >
              {isOutOfStock
                ? "Out of Stock"
                : isInBag
                  ? "Added to Cart"
                  : "Add to Cart"}
            </button>

            <button
              type="button"
              className="rounded-xl border border-brand-300 bg-white px-5 py-3.5 text-sm font-black text-brand-700 hover:bg-brand-50"
              onClick={toggleWishlist}
            >
              {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            </button>
          </div>

          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-black [&_h2]:text-slate-950 [&_p]:my-2 [&_p]:text-sm [&_p]:text-slate-600">
            <h2>Product information</h2>
            <p>
              <strong>Category:</strong> {product.category}
            </p>
            <p>
              <strong>Return policy:</strong> {product.return_period} day
              returns
            </p>
            <p>
              <strong>Delivery:</strong>{" "}
              {product.delivery_date ||
                "Delivery details available at checkout"}
            </p>
          </section>
        </div>
      </section>

      <section className="mt-10 border-t border-slate-200 pt-8">
        <div className="flex items-center justify-between gap-4 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-950 [&_a]:font-bold [&_a]:text-brand-700">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
              Verified customer feedback
            </p>
            <h2>Reviews ({reviews.length})</h2>
          </div>
          {!currentUser && (
            <Link to="/login">Log in to review after purchase</Link>
          )}
        </div>

        {currentUser && (
          <form
            className="my-6 grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 [&_h3]:font-black [&_h3]:text-slate-950 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-bold [&_label]:text-slate-700 [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2.5 [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:px-3 [&_select]:py-2.5 [&_textarea]:min-h-24 [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:px-3 [&_textarea]:py-2.5"
            onSubmit={submitReview}
          >
            <h3>
              {editingReviewId ? "Edit your review" : "Review this product"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
              <label>
                Rating
                <select
                  value={reviewForm.rating}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      rating: Number(event.target.value),
                    })
                  }
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Bad</option>
                </select>
              </label>
              <label>
                Title
                <input
                  value={reviewForm.title}
                  maxLength="120"
                  onChange={(event) =>
                    setReviewForm({ ...reviewForm, title: event.target.value })
                  }
                  required
                />
              </label>
            </div>
            <label>
              Comment
              <textarea
                value={reviewForm.comment}
                maxLength="1000"
                onChange={(event) =>
                  setReviewForm({ ...reviewForm, comment: event.target.value })
                }
                required
              />
            </label>
            <button
              type="submit"
              className="w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600"
              disabled={reviewSubmitting}
            >
              {reviewSubmitting
                ? "Saving..."
                : editingReviewId
                  ? "Update review"
                  : "Submit review"}
            </button>
            {editingReviewId && (
              <button
                type="button"
                className="ml-2 w-fit bg-transparent text-sm font-black text-brand-700"
                onClick={() => {
                  setEditingReviewId("");
                  setReviewForm({ rating: 5, title: "", comment: "" });
                }}
              >
                Cancel
              </button>
            )}
          </form>
        )}

        {reviewError && (
          <p className="mt-4 text-sm font-bold text-rose-600">{reviewError}</p>
        )}
        <div className="grid max-w-3xl gap-3">
          {reviews.length === 0 && <p>No reviews yet.</p>}
          {reviews.map((review) => (
            <article
              className="border-b border-slate-200 py-4 [&_p]:my-2 [&_p]:text-sm [&_p]:leading-6 [&_p]:text-slate-600 [&_button]:mr-3 [&_button]:text-sm [&_button]:font-black [&_button]:text-brand-700"
              key={review._id}
            >
              <div className="flex items-center justify-between gap-3 [&_strong]:text-slate-950 [&_span]:text-sm [&_span]:text-slate-500">
                <strong>{review.title}</strong>
                <span>
                  {review.rating}/5 · {review.user?.name || "Verified customer"}
                </span>
              </div>
              <p>{review.comment}</p>
              {currentUser?.id === review.user?._id && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReviewId(review._id);
                      setReviewForm({
                        rating: review.rating,
                        title: review.title,
                        comment: review.comment,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReview(review._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8 [&_h2]:mb-6 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-950">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
              You may also like
            </p>
            <h2>Related products</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {relatedProducts.map((item) => (
              <HomeItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewedProducts.length > 0 && (
        <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8 [&_h2]:mb-6 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-950">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
              Continue exploring
            </p>
            <h2>Recently viewed</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {recentlyViewedProducts.slice(0, 4).map((item) => (
              <HomeItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetails;
