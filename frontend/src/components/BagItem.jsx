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
          productId: entry.productId,
          selectedSize: entry.selectedSize || "",
          selectedColor: entry.selectedColor || "",
          quantity: nextQuantity,
        }),
      );
    }
  };

  const removeItem = () => {
    dispatch(
      bagActions.removeFromBag({
        productId: entry.productId,
        selectedSize: entry.selectedSize || "",
        selectedColor: entry.selectedColor || "",
      }),
    );
  };

  const moveToWishlist = () => {
    dispatch(wishlistActions.addToWishlist(item.id));
    dispatch(
      bagActions.removeFromBag({
        productId: entry.productId,
        selectedSize: entry.selectedSize || "",
        selectedColor: entry.selectedColor || "",
      }),
    );
  };

  return (
    <article className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[145px_minmax(0,1fr)] sm:gap-5 sm:p-4">
      <Link
        to={`/product/${item.id}`}
        className="aspect-[4/5] overflow-hidden rounded-xl bg-slate-100 [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
      >
        <img
          src={`/${String(item.image).replace(/^\/+/, "")}`}
          alt={item.item_name}
        />
      </Link>

      <div className="min-w-0">
        <Link
          to={`/product/${item.id}`}
          className="text-inherit no-underline [&_p]:text-[11px] [&_p]:font-black [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-slate-500 [&_h2]:mt-1 [&_h2]:text-base [&_h2]:font-black [&_h2]:text-slate-950"
        >
          <p>{item.brand || item.company}</p>
          <h2>{item.item_name}</h2>
        </Link>

        <div className="mt-3 flex flex-wrap gap-2 [&_span]:rounded-lg [&_span]:bg-slate-100 [&_span]:px-2.5 [&_span]:py-1 [&_span]:text-xs [&_span]:font-bold [&_span]:text-slate-600">
          {entry.selectedSize && <span>Size: {entry.selectedSize}</span>}

          {entry.selectedColor && <span>Color: {entry.selectedColor}</span>}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-2 [&_strong]:text-base [&_strong]:font-black [&_strong]:text-slate-950 [&_span]:text-xs [&_span]:text-slate-400 [&_span]:line-through [&_em]:text-xs [&_em]:font-black [&_em]:not-italic [&_em]:text-emerald-700">
          <strong>₹{item.current_price.toLocaleString("en-IN")}</strong>

          {item.original_price > item.current_price && (
            <span>₹{item.original_price.toLocaleString("en-IN")}</span>
          )}

          {item.discount_percentage > 0 && (
            <em>{item.discount_percentage}% OFF</em>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 [&_div]:inline-flex [&_div]:overflow-hidden [&_div]:rounded-lg [&_div]:border [&_div]:border-slate-300 [&_button]:grid [&_button]:h-8 [&_button]:w-8 [&_button]:place-items-center [&_button]:bg-white [&_button]:text-slate-800 [&_button]:hover:bg-slate-50 [&_button:disabled]:text-slate-300 [&_strong]:grid [&_strong]:h-8 [&_strong]:w-8 [&_strong]:place-items-center [&_strong]:border-x [&_strong]:border-slate-300">
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
          className={`mt-3 text-xs font-black ${
            item.stock <= 0
              ? "text-rose-600"
              : item.stock <= 5
                ? "text-amber-700"
                : "text-emerald-700"
          }`}
        >
          {item.stock <= 0
            ? "Out of stock"
            : item.stock <= 5
              ? `Only ${item.stock} left`
              : "In stock"}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 [&_button]:inline-flex [&_button]:items-center [&_button]:gap-1.5 [&_button]:bg-transparent [&_button]:text-xs [&_button]:font-black [&_button]:text-brand-700 [&_button]:hover:text-brand-800">
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
