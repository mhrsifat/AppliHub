// src/routes/AdminPrivateRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AdminPrivateRoute() {
  const { admin } = useSelector((state) => state.auth);

  return admin ? <Outlet /> : <Navigate to="/login" replace />;
}