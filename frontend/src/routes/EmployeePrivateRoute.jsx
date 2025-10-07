// src/routes/EmployeePrivateRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function EmployeePrivateRoute() {
  const { employee } = useSelector((state) => state.auth);

  return employee ? <Outlet /> : <Navigate to="/login" replace />;
}