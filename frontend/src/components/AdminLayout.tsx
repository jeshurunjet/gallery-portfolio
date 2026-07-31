import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      <div className="admin-mobile-bar">
        <button
          type="button"
          className="admin-mobile-menu-button"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-expanded={sidebarOpen}
          aria-label="Toggle admin menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="admin-mobile-title">Admin Control</span>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close admin menu"
          onClick={closeSidebar}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2 className="admin-title">Admin Control</h2>

        <nav className="admin-nav">
          <Link to="/admin" onClick={closeSidebar}>
            Dashboard
          </Link>
          <Link to="/admin/projects" onClick={closeSidebar}>
            Projects
          </Link>
          <Link to="/admin/tags" onClick={closeSidebar}>
            Tags
          </Link>
          <Link to="/admin/pages" onClick={closeSidebar}>
            Pages
          </Link>
          <Link to="/admin/account" onClick={closeSidebar}>
            Account
          </Link>
        </nav>
      </aside>

      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}

export default AdminLayout;
