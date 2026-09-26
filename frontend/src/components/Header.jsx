import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { BsFillPersonFill } from "react-icons/bs";
import { BsShieldLockFill } from "react-icons/bs";
import { FaChevronDown } from "react-icons/fa6";
import { FaFaceGrinHearts, FaBagShopping } from "react-icons/fa6";
import { FaBars, FaHome } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import { searchActions } from "../store/searchSlice";
import { clearUserSession } from "../store/userAuthSlice";
import { clearAdminSession } from "../store/adminAuthSlice";
import { adminApiUrl } from "../utils/adminApi";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const bag = useSelector((store) => store.bag || []);
  const wishlist = useSelector((store) => store.wishlist || []);
  const isUserAuthenticated = useSelector(
    (store) => store.userAuth?.isAuthenticated,
  );
  const isAdminAuthenticated = useSelector(
    (store) => store.adminAuth?.isAuthenticated,
  );
  const user = useSelector((store) => store.userAuth?.user);
  const [searchText, setSearchText] = useState("");

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchText(value);
    dispatch(searchActions.setSearchText(value));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const value = searchText.trim();
    navigate(
      value ? `/products?search=${encodeURIComponent(value)}` : "/products",
    );
  };

  const closeMenu = () => undefined;

  const handleUserLogout = () => {
    fetch(adminApiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => undefined);
    dispatch(clearUserSession());
    closeMenu();
  };

  const handleAdminLogout = () => {
    fetch(adminApiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => undefined);
    dispatch(clearAdminSession());
    window.location.assign("/admin/login");
  };

  return (
    <>
      <header className="site-header">
        <div className="logo_container">
          <Link to="/" onClick={closeMenu}>
            <img
              className="stylekart_home"
              src="/images/stylekart.png"
              alt="StyleKart"
            />
          </Link>
        </div>

        <nav className="nav_bar" aria-label="Primary navigation">
          <NavLink to="/men" onClick={closeMenu}>
            Men
          </NavLink>

          <NavLink to="/women" onClick={closeMenu}>
            Women
          </NavLink>

          <NavLink to="/kids" onClick={closeMenu}>
            Kids
          </NavLink>

          <NavLink to="/beauty" onClick={closeMenu}>
            Beauty
          </NavLink>
        </nav>

        <form className="search_bar" role="search" onSubmit={submitSearch}>
          <FaSearch aria-hidden="true" />
          <input
            type="text"
            className="search_input"
            placeholder="Search products..."
            aria-label="Search products"
            value={searchText}
            onChange={handleSearch}
          />
          {searchText && (
            <button
              type="button"
              className="search_clear"
              aria-label="Clear search"
              onClick={() => handleSearch({ target: { value: "" } })}
            >
              x
            </button>
          )}
        </form>

        <div className="action_bar">
          {isAdminAuthenticated ? (
            <div className="desktop-header-actions">
              <Link
                to="/admin"
                className="action_container"
                onClick={closeMenu}
              >
                <BsShieldLockFill size={20} />
                <span className="action_name">Admin Dashboard</span>
              </Link>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleAdminLogout}
                title="Log out"
              >
                Admin Logout
              </button>
            </div>
          ) : isUserAuthenticated ? (
            <div className="desktop-header-actions">
              <Link
                to="/profile"
                className="action_container"
                onClick={closeMenu}
              >
                <BsFillPersonFill size={20} />
                <span className="action_name">{user.name || "Profile"}</span>
              </Link>
              {/* <Link
                to="/orders"
                className="action_container"
                onClick={closeMenu}
              >
                <span className="action_name">Orders</span>
              </Link> */}
            </div>
          ) : (
            <details className="auth_menu desktop-header-actions">
              <summary className="action_container auth_trigger">
                <BsFillPersonFill size={20} />
                <span className="action_name">Login</span>
                <FaChevronDown className="auth_chevron" size={10} />
              </summary>
              <div className="auth_dropdown">
                <div className="auth_dropdown_title">Sign in to StyleKart</div>
                <Link to="/login" onClick={closeMenu}>
                  <BsFillPersonFill size={17} />
                  User Login
                </Link>
                <Link to="/admin/login" onClick={closeMenu}>
                  <BsShieldLockFill size={17} />
                  Admin Login
                </Link>
              </div>
            </details>
          )}

          {!isAdminAuthenticated && (
            <>
              <Link
                className="action_container desktop_action"
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
                className="action_container desktop_action"
                to="/bag"
                onClick={closeMenu}
              >
                <FaBagShopping size={20} />
                <span className="action_name">Cart</span>

                {bag.length > 0 && (
                  <span className="bag-item-count">{bag.length}</span>
                )}
              </Link>
            </>
          )}

          {isUserAuthenticated && (
            <button
              type="button"
              className="btn btn-outline-danger desktop-logout"
              onClick={handleUserLogout}
              title="Log out"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <nav
        className="mobile_bottom_nav"
        role="navigation"
        aria-label="Mobile Navigation"
      >
        <NavLink to="/" className="mobile_nav_item" onClick={closeMenu}>
          <span className="mobile-home-icon" aria-hidden="true">
            <FaHome aria-hidden="true" />
          </span>
          <span>Home</span>
        </NavLink>

        <Link to="/categories" className="mobile_nav_item" onClick={closeMenu}>
          <FaBars />
          <span>Categories</span>
        </Link>

        {!isAdminAuthenticated && (
          <>
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
          </>
        )}

        {isUserAuthenticated ? (
          <details className="mobile_nav_item mobile_account_menu">
            <summary>
              <BsFillPersonFill />
              <span>Account</span>
            </summary>
            <div className="mobile_account_dropdown">
              <Link to="/profile" onClick={closeMenu}>
                Profile
              </Link>
              <Link to="/orders" onClick={closeMenu}>
                Orders
              </Link>
              <button type="button" onClick={handleUserLogout}>
                Logout
              </button>
            </div>
          </details>
        ) : (
          <Link
            to={isAdminAuthenticated ? "/admin" : "/login"}
            className="mobile_nav_item"
            onClick={closeMenu}
          >
            {isAdminAuthenticated ? <BsShieldLockFill /> : <BsFillPersonFill />}
            <span>{isAdminAuthenticated ? "Admin" : "Login"}</span>
          </Link>
        )}
      </nav>
    </>
  );
};

export default Header;
