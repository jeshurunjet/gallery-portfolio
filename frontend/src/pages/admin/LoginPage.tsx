import { useState } from "react";
import { Link } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuth", "true");

      window.location.replace("/admin");
    } catch (err) {
      console.error(err);
      setError("Invalid credentials");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <p>Sign in to manage your portfolio projects and tags.</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="admin-primary-button">
          Sign In
        </button>
        <p className="auth-helper-text">
          Forgot your password? <Link to="/forgot-password">Reset it</Link>
        </p>
      </form>
    </main>
  );
}

export default LoginPage;
