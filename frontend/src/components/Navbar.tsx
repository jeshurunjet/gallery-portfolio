import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <div>
        <Link to="/">Jeshurun Sanchez</Link>
      </div>

      <div>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/resume">Resume</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;
