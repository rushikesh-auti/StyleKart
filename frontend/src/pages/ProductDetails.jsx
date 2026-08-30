import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";

const ProductDetails = () => {
  const { id } = useParams();

  const dispatch = useDispatch();

  const bagItems = useSelector((store) => store.bag);
  const wishlistItems = useSelector((store) => store.wishlist);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `https://stylekart-7x1q.onrender.com/api/products/${id}`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        setProduct(data.product);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="product-details-status">
        <h3>Loading product...</h3>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-status">
        <h3>{error || "Product not found"}</h3>
      </div>
    );
  }

  const isInBag = bagItems.includes(product.id);
  const isInWishlist = wishlistItems.includes(product.id);

  const handleAddToBag = () => {
    if (!isInBag) {
      dispatch(bagActions.addToBag(product.id));
    }
  };

  const handleRemoveFromBag = () => {
    if (isInBag) {
      dispatch(bagActions.removeFromBag(product.id));
    }
  };

  const handleWishlist = () => {
    if (!isInWishlist) {
      dispatch(wishlistActions.addToWishlist(product.id));
    }
  };

  const handleRemoveWishlist = () => {
    if (isInWishlist) {
      dispatch(wishlistActions.removeFromWishlist(product.id));
    }
  };

  return (
    <main className="product-details-page">
      <div className="product-details-container">

        <div className="product-details-image-section">
          <img
            src={`/${product.image}`}
            alt={product.item_name}
            className="product-details-image"
          />
        </div>

        <div className="product-details-info">

          <h1 className="product-details-company">
            {product.company}
          </h1>

          <p className="product-details-name">
            {product.item_name}
          </p>

          <div className="product-details-rating">
            {product.rating?.stars || 0} ⭐
            <span>
              | {product.rating?.count || 0} Ratings
            </span>
          </div>

          <hr />

          <div className="product-details-price">

            <span className="details-current-price">
              ₹{product.current_price}
            </span>

            <span className="details-original-price">
              ₹{product.original_price}
            </span>

            <span className="details-discount">
              {product.discount_percentage}% OFF
            </span>

          </div>

          <p className="tax-info">
            inclusive of all taxes
          </p>

          {product.sizes?.length > 0 && (
            <div className="product-option">
              <h3>Select Size</h3>

              <div className="size-options">
                {product.sizes.map((size) => (
                  <button
                    type="button"
                    key={size}
                    className="size-button"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="product-option">
              <h3>Available Colors</h3>

              <div className="color-options">
                {product.colors.map((color) => (
                  <span
                    className="color-option"
                    key={color}
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="product-details-actions">

            {isInBag ? (
              <button
                type="button"
                className="details-remove-button"
                onClick={handleRemoveFromBag}
              >
                Remove from Cart
              </button>
            ) : (
              <button
                type="button"
                className="details-cart-button"
                onClick={handleAddToBag}
              >
                Add to Cart
              </button>
            )}

            {isInWishlist ? (
              <button
                type="button"
                className="details-wishlist-button active"
                onClick={handleRemoveWishlist}
              >
                ♥ Remove Wishlist
              </button>
            ) : (
              <button
                type="button"
                className="details-wishlist-button"
                onClick={handleWishlist}
              >
                ♡ Wishlist
              </button>
            )}

          </div>

          <div className="product-information">

            <h3>Product Details</h3>

            <p>
              <strong>Brand:</strong> {product.brand || product.company}
            </p>

            <p>
              <strong>Category:</strong> {product.category}
            </p>

            <p>
              <strong>Subcategory:</strong> {product.subcategory}
            </p>

            <p>
              <strong>Stock:</strong> {product.stock}
            </p>

            {product.return_period && (
              <p>
                <strong>Return:</strong> {product.return_period}
              </p>
            )}

            {product.delivery_date && (
              <p>
                <strong>Delivery:</strong> {product.delivery_date}
              </p>
            )}

          </div>

        </div>

      </div>
    </main>
  );
};

export default ProductDetails;