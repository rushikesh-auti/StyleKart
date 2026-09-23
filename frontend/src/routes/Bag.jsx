import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import BagItem from "../components/BagItem";
import BagSummary from "../components/BagSummary";
import { getCartSummary } from "../utils/cartCalculations";
import "../styles/cart.css";

const Bag = () => {
  const bagEntries = useSelector((state) => state.bag || []);
  const products = useSelector((state) => state.items || []);

  const summary = getCartSummary(bagEntries, products);

  if (summary.lines.length === 0) {
    return (
      <main className="cart-page">
        <section className="cart-empty-state">
          <h1>Your cart is empty</h1>
          <p>Find styles you love and add them to your cart.</p>
          <Link to="/products">Continue Shopping</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-header">
        <div>
          <p className="home-eyebrow">Your shopping bag</p>
          <h1>Cart ({summary.itemCount} items)</h1>
        </div>

        <Link to="/products">Continue Shopping</Link>
      </section>

      <section className="cart-layout">
        <div className="cart-items">
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