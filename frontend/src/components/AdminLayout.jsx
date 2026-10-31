import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowRightFromBracket,
  FaBagShopping,
  FaBars,
  FaBoxOpen,
  FaBoxesStacked,
  FaGauge,
  FaHeadset,
  FaTicket,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import { bagActions } from "../store/bagSlice";
import { clearAdminSession } from "../store/adminAuthSlice";
import { setSessionStatus } from "../store/authSessionSlice";
import { wishlistActions } from "../store/wishlistSlice";
import { adminApiUrl } from "../utils/adminApi";

const navigation = [
  { to: "/admin", label: "Dashboard", icon: FaGauge, end: true },
  { to: "/admin/orders", label: "Orders", icon: FaBagShopping },
  { to: "/admin/products", label: "Products", icon: FaBoxOpen },
  { to: "/admin/inventory", label: "Inventory", icon: FaBoxesStacked },
  { to: "/admin/customers", label: "Customers", icon: FaUsers },
  { to: "/admin/coupons", label: "Coupons", icon: FaTicket },
  { to: "/admin/support", label: "Support", icon: FaHeadset },
];

const navLinkClass = ({ isActive }) =>
  `flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
    isActive
      ? "bg-white/10 text-white ring-1 ring-white/10"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

const NavigationLinks = ({ onNavigate }) => (
  <nav aria-label="Admin navigation" className="space-y-1">
    {navigation.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={navLinkClass}
        onClick={onNavigate}
      >
        <Icon aria-hidden="true" className="shrink-0 text-base" />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

NavigationLinks.propTypes = {
  onNavigate: PropTypes.func,
};

const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const mobileMenuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const admin = useSelector((store) => store.adminAuth?.admin);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const activePage =
    [...navigation]
      .sort((left, right) => right.to.length - left.to.length)
      .find(
        ({ to, end }) =>
          location.pathname === to ||
          (!end && location.pathname.startsWith(`${to}/`)),
      )?.label || "Admin";

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const menu = mobileMenuRef.current;
    const menuTrigger = menuTriggerRef.current;
    const getFocusableItems = () =>
      menu?.querySelectorAll('a[href], button:not([disabled])') || [];
    getFocusableItems()[0]?.focus();

    const handleMenuKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableItems = getFocusableItems();
      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem?.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem?.focus();
      }
    };

    document.addEventListener("keydown", handleMenuKeyDown);
    return () => {
      document.removeEventListener("keydown", handleMenuKeyDown);
      menuTrigger?.focus();
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch(adminApiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!response.ok) {
        throw new Error("Unable to log out. Please try again.");
      }

      dispatch(clearAdminSession());
      dispatch(bagActions.resetBag());
      dispatch(wishlistActions.resetWishlist());
      dispatch(setSessionStatus("unauthenticated"));
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(error.message || "Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-slate-950 px-4 py-6 lg:flex">
        <div className="mb-9 flex items-center gap-3 px-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-lg font-black text-white">
            S
          </span>
          <div>
            <p className="text-lg font-black tracking-tight text-white">
              StyleKart
            </p>
            <p className="text-xs font-medium text-slate-400">Admin workspace</p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Store management
        </p>
        <NavigationLinks />

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="mb-3 truncate px-3 text-xs text-slate-400">
            {admin?.name || admin?.email || "Administrator"}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <FaArrowRightFromBracket aria-hidden="true" />
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                ref={menuTriggerRef}
                aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
                aria-controls="admin-mobile-navigation"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 lg:hidden"
              >
                {mobileMenuOpen ? <FaXmark /> : <FaBars />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-500">
                  StyleKart / Admin
                </p>
                <p className="truncate text-lg font-black text-slate-950">
                  {activePage}
                </p>
              </div>
            </div>
            <div className="hidden max-w-[240px] truncate text-right text-sm font-semibold text-slate-600 sm:block">
              {admin?.name || admin?.email || "Administrator"}
            </div>
          </div>
          {logoutError && (
            <p className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 sm:px-6 lg:px-8" role="alert">
              {logoutError}
            </p>
          )}
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close admin menu"
              className="absolute inset-0 bg-slate-950/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside
              id="admin-mobile-navigation"
              ref={mobileMenuRef}
              role="dialog"
              aria-modal="true"
              className="relative flex h-full w-[min(84vw,320px)] flex-col bg-slate-950 px-4 py-6 shadow-2xl"
              aria-label="Admin menu"
            >
              <div className="mb-8 flex items-center justify-between gap-3 px-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 font-black text-white">
                    S
                  </span>
                  <div>
                    <p className="font-black text-white">StyleKart</p>
                    <p className="text-xs text-slate-400">Admin workspace</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close admin menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <FaXmark />
                </button>
              </div>
              <NavigationLinks onNavigate={() => setMobileMenuOpen(false)} />
              <div className="mt-auto border-t border-white/10 pt-4">
                {logoutError && (
                  <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200" role="alert">
                    {logoutError}
                  </p>
                )}
                <div className="mb-3 truncate px-3 text-xs text-slate-400">
                  {admin?.name || admin?.email || "Administrator"}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-60"
                >
                  <FaArrowRightFromBracket aria-hidden="true" />
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
