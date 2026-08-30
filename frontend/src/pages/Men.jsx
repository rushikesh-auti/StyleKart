import { useSelector } from "react-redux";
import HomeItem from "../components/HomeItem";

const Men = () => {
  const items = useSelector((store) => store.items);

  const menProducts = items.filter(
    (item) => item.category?.toLowerCase() === "men"
  );

  return (
    <main>
      <h2 className="category_heading">Men's Collection</h2>

      <div className="items-container">
        {menProducts.length === 0 ? (
          <h2>No Products Found</h2>
        ) : (
          menProducts.map((item) => (
            <HomeItem key={item.id} item={item} />
          ))
        )}
      </div>
    </main>
  );
};

export default Men;