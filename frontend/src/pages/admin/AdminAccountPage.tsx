import { useEffect, useState } from "react";
import {
  AlertTriangle,
  KeyRound,
  LockKeyhole,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import Toast from "../../components/Toast";
import useTheme from "../../hooks/useTheme";
import {
  credentialToJson,
  passkeysSupported,
  registrationOptionsFromJson,
} from "../../utils/passkeys";

type AccountSummary = {
  id: number;
  email: string;
  twoFactorEnabled: boolean;
  recoveryCodeCount: number;
  registrationEnabled: boolean;
  userCount: number;
};

type CurrentUser = {
  id: number;
  email: string;
  twoFactorEnabled: boolean;
  recoveryCodeCount: number;
};

type TwoFactorSetup = {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
};

type EnableTwoFactorResponse = {
  message: string;
  recoveryCodes: string[];
  recoveryCodeCount: number;
};

type RecoveryCodesResponse = {
  recoveryCodes: string[];
  recoveryCodeCount: number;
};

type Passkey = {
  id: number;
  name: string;
  createdAt: number;
  lastUsedAt: number | null;
};

function AdminAccountPage() {
  const { theme, setTheme } = useTheme();
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [visibleRecoveryCodes, setVisibleRecoveryCodes] = useState<string[]>([]);
  const [regeneratePassword, setRegeneratePassword] = useState("");
  const [regenerateCode, setRegenerateCode] = useState("");
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [passkeyName, setPasskeyName] = useState("My phone");
  const [passkeyPassword, setPasskeyPassword] = useState("");
  const [passkeyCode, setPasskeyCode] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const themeOptions = [
    {
      value: "light" as const,
      label: "Light",
      description: "Keep the admin and portfolio in the light theme.",
      icon: <Sun size={18} />,
    },
    {
      value: "dark" as const,
      label: "Dark",
      description: "Use the dark theme across the site.",
      icon: <Moon size={18} />,
    },
    {
      value: "system" as const,
      label: "System",
      description: "Follow your device appearance automatically.",
      icon: <Monitor size={18} />,
    },
  ];

  const handleAuthExpired = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuth");
    sessionStorage.setItem(
      "authMessage",
      "Your session has expired. Please log in again."
    );
    window.location.replace("/admin/login");
  };

  useEffect(() => {
    const loadAccount = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_BASE_URL}/api/auth/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          handleAuthExpired();
          return;
        }

        if (response.ok) {
          const data: AccountSummary = await response.json();
          setAccount(data);
          const passkeyResponse = await fetch(`${API_BASE_URL}/api/auth/passkeys`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (passkeyResponse.ok) {
            setPasskeys(await passkeyResponse.json());
          }
          return;
        }

        // Fallback for older backend deployments that may not have /api/auth/account yet.
        const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (meResponse.status === 401) {
          handleAuthExpired();
          return;
        }

        if (!meResponse.ok) {
          throw new Error("Failed to load account details");
        }

        const meData: CurrentUser = await meResponse.json();
        setAccount({
          id: meData.id,
          email: meData.email,
          twoFactorEnabled: meData.twoFactorEnabled,
          recoveryCodeCount: meData.recoveryCodeCount,
          registrationEnabled: false,
          userCount: 0,
        });
        setToastMessage(
          "Loaded basic account details. Update backend to enable registration status and user count."
        );
        setShowToast(true);
      } catch (error) {
        console.error("Failed to fetch account details:", error);
        setToastMessage("Could not load account details.");
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    void loadAccount();
  }, []);

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/auth/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("isAuth");
      window.location.replace("/admin/login");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setToastMessage("Failed to delete account.");
      setShowToast(true);
    } finally {
      setDeleting(false);
    }
  };

  const refreshAccount = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/auth/account`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      handleAuthExpired();
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to refresh account");
    }

    const data: AccountSummary = await response.json();
    setAccount(data);
  };

  const handleStartTwoFactorSetup = async () => {
    try {
      setTwoFactorLoading(true);
      setTwoFactorError("");
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/auth/2fa/setup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to start 2FA setup");
      }

      const data: TwoFactorSetup = await response.json();
      setSetupData(data);
      setEnableCode("");
      setVisibleRecoveryCodes([]);
      setToastMessage("Scan the QR code or copy the setup key into Google Authenticator.");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to start 2FA setup:", error);
      setTwoFactorError("Could not start Google Authenticator setup.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleEnableTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setTwoFactorLoading(true);
      setTwoFactorError("");
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/auth/2fa/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: enableCode.trim() }),
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to enable 2FA");
      }

      const data: EnableTwoFactorResponse = await response.json();
      await refreshAccount();
      setSetupData(null);
      setEnableCode("");
      setVisibleRecoveryCodes(data.recoveryCodes);
      setToastMessage("Google Authenticator is now enabled. Save your backup codes before leaving this page.");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to enable 2FA:", error);
      setTwoFactorError("That code was not accepted. Check Google Authenticator and try again.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisableTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setTwoFactorLoading(true);
      setTwoFactorError("");
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/auth/2fa/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode.trim(),
        }),
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to disable 2FA");
      }

      await refreshAccount();
      setDisablePassword("");
      setDisableCode("");
      setSetupData(null);
      setVisibleRecoveryCodes([]);
      setToastMessage("Google Authenticator has been disabled.");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to disable 2FA:", error);
      setTwoFactorError("We could not disable Google Authenticator with those details.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setTwoFactorLoading(true);
      setTwoFactorError("");
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/auth/2fa/recovery/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: regeneratePassword,
          code: regenerateCode.trim(),
        }),
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to regenerate recovery codes");
      }

      const data: RecoveryCodesResponse = await response.json();
      await refreshAccount();
      setVisibleRecoveryCodes(data.recoveryCodes);
      setRegeneratePassword("");
      setRegenerateCode("");
      setToastMessage("New recovery codes generated. Save them before leaving this page.");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to regenerate recovery codes:", error);
      setTwoFactorError("We could not generate new recovery codes with those details.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleCopyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToastMessage(message);
      setShowToast(true);
    } catch (error) {
      console.error("Failed to copy text:", error);
      setToastMessage("Copy failed on this device. You can still select and copy manually.");
      setShowToast(true);
    }
  };

  const handleDownloadRecoveryCodes = () => {
    if (visibleRecoveryCodes.length === 0) {
      return;
    }

    const fileContents = [
      "Jesh Portfolio Admin recovery codes",
      "",
      ...visibleRecoveryCodes,
      "",
      "Each code works once. Keep them somewhere safe.",
    ].join("\n");

    const blob = new Blob([fileContents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddPasskey = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasskeyError("");
    if (!passkeysSupported()) {
      setPasskeyError("Passkeys require HTTPS and a supported browser.");
      return;
    }

    try {
      setPasskeyLoading(true);
      const token = localStorage.getItem("token");
      const startResponse = await fetch(`${API_BASE_URL}/api/auth/passkeys/register/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: passkeyPassword, code: passkeyCode }),
      });
      if (!startResponse.ok) {
        throw new Error(
          startResponse.status === 401
            ? "Your password or Google Authenticator code was not accepted."
            : "Could not start passkey setup."
        );
      }
      const startData = await startResponse.json();
      const credential = (await navigator.credentials.create({
        publicKey: registrationOptionsFromJson(startData.publicKeyOptionsJson),
      })) as PublicKeyCredential | null;
      if (!credential) throw new Error("No passkey was created.");

      const finishResponse = await fetch(`${API_BASE_URL}/api/auth/passkeys/register/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId: startData.challengeId,
          credentialJson: credentialToJson(credential),
          name: passkeyName,
        }),
      });
      if (!finishResponse.ok) throw new Error("The passkey could not be saved.");
      const saved: Passkey = await finishResponse.json();
      setPasskeys((current) => [...current, saved]);
      setPasskeyPassword("");
      setPasskeyCode("");
      setToastMessage("Passkey added. You can now use it as your main way to sign in.");
      setShowToast(true);
    } catch (passkeySetupError) {
      console.error(passkeySetupError);
      setPasskeyError(
        passkeySetupError instanceof DOMException && passkeySetupError.name === "NotAllowedError"
          ? "Passkey setup was cancelled or timed out."
          : passkeySetupError instanceof Error
            ? passkeySetupError.message
            : "Could not add this passkey."
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleRemovePasskey = async (passkey: Passkey) => {
    if (!confirm(`Remove “${passkey.name}”? Google Authenticator will remain available.`)) return;
    setPasskeyError("");
    try {
      setPasskeyLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/auth/passkeys/${passkey.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: passkeyPassword, code: passkeyCode }),
      });
      if (!response.ok) {
        throw new Error("Enter your password and a current Google Authenticator code first.");
      }
      setPasskeys((current) => current.filter((item) => item.id !== passkey.id));
      setPasskeyPassword("");
      setPasskeyCode("");
      setToastMessage("Passkey removed.");
      setShowToast(true);
    } catch (removeError) {
      console.error(removeError);
      setPasskeyError(removeError instanceof Error ? removeError.message : "Could not remove passkey.");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <>
      <main>
        <div className="admin-page-header">
          <div>
            <h1>Account</h1>
            <p>View admin access, registration status, and account controls.</p>
          </div>
        </div>

        <section className="admin-account-grid">
          <div className="admin-account-panel admin-account-profile">
            <div className="admin-account-icon">
              <UserRound size={22} />
            </div>
            <p className="admin-stat-label">Signed in as</p>
            <h2>{loading ? "Loading..." : account?.email ?? "Unavailable"}</h2>
            <small>Account ID: {account?.id ?? "-"}</small>
          </div>

          <div className="admin-account-panel">
            <div className="admin-account-icon">
              <LockKeyhole size={22} />
            </div>
            <p className="admin-stat-label">Registration</p>
            <h2>
              {loading
                ? "Loading..."
                : account?.userCount === 0 && account?.registrationEnabled === false
                  ? "Unavailable"
                  : account?.registrationEnabled
                    ? "Enabled"
                    : "Disabled"}
            </h2>
            <small>
              {account?.userCount === 0 && account?.registrationEnabled === false
                ? "Registration status requires the /api/auth/account backend endpoint."
                : account?.registrationEnabled
                ? "New admin accounts can currently be created."
                : "New account creation is currently blocked by server config."}
            </small>
          </div>

          <div className="admin-account-panel">
            <div className="admin-account-icon">
              <ShieldCheck size={22} />
            </div>
            <p className="admin-stat-label">Two-factor authentication</p>
            <h2>
              {loading
                ? "Loading..."
                : account?.twoFactorEnabled
                  ? "Enabled"
                  : "Disabled"}
            </h2>
            <small>
              {account?.twoFactorEnabled
                ? `Google Authenticator is required during admin login. ${account?.recoveryCodeCount ?? 0} backup codes ready.`
                : "Add Google Authenticator for a second sign-in step."}
            </small>
          </div>

          <div className="admin-account-panel">
            <div className="admin-account-icon">
              <ShieldCheck size={22} />
            </div>
            <p className="admin-stat-label">Users in database</p>
            <h2>
              {loading
                ? "-"
                : account?.userCount === 0 && account?.registrationEnabled === false
                  ? "N/A"
                  : account?.userCount ?? 0}
            </h2>
            <small>
              {account?.userCount === 0 && account?.registrationEnabled === false
                ? "User count requires the /api/auth/account backend endpoint."
                : "Total stored admin user accounts."}
            </small>
          </div>
        </section>

        <section className="admin-section admin-theme-panel">
          <div className="admin-section-header">
            <div>
              <p className="admin-stat-label">Primary sign-in</p>
              <h2>Passkeys</h2>
            </div>
            <small>{passkeys.length > 0 ? `${passkeys.length} ready` : "Not set up"}</small>
          </div>

          <p>
            Sign in using your phone, fingerprint, face, pattern, or device PIN.
            Google Authenticator remains your backup sign-in method.
          </p>

          {passkeys.length > 0 && (
            <div className="admin-passkey-list">
              {passkeys.map((passkey) => (
                <div className="admin-passkey-item" key={passkey.id}>
                  <span className="admin-account-icon"><KeyRound size={19} /></span>
                  <div>
                    <strong>{passkey.name}</strong>
                    <small>
                      Passkey · Added{" "}
                      {new Date(passkey.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="auth-secondary-button"
                    onClick={() => handleRemovePasskey(passkey)}
                    disabled={passkeyLoading}
                    aria-label={`Remove ${passkey.name}`}
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {!account?.twoFactorEnabled ? (
            <p className="auth-error">
              Enable Google Authenticator below before adding a passkey. It will be your backup.
            </p>
          ) : (
            <form className="admin-two-factor-form" onSubmit={handleAddPasskey}>
              <p className="admin-two-factor-help">
                To add or remove a passkey, confirm with your password and a current
                Google Authenticator code.
              </p>
              <input
                type="text"
                placeholder="Passkey name, e.g. My iPhone"
                value={passkeyName}
                maxLength={120}
                onChange={(event) => setPasskeyName(event.target.value)}
              />
              <input
                type="password"
                placeholder="Current password"
                autoComplete="current-password"
                value={passkeyPassword}
                onChange={(event) => setPasskeyPassword(event.target.value)}
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                placeholder="Current 6-digit authenticator code"
                value={passkeyCode}
                onChange={(event) =>
                  setPasskeyCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              {passkeyError && <p className="auth-error">{passkeyError}</p>}
              <button
                type="submit"
                className="admin-primary-button"
                disabled={passkeyLoading}
              >
                <KeyRound size={18} />
                {passkeyLoading ? "Waiting for your device..." : "Add a passkey"}
              </button>
            </form>
          )}
        </section>

        <section className="admin-section admin-theme-panel">
          <div className="admin-section-header">
            <div>
              <p className="admin-stat-label">Appearance</p>
              <h2>Theme preference</h2>
            </div>
            <small>Current: {theme}</small>
          </div>

          <p>
            Choose how the portfolio and admin area should look on this device.
          </p>

          <div className="admin-theme-options">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`admin-theme-option ${theme === option.value ? "active" : ""}`}
                onClick={() => setTheme(option.value)}
                aria-pressed={theme === option.value}
              >
                {option.icon}
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-section admin-theme-panel">
          <div className="admin-section-header">
            <div>
              <p className="admin-stat-label">Security</p>
              <h2>Google Authenticator</h2>
            </div>
            <small>{account?.twoFactorEnabled ? "Protected" : "Not enabled"}</small>
          </div>

          <p>
            Use Google Authenticator to generate 6-digit codes for admin sign-in. Backup
            recovery codes let you back in if you lose access to your authenticator.
          </p>

          {!account?.twoFactorEnabled ? (
            <div className="admin-two-factor-panel">
              <button
                type="button"
                className="admin-primary-button"
                onClick={handleStartTwoFactorSetup}
                disabled={twoFactorLoading}
              >
                {setupData ? "Generate a new setup key" : "Start setup"}
              </button>

              {setupData && (
                <form className="admin-two-factor-form" onSubmit={handleEnableTwoFactor}>
                  <div className="admin-two-factor-setup-grid">
                    <div className="admin-two-factor-qr">
                      <img
                        src={setupData.qrCodeDataUrl}
                        alt="QR code for adding this account to Google Authenticator"
                      />
                    </div>
                    <div className="admin-two-factor-secret">
                      <span>Manual setup key</span>
                      <code>{setupData.secret}</code>
                      <div className="admin-two-factor-actions">
                        <button
                          type="button"
                          className="auth-secondary-button"
                          onClick={() =>
                            handleCopyText(setupData.secret, "Setup key copied to clipboard.")
                          }
                        >
                          Copy setup key
                        </button>
                        <button
                          type="button"
                          className="auth-secondary-button"
                          onClick={() =>
                            handleCopyText(setupData.otpauthUrl, "Authenticator setup link copied.")
                          }
                        >
                          Copy setup link
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="admin-two-factor-help">
                    Scan the QR code with Google Authenticator, or tap + and choose
                    "Enter a setup key" if you prefer to paste the secret manually.
                  </p>
                  <a className="admin-two-factor-link" href={setupData.otpauthUrl}>
                    Open setup link
                  </a>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    placeholder="Enter the 6-digit code"
                    value={enableCode}
                    onChange={(event) =>
                      setEnableCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                  {twoFactorError && <p className="auth-error">{twoFactorError}</p>}
                  <button
                    type="submit"
                    className="admin-primary-button"
                    disabled={twoFactorLoading}
                  >
                    Confirm and enable
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="admin-two-factor-panel">
              <div className="admin-two-factor-status">
                <strong>{account?.recoveryCodeCount ?? 0} backup codes available</strong>
                <span>Each recovery code works once during login if your authenticator is unavailable.</span>
              </div>

              {visibleRecoveryCodes.length > 0 && (
                <div className="admin-recovery-codes-card">
                  <div className="admin-recovery-codes-header">
                    <div>
                      <strong>Save these recovery codes now</strong>
                      <span>You will not be able to view this same set again later.</span>
                    </div>
                    <div className="admin-two-factor-actions">
                      <button
                        type="button"
                        className="auth-secondary-button"
                        onClick={() =>
                          handleCopyText(
                            visibleRecoveryCodes.join("\n"),
                            "Recovery codes copied to clipboard."
                          )
                        }
                      >
                        Copy codes
                      </button>
                      <button
                        type="button"
                        className="auth-secondary-button"
                        onClick={handleDownloadRecoveryCodes}
                      >
                        Download TXT
                      </button>
                    </div>
                  </div>
                  <div className="admin-recovery-codes-grid">
                    {visibleRecoveryCodes.map((code) => (
                      <code key={code}>{code}</code>
                    ))}
                  </div>
                </div>
              )}

              <form className="admin-two-factor-form" onSubmit={handleRegenerateRecoveryCodes}>
                <p className="admin-two-factor-help">
                  Generate a fresh set of backup recovery codes. This replaces any older set.
                </p>
                <input
                  type="password"
                  placeholder="Current password"
                  autoComplete="current-password"
                  value={regeneratePassword}
                  onChange={(event) => setRegeneratePassword(event.target.value)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="Current 6-digit authenticator code"
                  value={regenerateCode}
                  onChange={(event) =>
                    setRegenerateCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={twoFactorLoading}
                >
                  Generate new recovery codes
                </button>
              </form>

              <form className="admin-two-factor-form" onSubmit={handleDisableTwoFactor}>
                <p className="admin-two-factor-help">
                  Disabling 2FA requires your password and a current code from
                  Google Authenticator.
                </p>
                <input
                  type="password"
                  placeholder="Current password"
                  autoComplete="current-password"
                  value={disablePassword}
                  onChange={(event) => setDisablePassword(event.target.value)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="6-digit authentication code"
                  value={disableCode}
                  onChange={(event) =>
                    setDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
                {twoFactorError && <p className="auth-error">{twoFactorError}</p>}
                <button
                  type="submit"
                  className="auth-secondary-button"
                  disabled={twoFactorLoading}
                >
                  Disable Google Authenticator
                </button>
              </form>
            </div>
          )}
        </section>

        <section className="admin-account-danger">
          <div>
            <span className="admin-danger-icon">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h2>Danger Zone</h2>
              <p>
                Delete your admin account only if you are sure you no longer need
                access to this portfolio CMS.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-danger-button"
            onClick={handleDeleteAccount}
            disabled={loading || deleting}
          >
            {deleting ? "Deleting..." : "Delete Account"}
          </button>
        </section>
      </main>

      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default AdminAccountPage;
