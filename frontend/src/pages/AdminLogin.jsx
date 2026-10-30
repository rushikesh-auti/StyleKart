import { Navigate, useLocation } from "react-router-dom";

const AdminLogin = () => {
  const location = useLocation();

  return (
    <Navigate
      to={{ pathname: "/login", search: location.search }}
      state={location.state}
      replace
    />
  );
};

export default AdminLogin;
