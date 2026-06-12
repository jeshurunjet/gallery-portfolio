export const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
export const AUTH_MESSAGE_KEY = "authMessage";
export const AUTH_LAST_ACTIVITY_KEY = "authLastActivity";

export function isAuthStored() {
  return (
    localStorage.getItem("isAuth") === "true" &&
    Boolean(localStorage.getItem("token"))
  );
}

export function markSessionActive(timestamp = Date.now()) {
  localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(timestamp));
}

export function getLastActivity() {
  const rawValue = localStorage.getItem(AUTH_LAST_ACTIVITY_KEY);
  const parsed = Number(rawValue);

  if (!rawValue || Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

export function hasSessionExpired(now = Date.now()) {
  const lastActivity = getLastActivity();

  if (lastActivity === null) {
    return isAuthStored();
  }

  return now - lastActivity >= SESSION_TIMEOUT_MS;
}

export function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("isAuth");
  localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
}

export function startStoredSession(token: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("isAuth", "true");
  markSessionActive();
}

export function expireStoredSession(
  message = "Your session has expired. Please log in again."
) {
  clearStoredSession();
  sessionStorage.setItem(AUTH_MESSAGE_KEY, message);
}
