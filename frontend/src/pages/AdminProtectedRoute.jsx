import { Navigate, Outlet } from "react-router-dom";
import { getAdminToken, clearAdminSession } from "../utils/adminApi";

const AdminProtectedRoute = () => {
  const token = getAdminToken();

  if (token) {
    try {
      const encodedPayload = token
        .split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const payload = JSON.parse(atob(encodedPayload));
      if (payload.exp && payload.exp * 1000 <= Date.now()) {
        clearAdminSession();
        return <Navigate to="/admin/login" replace />;
      }
    } catch {
      clearAdminSession();
      return <Navigate to="/admin/login" replace />;
    }
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
