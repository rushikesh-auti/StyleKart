import BagItem from "../components/BagItem";
import BagSummary from "../components/BagSummary";
import { useSelector } from "react-redux";

const Bag = () => {
  const bagItems = useSelector((state) => state.bag);
  const items = useSelector((state) => state.items);
  const finalItems = items.filter((item) => {
    const itemIndex = bagItems.indexOf(item.id);
    return itemIndex >= 0;
  });

  return (
    <main>
      <div className="bag-page">
        <div className="bag-items-container">
          {finalItems.length === 0 ? (
            <div className="text-center p-5">
              <h2>Your cart is empty</h2>
              <p className="text-muted">Add products to see them here.</p>
            </div>
          ) : (
            finalItems.map((item) => <BagItem key={item.id} item={item} />)
          )}
        </div>
        {finalItems.length > 0 && <BagSummary />}
      </div>
    </main>
  );
};

export default Bag;
