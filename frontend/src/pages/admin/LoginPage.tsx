import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import Toast from "../../components/Toast";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { startStoredSession } from "../../utils/session";
import {
  authenticationOptionsFromJson,
  credentialToJson,
  passkeysSupported,
} from "../../utils/passkeys";

function LoginPage() {
  const initialAuthMessage = sessionStorage.getItem("authMessage");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [isPasskeySubmitting, setIsPasskeySubmitting] = useState(false);
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

  const handlePasskeyLogin = async () => {
    setError("");

    if (!passkeysSupported()) {
      setError("Passkeys are not available in this browser. Use Google Authenticator instead.");
      setShowFallback(true);
      return;
    }

    try {
      setIsPasskeySubmitting(true);
      const startResponse = await fetch(`${API_BASE_URL}/api/auth/passkeys/login/start`, {
        method: "POST",
      });
      if (!startResponse.ok) throw new Error("Could not start passkey login");
      const startData = await startResponse.json();
      const credential = (await navigator.credentials.get({
        publicKey: authenticationOptionsFromJson(startData.publicKeyOptionsJson),
      })) as PublicKeyCredential | null;
      if (!credential) throw new Error("No passkey was selected");

      const finishResponse = await fetch(`${API_BASE_URL}/api/auth/passkeys/login/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: startData.challengeId,
          credentialJson: credentialToJson(credential),
        }),
      });
      if (!finishResponse.ok) throw new Error("Passkey was not accepted");
      const data = await finishResponse.json();
      startStoredSession(data.token);
      window.location.replace("/admin");
    } catch (passkeyError) {
      console.error(passkeyError);
      setError(
        passkeyError instanceof DOMException && passkeyError.name === "NotAllowedError"
          ? "Passkey sign-in was cancelled or timed out."
          : "We could not sign you in with that passkey. You can use Google Authenticator instead."
      );
    } finally {
      setIsPasskeySubmitting(false);
    }
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
              : showFallback
                ? "Use your password and Google Authenticator."
                : "Use your phone, fingerprint, face, pattern, or device PIN."}
          </p>

          {challengeToken ? (
            <input
              type="text"
              placeholder="6-digit code or backup recovery code"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase().trim())}
            />
          ) : showFallback ? (
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
          ) : (
            <button
              type="button"
              className="admin-primary-button auth-passkey-button"
              onClick={handlePasskeyLogin}
              disabled={isPasskeySubmitting}
            >
              <KeyRound size={18} />
              {isPasskeySubmitting ? "Waiting for your device..." : "Sign in with a passkey"}
            </button>
          )}

          {error && <p className="auth-error">{error}</p>}

          {(challengeToken || showFallback) && (
            <button type="submit" className="admin-primary-button">
              {isSubmitting
                ? challengeToken
                  ? "Verifying..."
                  : "Signing In..."
                : challengeToken
                  ? "Verify Code"
                  : "Continue"}
            </button>
          )}
          {challengeToken ? (
            <button
              type="button"
              className="auth-secondary-button"
              onClick={handleBackToPassword}
            >
              Back to password
            </button>
          ) : showFallback ? (
            <p className="auth-helper-text">
              <button
                type="button"
                className="auth-text-button"
                onClick={() => {
                  setShowFallback(false);
                  setError("");
                }}
              >
                Use a passkey
              </button>
              {" · "}
              <Link to="/forgot-password">Reset password</Link>
            </p>
          ) : (
            <button
              type="button"
              className="auth-secondary-button"
              onClick={() => {
                setShowFallback(true);
                setError("");
              }}
            >
              Use Google Authenticator instead
            </button>
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
