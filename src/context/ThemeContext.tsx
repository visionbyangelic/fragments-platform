import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "pink-dream" | "dusk";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "fragments-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "dusk";
    const stored = localStorage.getItem(THEME_KEY);
    // Dusk is the default. Only an explicit Pink Dream choice, or a
    // retired theme name, changes that: retired names also land on Dusk.
    return stored === "pink-dream" ? "pink-dream" : "dusk";
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
