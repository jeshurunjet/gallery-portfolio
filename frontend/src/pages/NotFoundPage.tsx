import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, SearchX } from "lucide-react";

function NotFoundPage() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");

  return (
    <main className="not-found-page">
      <section className="not-found-card">
        <div className="not-found-icon">
          <SearchX size={34} />
        </div>

        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>
          The page you tried to open does not exist, may have moved, or is not
          available from this route.
        </p>

        <div className="not-found-path">{location.pathname}</div>

        <div className="not-found-actions">
          <Link to="/" className="admin-primary-button">
            <Home size={17} />
            Home
          </Link>

          {isAdminPath && (
            <Link to="/admin" className="admin-secondary-button">
              <LayoutDashboard size={17} />
              Admin Dashboard
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;
