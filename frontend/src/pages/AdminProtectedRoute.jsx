import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedRoute = () => {
  const token = localStorage.getItem("adminToken");

  // If admin is not logged in, redirect to login
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // If logged in, allow access to admin pages
  return <Outlet />;
};

export default AdminProtectedRoute;