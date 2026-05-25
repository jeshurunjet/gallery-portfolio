import { useEffect, useState } from "react";
import {
  AlertTriangle,
  LockKeyhole,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import Toast from "../../components/Toast";
import useTheme from "../../hooks/useTheme";

type AccountSummary = {
  id: number;
  email: string;
  registrationEnabled: boolean;
  userCount: number;
};

type CurrentUser = {
  id: number;
  email: string;
};

function AdminAccountPage() {
  const { theme, setTheme } = useTheme();
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

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
