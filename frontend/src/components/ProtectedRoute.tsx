// ProtectedRoute.tsx
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = localStorage.getItem("isAuth") === "true";

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
