import { useSelector } from "react-redux";
import HomeItem from "../components/HomeItem";

const Kids = () => {
  const items = useSelector((store) => store.items);

  const kidsProducts = items.filter(
    (item) => item.category?.toLowerCase() === "kids"
  );

  return (
    <main>
      <h2 className="category_heading">Kids' Collection</h2>

      <div className="items-container">
        {kidsProducts.length === 0 ? (
          <h2>No Products Found</h2>
        ) : (
          kidsProducts.map((item) => (
            <HomeItem key={item.id} item={item} />
          ))
        )}
      </div>
    </main>
  );
};

export default Kids;