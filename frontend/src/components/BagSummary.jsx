import { Link } from "react-router-dom";

const BagSummary = ({ summary }) => (
  <aside className="cart-summary">
    <h2>Price Details</h2>

    <div>
      <span>Total MRP ({summary.itemCount} items)</span>
      <strong>₹{summary.totalMrp.toLocaleString("en-IN")}</strong>
    </div>

    <div>
      <span>Discount on MRP</span>
      <strong className="cart-summary-discount">
        −₹{summary.discount.toLocaleString("en-IN")}
      </strong>
    </div>

    <div>
      <span>Delivery</span>
      <strong>
        {summary.delivery === 0
          ? "FREE"
          : `₹${summary.delivery.toLocaleString("en-IN")}`}
      </strong>
    </div>

    <hr />

    <div className="cart-summary-total">
      <span>Total Amount</span>
      <strong>
        ₹{summary.totalAmount.toLocaleString("en-IN")}
      </strong>
    </div>

    <p>
      You save ₹{summary.savings.toLocaleString("en-IN")} on this order
    </p>

    <Link to="/checkout">Proceed to Checkout</Link>
  </aside>
);

export default BagSummary;