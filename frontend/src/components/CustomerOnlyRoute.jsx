import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const CustomerOnlyRoute = () => {
  const isAdminAuthenticated = useSelector(
    (store) => store.adminAuth?.isAuthenticated,
  );

  if (isAdminAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default CustomerOnlyRoute;
