import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="mt-20 border-t border-slate-200 bg-slate-950 pb-24 text-slate-300 md:pb-0">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
      <div className="sm:col-span-2 lg:col-span-1">
        <img
          className="h-10 w-auto brightness-0 invert"
          src="/images/stylekart.png"
          alt="StyleKart"
        />
        <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
          Fashion, beauty and everyday essentials in one simple shopping
          experience.
        </p>
      </div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-white">
          Shop
        </h3>
        <div className="mt-4 grid gap-3 text-sm">
          <Link to="/men" className="hover:text-brand-300">
            Men
          </Link>
          <Link to="/women" className="hover:text-brand-300">
            Women
          </Link>
          <Link to="/kids" className="hover:text-brand-300">
            Kids
          </Link>
          <Link to="/beauty" className="hover:text-brand-300">
            Beauty
          </Link>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-white">
          Account
        </h3>
        <div className="mt-4 grid gap-3 text-sm">
          <Link to="/profile" className="hover:text-brand-300">
            Profile
          </Link>
          <Link to="/orders" className="hover:text-brand-300">
            Orders
          </Link>
          <Link to="/wishlist" className="hover:text-brand-300">
            Wishlist
          </Link>
          <Link to="/bag" className="hover:text-brand-300">
            Cart
          </Link>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-white">
          StyleKart promise
        </h3>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Secure checkout, clear pricing and a responsive experience across
          desktop and mobile.
        </p>
      </div>
    </div>
    <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
      © 2026 StyleKart. All rights reserved.
    </div>
  </footer>
);

export default Footer;
