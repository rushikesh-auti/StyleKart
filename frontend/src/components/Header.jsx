import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { BsFillPersonFill } from "react-icons/bs";
import { FaFaceGrinHearts, FaBagShopping } from "react-icons/fa6";
import { FaBars, FaTimes } from "react-icons/fa";
import { searchActions } from "../store/searchSlice";

const Header = () => {
  const dispatch = useDispatch();

  const [menuOpen, setMenuOpen] = useState(false);

  const bag = useSelector((store) => store.bag || []);
  const wishlist = useSelector((store) => store.wishlist || []);

  const handleSearch = (event) => {
    dispatch(searchActions.setSearchText(event.target.value));
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header>
      <div className="logo_container">
        <Link to="/" onClick={closeMenu}>
          <img
            className="stylekart_home"
            src="/images/stylekart.png"
            alt="StyleKart"
          />
        </Link>
      </div>

      <div
        className="menu_icon"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </div>

      <nav className={`nav_bar ${menuOpen ? "active" : ""}`}>
        <Link to="/" >
          Men
        </Link>

        <Link to="/" >
          Women
        </Link>

        <Link to="/" >
          Kids
        </Link>

        <Link to="/" >
          Home & Living
        </Link>

        <Link to="/" >
          Beauty
        </Link>
      </nav>

      <div className="search_bar">
        <input
          type="text"
          className="search_input"
          placeholder="Search products..."
          onChange={handleSearch}
        />
      </div>

      <div className="action_bar">
        <div className="action_container">
          <BsFillPersonFill size={20} />
          <span className="action_name">Profile</span>
        </div>

        <Link
          className="action_container"
          to="/wishlist"
          onClick={closeMenu}
        >
          <FaFaceGrinHearts size={20} />

          <span className="action_name">Wishlist</span>

          <span className="bag-item-count">
            {wishlist.length}
          </span>
        </Link>

        <Link
          className="action_container"
          to="/bag"
          onClick={closeMenu}
        >
          <FaBagShopping size={20} />

          <span className="action_name">Bag</span>

          <span className="bag-item-count">
            {bag.length}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Header;