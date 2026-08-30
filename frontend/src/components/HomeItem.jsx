import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { bagActions } from "../store/bagSlice";
import { GrAddCircle } from "react-icons/gr";
import { AiFillDelete } from "react-icons/ai";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { wishlistActions } from "../store/wishlistSlice";

const HomeItem = ({ item }) => {
  const dispatch = useDispatch();

  const bagItems = useSelector((store) => store.bag || []);
  const wishlistItems = useSelector((store) => store.wishlist || []);

  const elementFound = bagItems.includes(item.id);
  const wishlistFound = wishlistItems.includes(item.id);

  const handleAddToBag = () => {
    dispatch(bagActions.addToBag(item.id));
  };

  const handleRemove = () => {
    dispatch(bagActions.removeFromBag(item.id));
  };

  const handleWishlist = () => {
    dispatch(wishlistActions.addToWishlist(item.id));
  };

  const handleRemoveWishlist = () => {
    dispatch(wishlistActions.removeFromWishlist(item.id));
  };

  return (
    <div className="item-container">

      {/* Product Image */}
      <Link to={`/product/${item.id}`}>
        <img
          className="item-image"
          src={`/${item.image}`}
          alt={item.item_name}
        />
      </Link>

      <div className="rating">
        {item.rating?.stars || 0} ⭐ | {item.rating?.count || 0}
      </div>

      <div className="company-name">
        {item.company}
      </div>

      {/* Product Name */}
      <Link
        to={`/product/${item.id}`}
        className="product-link"
      >
        <div className="item-name">
          {item.item_name}
        </div>
      </Link>

      <div className="price">
        <span className="current-price">
          ₹{item.current_price}
        </span>

        <span className="original-price">
          ₹{item.original_price}
        </span>

        <span className="discount">
          ({item.discount_percentage}% OFF)
        </span>
      </div>

      {/* Cart */}
      {elementFound ? (
        <button
          type="button"
          className="btn btn-add-bag btn-danger"
          onClick={handleRemove}
        >
          <AiFillDelete /> Remove
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-add-bag btn-success"
          onClick={handleAddToBag}
        >
          <GrAddCircle /> Add to Cart
        </button>
      )}

      {/* Wishlist */}
      <button
        type="button"
        className={
          wishlistFound
            ? "btn btn-danger"
            : "btn btn-outline-danger"
        }
        onClick={
          wishlistFound
            ? handleRemoveWishlist
            : handleWishlist
        }
      >
        {wishlistFound ? (
          <>
            <FaHeart /> Remove Wishlist
          </>
        ) : (
          <>
            <FaRegHeart /> Wishlist
          </>
        )}
      </button>

    </div>
  );
};

export default HomeItem;