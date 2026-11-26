// The platform's proper themes. Each one is a full look (palette,
// gradients, fragment surfaces, letter colours, heading font, card
// style, decorations), defined as CSS variables under
// [data-theme="..."] in styles.css.
//
// The presets: thirteen from the wall-themes brief (26 Nov 2026),
// Dreamy Pink Sky from her picture brief the same day, and nine more
// for every kind of wall — including the Stitch design as one option
// and two for the men she asked about (football, money). Every one
// is a different design — its own typography, background treatment,
// card styling and decorations — not a recoloured copy of the same
// page. Two of the earlier presets already matched the brief and
// survived the rebuild: Matcha Garden and Cloud Nine.
export type ThemeCategory =
  | "Pastel"
  | "Kawaii"
  | "Minimalist"
  | "Romantic"
  | "Nature"
  | "Dark Academia"
  | "Dreamy"
  | "Y2K"
  | "Dark"
  | "Bold"
  | "Classic";

export type ThemeFont = "cormorant" | "inter" | "baloo" | "caveat" | "vt323" | "great-vibes";

/** The heading/display font of a theme. The body font stays Inter. */
export const THEME_FONT_STACKS: Record<ThemeFont, string> = {
  cormorant: '"Cormorant Garamond", ui-serif, Georgia, serif',
  inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
  baloo: '"Baloo 2", "Cormorant Garamond", ui-serif, Georgia, serif',
  caveat: '"Caveat", "Cormorant Garamond", cursive',
  vt323: '"VT323", "Courier New", monospace',
  "great-vibes": '"Great Vibes", "Cormorant Garamond", cursive',
};

export const THEME_FONTS: { name: ThemeFont; label: string }[] = [
  { name: "cormorant", label: "Elegant serif" },
  { name: "inter", label: "Clean sans" },
  { name: "baloo", label: "Playful rounded" },
  { name: "caveat", label: "Handwritten" },
  { name: "vt323", label: "Pixel retro" },
  { name: "great-vibes", label: "Romantic script" },
];

/** How a wall's message cards are shaped and finished. */
export type CardStyle = "rounded" | "paper" | "polaroid" | "minimal" | "floating";

export const CARD_STYLES: { name: CardStyle; label: string; blurb: string }[] = [
  { name: "rounded", label: "Rounded cards", blurb: "Soft corners, gentle shadow" },
  { name: "paper", label: "Paper notes", blurb: "Flat, warm, stationery" },
  { name: "polaroid", label: "Polaroid", blurb: "Square corners, photo frame" },
  { name: "minimal", label: "Minimal bordered", blurb: "Thin border, no shadow" },
  { name: "floating", label: "Soft floating", blurb: "Big corners, big soft shadow" },
];

/** Decorative motifs that can drift around a wall. Rendered as small
    local SVGs (see components/WallDecorations.tsx) — never emoji, never
    external images. */
export type Decoration =
  | "hearts"
  | "stars"
  | "flowers"
  | "clouds"
  | "sparkles"
  | "butterflies"
  | "bows"
  | "daisies"
  | "football"
  | "dollar";

export const DECORATIONS: { name: Decoration; label: string }[] = [
  { name: "hearts", label: "Hearts" },
  { name: "stars", label: "Stars" },
  { name: "flowers", label: "Flowers" },
  { name: "clouds", label: "Clouds" },
  { name: "sparkles", label: "Sparkles" },
  { name: "butterflies", label: "Butterflies" },
  { name: "bows", label: "Bows" },
  { name: "daisies", label: "Daisies" },
  { name: "football", label: "Football" },
  { name: "dollar", label: "Dollar sign" },
];

export interface ThemeDef {
  name: string;
  label: string;
  blurb: string;
  /** Gallery category. The nine retired presets sit under Classic,
      below the current presets, so nothing anyone loved is taken away. */
  category: ThemeCategory;
  font: ThemeFont;
  cardStyle: CardStyle;
  decorations: Decoration[];
  /** The five editor colours in hex, matching the theme's CSS.
      The customisation editor starts its pickers here, and only
      colours the owner changes are saved as overrides. */
  defaults: { bg: string; accent: string; secondary: string; card: string; ink: string };
  card: { bg: [string, string, string]; ink: string; muted: string; accent: string; letter: string; letterInk: string };
}

export const THEMES: ThemeDef[] = [
  {
    name: "cherry",
    label: "Cherry Blossom",
    blurb: "Blush pink, petals, delicate serif",
    category: "Romantic",
    font: "cormorant",
    cardStyle: "paper",
    decorations: ["flowers"],
    defaults: { bg: "#f8e9ee", accent: "#d65a7e", secondary: "#f6dfe7", card: "#fdf3f5", ink: "#5c2a3d" },
    card: { bg: ["#fdf0f3", "#fbe4ea", "#f9dfe8"], ink: "#5a2a3a", muted: "#a86a80", accent: "#e0708f", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "coquette",
    label: "Coquette",
    blurb: "Bows, blush and script — the pretty pink wall",
    category: "Romantic",
    font: "great-vibes",
    cardStyle: "rounded",
    decorations: ["bows", "hearts", "sparkles", "flowers"],
    defaults: { bg: "#fbeef3", accent: "#cf6f92", secondary: "#f6dde8", card: "#fff8fa", ink: "#4d2a3c" },
    card: { bg: ["#fff6f9", "#fdeef3", "#fce4ec"], ink: "#4d2a3c", muted: "#b0708a", accent: "#d67b9c", letter: "#fdf6e3", letterInk: "#3d2c22" },
  },
  {
    name: "cloud",
    label: "Cloud Nine",
    blurb: "Soft sky, drifting clouds",
    category: "Dreamy",
    font: "baloo",
    cardStyle: "floating",
    decorations: ["clouds"],
    defaults: { bg: "#dcecf8", accent: "#5a9bd4", secondary: "#dbeefb", card: "#f4f9fd", ink: "#23405c" },
    card: { bg: ["#e8f3fc", "#dceefb", "#eef6fd"], ink: "#23405c", muted: "#5f84a3", accent: "#5aa3d8", letter: "#fbf3df", letterInk: "#2c3a40" },
  },
  {
    name: "moonlight",
    label: "Moonlight",
    blurb: "Lavender night, tiny stars",
    category: "Dreamy",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: ["stars", "sparkles"],
    defaults: { bg: "#1d1533", accent: "#b79ced", secondary: "#2c2145", card: "#241a3d", ink: "#ece8f7" },
    card: { bg: ["#241a3d", "#1c1430", "#2e2249"], ink: "#ece8f7", muted: "#a89ec9", accent: "#b79ced", letter: "#e6d9bd", letterInk: "#322c40" },
  },
  {
    name: "matcha",
    label: "Matcha Garden",
    blurb: "Soft green morning",
    category: "Nature",
    font: "cormorant",
    cardStyle: "minimal",
    decorations: [],
    defaults: { bg: "#eef4e4", accent: "#6f9e60", secondary: "#e2ecdc", card: "#f6f9ef", ink: "#2f4433" },
    card: { bg: ["#e7f0d8", "#d9ead0", "#f0efd3"], ink: "#2f4433", muted: "#6d8266", accent: "#6f9e60", letter: "#fbf3df", letterInk: "#37402a" },
  },
  {
    name: "love-letter",
    label: "Love Letter",
    blurb: "Cream paper, dusty rose, handwritten",
    category: "Romantic",
    font: "caveat",
    cardStyle: "paper",
    decorations: ["hearts", "bows"],
    defaults: { bg: "#f3e9d8", accent: "#c2707f", secondary: "#efe0cc", card: "#faf3e6", ink: "#4a3226" },
    card: { bg: ["#f7ead9", "#f3e0c8", "#f9efe0"], ink: "#4a3226", muted: "#96755e", accent: "#c2707f", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "y2k",
    label: "Y2K Dream",
    blurb: "Glossy pink, purple, sparkles",
    category: "Y2K",
    font: "baloo",
    cardStyle: "floating",
    decorations: ["stars", "sparkles"],
    defaults: { bg: "#f2dff2", accent: "#d65fb5", secondary: "#ecd9f0", card: "#f9eef9", ink: "#4a2350" },
    card: { bg: ["#f6e3f7", "#efd9f5", "#f9e6f2"], ink: "#4a2350", muted: "#96689e", accent: "#d65fb5", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "lavender",
    label: "Lavender Dream",
    blurb: "Soft lilac, gentle gradients",
    category: "Pastel",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: ["flowers"],
    defaults: { bg: "#f1e8f9", accent: "#9a76d6", secondary: "#ece0f7", card: "#faf6fd", ink: "#3f2a5c" },
    card: { bg: ["#f3eafb", "#ecdef8", "#f6effd"], ink: "#3f2a5c", muted: "#8a76a8", accent: "#9a76d6", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "sunshine",
    label: "Sunshine",
    blurb: "Butter yellow, daisies, warm orange",
    category: "Pastel",
    font: "baloo",
    cardStyle: "rounded",
    decorations: ["daisies"],
    defaults: { bg: "#faf0d2", accent: "#e8a13c", secondary: "#f7e9c0", card: "#fdf8e6", ink: "#54401a" },
    card: { bg: ["#fdf3d7", "#fbeec2", "#fdf6e0"], ink: "#54401a", muted: "#a3854e", accent: "#e8a13c", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "dark-academia",
    label: "Dark Academia",
    blurb: "Espresso, burgundy, antique gold",
    category: "Dark Academia",
    font: "cormorant",
    cardStyle: "paper",
    decorations: [],
    defaults: { bg: "#2e2318", accent: "#c9a227", secondary: "#3a2f22", card: "#3a2c20", ink: "#efe6d4" },
    card: { bg: ["#3a2c20", "#2e2318", "#463527"], ink: "#efe6d4", muted: "#b39d7f", accent: "#c9a227", letter: "#faf0d7", letterInk: "#40301c" },
  },
  {
    name: "ocean",
    label: "Ocean Blue",
    blurb: "Muted blue, seafoam, calm waves",
    category: "Nature",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: [],
    defaults: { bg: "#dde9f2", accent: "#5a9ec4", secondary: "#d5e5f0", card: "#f2f7fa", ink: "#23405c" },
    card: { bg: ["#e6f0f7", "#d8e9f2", "#eef5f9"], ink: "#23405c", muted: "#5f84a3", accent: "#5a9ec4", letter: "#fbf3df", letterInk: "#2c3a40" },
  },
  {
    name: "pixel",
    label: "Pixel Love",
    blurb: "Retro pixels, tiny hearts",
    category: "Kawaii",
    font: "vt323",
    cardStyle: "minimal",
    decorations: ["hearts", "stars"],
    defaults: { bg: "#ece7f7", accent: "#e05a9b", secondary: "#e6def6", card: "#f6f2fb", ink: "#33254d" },
    card: { bg: ["#f2eefc", "#e9e2f8", "#f6f0fd"], ink: "#33254d", muted: "#7d6a9e", accent: "#e05a9b", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "minimal",
    label: "Minimal",
    blurb: "Cream, charcoal, clean type",
    category: "Minimalist",
    font: "inter",
    cardStyle: "minimal",
    decorations: [],
    defaults: { bg: "#f5f1e8", accent: "#4a463e", secondary: "#eee9dd", card: "#ffffff", ink: "#2c2a26" },
    card: { bg: ["#faf7f0", "#f4efe4", "#fbf8f1"], ink: "#2c2a26", muted: "#8a8378", accent: "#6b6357", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "dreamy-pink-sky",
    label: "Dreamy Pink Sky",
    blurb: "Pastel pink sky, clouds, butterflies",
    category: "Dreamy",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: ["flowers", "clouds", "butterflies", "bows", "stars", "sparkles"],
    defaults: { bg: "#fceaf4", accent: "#d96fa5", secondary: "#f8e8fa", card: "#fffafd", ink: "#542747" },
    card: { bg: ["#fffafd", "#fceaf4", "#f8e8fa"], ink: "#542747", muted: "#956d89", accent: "#d96fa5", letter: "#fdeef5", letterInk: "#542747" },
  },
  {
    name: "sunset-blaze",
    label: "Sunset Blaze",
    blurb: "Golden hour, warm and bold",
    category: "Pastel",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: ["clouds", "stars", "sparkles"],
    defaults: { bg: "#fff1e6", accent: "#e85d3d", secondary: "#ffe3d0", card: "#fffbf5", ink: "#4a2318" },
    card: { bg: ["#fff8f0", "#ffefe0", "#ffe9d6"], ink: "#4a2318", muted: "#9a6b52", accent: "#e85d3d", letter: "#fdebd7", letterInk: "#4a2318" },
  },
  {
    name: "noir-gold",
    label: "Noir Gold",
    blurb: "Charcoal and gold, quietly luxurious",
    category: "Dark",
    font: "cormorant",
    cardStyle: "minimal",
    decorations: ["stars", "sparkles"],
    defaults: { bg: "#1a1a1e", accent: "#d4af37", secondary: "#232329", card: "#26262c", ink: "#f5f1e8" },
    card: { bg: ["#26262c", "#1e1e24", "#2e2e36"], ink: "#f5f1e8", muted: "#a8a29a", accent: "#d4af37", letter: "#efe6c8", letterInk: "#2a2118" },
  },
  {
    name: "desert-dunes",
    label: "Desert Dunes",
    blurb: "Warm sand, terracotta, open sky",
    category: "Nature",
    font: "caveat",
    cardStyle: "paper",
    decorations: ["flowers", "sparkles"],
    defaults: { bg: "#f7efe3", accent: "#b4552d", secondary: "#f1e3ce", card: "#fdf8ef", ink: "#3d2c1e" },
    card: { bg: ["#faf3e6", "#f5e9d3", "#fbf6ea"], ink: "#3d2c1e", muted: "#8a7260", accent: "#b4552d", letter: "#f7ead0", letterInk: "#3d2c1e" },
  },
  {
    name: "mint-cloud",
    label: "Mint Cloud",
    blurb: "Fresh mint, soft and clean",
    category: "Pastel",
    font: "baloo",
    cardStyle: "floating",
    decorations: ["daisies", "butterflies", "sparkles"],
    defaults: { bg: "#eaf7f0", accent: "#2e9e6b", secondary: "#ddf2e6", card: "#f7fcf9", ink: "#1f3d2e" },
    card: { bg: ["#f2faf5", "#e6f5ec", "#f7fcf9"], ink: "#1f3d2e", muted: "#6b8a7a", accent: "#2e9e6b", letter: "#eff7e8", letterInk: "#1f3d2e" },
  },
  {
    name: "rosewood",
    label: "Rosewood",
    blurb: "Deep wine, soft romance",
    category: "Romantic",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: ["flowers", "hearts", "sparkles"],
    defaults: { bg: "#f9ecec", accent: "#9b2c3a", secondary: "#f5dfdf", card: "#fdfaf8", ink: "#3d1f24" },
    card: { bg: ["#fdf6f4", "#f9e9e6", "#fdefec"], ink: "#3d1f24", muted: "#96686e", accent: "#9b2c3a", letter: "#f9e8e0", letterInk: "#3d1f24" },
  },
  {
    name: "arctic",
    label: "Arctic",
    blurb: "Ice blue, crisp and calm",
    category: "Minimalist",
    font: "inter",
    cardStyle: "minimal",
    decorations: ["clouds", "stars", "sparkles"],
    defaults: { bg: "#edf4f8", accent: "#3a7ca5", secondary: "#e0edf3", card: "#ffffff", ink: "#1e2f3d" },
    card: { bg: ["#f4f9fb", "#e8f2f7", "#f8fbfd"], ink: "#1e2f3d", muted: "#6b8598", accent: "#3a7ca5", letter: "#eaf2f7", letterInk: "#1e2f3d" },
  },
  {
    name: "dreamy-rose",
    label: "Dreamy Rose",
    blurb: "Soft rose, deep plum, quiet romance",
    category: "Dreamy",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: ["clouds", "stars", "sparkles", "flowers", "butterflies"],
    defaults: { bg: "#fff7fa", accent: "#92415b", secondary: "#fbe9f0", card: "#fff7fa", ink: "#2b122d" },
    card: { bg: ["#fff7fa", "#fbe9f0", "#f6dde8"], ink: "#2b122d", muted: "#8a5a6e", accent: "#92415b", letter: "#fdeef5", letterInk: "#2b122d" },
  },
  {
    name: "match-day",
    label: "Match Day",
    blurb: "Pitch green, match-night energy",
    category: "Bold",
    font: "inter",
    cardStyle: "rounded",
    decorations: ["football", "stars", "sparkles"],
    defaults: { bg: "#cfead3", accent: "#1b7a3d", secondary: "#bfe3c8", card: "#f4faf4", ink: "#0f2a18" },
    card: { bg: ["#eef8f0", "#dff0e2", "#f4faf4"], ink: "#0f2a18", muted: "#4e6b57", accent: "#1b7a3d", letter: "#eff7e8", letterInk: "#0f2a18" },
  },
  {
    name: "money-moves",
    label: "Money Moves",
    blurb: "Money green and gold, big plans",
    category: "Bold",
    font: "inter",
    cardStyle: "rounded",
    decorations: ["dollar", "stars", "sparkles"],
    defaults: { bg: "#dceedb", accent: "#1e7a34", secondary: "#c9e6c6", card: "#f4faf3", ink: "#122a18" },
    card: { bg: ["#eef8f0", "#dff0e2", "#f4faf3"], ink: "#122a18", muted: "#4e6b57", accent: "#1e7a34", letter: "#f3f0d8", letterInk: "#122a18" },
  },
];

export const THEME_CATEGORIES: ThemeCategory[] = [
  "Dreamy",
  "Romantic",
  "Pastel",
  "Nature",
  "Y2K",
  "Dark Academia",
  "Kawaii",
  "Minimalist",
  "Dark",
  "Bold",
  "Classic",
];

// The nine retired presets (26 Nov 2026). They were never removed —
// the trial only hid them — and now they sit in the gallery under
// Classic, below the current presets, so a wall that loved one keeps it.
// Matcha and Cloud Nine are not listed here: they survived the
// rebuild as new themes with the same names and the same CSS, so a
// wall on either resolves through THEMES and looks identical.
export const LEGACY_THEMES: ThemeDef[] = [
  {
    name: "dusk",
    label: "Dusk",
    blurb: "Deep blue violet night",
    category: "Classic",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: [],
    defaults: { bg: "#201b31", accent: "#b79ced", secondary: "#322b52", card: "#2b2444", ink: "#edeaf6" },
    card: { bg: ["#2b2444", "#231d38", "#352b52"], ink: "#edeaf6", muted: "#b6aed6", accent: "#b79ced", letter: "#e6d9bd", letterInk: "#322c40" },
  },
  {
    name: "pink-dream",
    label: "Pink Dream",
    blurb: "Soft pink sanctuary",
    category: "Classic",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: [],
    defaults: { bg: "#fbe9f3", accent: "#dd7fb2", secondary: "#f4e3f8", card: "#fdf3f7", ink: "#4a2b45" },
    card: { bg: ["#fbe9f3", "#f4e3f8", "#eae5fb"], ink: "#4a2b45", muted: "#96698c", accent: "#dd7fb2", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "midnight",
    label: "Midnight Ink",
    blurb: "Near black, silver moonlight",
    category: "Classic",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: [],
    defaults: { bg: "#12131a", accent: "#c7ceda", secondary: "#1e1f29", card: "#17181f", ink: "#e8e9ee" },
    card: { bg: ["#17181f", "#0f1015", "#1e1f29"], ink: "#e8e9ee", muted: "#9aa0ae", accent: "#c7ceda", letter: "#d8d3c3", letterInk: "#22232b" },
  },
  {
    name: "vintage",
    label: "Vintage Letter",
    blurb: "Warm paper and sepia ink",
    category: "Classic",
    font: "cormorant",
    cardStyle: "paper",
    decorations: [],
    defaults: { bg: "#f2e7ce", accent: "#b45a28", secondary: "#ead9b6", card: "#f6ecd4", ink: "#4a3520" },
    card: { bg: ["#f2e4c3", "#ead8b2", "#f5ead3"], ink: "#4a3520", muted: "#8a6b45", accent: "#b45a28", letter: "#faf0d7", letterInk: "#40301c" },
  },
  {
    name: "lagoon",
    label: "Lagoon",
    blurb: "Deep teal, sea glass light",
    category: "Classic",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: [],
    defaults: { bg: "#142f38", accent: "#5fd3c6", secondary: "#1e3f4a", card: "#173f4a", ink: "#e6f4f1" },
    card: { bg: ["#173f4a", "#112e39", "#1b4a42"], ink: "#e6f4f1", muted: "#9fc6bd", accent: "#5fd3c6", letter: "#dedbc4", letterInk: "#1e3238" },
  },
  {
    name: "ember",
    label: "Ember",
    blurb: "Warm sunset, low light",
    category: "Classic",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: [],
    defaults: { bg: "#2a1810", accent: "#e8863c", secondary: "#3d241a", card: "#3a2118", ink: "#f7e8d8" },
    card: { bg: ["#3a2118", "#2e1a12", "#4a2a1c"], ink: "#f7e8d8", muted: "#c9a586", accent: "#e8863c", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "forest",
    label: "Forest Night",
    blurb: "Deep green, after rain",
    category: "Classic",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: [],
    defaults: { bg: "#121f17", accent: "#6fbf7f", secondary: "#1b2f24", card: "#16261c", ink: "#e4f2e6" },
    card: { bg: ["#16261c", "#101f15", "#1d3226"], ink: "#e4f2e6", muted: "#8fae97", accent: "#6fbf7f", letter: "#fbf3df", letterInk: "#37402a" },
  },
  {
    name: "peach",
    label: "Peach Soda",
    blurb: "Fizzy peach, polka dots",
    category: "Classic",
    font: "baloo",
    cardStyle: "floating",
    decorations: [],
    defaults: { bg: "#fcefe2", accent: "#ef8f3c", secondary: "#fce7d2", card: "#fdf6ec", ink: "#5a3418" },
    card: { bg: ["#fdf0e3", "#fce7d2", "#fbe3c8"], ink: "#5a3418", muted: "#a97a4e", accent: "#ef8f3c", letter: "#fbf3df", letterInk: "#3d2c22" },
  },
  {
    name: "starry",
    label: "Starry Night",
    blurb: "Deep blue, tiny stars",
    category: "Classic",
    font: "cormorant",
    cardStyle: "rounded",
    decorations: ["stars"],
    defaults: { bg: "#141a30", accent: "#a8b8f0", secondary: "#232c4d", card: "#1b2340", ink: "#e9ecf7" },
    card: { bg: ["#1b2340", "#141a30", "#232c4d"], ink: "#e9ecf7", muted: "#9aa5c9", accent: "#a8b8f0", letter: "#e6d9bd", letterInk: "#322c40" },
  },
];

export function themeDef(name: string): ThemeDef | undefined {
  return THEMES.find((t) => t.name === name) ?? LEGACY_THEMES.find((t) => t.name === name);
}

// A new wall is born in a random theme — there is no fixed default.
// The pool is the current gallery (the 23 themes), not
// the Classics, so every new wall starts on something designed.
export function randomThemeName(): ThemeName {
  return THEMES[Math.floor(Math.random() * THEMES.length)].name;
}

// "custom" is not a preset: it means the owner picked their own three
// colours, stored on the profile as custom_theme. It is a valid theme
// name everywhere a preset is, but it has no entry in THEMES — its
// variables are derived at runtime (see lib/custom-theme.ts).
export const CUSTOM_THEME_NAME = "custom" as const;

export type CardPalette = ThemeDef["card"];

export function cardPalette(name: string): CardPalette {
  return themeDef(name)?.card ?? THEMES[0].card;
}

export type ThemeName = ThemeDef["name"] | (typeof LEGACY_THEMES)[number]["name"] | typeof CUSTOM_THEME_NAME;

export const DEFAULT_THEME: ThemeName = "moonlight";

export function isThemeName(value: unknown): value is ThemeName {
  return (
    typeof value === "string" &&
    (value === CUSTOM_THEME_NAME ||
      THEMES.some((t) => t.name === value) ||
      LEGACY_THEMES.some((t) => t.name === value))
  );
}

export function themeLabel(name: string): string {
  if (name === CUSTOM_THEME_NAME) return "Custom";
  return themeDef(name)?.label ?? "Moonlight";
}
