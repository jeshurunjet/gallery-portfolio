import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import Toast from "../../components/Toast";
import { Eye, EyeOff } from "lucide-react";

function LoginPage() {
  const initialAuthMessage = sessionStorage.getItem("authMessage");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage] = useState(initialAuthMessage ?? "");
  const [showToast, setShowToast] = useState(Boolean(initialAuthMessage));

  if (initialAuthMessage) {
    sessionStorage.removeItem("authMessage");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
    <>
      <main className="auth-page">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Admin Login</h1>
          <p className="auth-subtext">Manage your portfolio securely</p>
          <p>Sign in to manage your portfolio projects and tags.</p>

          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="auth-password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="auth-password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="admin-primary-button">
            Sign In
          </button>
          <p className="auth-helper-text">
            Forgot your password? <Link to="/forgot-password">Reset it</Link>
          </p>
        </form>
      </main>
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default LoginPage;
