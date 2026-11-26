import { CUSTOM_THEME_NAME, THEMES, type ThemeName } from "@/lib/themes";
import { buildCustomThemeVars, type CustomTheme } from "@/lib/custom-theme";
import { Check, Paintbrush } from "lucide-react";
import type { CSSProperties } from "react";

interface Props {
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
  /** The owner's own colours, for the Custom tile's preview. */
  customTheme: CustomTheme;
}

// A grid of miniature walls, one per theme. Each preview carries its
// own data-theme attribute, so it renders with that theme's real CSS
// variables: what you see is exactly what the wall will look like.
export function ThemePicker({ value, onChange, customTheme }: Props) {
  const customSelected = value === CUSTOM_THEME_NAME;
  const customVars = buildCustomThemeVars(customTheme).vars as CSSProperties;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map((t) => {
        const selected = value === t.name;
        return (
          <button
            key={t.name}
            type="button"
            onClick={() => onChange(t.name)}
            aria-pressed={selected}
            className={`group relative overflow-hidden rounded-3xl text-left ring-2 transition ${
              selected ? "ring-primary" : "ring-transparent hover:ring-border"
            }`}
          >
            <div data-theme={t.name} className="pointer-events-none">
              <div
                className="p-3"
                style={{
                  backgroundImage:
                    "var(--gradient-aura), var(--gradient-sanctuary)",
                  backgroundSize: "var(--wall-pattern-size, auto), auto",
                }}
              >
                <p
                  className="font-serif text-base leading-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  Your wall
                </p>
                <div
                  className="mt-2 rounded-2xl p-2.5"
                  style={{
                    background: "var(--frag-blush)",
                    color: "var(--frag-foreground)",
                  }}
                >
                  <p className="font-serif text-[13px] leading-snug">
                    A kind word lives here
                  </p>
                  <p className="mt-1 text-[10px] italic opacity-70">— Anonymous</p>
                </div>
                <div
                  className="mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-medium"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Leave a fragment
                </div>
              </div>
            </div>
            <div className="flex items-start justify-between gap-2 bg-card px-3 py-2.5">
              <div>
                <p className="text-sm font-medium leading-tight">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.blurb}</p>
              </div>
              {selected && (
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
          </button>
        );
      })}
      <button
        key="custom"
        type="button"
        onClick={() => onChange(CUSTOM_THEME_NAME)}
        aria-pressed={customSelected}
        className={`group relative overflow-hidden rounded-3xl text-left ring-2 transition ${
          customSelected ? "ring-primary" : "ring-transparent hover:ring-border"
        }`}
      >
        <div data-theme={CUSTOM_THEME_NAME} className="pointer-events-none" style={customVars}>
          <div
            className="p-3"
            style={{
              backgroundImage:
                "var(--gradient-aura), var(--gradient-sanctuary)",
              backgroundSize: "var(--wall-pattern-size, auto), auto",
            }}
          >
            <p
              className="font-serif text-base leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              Your wall
            </p>
            <div
              className="mt-2 rounded-2xl p-2.5"
              style={{
                background: "var(--frag-blush)",
                color: "var(--frag-foreground)",
              }}
            >
              <p className="font-serif text-[13px] leading-snug">
                A kind word lives here
              </p>
              <p className="mt-1 text-[10px] italic opacity-70">— Anonymous</p>
            </div>
            <div
              className="mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-medium"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              Leave a fragment
            </div>
          </div>
        </div>
        <div className="flex items-start justify-between gap-2 bg-card px-3 py-2.5">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium leading-tight">
              <Paintbrush className="h-3.5 w-3.5" aria-hidden />
              Custom
            </p>
            <p className="text-xs text-muted-foreground">Your colours, your wall</p>
          </div>
          {customSelected && (
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
