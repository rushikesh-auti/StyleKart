import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const CustomerOnlyRoute = () => {
  const isAdminAuthenticated = useSelector(
    (store) => store.adminAuth?.isAuthenticated,
  );
  const isUserAuthenticated = useSelector(
    (store) => store.userAuth?.isAuthenticated,
  );
  const location = useLocation();

  if (isAdminAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  if (!isUserAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default CustomerOnlyRoute;
