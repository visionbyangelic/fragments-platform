// The platform's proper themes. Each one is a full look (palette,
// gradients, fragment surfaces, letter colours), defined as CSS
// variables under [data-theme="..."] in styles.css.
export const THEMES = [
  {
    name: "dusk",
    label: "Dusk",
    blurb: "Deep blue violet night",
    card: { bg: ["#2b2444", "#231d38", "#352b52"], ink: "#edeaf6", muted: "#b6aed6", accent: "#b79ced", letter: "#e6d9bd", letterInk: "#322c40" },
  },
  {
    name: "pink-dream",
    label: "Pink Dream",
    blurb: "Soft pink sanctuary",
    card: { bg: ["#fbe9f3", "#f4e3f8", "#eae5fb"], ink: "#4a2b45", muted: "#96698c", accent: "#dd7fb2", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "midnight",
    label: "Midnight Ink",
    blurb: "Near black, silver moonlight",
    card: { bg: ["#17181f", "#0f1015", "#1e1f29"], ink: "#e8e9ee", muted: "#9aa0ae", accent: "#c7ceda", letter: "#d8d3c3", letterInk: "#22232b" },
  },
  {
    name: "vintage",
    label: "Vintage Letter",
    blurb: "Warm paper and sepia ink",
    card: { bg: ["#f2e4c3", "#ead8b2", "#f5ead3"], ink: "#4a3520", muted: "#8a6b45", accent: "#b45a28", letter: "#faf0d7", letterInk: "#40301c" },
  },
  {
    name: "lagoon",
    label: "Lagoon",
    blurb: "Deep teal, sea glass light",
    card: { bg: ["#173f4a", "#112e39", "#1b4a42"], ink: "#e6f4f1", muted: "#9fc6bd", accent: "#5fd3c6", letter: "#dedbc4", letterInk: "#1e3238" },
  },
  {
    name: "matcha",
    label: "Matcha Garden",
    blurb: "Soft green morning",
    card: { bg: ["#e7f0d8", "#d9ead0", "#f0efd3"], ink: "#2f4433", muted: "#6d8266", accent: "#6f9e60", letter: "#fbf3df", letterInk: "#37402a" },
  },
  {
    name: "ember",
    label: "Ember",
    blurb: "Warm sunset, low light",
    card: { bg: ["#3a2118", "#2e1a12", "#4a2a1c"], ink: "#f7e8d8", muted: "#c9a586", accent: "#e8863c", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "forest",
    label: "Forest Night",
    blurb: "Deep green, after rain",
    card: { bg: ["#16261c", "#101f15", "#1d3226"], ink: "#e4f2e6", muted: "#8fae97", accent: "#6fbf7f", letter: "#fbf3df", letterInk: "#37402a" },
  },
  {
    name: "peach",
    label: "Peach Soda",
    blurb: "Fizzy peach, polka dots",
    card: { bg: ["#fdf0e3", "#fce7d2", "#fbe3c8"], ink: "#5a3418", muted: "#a97a4e", accent: "#ef8f3c", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "cloud",
    label: "Cloud Nine",
    blurb: "Soft sky, drifting clouds",
    card: { bg: ["#e8f3fc", "#dceefb", "#eef6fd"], ink: "#23405c", muted: "#5f84a3", accent: "#5aa3d8", letter: "#fbf3df", letterInk: "#2c3a40" },
  },
  {
    name: "starry",
    label: "Starry Night",
    blurb: "Deep blue, tiny stars",
    card: { bg: ["#1b2340", "#141a30", "#232c4d"], ink: "#e9ecf7", muted: "#9aa5c9", accent: "#a8b8f0", letter: "#e6d9bd", letterInk: "#322c40" },
  },
] as const;

// "custom" is not a preset: it means the owner picked their own three
// colours, stored on the profile as custom_theme. It is a valid theme
// name everywhere a preset is, but it has no entry in THEMES — its
// variables are derived at runtime (see lib/custom-theme.ts).
export const CUSTOM_THEME_NAME = "custom" as const;

export type CardPalette = (typeof THEMES)[number]["card"];

export function cardPalette(name: string): CardPalette {
  return (THEMES.find((t) => t.name === name) ?? THEMES[0]).card;
}

export type ThemeName = (typeof THEMES)[number]["name"] | typeof CUSTOM_THEME_NAME;

export const DEFAULT_THEME: ThemeName = "dusk";

export function isThemeName(value: unknown): value is ThemeName {
  return (
    typeof value === "string" &&
    (value === CUSTOM_THEME_NAME || THEMES.some((t) => t.name === value))
  );
}

export function themeLabel(name: string): string {
  if (name === CUSTOM_THEME_NAME) return "Custom";
  return THEMES.find((t) => t.name === name)?.label ?? "Dusk";
}
