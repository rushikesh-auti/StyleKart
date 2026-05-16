import { useDispatch, useSelector } from "react-redux";
import { bagActions } from "../store/bagSlice";
import { GrAddCircle } from "react-icons/gr";
import { AiFillDelete } from "react-icons/ai";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { wishlistActions } from "../store/wishlistSlice";

const HomeItem = ({ item }) => {
  const dispatch = useDispatch();

  const bagItems = useSelector(
    (store) => store.bag 
  );

  const wishlistItems = useSelector(
    (store) => store.wishlist 
  );

  const elementFound =
    bagItems.indexOf(item.id) >= 0;

  const wishlistFound =
    wishlistItems.indexOf(item.id) >= 0;

  const handleAddToBag = () => {
    dispatch(
      bagActions.addToBag(item.id)
    );
  };

  const handleRemove = () => {
    dispatch(
      bagActions.removeFromBag(item.id)
    );
  };

  const handleWishlist = () => {
    dispatch(
      wishlistActions.addToWishlist(item.id)
    );
  };

  const handleRemoveWishlist = () => {
    dispatch(
      wishlistActions.removeFromWishlist(item.id)
    );
  };

  return (
    <div className="item-container">
      <img
        className="item-image"
        src={item.image}
        alt="item image"
      />

      <div className="rating">
        {item.rating.stars} ⭐ |
        {item.rating.count}
      </div>

      <div className="company-name">
        {item.company}
      </div>

      <div className="item-name">
        {item.item_name}
      </div>

      <div className="price">
        <span className="current-price">
          Rs {item.current_price}
        </span>

        <span className="original-price">
          Rs {item.original_price}
        </span>

        <span className="discount">
          ({item.discount_percentage}% OFF)
        </span>
      </div>

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
          <GrAddCircle /> Add to Bag
        </button>
      )}

      <br />
      <br />

      {wishlistFound ? (
        <button
          className="btn btn-danger"
          onClick={handleRemoveWishlist}
        >
          <FaHeart /> Remove Wishlist
        </button>
      ) : (
        <button
          className="btn btn-outline-danger"
          onClick={handleWishlist}
        >
          <FaRegHeart /> Wishlist
        </button>
      )}
    </div>
  );
};

export default HomeItem;