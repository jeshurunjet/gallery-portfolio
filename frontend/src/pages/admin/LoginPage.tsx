import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import Toast from "../../components/Toast";
import { Eye, EyeOff } from "lucide-react";
import { startStoredSession } from "../../utils/session";

function LoginPage() {
  const initialAuthMessage = sessionStorage.getItem("authMessage");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage] = useState(initialAuthMessage ?? "");
  const [showToast, setShowToast] = useState(Boolean(initialAuthMessage));

  if (initialAuthMessage) {
    sessionStorage.removeItem("authMessage");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (challengeToken) {
        const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/login/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            challengeToken,
            code: verificationCode.trim(),
          }),
        });

        if (!verifyResponse.ok) {
          throw new Error("Invalid authentication code");
        }

        const verifyData = await verifyResponse.json();

        if (verifyData.usedRecoveryCode) {
          const remainingCodes = Number(verifyData.remainingRecoveryCodes ?? 0);
          sessionStorage.setItem(
            "authMessage",
            remainingCodes > 0
              ? `Recovery code used. ${remainingCodes} backup code${remainingCodes === 1 ? "" : "s"} left.`
              : "Recovery code used. You have no backup codes left, so regenerate them soon."
          );
        }

        startStoredSession(verifyData.token);
        window.location.replace("/admin");
        return;
      }

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

      if (data.requiresTwoFactor) {
        setChallengeToken(data.challengeToken);
        setVerificationCode("");
        return;
      }

      startStoredSession(data.token);

      if (
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission().catch((notificationError) => {
          console.error("Notification permission request failed", notificationError);
        });
      }

      window.location.replace("/admin");
    } catch (err) {
      console.error(err);
      setError(
        challengeToken
          ? "The 6-digit code was not accepted. Please try again."
          : "Invalid credentials"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToPassword = () => {
    setChallengeToken("");
    setVerificationCode("");
    setError("");
  };

  return (
    <>
      <main className="auth-page">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Admin Login</h1>
          <p className="auth-subtext">Manage your portfolio securely</p>
          <p>
            {challengeToken
              ? "Enter a 6-digit authenticator code or one of your backup recovery codes."
              : "Sign in to manage your portfolio projects and tags."}
          </p>

          {challengeToken ? (
            <input
              type="text"
              placeholder="6-digit code or backup recovery code"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase().trim())}
            />
          ) : (
            <>
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
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="admin-primary-button">
            {isSubmitting
              ? challengeToken
                ? "Verifying..."
                : "Signing In..."
              : challengeToken
                ? "Verify Code"
                : "Sign In"}
          </button>
          {challengeToken ? (
            <button
              type="button"
              className="auth-secondary-button"
              onClick={handleBackToPassword}
            >
              Back to password
            </button>
          ) : (
            <p className="auth-helper-text">
              Forgot your password? <Link to="/forgot-password">Reset it</Link>
            </p>
          )}
        </form>
      </main>
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default LoginPage;
