import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Footer from "../components/Footer";
import Header from "../components/Header";
import FetchItems from "../components/Fetchitems";
import LoadingSpinner from "../components/LoadingSpinner";

import { clearUserSession, restoreUserSession } from "../store/userAuthSlice";
import { clearAdminSession, setAdminSession } from "../store/adminAuthSlice";

import { fetchStatusActions } from "../store/fetchStatusSlice";
import { adminApiUrl } from "../utils/adminApi";

function App() {
  const fetchStatus = useSelector((store) => store.fetchStatus);
  const dispatch = useDispatch();

  // Restore the server-validated session from the HttpOnly cookie.
  useEffect(() => {
    let active = true;

    fetch(adminApiUrl("/auth/me"), {
      credentials: "include",
    })
      .then(async (response) => {
        if (response.status === 401) {
          dispatch(clearUserSession());
          dispatch(clearAdminSession());
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (active && data.user?.role === "admin") {
          dispatch(clearUserSession());
          dispatch(setAdminSession({ admin: data.user }));
        } else if (active && data.user) {
          dispatch(clearAdminSession());
          dispatch(restoreUserSession({ user: data.user }));
        }
      })
      .catch(() => {
        // Keep the session during temporary network failures.
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
        <main className="container py-5">
          <div className="text-center py-5">
            <h2 className="mb-3">Unable to load products</h2>

            <p className="text-muted mb-4">{fetchStatus.error}</p>

            <button
              type="button"
              className="btn btn-dark"
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
      <Header />

      <FetchItems />

      {renderContent()}

      <Footer />
    </>
  );
}

export default App;
