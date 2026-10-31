import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Footer from "../components/Footer";
import Header from "../components/Header";
import FetchItems from "../components/Fetchitems";
import LoadingSpinner from "../components/LoadingSpinner";

import { clearUserSession, restoreUserSession } from "../store/userAuthSlice";
import { clearAdminSession, setAdminSession } from "../store/adminAuthSlice";

import { fetchStatusActions } from "../store/fetchStatusSlice";
import { bagActions } from "../store/bagSlice";
import { wishlistActions } from "../store/wishlistSlice";
import { setSessionStatus } from "../store/authSessionSlice";
import styleKartStore from "../store/index";
import { adminApiUrl } from "../utils/adminApi";

function App() {
  const fetchStatus = useSelector((store) => store.fetchStatus);
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdminRoute =
    location.pathname === "/admin" || location.pathname.startsWith("/admin/");

  // Restore the server-validated session from the HttpOnly cookie.
  useEffect(() => {
    let active = true;
    const sessionRevision = styleKartStore.getState().authSession.revision;
    const isCurrentSessionCheck = () =>
      styleKartStore.getState().authSession.revision === sessionRevision;

    fetch(adminApiUrl("/auth/me"), {
      credentials: "include",
    })
      .then(async (response) => {
        if (!active || !isCurrentSessionCheck()) return;

        if (response.status === 401) {
          dispatch(clearUserSession());
          dispatch(clearAdminSession());
          dispatch(bagActions.resetBag());
          dispatch(wishlistActions.resetWishlist());
          dispatch(setSessionStatus("unauthenticated"));
          return;
        }

        if (!response.ok) {
          dispatch(setSessionStatus("unavailable"));
          return;
        }

        const data = await response.json();
        if (!active || !isCurrentSessionCheck()) return;

        if (data.user?.role === "admin") {
          dispatch(clearUserSession());
          dispatch(bagActions.resetBag());
          dispatch(wishlistActions.resetWishlist());
          dispatch(setAdminSession({ admin: data.user }));
        } else if (data.user?.role === "user") {
          dispatch(clearAdminSession());
          dispatch(restoreUserSession({ user: data.user }));
          dispatch(bagActions.loadUserCart());
          dispatch(wishlistActions.loadUserWishlist());
        } else {
          dispatch(clearUserSession());
          dispatch(clearAdminSession());
          dispatch(setSessionStatus("unauthenticated"));
          return;
        }

        dispatch(setSessionStatus("authenticated"));
      })
      .catch(() => {
        if (active && isCurrentSessionCheck()) {
          dispatch(setSessionStatus("unavailable"));
        }
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  // Product loading state
  const renderContent = () => {
    if (fetchStatus.currentlyFetching) {
      return <LoadingSpinner />;
    }

    // Product API error state
    if (fetchStatus.error) {
      return (
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="px-4 py-12 text-center text-slate-500">
            <h2 className="mb-3">Unable to load products</h2>

            <p className="mb-6 text-slate-500">{fetchStatus.error}</p>

            <button
              type="button"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-brand-600"
              onClick={() => dispatch(fetchStatusActions.resetFetchStatus())}
            >
              Try Again
            </button>
          </div>
        </main>
      );
    }

    return <Outlet />;
  };

  return (
    <>
      {!isAdminRoute && <Header />}

      {!isAdminRoute && <FetchItems />}

      {isAdminRoute ? <Outlet /> : renderContent()}

      {!isAdminRoute && <Footer />}
    </>
  );
}

export default App;
