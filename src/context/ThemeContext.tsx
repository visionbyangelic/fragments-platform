import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_THEME, isThemeName, type ThemeName } from "@/lib/themes";

export type { ThemeName };

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "fragments-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const stored = localStorage.getItem(THEME_KEY);
    // Dusk is the default. A stored choice wins; anything unknown
    // (including retired theme names) falls back to Dusk.
    return isThemeName(stored) ? stored : DEFAULT_THEME;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => setThemeState(newTheme);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
