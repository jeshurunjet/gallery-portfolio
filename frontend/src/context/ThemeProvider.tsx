import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const FAVICON_ID = "app-favicon";
const APPLE_TOUCH_ICON_ID = "app-apple-touch-icon";

function buildLogoDataUrl(strokeColor: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
      <path d="M24.8 18.9 24.8 18.9l-9.2 10.3 0 0c-1.4 1.5-3.4 2.5-5.7 2.5-4.3 0-7.8-3.5-7.8-7.8s3.5-7.8 7.8-7.8c2.4 0 4.1 1.3 6 2.8l0 0" stroke="${strokeColor}" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10"/>
      <path d="M23.2 29.1 23.2 29.1l9.2-10.3 0 0c1.4-1.5 3.4-2.5 5.7-2.5 4.3 0 7.8 3.5 7.8 7.8s-3.5 7.8-7.8 7.8c-2.4 0-4.1-1.3-6-2.8l0 0" stroke="${strokeColor}" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function applyThemeIcons(isDark: boolean) {
  const href = buildLogoDataUrl(isDark ? "#ffffff" : "#111111");
  const favicon = document.getElementById(FAVICON_ID) as HTMLLinkElement | null;
  const appleTouchIcon = document.getElementById(
    APPLE_TOUCH_ICON_ID,
  ) as HTMLLinkElement | null;

  if (favicon) {
    favicon.href = href;
  }

  if (appleTouchIcon) {
    appleTouchIcon.href = href;
  }
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
} | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved) return saved;
    } catch {}
    return "system";
  });

  useEffect(() => {
    const apply = (t: Theme) => {
      const root = document.documentElement;
      const isDark =
        t === "dark" ||
        (t === "system" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDark) {
        root.classList.add("theme-dark");
      } else {
        root.classList.remove("theme-dark");
      }

      applyThemeIcons(isDark);
    };

    apply(theme);
    try {
      if (theme === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, theme);
    } catch {}

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => apply(theme);
    mql?.addEventListener?.("change", onChange);
    return () => mql?.removeEventListener?.("change", onChange);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState((p) => (p === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}

export default ThemeProvider;
