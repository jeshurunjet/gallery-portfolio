import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      setMessage("Password reset successful!");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Reset Password</h1>

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          type="button"
          className="auth-secondary-button"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? "Hide password" : "Show password"}
        </button>

        {message && <p className="auth-success">{message}</p>}
        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="admin-primary-button">
          Reset Password
        </button>
      </form>
    </main>
  );
}

export default ResetPasswordPage;
