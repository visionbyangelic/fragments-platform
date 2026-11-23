// The platform's proper themes. Each one is a full look (palette,
// gradients, fragment surfaces, letter colours), defined as CSS
// variables under [data-theme="..."] in styles.css.
export const THEMES = [
  { name: "dusk", label: "Dusk", blurb: "Deep blue violet night" },
  { name: "pink-dream", label: "Pink Dream", blurb: "Soft pink sanctuary" },
  { name: "midnight", label: "Midnight Ink", blurb: "Near black, silver moonlight" },
  { name: "vintage", label: "Vintage Letter", blurb: "Warm paper and sepia ink" },
  { name: "lagoon", label: "Lagoon", blurb: "Deep teal, sea glass light" },
  { name: "matcha", label: "Matcha Garden", blurb: "Soft green morning" },
] as const;

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
