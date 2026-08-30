import { useSelector } from "react-redux";
import HomeItem from "../components/HomeItem";

const Beauty = () => {
  const items = useSelector((store) => store.items);

  const beautyProducts = items.filter(
    (item) => item.category?.toLowerCase() === "beauty"
  );

  return (
    <main>
      <h2 className="category_heading">Beauty Collection</h2>

      <div className="items-container">
        {beautyProducts.length === 0 ? (
          <h2>No Products Found</h2>
        ) : (
          beautyProducts.map((item) => (
            <HomeItem key={item.id} item={item} />
          ))
        )}
      </div>
    </main>
  );
};

export default Beauty;