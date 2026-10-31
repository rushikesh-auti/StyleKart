import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = () => {
  const location = useLocation();
  const sessionStatus = useSelector((store) => store.authSession?.status);
  const user = useSelector((store) => store.userAuth?.user);
  const isAdminAuthenticated = useSelector(
    (store) => store.adminAuth?.isAuthenticated,
  );

  if (sessionStatus === "checking") return <LoadingSpinner />;

  if (isAdminAuthenticated && sessionStatus === "authenticated") {
    return <Navigate to="/admin" replace />;
  }

  if (
    sessionStatus !== "authenticated" ||
    user?.role !== "user"
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
