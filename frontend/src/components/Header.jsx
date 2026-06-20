import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { BsFillPersonFill } from "react-icons/bs";
import { FaFaceGrinHearts, FaBagShopping } from "react-icons/fa6";
import { FaBars } from "react-icons/fa";
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
    <>
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

        <nav className="nav_bar">
          <Link to="/men" onClick={closeMenu}>
            Men
          </Link>

          <Link to="/women" onClick={closeMenu}>
            Women
          </Link>

          <Link to="/kids" onClick={closeMenu}>
            Kids
          </Link>

          <Link to="/beauty" onClick={closeMenu}>
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
          <Link
            to="/"
            className="action_container"
            onClick={closeMenu}
          >
            <BsFillPersonFill size={20} />
            <span className="action_name">Profile</span>
          </Link>

          <Link
            className="action_container"
            to="/wishlist"
            onClick={closeMenu}
          >
            <FaFaceGrinHearts size={20} />
            <span className="action_name">Wishlist</span>

            {wishlist.length > 0 && (
              <span className="bag-item-count">{wishlist.length}</span>
            )}
          </Link>

          <Link
            className="action_container"
            to="/bag"
            onClick={closeMenu}
          >
            <FaBagShopping size={20} />
            <span className="action_name">Cart</span>

            {bag.length > 0 && (
              <span className="bag-item-count">{bag.length}</span>
            )}
          </Link>
        </div>
      </header>

      <nav
        className="mobile_bottom_nav"
        role="navigation"
        aria-label="Mobile Navigation"
      >
        <Link to="/" className="mobile_nav_item" onClick={closeMenu}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5z"
              fill="currentColor"
            />
          </svg>
          <span>Home</span>
        </Link>

        <Link to="/categories" className="mobile_nav_item" onClick={closeMenu}>
          <FaBars />
          <span>Categories</span>
        </Link>

        <Link
          to="/wishlist"
          className="mobile_nav_item"
          onClick={closeMenu}
        >
          <FaFaceGrinHearts />
          <span>Wishlist</span>

          {wishlist.length > 0 && (
            <span className="bag-item-count">{wishlist.length}</span>
          )}
        </Link>

        <Link to="/bag" className="mobile_nav_item" onClick={closeMenu}>
          <FaBagShopping />
          <span>Cart</span>

          {bag.length > 0 && (
            <span className="bag-item-count">{bag.length}</span>
          )}
        </Link>

        <Link to="/" className="mobile_nav_item" >
          <BsFillPersonFill />
          <span>Account</span>
        </Link>
      </nav>
    </>
  );
};

export default Header;