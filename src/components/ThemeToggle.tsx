import { Palette } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { THEMES } from "@/lib/themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const idx = THEMES.findIndex((t) => t.name === theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.name);
  };

  const currentLabel = THEMES.find((t) => t.name === theme)?.label ?? "Theme";

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
