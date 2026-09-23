import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";

import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";

const HomeItem = ({ item }) => {
  const dispatch = useDispatch();
  const bagItems = useSelector((store) => store.bag || []);
  const wishlistItems = useSelector((store) => store.wishlist || []);

  const isInBag = bagItems.some((bagItem) => bagItem.productId === item.id);
  const isInWishlist = wishlistItems.includes(item.id);
  const isOutOfStock = item.stock <= 0;
  const imagePath = `/${String(item.image || "").replace(/^\/+/, "")}`;

  const addToCart = () => {
    if (!isOutOfStock && !isInBag) {
      dispatch(
        bagActions.addToBag({
          productId: item.id,
          quantity: 1,
        }),
      );
    }
  };

  const toggleWishlist = () => {
    if (isInWishlist) {
      dispatch(wishlistActions.removeFromWishlist(item.id));
      return;
    }

    dispatch(wishlistActions.addToWishlist(item.id));
  };

  return (
    <article className="product-card">
      <div className="product-card-image-wrap">
        <Link to={`/product/${item.id}`} className="product-card-image-link">
          <img
            className="product-card-image"
            src={imagePath}
            alt={item.item_name}
            loading="lazy"
          />
        </Link>

        <button
          type="button"
          className="product-card-wishlist"
          onClick={toggleWishlist}
          aria-label={
            isInWishlist
              ? `Remove ${item.item_name} from wishlist`
              : `Add ${item.item_name} to wishlist`
          }
        >
          {isInWishlist ? <FaHeart /> : <FaRegHeart />}
        </button>

        {item.discount_percentage > 0 && (
          <span className="product-card-deal">
            {item.discount_percentage}% OFF
          </span>
        )}
      </div>

      <div className="product-card-content">
        <Link to={`/product/${item.id}`} className="product-card-details">
          <p className="product-card-brand">{item.brand || item.company}</p>

          <h3 className="product-card-name">{item.item_name}</h3>
        </Link>

        <div className="product-card-rating">
          <FaStar />
          <span>{item.rating?.stars?.toFixed(1) || "0.0"}</span>
          <span className="product-card-rating-count">
            ({item.rating?.count || 0})
          </span>
        </div>

        <div className="product-card-price">
          <span className="product-card-current-price">
            ₹{item.current_price?.toLocaleString("en-IN")}
          </span>

          {item.original_price > item.current_price && (
            <span className="product-card-original-price">
              ₹{item.original_price?.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <p
          className={
            isOutOfStock
              ? "product-card-stock out-of-stock"
              : item.stock <= 5
                ? "product-card-stock low-stock"
                : "product-card-stock"
          }
        >
          {isOutOfStock
            ? "Out of stock"
            : item.stock <= 5
              ? `Only ${item.stock} left`
              : "In stock"}
        </p>

        <button
          type="button"
          className="product-card-cart-button"
          disabled={isOutOfStock || isInBag}
          onClick={addToCart}
        >
          {isOutOfStock
            ? "Unavailable"
            : isInBag
              ? "Added to Cart"
              : "Add to Cart"}
        </button>
      </div>
    </article>
  );
};

export default HomeItem;
