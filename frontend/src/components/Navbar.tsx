import { Link, useNavigate } from "react-router-dom";
// import { useState } from "react";

function Navbar() {
  const navigate = useNavigate();
  const isAuth = localStorage.getItem("isAuth") === "true";

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("token");

    navigate("/");
    window.location.reload();
  };

  return (
    <nav>
      <div>
        <Link className="logo" to="/">
          JESHURUN SANCHEZ
        </Link>
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
