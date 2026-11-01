import { NavLink } from "react-router-dom";

const links = [
  { to: "/profile", label: "Profile", end: true },
  { to: "/orders", label: "Orders" },
  { to: "/wishlist", label: "Wishlist", end: true },
  { to: "/wardrobe", label: "Wardrobe", end: true },
  { to: "/addresses", label: "Addresses", end: true },
];

const AccountNavigation = () => (
  <div className="mb-7 overflow-x-auto pb-1">
    <nav
      aria-label="Account navigation"
      className="flex min-w-max gap-2 border-b border-slate-200"
    >
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `min-h-11 rounded-t-xl border-b-2 px-4 py-3 text-sm font-medium transition-colors motion-reduce:transition-none ${
              isActive
                ? "border-brand-600 bg-brand-50/60 text-brand-800"
                : "border-transparent text-slate-600 hover:bg-white hover:text-slate-950"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  </div>
);

export default AccountNavigation;
