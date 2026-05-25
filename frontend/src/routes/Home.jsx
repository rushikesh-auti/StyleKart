import { useSelector } from "react-redux";
import HomeItem from "../components/HomeItem";

const Home = () => {
  const items = useSelector((store) => store.items);

  const searchText = useSelector((store) => store.search);

  const filteredItems = items.filter((item) =>
    item.company.toLowerCase().includes(searchText.toLowerCase()) ||
    item.item_name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <main>
      <div className="items-container">
        {filteredItems.length === 0 ? (
          <h2>
            No Products Found
          </h2>
        ) : (
          filteredItems.map(
            (item) => (
              <HomeItem
                key={item.id}
                item={item}
              />
            )
          )
        )}
      </div>
    </main>
  );
};

export default Home;