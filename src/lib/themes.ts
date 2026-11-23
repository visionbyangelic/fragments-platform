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
] as const;

export type CardPalette = (typeof THEMES)[number]["card"];

export function cardPalette(name: string): CardPalette {
  return (THEMES.find((t) => t.name === name) ?? THEMES[0]).card;
}

export type ThemeName = (typeof THEMES)[number]["name"];

export const DEFAULT_THEME: ThemeName = "dusk";

export function isThemeName(value: unknown): value is ThemeName {
  return (
    typeof value === "string" && THEMES.some((t) => t.name === value)
  );
}

export function themeLabel(name: string): string {
  return THEMES.find((t) => t.name === name)?.label ?? "Dusk";
}
