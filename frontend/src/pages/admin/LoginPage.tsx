import { useState } from "react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === "admin@test.com" && password === "1234") {
      localStorage.setItem("isAuth", "true");
      window.location.href = "/admin";
    } else {
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
      </form>
    </main>
  );
}

export default LoginPage;
