import { useSelector, useDispatch } from "react-redux";
import { wishlistActions } from "../store/wishlistSlice";
import { bagActions } from "../store/bagSlice";

const Wishlist = () => {
  const dispatch = useDispatch();

  const wishlistIds = useSelector(
    (store) => store.wishlist
  );

  const products = useSelector(
    (store) => store.items
  );

  const wishlistProducts = products.filter(
    (product) => wishlistIds.includes(product.id)
  );

  const handleMoveToBag = (id) => {
    dispatch(bagActions.addToBag(id));
    dispatch(
      wishlistActions.removeFromWishlist(id)
    );
  };

  const handleRemove = (id) => {
    dispatch(
      wishlistActions.removeFromWishlist(id)
    );
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">
        My Wishlist ({wishlistProducts.length} items)
      </h2>

      {wishlistProducts.length === 0 ? (
        <div className="text-center mt-5">
          <h3>Wishlist is empty</h3>
          <p>
            Add products you like and they'll
            appear here.
          </p>
        </div>
      ) : (
        <div className="row">
          {wishlistProducts.map((product) => (
            <div
              className="col-lg-3 col-md-4 col-sm-6 mb-4"
              key={product.id}
            >
              <div className="card h-100">

                <img
                  src={product.image}
                  className="card-img-top"
                  alt={product.item_name}
                />

                <div className="card-body">

                  <h6>
                    {product.company}
                  </h6>

                  <p>
                    {product.item_name}
                  </p>

                  <div>
                    <strong>
                      ₹{product.current_price}
                    </strong>

                    <span
                      style={{
                        textDecoration:
                          "line-through",
                        marginLeft: "8px",
                      }}
                    >
                      ₹{product.original_price}
                    </span>

                    <span
                      style={{
                        color: "green",
                        marginLeft: "8px",
                      }}
                    >
                      {product.discount_percentage}% OFF
                    </span>
                  </div>

                  <button
                    className="btn btn-success w-100 mt-3"
                    onClick={() =>
                      handleMoveToBag(product.id)
                    }
                  >
                    Move to Cart
                  </button>

                  <button
                    className="btn btn-outline-danger w-100 mt-2"
                    onClick={() =>
                      handleRemove(product.id)
                    }
                  >
                    Remove
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;