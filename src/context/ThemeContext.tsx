import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  CUSTOM_THEME_NAME,
  DEFAULT_THEME,
  isThemeName,
  themeDef,
  type ThemeName,
} from "@/lib/themes";
import {
  buildCustomThemeVars,
  DEFAULT_CUSTOM_THEME,
  parseCustomTheme,
  type CustomTheme,
} from "@/lib/custom-theme";
import {
  buildOverrideVars,
  OVERRIDE_VAR_KEYS,
  parseThemeOverrides,
  type ThemeOverrides,
} from "@/lib/theme-overrides";

export type { ThemeName };
export type { CustomTheme };
export type { ThemeOverrides };

interface ThemeContextValue {
  theme: ThemeName;
  /** The owner's own colours when the theme is Custom, else null. */
  customTheme: CustomTheme | null;
  /** The owner's editor overrides on top of the theme, else null. */
  overrides: ThemeOverrides | null;
  /** Switch theme; pass the custom colours when switching to Custom,
      and the editor overrides (null clears them). */
  setTheme: (
    theme: ThemeName,
    custom?: CustomTheme | null,
    overrides?: ThemeOverrides | null,
  ) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "fragments-theme";
const CUSTOM_KEY = "fragments-custom-theme";
const CUSTOM_VARS_KEY = "fragments-custom-vars";
const OVERRIDES_KEY = "fragments-theme-overrides";
const OVERRIDE_VARS_KEY = "fragments-override-vars";
const OVERRIDE_SCHEME_KEY = "fragments-override-scheme";

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

function readStoredOverrides(): ThemeOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    return parseThemeOverrides(JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "null"));
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

function applyOverrideVars(overrides: ThemeOverrides): void {
  const root = document.documentElement;
  const built = buildOverrideVars(overrides);
  for (const [key, value] of Object.entries(built.vars)) {
    root.style.setProperty(key, value);
  }
  if (built.colorScheme) {
    root.style.colorScheme = built.colorScheme;
    try {
      localStorage.setItem(OVERRIDE_SCHEME_KEY, built.colorScheme);
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    localStorage.setItem(OVERRIDE_VARS_KEY, JSON.stringify(built.vars));
  } catch {
    /* ignore */
  }
}

function clearOverrideVars(): void {
  const root = document.documentElement;
  for (const key of OVERRIDE_VAR_KEYS) root.style.removeProperty(key);
  try {
    localStorage.removeItem(OVERRIDES_KEY);
    localStorage.removeItem(OVERRIDE_VARS_KEY);
    localStorage.removeItem(OVERRIDE_SCHEME_KEY);
  } catch {
    /* ignore */
  }
}

/** Applies a theme straight to the document: the data-theme and
    card style attributes plus the custom and override variables.
    The wall and the gate call this from their profile effects as
    well as setTheme, so the saved look lands even if the context
    state is stale from an earlier visit — the document is what
    the visitor actually sees. */
export function applyThemeToDocument(
  name: ThemeName,
  custom?: CustomTheme | null,
  overrides?: ThemeOverrides | null,
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", name);
  // The wall's card style: the editor's override wins, else the
  // theme's own default.
  const cardStyle = overrides?.cardStyle ?? themeDef(name)?.cardStyle ?? "rounded";
  root.setAttribute("data-card-style", cardStyle);
  if (name === CUSTOM_THEME_NAME) {
    // Custom keeps its fallback block until the colours land; the
    // inline variables then override it.
    if (custom) applyCustomVars(custom);
  } else {
    clearCustomVars();
  }
  if (overrides) {
    applyOverrideVars(overrides);
  } else {
    clearOverrideVars();
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const stored = localStorage.getItem(THEME_KEY);
    // Moonlight is the default. A stored choice wins; anything unknown
    // (including retired theme names) falls back to Moonlight.
    return isThemeName(stored) ? stored : DEFAULT_THEME;
  });
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(() =>
    readStoredCustom(),
  );
  const [overrides, setOverridesState] = useState<ThemeOverrides | null>(() =>
    readStoredOverrides(),
  );

  useEffect(() => {
    applyThemeToDocument(theme, customTheme, overrides);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage is a convenience, never a blocker */
    }
  }, [theme, customTheme, overrides]);

  // Stable on purpose: effects in the wall and the gate depend on it,
  // and a new identity every render would re-run them forever.
  const setTheme = useCallback(
    (
      newTheme: ThemeName,
      custom?: CustomTheme | null,
      newOverrides?: ThemeOverrides | null,
    ) => {
      if (custom) setCustomThemeState(custom);
      if (newOverrides !== undefined) setOverridesState(newOverrides);
      setThemeState(newTheme);
    },
    [],
  );

  return (
    <ThemeContext.Provider value={{ theme, customTheme, overrides, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
