import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import BagItem from "../components/BagItem";
import BagSummary from "../components/BagSummary";
import { getCartSummary } from "../utils/cartCalculations";

const Bag = () => {
  const bagEntries = useSelector((state) => state.bag || []);
  const products = useSelector((state) => state.items || []);

  const summary = getCartSummary(bagEntries, products);

  if (summary.lines.length === 0) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid min-h-[45vh] place-content-center justify-items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-slate-950 [&_p]:text-sm [&_p]:text-slate-500 [&_a]:rounded-xl [&_a]:bg-slate-950 [&_a]:px-5 [&_a]:py-3 [&_a]:text-sm [&_a]:font-black [&_a]:text-white">
          <h1>Your cart is empty</h1>
          <p>Find styles you love and add them to your cart.</p>
          <Link to="/products">Continue Shopping</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.03em] [&_h1]:text-slate-950 sm:[&_h1]:text-4xl [&_a]:rounded-xl [&_a]:bg-slate-950 [&_a]:px-5 [&_a]:py-3 [&_a]:text-sm [&_a]:font-black [&_a]:text-white">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
            Your shopping bag
          </p>
          <h1>Cart ({summary.itemCount} items)</h1>
        </div>

        <Link to="/products">Continue Shopping</Link>
      </section>

      <section className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4">
          {summary.lines.map(({ entry, product, quantity }) => (
            <BagItem
              key={entry.key}
              entry={entry}
              item={product}
              quantity={quantity}
            />
          ))}
        </div>

        <BagSummary summary={summary} />
      </section>
    </main>
  );
};

export default Bag;
