import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaStar } from "react-icons/fa";

import HomeItem from "../components/HomeItem";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";
import { adminApiUrl } from "../utils/adminApi";
import { getProducts } from "../utils/productApi";
import {
  addRecentlyViewedProduct,
  getRecentlyViewedProducts,
} from "../utils/recentlyViewed";
import "../styles/home.css";
import "../styles/productDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const bagItems = useSelector((store) => store.bag || []);
  const wishlistItems = useSelector((store) => store.wishlist || []);

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
      <main className="product-details-status">
        <h1>Loading product...</h1>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-details-status">
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
    if (needsSizeSelection && !selectedSize) {
      setSelectionError("Please select a size before adding to cart.");
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

  const imagePath = `/${String(selectedImage || product.image).replace(
    /^\/+/,
    "",
  )}`;

  return (
    <main className="product-details-page">
      <section className="product-details-container">
        <div className="product-gallery">
          <div className="product-thumbnail-list">
            {galleryImages.map((image) => (
              <button
                key={image}
                type="button"
                className={
                  selectedImage === image
                    ? "product-thumbnail active"
                    : "product-thumbnail"
                }
                onClick={() => setSelectedImage(image)}
                aria-label={`View ${product.item_name}`}
              >
                <img src={`/${String(image).replace(/^\/+/, "")}`} alt="" />
              </button>
            ))}
          </div>

          <div className="product-main-image-wrap">
            <img
              src={imagePath}
              alt={product.item_name}
              className="product-main-image"
            />
          </div>
        </div>

        <div className="product-details-info">
          <p className="product-details-brand">
            {product.brand || product.company}
          </p>

          <h1>{product.item_name}</h1>

          <div className="product-details-rating">
            <FaStar />
            <strong>{product.rating?.stars?.toFixed(1) || "0.0"}</strong>
            <span>{product.rating?.count || 0} ratings</span>
          </div>

          <div className="product-details-price">
            <strong>₹{product.current_price?.toLocaleString("en-IN")}</strong>

            {product.original_price > product.current_price && (
              <span>₹{product.original_price?.toLocaleString("en-IN")}</span>
            )}

            {product.discount_percentage > 0 && (
              <em>{product.discount_percentage}% OFF</em>
            )}
          </div>

          <p
            className={
              isOutOfStock
                ? "product-stock-status out-of-stock"
                : product.stock <= 5
                  ? "product-stock-status low-stock"
                  : "product-stock-status"
            }
          >
            {stockMessage}
          </p>

          {product.description && (
            <p className="product-description">{product.description}</p>
          )}

          {needsSizeSelection && (
            <section className="product-option-group">
              <div className="product-option-heading">
                <h2>Select size</h2>
                <span>Required</span>
              </div>

              <div className="product-size-options">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={
                      selectedSize === size
                        ? "product-size-option active"
                        : "product-size-option"
                    }
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
            <section className="product-option-group">
              <div className="product-option-heading">
                <h2>Select color</h2>
                <span>{selectedColor || "Optional"}</span>
              </div>

              <div className="product-color-options">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={
                      selectedColor === color
                        ? "product-color-option active"
                        : "product-color-option"
                    }
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="product-option-group">
            <div className="product-option-heading">
              <h2>Quantity</h2>
              <span>{product.stock} available</span>
            </div>

            <div className="product-quantity-control">
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
            <p className="product-selection-error">{selectionError}</p>
          )}

          <div className="product-details-actions">
            <button
              type="button"
              className="product-add-cart"
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
              className="product-add-wishlist"
              onClick={toggleWishlist}
            >
              {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            </button>
          </div>

          <section className="product-information-card">
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

      {relatedProducts.length > 0 && (
        <section className="product-recommendation-section">
          <div>
            <p className="home-eyebrow">You may also like</p>
            <h2>Related products</h2>
          </div>

          <div className="home-product-grid">
            {relatedProducts.map((item) => (
              <HomeItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewedProducts.length > 0 && (
        <section className="product-recommendation-section">
          <div>
            <p className="home-eyebrow">Continue exploring</p>
            <h2>Recently viewed</h2>
          </div>

          <div className="home-product-grid">
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
