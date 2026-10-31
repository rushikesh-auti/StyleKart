import { Navigate, Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminProtectedRoute = () => {
  const location = useLocation();
  const sessionStatus = useSelector((store) => store.authSession?.status);
  const isAuthenticated = useSelector(
    (store) => store.adminAuth?.isAuthenticated,
  );
  const admin = useSelector((store) => store.adminAuth?.admin);

  if (sessionStatus === "checking") return <LoadingSpinner />;

  if (
    sessionStatus === "authenticated" &&
    isAuthenticated &&
    admin?.role === "admin"
  ) {
    return <Outlet />;
  }

  if (sessionStatus === "authenticated") {
    return <Navigate to="/" replace />;
  }

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
};

export default AdminProtectedRoute;
