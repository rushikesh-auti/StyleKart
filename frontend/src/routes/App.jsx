import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import FetchItems from "../components/Fetchitems";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import { clearUserSession, restoreUserSession } from "../store/userAuthSlice";
import { adminApiUrl } from "../utils/adminApi";

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
      {fetchStatus.currentlyFetching ? <LoadingSpinner /> : <Outlet />}
      <Footer />
    </>
  );
}

export default App;
