import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHeart, FaTrashCan } from "react-icons/fa6";

import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistIds = useSelector((store) => store.wishlist || []);
  const products = useSelector((store) => store.items || []);
  const isUserAuthenticated = useSelector(
    (store) => store.userAuth?.isAuthenticated,
  );
  const wishlistProducts = products.filter((product) =>
    wishlistIds.includes(product.id),
  );

  const handleMoveToBag = (product) => {
    if (!isUserAuthenticated) {
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }

    const requiresOptions =
      (product.sizes?.length || 0) > 0 || (product.colors?.length || 0) > 0;

    if (requiresOptions) {
      navigate(`/product/${product.id}`);
      return;
    }

    dispatch(
      bagActions.addToBag({
        productId: product.id,
        quantity: 1,
      }),
    );
    dispatch(wishlistActions.removeFromWishlist(product.id));
  };

  const handleRemove = (id) => {
    dispatch(wishlistActions.removeFromWishlist(id));
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
            Saved for later
          </p>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
            My Wishlist
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {wishlistProducts.length}{" "}
            {wishlistProducts.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        <FaHeart className="hidden text-3xl text-brand-500 sm:block" />
      </div>

      {wishlistProducts.length === 0 ? (
        <section className="grid min-h-[45vh] place-content-center justify-items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-2xl text-brand-600">
            <FaHeart />
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-950">
            Your wishlist is empty
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Save products you love and they’ll appear here for quick access
            later.
          </p>
          <Link
            to="/products"
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
          >
            Explore Products
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {wishlistProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
            >
              <Link
                to={`/product/${product.id}`}
                className="block aspect-[4/5] overflow-hidden bg-slate-100"
              >
                <img
                  src={`/${String(product.image || "").replace(/^\/+/, "")}`}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  alt={product.item_name}
                />
              </Link>

              <div className="p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {product.brand || product.company}
                </p>
                <Link
                  to={`/product/${product.id}`}
                  className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-slate-900 hover:text-brand-700"
                >
                  {product.item_name}
                </Link>

                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  <strong className="text-base font-black text-slate-950">
                    ₹{product.current_price?.toLocaleString("en-IN")}
                  </strong>
                  {product.original_price > product.current_price && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{product.original_price?.toLocaleString("en-IN")}
                    </span>
                  )}
                  {product.discount_percentage > 0 && (
                    <span className="text-xs font-black text-emerald-700">
                      {product.discount_percentage}% OFF
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={product.stock <= 0}
                  onClick={() => handleMoveToBag(product)}
                >
                  {product.stock <= 0
                    ? "Out of Stock"
                    : product.sizes?.length || product.colors?.length
                      ? "Select Options"
                      : "Move to Cart"}
                </button>

                <button
                  type="button"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-50"
                  onClick={() => handleRemove(product.id)}
                >
                  <FaTrashCan /> Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default Wishlist;
