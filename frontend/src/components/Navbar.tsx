import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const isAuth = localStorage.getItem("isAuth") === "true";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("token");

    closeMenu();
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <Link className="logo" to="/" onClick={closeMenu}>
        <span className="logo-full">JESHURUN SANCHEZ</span>
        <span className="logo-short">JS</span>
      </Link>

      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>

      <div className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        <Link to="/" onClick={closeMenu}>
          Home
        </Link>
        <Link to="/about" onClick={closeMenu}>
          About
        </Link>
        <Link to="/resume" onClick={closeMenu}>
          Resume
        </Link>

        {isAuth ? (
          <>
            <Link to="/admin" onClick={closeMenu}>
              Dashboard
            </Link>
            <span className="nav-link-text logout" onClick={handleLogout}>
              Logout
            </span>
          </>
        ) : (
          <Link to="/admin/login" onClick={closeMenu}>
            Login
          </Link>
        )}
      </div>

      {isMenuOpen && <div className="nav-overlay" onClick={closeMenu} />}
    </nav>
  );
}

export default Navbar;
