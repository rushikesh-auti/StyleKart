import { BsFillPersonFill } from "react-icons/bs";
import { FaFaceGrinHearts, FaBagShopping } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { searchActions } from "../store/searchSlice";

const Header = () => {
  const dispatch = useDispatch();

  const bag = useSelector((store) => store.bag || []);

  const wishlist = useSelector((store) => store.wishlist || []);

  const handleSearch = (event) => {
    dispatch(
      searchActions.setSearchText(
        event.target.value
      )
    );
  };

  return (
    <header>
      <div className="logo_container">
        <Link to="/">
          <img
            className="stylekart_home"
            src="/images/stylekart.png"
            alt="StyleKart"
          />
        </Link>
      </div>

      <nav className="nav_bar">
        <a href="#">Men</a>
        <a href="#">Women</a>
        <a href="#">Kids</a>
        <a href="#">Home & Living</a>
        <a href="#">Beauty</a>
      </nav>

      <div className="search_bar">
        <input
          className="search_input"
          placeholder="Search products..."
          onChange={handleSearch}
        />
      </div>

      <div className="action_bar">
        <div className="action_container">
          <BsFillPersonFill />
          <span>Profile</span>
        </div>

        <Link
          className="action_container"
          to="/wishlist">
          <FaFaceGrinHearts />

          <span>Wishlist</span>

          <span className="bag-item-count">
            {wishlist.length}
          </span>
        </Link>

        <Link
          className="action_container"
          to="/bag">
          <FaBagShopping />
          <span>Bag</span>

          <span className="bag-item-count">
            {bag.length}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Header;