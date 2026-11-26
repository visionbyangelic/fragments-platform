import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CUSTOM_THEME_NAME, DEFAULT_THEME, isThemeName, type ThemeName } from "@/lib/themes";
import {
  buildCustomThemeVars,
  DEFAULT_CUSTOM_THEME,
  parseCustomTheme,
  type CustomTheme,
} from "@/lib/custom-theme";

export type { ThemeName };
export type { CustomTheme };

interface ThemeContextValue {
  theme: ThemeName;
  /** The owner's own colours when the theme is Custom, else null. */
  customTheme: CustomTheme | null;
  /** Switch theme; pass the custom colours when switching to Custom. */
  setTheme: (theme: ThemeName, custom?: CustomTheme | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "fragments-theme";
const CUSTOM_KEY = "fragments-custom-theme";
const CUSTOM_VARS_KEY = "fragments-custom-vars";

// The variable names a custom theme sets. They are the same for every
// custom palette, so leaving Custom means removing exactly these.
const CUSTOM_VAR_KEYS = Object.keys(buildCustomThemeVars(DEFAULT_CUSTOM_THEME).vars);

function readStoredCustom(): CustomTheme | null {
  if (typeof window === "undefined") return null;
  try {
    return parseCustomTheme(JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "null"));
  } catch {
    return null;
  }
}

function applyCustomVars(picks: CustomTheme): void {
  const root = document.documentElement;
  const built = buildCustomThemeVars(picks);
  for (const [key, value] of Object.entries(built.vars)) {
    root.style.setProperty(key, value);
  }
  root.style.colorScheme = built.colorScheme;
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(picks));
    localStorage.setItem(CUSTOM_VARS_KEY, JSON.stringify(built.vars));
  } catch {
    /* storage is a convenience, never a blocker */
  }
}

function clearCustomVars(): void {
  const root = document.documentElement;
  for (const key of CUSTOM_VAR_KEYS) root.style.removeProperty(key);
  root.style.removeProperty("color-scheme");
  try {
    localStorage.removeItem(CUSTOM_VARS_KEY);
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const stored = localStorage.getItem(THEME_KEY);
    // Dusk is the default. A stored choice wins; anything unknown
    // (including retired theme names) falls back to Dusk.
    return isThemeName(stored) ? stored : DEFAULT_THEME;
  });
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(() =>
    readStoredCustom(),
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    if (theme === CUSTOM_THEME_NAME) {
      // Custom keeps its fallback block until the colours land; the
      // inline variables then override it.
      if (customTheme) applyCustomVars(customTheme);
    } else {
      clearCustomVars();
    }
  }, [theme, customTheme]);

  const setTheme = (newTheme: ThemeName, custom?: CustomTheme | null) => {
    if (custom) setCustomThemeState(custom);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, customTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
