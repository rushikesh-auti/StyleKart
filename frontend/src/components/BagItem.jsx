import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { RiDeleteBin5Fill } from "react-icons/ri";

import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";

const BagItem = ({ entry, item, quantity }) => {
  const dispatch = useDispatch();

  const updateQuantity = (nextQuantity) => {
    if (nextQuantity >= 1 && nextQuantity <= item.stock) {
      dispatch(
        bagActions.updateQuantity({
          key: entry.key,
          quantity: nextQuantity,
        }),
      );
    }
  };

  const removeItem = () => {
    dispatch(bagActions.removeFromBag(entry.key));
  };

  const moveToWishlist = () => {
    dispatch(wishlistActions.addToWishlist(item.id));
    dispatch(bagActions.removeFromBag(entry.key));
  };

  return (
    <article className="cart-item">
      <Link to={`/product/${item.id}`} className="cart-item-image-wrap">
        <img
          src={`/${String(item.image).replace(/^\/+/, "")}`}
          alt={item.item_name}
        />
      </Link>

      <div className="cart-item-content">
        <Link to={`/product/${item.id}`} className="cart-item-name">
          <p>{item.brand || item.company}</p>
          <h2>{item.item_name}</h2>
        </Link>

        <div className="cart-item-options">
          {entry.selectedSize && (
            <span>Size: {entry.selectedSize}</span>
          )}

          {entry.selectedColor && (
            <span>Color: {entry.selectedColor}</span>
          )}
        </div>

        <div className="cart-item-price">
          <strong>
            ₹{item.current_price.toLocaleString("en-IN")}
          </strong>

          {item.original_price > item.current_price && (
            <span>
              ₹{item.original_price.toLocaleString("en-IN")}
            </span>
          )}

          {item.discount_percentage > 0 && (
            <em>{item.discount_percentage}% OFF</em>
          )}
        </div>

        <div className="cart-item-quantity">
          <span>Quantity</span>

          <div>
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => updateQuantity(quantity - 1)}
            >
              −
            </button>

            <strong>{quantity}</strong>

            <button
              type="button"
              disabled={quantity >= item.stock}
              onClick={() => updateQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>

        <p
          className={
            item.stock <= 0
              ? "cart-item-stock out"
              : item.stock <= 5
                ? "cart-item-stock low"
                : "cart-item-stock"
          }
        >
          {item.stock <= 0
            ? "Out of stock"
            : item.stock <= 5
              ? `Only ${item.stock} left`
              : "In stock"}
        </p>

        <div className="cart-item-actions">
          <button type="button" onClick={moveToWishlist}>
            Move to Wishlist
          </button>

          <button type="button" onClick={removeItem}>
            <RiDeleteBin5Fill />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
};

export default BagItem;