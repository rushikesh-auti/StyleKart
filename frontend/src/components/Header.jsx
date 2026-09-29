import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BsFillPersonFill, BsShieldLockFill } from "react-icons/bs";
import {
  FaArrowRightFromBracket,
  FaBagShopping,
  FaBars,
  FaBoxOpen,
  FaChevronDown,
  FaGauge,
  FaGift,
  FaHeadset,
  FaHeart,
  FaHouse,
  FaLocationDot,
  FaMagnifyingGlass,
  FaRegCreditCard,
  FaRegHeart,
  FaRegUser,
  FaTicket,
  FaUserPen,
  FaXmark,
} from "react-icons/fa6";
import { searchActions } from "../store/searchSlice";
import { clearUserSession } from "../store/userAuthSlice";
import { clearAdminSession } from "../store/adminAuthSlice";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";
import { adminApiUrl } from "../utils/adminApi";

/*
  Matches the StyleKart storefront:
  - white header, slate-100 search pill, slate-50 page
  - magenta (brand) for accents: icons, badges, active states
  - black (slate-900) for primary buttons, like "Shop Now" / "Select Options"
*/

const navClass = ({ isActive }) =>
  `border-b-2 px-0.5 py-1 text-sm font-semibold transition-colors ${
    isActive
      ? "border-brand-600 text-brand-700"
      : "border-transparent text-slate-800 hover:text-brand-600"
  }`;

const CountBadge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

const iconButton =
  "relative grid h-10 w-10 place-items-center rounded-full text-slate-800 transition-colors hover:bg-slate-100 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600";

/* Hover-open on desktop, click/tap on touch. Esc and outside click close it. */
const useHoverMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  const close = () => {
    clearTimeout(timer.current);
    setIsOpen(false);
  };
  const open = () => {
    clearTimeout(timer.current);
    setIsOpen(true);
  };
  const closeSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsOpen(false), 140);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return {
    ref,
    isOpen,
    open,
    close,
    closeSoon,
    toggle: () => setIsOpen((v) => !v),
  };
};

const Tile = ({ to, icon: Icon, label, count = 0, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    role="menuitem"
    className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-2 py-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
  >
    <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white text-brand-600 shadow-sm">
      <Icon size={15} />
      <CountBadge count={count} />
    </span>
    {label}
  </Link>
);

const Row = ({ to, icon: Icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    role="menuitem"
    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
  >
    <Icon className="text-slate-400" size={14} />
    {label}
  </Link>
);

const LogoutButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    role="menuitem"
    className="flex w-full items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
  >
    <FaArrowRightFromBracket size={14} /> Log out
  </button>
);

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
  const menu = useHoverMenu();

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

  const handleUserLogout = async () => {
    await logoutRequest();
    dispatch(clearUserSession());
    dispatch(bagActions.resetBag());
    dispatch(wishlistActions.resetWishlist());
    menu.close();
    navigate("/", { replace: true });
  };

  const handleAdminLogout = async () => {
    await logoutRequest();
    dispatch(clearAdminSession());
    dispatch(bagActions.resetBag());
    dispatch(wishlistActions.resetWishlist());
    menu.close();
    navigate("/admin/login", { replace: true });
  };

  // Mouse: hover already opened it, so a click keeps it open. Touch: click toggles.
  const handleTriggerClick = () => {
    const canHover =
      typeof window !== "undefined" &&
      window.matchMedia?.("(hover: hover)").matches;
    if (canHover) menu.open();
    else menu.toggle();
  };

  const categoryLinks = [
    { to: "/men", label: "Men" },
    { to: "/women", label: "Women" },
    { to: "/kids", label: "Kids" },
    { to: "/beauty", label: "Beauty" },
  ];

  const initial = (user?.name || "U").trim().charAt(0).toUpperCase();
  const firstName = user?.name?.split(" ")[0];

  const renderPanel = () => {
    if (isAdminAuthenticated) {
      return (
        <>
          <div className="flex items-center gap-3 px-5 pb-4 pt-5">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-white">
              <BsShieldLockFill size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-slate-900">Admin</p>
              <p className="text-sm text-slate-500">Store management</p>
            </div>
          </div>
          <div className="px-3 pb-3">
            <Row
              to="/admin"
              icon={FaGauge}
              label="Open dashboard"
              onClick={menu.close}
            />
          </div>
          <LogoutButton onClick={handleAdminLogout} />
        </>
      );
    }

    if (isUserAuthenticated) {
      return (
        <>
          <div className="flex items-center gap-3 px-5 pb-4 pt-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">
                {user?.name || "Your account"}
              </p>
              <p className="truncate text-sm text-slate-500">
                {user?.email || user?.phone || "Signed in"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 px-4 pb-3">
            <Tile
              to="/orders"
              icon={FaBoxOpen}
              label="Orders"
              onClick={menu.close}
            />
            <Tile
              to="/wishlist"
              icon={FaRegHeart}
              label="Wishlist"
              count={wishlist.length}
              onClick={menu.close}
            />
            <Tile
              to="/coupons"
              icon={FaTicket}
              label="Coupons"
              onClick={menu.close}
            />
          </div>

          <div className="px-3 pb-3">
            <Row
              to="/addresses"
              icon={FaLocationDot}
              label="Saved addresses"
              onClick={menu.close}
            />
            <Row
              to="/"
              icon={FaRegCreditCard}
              label="Saved cards"
              onClick={menu.close}
            />
            <Row to="/" icon={FaGift} label="Gift cards" onClick={menu.close} />
            <Row
              to="/"
              icon={FaHeadset}
              label="Help and contact"
              onClick={menu.close}
            />
            <Row
              to="/profile"
              icon={FaUserPen}
              label="Edit profile"
              onClick={menu.close}
            />
          </div>
          <LogoutButton onClick={handleUserLogout} />
        </>
      );
    }

    return (
      <>
        <div className="px-6 pb-4 pt-6">
          <p className="text-lg font-extrabold text-slate-900">
            Welcome to StyleKart
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Log in to track orders, save favourites and check out faster.
          </p>
          <Link
            to="/login"
            onClick={menu.close}
            role="menuitem"
            className="mt-4 block rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-600"
          >
            Log in or sign up
          </Link>
        </div>
        <div className="px-3 pb-3">
          <Row
            to="/orders"
            icon={FaBoxOpen}
            label="Orders"
            onClick={menu.close}
          />
          <Row
            to="/wishlist"
            icon={FaRegHeart}
            label="Wishlist"
            onClick={menu.close}
          />
          <Row
            to="/"
            icon={FaHeadset}
            label="Help and contact"
            onClick={menu.close}
          />
        </div>
        <Link
          to="/admin/login"
          onClick={menu.close}
          role="menuitem"
          className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <BsShieldLockFill size={14} /> Admin login
        </Link>
      </>
    );
  };

  const searchForm = (className) => (
    <form className={className} role="search" onSubmit={submitSearch}>
      <FaMagnifyingGlass className="shrink-0 text-sm text-slate-400" />
      <input
        type="text"
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500"
        placeholder="Search products, brands and more"
        value={searchText}
        onChange={handleSearch}
      />
      {searchText && (
        <button
          type="button"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          onClick={() => handleSearch({ target: { value: "" } })}
          aria-label="Clear search"
        >
          <FaXmark size={13} />
        </button>
      )}
    </form>
  );

  const searchClass =
    "items-center rounded-full bg-slate-100 px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-300";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-3 sm:px-6 md:h-[68px] lg:gap-8 lg:px-8">
          <Link to="/" className="shrink-0" aria-label="StyleKart home">
            <img
              className="h-8 w-auto sm:h-9"
              src="/images/stylekart.png"
              alt="StyleKart"
            />
          </Link>

          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label="Primary navigation"
          >
            {categoryLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          {searchForm(`ml-auto hidden min-w-0 flex-1 sm:flex ${searchClass}`)}

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
            {/* Account dropdown (desktop) */}
            <div
              ref={menu.ref}
              className="relative hidden md:block"
              onMouseEnter={menu.open}
              onMouseLeave={menu.closeSoon}
            >
              <button
                type="button"
                onClick={handleTriggerClick}
                onKeyDown={(e) => e.key === "ArrowDown" && menu.open()}
                aria-haspopup="menu"
                aria-expanded={menu.isOpen}
                aria-label="Account menu"
                className={`flex h-10 items-center gap-2 rounded-full pl-1.5 pr-3 text-sm font-semibold text-slate-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
                  menu.isOpen ? "bg-slate-100" : "hover:bg-slate-100"
                }`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full ${
                    isUserAuthenticated
                      ? "bg-brand-600 text-xs font-bold text-white"
                      : isAdminAuthenticated
                        ? "bg-slate-900 text-white"
                        : "bg-brand-50 text-brand-600"
                  }`}
                >
                  {isUserAuthenticated ? (
                    initial
                  ) : isAdminAuthenticated ? (
                    <BsShieldLockFill size={12} />
                  ) : (
                    <FaRegUser size={13} />
                  )}
                </span>
                <span className="hidden max-w-24 truncate lg:inline">
                  {isAdminAuthenticated
                    ? "Admin"
                    : isUserAuthenticated
                      ? firstName || "Account"
                      : "Log in"}
                </span>
                <FaChevronDown
                  className={`text-[9px] text-slate-500 transition-transform ${menu.isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* pt-3 keeps the hover path continuous from button to card */}
              <div
                className={`absolute right-0 top-full w-[320px] pt-3 transition-all duration-150 motion-reduce:transition-none ${
                  menu.isOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div
                  role="menu"
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
                >
                  {renderPanel()}
                </div>
                <span className="absolute right-8 top-[6px] h-3 w-3 rotate-45 border-l border-t border-slate-200 bg-white" />
              </div>
            </div>

            {!isAdminAuthenticated && (
              <Link
                to="/wishlist"
                className={`${iconButton} hidden md:grid`}
                aria-label={`Wishlist, ${wishlist.length} items`}
              >
                <FaRegHeart size={18} />
                <CountBadge count={wishlist.length} />
              </Link>
            )}

            {!isAdminAuthenticated && (
              <Link
                to="/bag"
                className={`${iconButton} hidden sm:grid`}
                aria-label={`Bag, ${bag.length} item${bag.length === 1 ? "" : "s"}`}
              >
                <FaBagShopping size={18} />
                <CountBadge count={bag.length} />
              </Link>
            )}
          </div>
        </div>

        {/* Small screens: search on its own row */}
        <div className="px-3 pb-3 sm:hidden">
          {searchForm(`flex min-w-0 ${searchClass}`)}
        </div>
      </header>

      {/* Bottom mobile tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden"
        aria-label="Mobile navigation"
      >
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-500"}`
          }
        >
          <FaHouse className="text-lg" />
          <span>Home</span>
        </NavLink>
        <Link
          to="/categories"
          className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold text-slate-500"
        >
          <FaBars className="text-lg" />
          <span>Categories</span>
        </Link>
        <Link
          to="/wishlist"
          className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold text-slate-500"
        >
          <span className="relative">
            <FaHeart className="text-lg" />
            <CountBadge count={wishlist.length} />
          </span>
          <span>Wishlist</span>
        </Link>
        <Link
          to="/bag"
          className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold text-slate-500"
        >
          <span className="relative">
            <FaBagShopping className="text-lg" />
            <CountBadge count={bag.length} />
          </span>
          <span>Bag</span>
        </Link>
        <Link
          to={
            isAdminAuthenticated
              ? "/admin"
              : isUserAuthenticated
                ? "/profile"
                : "/login"
          }
          className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold text-slate-500"
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
