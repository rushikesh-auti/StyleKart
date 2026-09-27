import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";

const HomeItem = ({ item }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bagItems = useSelector((store) => store.bag || []);
  const wishlistItems = useSelector((store) => store.wishlist || []);
  const isUserAuthenticated = useSelector(
    (store) => store.userAuth?.isAuthenticated,
  );
  const isInBag = bagItems.some((bagItem) => bagItem.productId === item.id);
  const isInWishlist = wishlistItems.includes(item.id);
  const isOutOfStock = item.stock <= 0;
  const requiresOptions =
    (item.sizes?.length || 0) > 0 || (item.colors?.length || 0) > 0;
  const imagePath = `/${String(item.image || "").replace(/^\/+/, "")}`;

  const addToCart = () => {
    if (isOutOfStock || isInBag) return;
    if (!isUserAuthenticated) {
      navigate("/login", { state: { from: `/product/${item.id}` } });
      return;
    }
    if (requiresOptions) {
      navigate(`/product/${item.id}`);
      return;
    }
    dispatch(bagActions.addToBag({ productId: item.id, quantity: 1 }));
  };

  const toggleWishlist = () => {
    dispatch(
      isInWishlist
        ? wishlistActions.removeFromWishlist(item.id)
        : wishlistActions.addToWishlist(item.id),
    );
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <Link to={`/product/${item.id}`} className="block h-full">
          <img
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            src={imagePath}
            alt={item.item_name}
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-brand-600 shadow-md hover:bg-brand-50"
          onClick={toggleWishlist}
          aria-label="Toggle wishlist"
        >
          {isInWishlist ? <FaHeart /> : <FaRegHeart />}
        </button>
        {item.discount_percentage > 0 && (
          <span className="absolute bottom-3 left-3 rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">
            {item.discount_percentage}% OFF
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <Link to={`/product/${item.id}`} className="text-inherit no-underline">
          <p className="truncate text-[11px] font-black uppercase tracking-wider text-slate-500">
            {item.brand || item.company}
          </p>
          <h3 className="mt-1.5 line-clamp-2 min-h-[2.6rem] text-sm font-bold leading-5 text-slate-900 sm:text-[15px]">
            {item.item_name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-700">
          <FaStar className="text-amber-400" />
          <span>{item.rating?.stars?.toFixed(1) || "0.0"}</span>
          <span className="font-medium text-slate-400">
            ({item.rating?.count || 0})
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-black text-slate-950">
            ₹{item.current_price?.toLocaleString("en-IN")}
          </span>
          {item.original_price > item.current_price && (
            <span className="text-xs text-slate-400 line-through">
              ₹{item.original_price?.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <p
          className={`my-2 min-h-5 text-xs font-bold ${isOutOfStock ? "text-rose-600" : item.stock <= 5 ? "text-amber-700" : "text-emerald-700"}`}
        >
          {isOutOfStock
            ? "Out of stock"
            : item.stock <= 5
              ? `Only ${item.stock} left`
              : "In stock"}
        </p>
        <button
          type="button"
          className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          disabled={isOutOfStock || isInBag}
          onClick={addToCart}
        >
          {isOutOfStock
            ? "Unavailable"
            : isInBag
              ? "Added to Cart"
              : requiresOptions
                ? "Select Options"
                : "Add to Cart"}
        </button>
      </div>
    </article>
  );
};
export default HomeItem;
