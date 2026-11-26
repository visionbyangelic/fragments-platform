// Custom themes: a wall owner picks three colours and the whole
// look is derived from them, so a custom wall always stays readable
// no matter what they pick. The derivation mirrors what the preset
// themes do by hand: surfaces are the background mixed a little way
// toward the text colour, the accent carries the buttons, and every
// piece of text is checked against the surface it sits on.

export interface CustomTheme {
  /** Page background. */
  bg: string;
  /** Buttons, links, highlights. */
  accent: string;
  /** Main text colour. */
  ink: string;
}

// A warm cocoa starter, distinct from every preset.
export const DEFAULT_CUSTOM_THEME: CustomTheme = {
  bg: "#2b1d16",
  accent: "#e8a87c",
  ink: "#f7ead9",
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isCustomTheme(value: unknown): value is CustomTheme {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.bg === "string" &&
    HEX_RE.test(v.bg) &&
    typeof v.accent === "string" &&
    HEX_RE.test(v.accent) &&
    typeof v.ink === "string" &&
    HEX_RE.test(v.ink)
  );
}

/** Reads a custom theme back out of a profile row (or anywhere else). */
export function parseCustomTheme(value: unknown): CustomTheme | null {
  return isCustomTheme(value)
    ? {
        bg: (value as CustomTheme).bg.toLowerCase(),
        accent: (value as CustomTheme).accent.toLowerCase(),
        ink: (value as CustomTheme).ink.toLowerCase(),
      }
    : null;
}

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** t = 0 gives a, t = 1 gives b. */
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isDark(hex: string): boolean {
  return luminance(hex) < 0.45;
}

/** Dark text on a light surface, light text on a dark one. */
function contrastText(hex: string): string {
  return luminance(hex) > 0.45 ? "#241d18" : "#f7f2e8";
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

function rotateHue(hex: string, degrees: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex((h + degrees + 360) % 360, s, l);
}

export interface BuiltCustomTheme {
  /** CSS variables, keys with their -- prefix, ready for setProperty. */
  vars: Record<string, string>;
  colorScheme: "dark" | "light";
}

/** Derives every theme variable the wall uses from three colours. */
export function buildCustomThemeVars(picks: CustomTheme): BuiltCustomTheme {
  const { bg, accent, ink } = picks;
  const dark = isDark(bg);
  const card = mix(bg, ink, 0.07);
  const mutedFg = mix(bg, ink, dark ? 0.55 : 0.45);
  const accentSurface = mix(accent, bg, 0.3);
  const fragBase = mix(bg, accent, 0.55);

  const vars: Record<string, string> = {
    "--background": bg,
    "--foreground": ink,
    "--card": card,
    "--card-foreground": ink,
    "--popover": card,
    "--popover-foreground": ink,
    "--primary": accent,
    "--primary-foreground": contrastText(accent),
    "--secondary": mix(bg, accent, 0.16),
    "--secondary-foreground": ink,
    "--muted": mix(bg, ink, 0.1),
    "--muted-foreground": mutedFg,
    "--accent": accentSurface,
    "--accent-foreground": contrastText(accentSurface),
    "--destructive": "#e5484d",
    "--destructive-foreground": "#fff8f8",
    "--border": mix(bg, ink, 0.16),
    "--input": mix(bg, ink, 0.22),
    "--ring": accent,
    "--sidebar": bg,
    "--sidebar-foreground": ink,
    "--sidebar-primary": accent,
    "--sidebar-primary-foreground": contrastText(accent),
    "--sidebar-accent": mix(bg, accent, 0.16),
    "--sidebar-accent-foreground": ink,
    "--sidebar-border": mix(bg, ink, 0.16),
    "--sidebar-ring": accent,
    // Fragment surfaces: the accent spun around the wheel, pulled
    // toward the background so they sit with the wall, never shout.
    "--frag-blush": mix(bg, rotateHue(accent, 0), 0.55),
    "--frag-lavender": mix(bg, rotateHue(accent, 45), 0.55),
    "--frag-sky": mix(bg, rotateHue(accent, 200), 0.55),
    "--frag-mint": mix(bg, rotateHue(accent, 160), 0.55),
    "--frag-peach": mix(bg, rotateHue(accent, 25), 0.55),
    "--frag-lilac": mix(bg, rotateHue(accent, 280), 0.55),
    "--frag-foreground": contrastText(fragBase),
    // Letters stay on paper, whatever the wall looks like.
    "--letter-cream": "#f2e8d5",
    "--letter-aged": "#e8d9b8",
    "--letter-pink": "#f3ddd6",
    "--letter-blue": "#dde6f2",
    "--letter-foreground": "#2a2118",
    "--gradient-sanctuary": `linear-gradient(135deg, ${bg}, ${mix(bg, accent, 0.28)} 50%, ${mix(bg, accent, 0.12)})`,
    "--gradient-aura": `radial-gradient(circle at 30% 20%, ${hexWithAlpha(accent, 0.35)}, transparent 60%), radial-gradient(circle at 80% 70%, ${hexWithAlpha(accent, 0.25)}, transparent 55%)`,
    "--glass-bg": hexWithAlpha(bg, 0.55),
    "--glass-border": hexWithAlpha(mix(bg, ink, 0.35), 0.5),
    "--shadow-soft": `0 20px 50px -20px ${hexWithAlpha("#000000", dark ? 0.7 : 0.35)}`,
    "--shadow-glow": `0 0 40px -8px ${hexWithAlpha(accent, 0.45)}`,
  };

  return { vars, colorScheme: dark ? "dark" : "light" };
}

export interface CustomCardPalette {
  bg: [string, string, string];
  ink: string;
  muted: string;
  accent: string;
  letter: string;
  letterInk: string;
}

/** The share-card palette for a custom wall. */
export function customCardPalette(picks: CustomTheme): CustomCardPalette {
  return {
    bg: [picks.bg, mix(picks.bg, picks.accent, 0.18), mix(picks.bg, picks.accent, 0.08)],
    ink: picks.ink,
    muted: mix(picks.bg, picks.ink, 0.5),
    accent: picks.accent,
    letter: "#fbf3df",
    letterInk: "#322c40",
  };
}
