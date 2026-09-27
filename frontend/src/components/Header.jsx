import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BsFillPersonFill, BsShieldLockFill } from "react-icons/bs";
import {
  FaBagShopping,
  FaBars,
  FaChevronDown,
  FaFaceGrinHearts,
  FaHouse,
  FaSearchengin,
  FaCross,
} from "react-icons/fa6";
import { searchActions } from "../store/searchSlice";
import { clearUserSession } from "../store/userAuthSlice";
import { clearAdminSession } from "../store/adminAuthSlice";
import { bagActions } from "../store/bagSlice";
import { adminApiUrl } from "../utils/adminApi";

const navClass = ({ isActive }) =>
  `relative flex h-full items-center border-b-2 px-1 text-xs font-black uppercase tracking-[0.08em] transition-colors ${
    isActive
      ? "border-brand-600 text-brand-600"
      : "border-transparent text-slate-700 hover:border-brand-300 hover:text-brand-600"
  }`;

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

  const logoutRequest = () =>
    fetch(adminApiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => undefined);

  const handleUserLogout = () => {
    logoutRequest();
    dispatch(clearUserSession());
    dispatch(bagActions.resetBag());
    navigate("/", { replace: true });
  };

  const handleAdminLogout = () => {
    logoutRequest();
    dispatch(clearAdminSession());
    dispatch(bagActions.resetBag());
    navigate("/admin/login", { replace: true });
  };

  const CountBadge = ({ count }) =>
    count > 0 ? (
      <span className="absolute -right-2 -top-2 grid min-h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-black text-white">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0" aria-label="StyleKart home">
            <img
              className="h-10 w-auto"
              src="/images/stylekart.png"
              alt="StyleKart"
            />
          </Link>

          <nav
            className="hidden self-stretch md:flex md:gap-5 lg:gap-7"
            aria-label="Primary navigation"
          >
            <NavLink to="/men" className={navClass}>
              Men
            </NavLink>
            <NavLink to="/women" className={navClass}>
              Women
            </NavLink>
            <NavLink to="/kids" className={navClass}>
              Kids
            </NavLink>
            <NavLink to="/beauty" className={navClass}>
              Beauty
            </NavLink>
          </nav>

          <form
            className="ml-auto flex min-w-0 flex-1 items-center rounded-xl border border-transparent bg-slate-100 px-3 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100 md:max-w-md"
            role="search"
            onSubmit={submitSearch}
          >
            <FaSearchengin className="shrink-0 text-sm text-slate-500" />
            <input
              type="text"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500"
              placeholder="Search products, brands and more"
              value={searchText}
              onChange={handleSearch}
            />
            {searchText && (
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                onClick={() => handleSearch({ target: { value: "" } })}
                aria-label="Clear search"
              >
                <FaCross />
              </button>
            )}
          </form>

          <div className="hidden shrink-0 items-center gap-4 md:flex">
            {isAdminAuthenticated ? (
              <>
                <Link
                  to="/admin"
                  className="flex flex-col items-center gap-1 text-xs font-bold text-slate-700 hover:text-brand-600"
                >
                  <BsShieldLockFill size={19} />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
                <button
                  type="button"
                  className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  onClick={handleAdminLogout}
                >
                  Logout
                </button>
              </>
            ) : isUserAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex max-w-20 flex-col items-center gap-1 text-xs font-bold text-slate-700 hover:text-brand-600"
                >
                  <BsFillPersonFill size={19} />
                  <span className="max-w-full truncate">
                    {user?.name || "Profile"}
                  </span>
                </Link>
                <button
                  type="button"
                  className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  onClick={handleUserLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <details className="group relative">
                <summary className="flex list-none cursor-pointer flex-col items-center gap-1 text-xs font-bold text-slate-700 hover:text-brand-600 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-1">
                    <BsFillPersonFill size={19} />
                    <FaChevronDown className="text-[9px] transition-transform group-open:rotate-180" />
                  </span>
                  <span>Login</span>
                </summary>
                <div className="absolute right-0 top-[calc(100%+16px)] w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
                  <p className="px-3 pb-2 pt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Sign in to StyleKart
                  </p>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <BsFillPersonFill /> User Login
                  </Link>
                  <Link
                    to="/admin/login"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <BsShieldLockFill /> Admin Login
                  </Link>
                </div>
              </details>
            )}

            {!isAdminAuthenticated && (
              <>
                <Link
                  to="/wishlist"
                  className="relative flex flex-col items-center gap-1 text-xs font-bold text-slate-700 hover:text-brand-600"
                >
                  <span className="relative">
                    <FaFaceGrinHearts size={19} />
                    <CountBadge count={wishlist.length} />
                  </span>
                  <span className="hidden lg:inline">Wishlist</span>
                </Link>
                <Link
                  to="/bag"
                  className="relative flex flex-col items-center gap-1 text-xs font-bold text-slate-700 hover:text-brand-600"
                >
                  <span className="relative">
                    <FaBagShopping size={19} />
                    <CountBadge count={bag.length} />
                  </span>
                  <span className="hidden lg:inline">Cart</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden"
        aria-label="Mobile navigation"
      >
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-500"}`
          }
        >
          <FaHouse className="text-lg" />
          <span>Home</span>
        </NavLink>
        <Link
          to="/categories"
          className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
        >
          <FaBars className="text-lg" />
          <span>Categories</span>
        </Link>
        <Link
          to="/wishlist"
          className="relative flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
        >
          <span className="relative">
            <FaFaceGrinHearts className="text-lg" />
            <CountBadge count={wishlist.length} />
          </span>
          <span>Wishlist</span>
        </Link>
        <Link
          to="/bag"
          className="relative flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
        >
          <span className="relative">
            <FaBagShopping className="text-lg" />
            <CountBadge count={bag.length} />
          </span>
          <span>Cart</span>
        </Link>
        <Link
          to={
            isAdminAuthenticated
              ? "/admin"
              : isUserAuthenticated
                ? "/profile"
                : "/login"
          }
          className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
        >
          {isAdminAuthenticated ? (
            <BsShieldLockFill className="text-lg" />
          ) : (
            <BsFillPersonFill className="text-lg" />
          )}
          <span>{isAdminAuthenticated ? "Admin" : "Account"}</span>
        </Link>
      </nav>
    </>
  );
};

export default Header;
