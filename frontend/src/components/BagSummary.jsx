import { Link } from "react-router-dom";

const BagSummary = ({ summary }) => (
  <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 [&_h2]:mb-5 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-slate-950 [&>div]:my-3 [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:text-sm [&>div]:text-slate-500 [&_hr]:my-4 [&_hr]:border-slate-200 [&>p]:mb-5 [&>p]:mt-3 [&>p]:text-xs [&>p]:font-black [&>p]:text-emerald-700 [&>a]:block [&>a]:rounded-xl [&>a]:bg-slate-950 [&>a]:px-5 [&>a]:py-3 [&>a]:text-center [&>a]:text-sm [&>a]:font-black [&>a]:text-white">
    <h2>Price Details</h2>

    <div>
      <span>Total MRP ({summary.itemCount} items)</span>
      <strong>₹{summary.totalMrp.toLocaleString("en-IN")}</strong>
    </div>

    <div>
      <span>Discount on MRP</span>
      <strong className="text-emerald-700">
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

    <div className="text-base font-black text-slate-950">
      <span>Total Amount</span>
      <strong>₹{summary.totalAmount.toLocaleString("en-IN")}</strong>
    </div>

    <p>You save ₹{summary.savings.toLocaleString("en-IN")} on this order</p>

    <Link to="/checkout">Proceed to Checkout</Link>
  </aside>
);

export default BagSummary;
