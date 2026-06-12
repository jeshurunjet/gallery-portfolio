import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Toast from "./Toast";
import {
  AUTH_LAST_ACTIVITY_KEY,
  expireStoredSession,
  hasSessionExpired,
  isAuthStored,
  markSessionActive,
  SESSION_TIMEOUT_MS,
} from "../utils/session";

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";

function SessionManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const logoutTimerRef = useRef<number | null>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const isLoginRoute = location.pathname === "/admin/login";

  useEffect(() => {
    const clearTimers = () => {
      if (logoutTimerRef.current !== null) {
        window.clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }

      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };

    const showBrowserNotification = () => {
      if (!("Notification" in window)) {
        return;
      }

      if (Notification.permission !== "granted") {
        return;
      }

      try {
        new Notification("Session expired", {
          body: "Please login again.",
        });
      } catch (error) {
        console.error("Notification failed:", error);
      }
    };

    const expireAndRedirect = () => {
      if (!isAuthStored()) {
        return;
      }

      clearTimers();
      expireStoredSession(SESSION_EXPIRED_MESSAGE);
      setToastMessage(SESSION_EXPIRED_MESSAGE);
      showBrowserNotification();

      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/admin/login", { replace: true });
      }, 900);
    };

    const scheduleExpiry = () => {
      clearTimers();

      if (!isAuthStored()) {
        return;
      }

      if (hasSessionExpired()) {
        expireAndRedirect();
        return;
      }

      const lastActivity = Number(localStorage.getItem(AUTH_LAST_ACTIVITY_KEY));
      const safeLastActivity = Number.isNaN(lastActivity)
        ? Date.now()
        : lastActivity;
      const remaining = Math.max(
        0,
        SESSION_TIMEOUT_MS - (Date.now() - safeLastActivity)
      );

      logoutTimerRef.current = window.setTimeout(expireAndRedirect, remaining);
    };

    const handleActivity = () => {
      if (!isAuthStored() || isLoginRoute) {
        return;
      }

      markSessionActive();
      scheduleExpiry();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (isAuthStored() && hasSessionExpired()) {
        expireAndRedirect();
        return;
      }

      scheduleExpiry();
    };

    if (isAuthStored() && hasSessionExpired()) {
      expireAndRedirect();
    } else if (isAuthStored() && !isLoginRoute) {
      scheduleExpiry();
    } else {
      clearTimers();
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, handleActivity);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimers();
    };
  }, [isLoginRoute, navigate]);

  return toastMessage ? (
    <Toast message={toastMessage} onClose={() => setToastMessage("")} />
  ) : null;
}

export default SessionManager;
