function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-name">Jeshurun Sanchez</p>

        <div className="footer-links">
          <a href="/" className="footer-link">
            Home
          </a>
          <a href="/about" className="footer-link">
            About
          </a>
          <a href="/resume" className="footer-link">
            Resume
          </a>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
