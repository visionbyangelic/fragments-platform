import { Palette } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { isLegacyTheme, LEGACY_PICKER_NAMES, THEMES, themeDef, themeLabel } from "@/lib/themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    // From a custom wall, cycling lands on the first preset. The
    // cycle stays in the theme's own era: a wall on a retired theme
    // cycles the old set, a wall on a new theme cycles the new one,
    // so the toggle never drags a trial wall onto the other set.
    const list = isLegacyTheme(theme)
      ? LEGACY_PICKER_NAMES.map((n) => themeDef(n)!)
      : THEMES;
    const idx = list.findIndex((t) => t.name === theme);
    const next = list[(idx + 1) % list.length];
    setTheme(next.name, undefined, null);
  };

  const currentLabel = themeLabel(theme);

  return (
    <button
      onClick={cycleTheme}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 backdrop-blur transition hover:bg-card"
      aria-label={`Current theme: ${currentLabel}. Click to change.`}
    >
      <Palette className="h-5 w-5 text-primary" />
      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 transition group-hover:opacity-100">
        {currentLabel}
      </span>
    </button>
  );
}
