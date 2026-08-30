import { useSelector } from "react-redux";
import HomeItem from "../components/HomeItem";

const Women = () => {
  const items = useSelector((store) => store.items);

  const womenProducts = items.filter(
    (item) => item.category?.toLowerCase() === "women"
  );

  return (
    <main>
      <h2 className="category_heading">Women's Collection</h2>

      <div className="items-container">
        {womenProducts.length === 0 ? (
          <h2>No Products Found</h2>
        ) : (
          womenProducts.map((item) => (
            <HomeItem key={item.id} item={item} />
          ))
        )}
      </div>
    </main>
  );
};

export default Women;