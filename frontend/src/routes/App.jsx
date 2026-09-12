import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import FetchItems from "../components/Fetchitems";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import { clearUserSession, restoreUserSession } from "../store/userAuthSlice";
import { adminApiUrl } from "../utils/adminApi";
import { fetchStatusActions } from "../store/fetchStatusSlice";

function App() {
  const fetchStatus = useSelector((store) => store.fetchStatus);
  const userToken = useSelector((store) => store.userAuth?.token);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userToken) return undefined;

    let active = true;
    fetch(adminApiUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${userToken}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          dispatch(clearUserSession());
          return;
        }

        if (!response.ok) return;
        const data = await response.json();
        if (active && data.user) {
          dispatch(restoreUserSession({ token: userToken, user: data.user }));
        }
      })
      .catch(() => {
        // Keep the session during temporary network failures.
      });

    return () => {
      active = false;
    };
  }, [dispatch, userToken]);

  return (
    <>
      <Header />
      <FetchItems />
      {fetchStatus.currentlyFetching ? (
        <LoadingSpinner />
      ) : fetchStatus.error ? (
        <main className="container py-5 text-center">
          <div className="py-5">
            <h2 className="mb-3">Unable to load products</h2>

            <p className="text-muted mb-4">{fetchStatus.error}</p>

            <button
              className="btn btn-dark"
              onClick={() => dispatch(fetchStatusActions.resetFetchStatus())}
            >
              Try Again
            </button>
          </div>
        </main>
      ) : (
        <Outlet />
      )}
      <Footer />
    </>
  );
}

export default App;
