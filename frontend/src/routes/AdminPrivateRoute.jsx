import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import useAuthCheck from "../hooks/useAuthCheck";
import Loader from "../components/common/Loader";

export default function AdminPrivateRoute() {
  const loading = useAuthCheck();
  const { admin } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="large" global={true} />
      </div>
    );
  }

  return admin ? <Outlet /> : <Navigate to="/login" replace />;
}
