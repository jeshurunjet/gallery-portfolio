import { useThemeContext } from "../context/ThemeProvider";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  return useThemeContext();
}

export default useTheme;
