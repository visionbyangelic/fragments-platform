// Per-wall theme overrides: what the customisation editor saves.
// A wall's look is a base theme (profiles.theme) plus, optionally,
// these overrides (profiles.theme_overrides, jsonb). Everything is
// optional — whatever is absent falls back to the base theme. The
// whole object is plain JSON, so a customised look can one day be
// saved under a name and shared with another wall without any
// schema change.
import {
  CARD_STYLES,
  DECORATIONS,
  THEME_FONTS,
  THEME_FONT_STACKS,
  type CardStyle,
  type Decoration,
  type ThemeFont,
} from "./themes";

export interface ThemeColors {
  /** Page background. */
  bg?: string;
  /** Buttons, links, highlights. */
  accent?: string;
  /** Secondary surfaces. */
  secondary?: string;
  /** Message card surface. */
  card?: string;
  /** Main text colour. */
  ink?: string;
}

export interface ThemeOverrides {
  colors?: ThemeColors;
  font?: ThemeFont;
  decorations?: Decoration[];
  cardStyle?: CardStyle;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function cleanColors(value: unknown): ThemeColors | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const out: ThemeColors = {};
  for (const key of ["bg", "accent", "secondary", "card", "ink"] as const) {
    if (typeof v[key] === "string" && HEX_RE.test(v[key] as string)) {
      out[key] = (v[key] as string).toLowerCase();
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Reads overrides back out of a profile row (or anywhere else).
    Unknown or malformed fields are dropped, never trusted. */
export function parseThemeOverrides(value: unknown): ThemeOverrides | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const out: ThemeOverrides = {};
  const colors = cleanColors(v.colors);
  if (colors) out.colors = colors;
  if (
    typeof v.font === "string" &&
    THEME_FONTS.some((f) => f.name === v.font)
  ) {
    out.font = v.font as ThemeFont;
  }
  if (Array.isArray(v.decorations)) {
    const known = DECORATIONS.map((d) => d.name);
    const kept = v.decorations.filter(
      (d): d is Decoration => typeof d === "string" && known.includes(d as Decoration),
    );
    out.decorations = kept;
  }
  if (
    typeof v.cardStyle === "string" &&
    CARD_STYLES.some((c) => c.name === v.cardStyle)
  ) {
    out.cardStyle = v.cardStyle as CardStyle;
  }
  return Object.keys(out).length ? out : null;
}

/** The CSS variables an override set can write, so clearing them is
    exactly removing these keys (the theme's own values return). */
export const OVERRIDE_VAR_KEYS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--accent",
  "--accent-foreground",
  "--ring",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--gradient-sanctuary",
  "--gradient-aura",
  "--font-serif",
] as const;

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Builds the inline variables for an override set. Only the fields
    the owner actually changed are written — everything else keeps
    the base theme's own CSS, so a one-colour tweak never drags the
    rest of the wall with it. The hero and aura follow only when the
    colours they are built from changed too. */
export function buildOverrideVars(overrides: ThemeOverrides): {
  vars: Record<string, string>;
  colorScheme: "dark" | "light" | null;
} {
  const colors = overrides.colors ?? {};
  const vars: Record<string, string> = {};
  let colorScheme: "dark" | "light" | null = null;

  if (colors.bg) {
    vars["--background"] = colors.bg;
    vars["--sidebar"] = colors.bg;
    colorScheme = luminance(colors.bg) < 0.45 ? "dark" : "light";
  }
  if (colors.ink) {
    vars["--foreground"] = colors.ink;
    vars["--card-foreground"] = colors.ink;
    vars["--popover-foreground"] = colors.ink;
    vars["--secondary-foreground"] = colors.ink;
    vars["--accent-foreground"] = colors.ink;
    vars["--sidebar-foreground"] = colors.ink;
  }
  if (colors.card) {
    vars["--card"] = colors.card;
    vars["--popover"] = colors.card;
  }
  if (colors.accent) {
    vars["--primary"] = colors.accent;
    vars["--primary-foreground"] =
      luminance(colors.accent) > 0.45 ? "#241d18" : "#f7f2e8";
    vars["--ring"] = colors.accent;
    vars["--sidebar-primary"] = colors.accent;
    vars["--sidebar-primary-foreground"] = vars["--primary-foreground"];
    vars["--gradient-aura"] = `radial-gradient(circle at 30% 20%, ${hexWithAlpha(colors.accent, 0.3)}, transparent 60%), radial-gradient(circle at 80% 70%, ${hexWithAlpha(colors.accent, 0.2)}, transparent 55%)`;
  }
  if (colors.secondary) {
    vars["--secondary"] = colors.secondary;
    vars["--accent"] = colors.secondary;
    vars["--sidebar-accent"] = colors.secondary;
    vars["--sidebar-border"] = colors.secondary;
    vars["--sidebar-ring"] = colors.secondary;
  }
  if (colors.bg && colors.card) {
    vars["--gradient-sanctuary"] =
      `linear-gradient(135deg, ${colors.bg}, ${colors.card} 50%, ${colors.bg})`;
  }
  if (overrides.font) {
    vars["--font-serif"] = THEME_FONT_STACKS[overrides.font];
  }
  return { vars, colorScheme };
}
