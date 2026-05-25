import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

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
      if (
        t === "dark" ||
        (t === "system" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        root.classList.add("theme-dark");
      } else {
        root.classList.remove("theme-dark");
      }
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
