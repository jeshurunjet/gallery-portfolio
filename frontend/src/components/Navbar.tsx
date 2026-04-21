import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(
    () => localStorage.getItem("isAuth") === "true"
  );

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    setIsAuth(false);
    navigate("/");
  };

  return (
    <nav>
      <div>
        <Link to="/">Gallery Portfolio</Link>
      </div>

      <div>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/resume">Resume</Link>

        {isAuth ? (
          <>
            <Link to="/admin">Dashboard</Link>
            <span className="nav-link-text logout" onClick={handleLogout}>
              Logout
            </span>
          </>
        ) : (
          <Link to="/admin/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
