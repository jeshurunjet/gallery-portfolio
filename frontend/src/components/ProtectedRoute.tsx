import { Navigate } from "react-router-dom";
import { expireStoredSession, hasSessionExpired } from "../utils/session";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const isAuth = localStorage.getItem("isAuth") === "true";

  if (token && isAuth && hasSessionExpired()) {
    expireStoredSession();
    return <Navigate to="/admin/login" replace />;
  }

  if (!token || !isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
