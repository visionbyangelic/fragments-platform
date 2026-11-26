// The wall customisation editor: colours, typography, decorations
// and card style, on top of the selected theme. It edits a draft —
// nothing is saved until the gate's Save button is pressed — and it
// only reports what actually changed: the saved overrides hold just
// the fields that differ from the theme's own defaults, so clearing
// them returns the wall to the pure theme.
import {
  CARD_STYLES,
  CUSTOM_THEME_NAME,
  DECORATIONS,
  THEME_FONTS,
  THEME_FONT_STACKS,
  themeDef,
  type CardStyle,
  type Decoration,
  type ThemeFont,
  type ThemeName,
} from "@/lib/themes";
import type { ThemeColors, ThemeOverrides } from "@/lib/theme-overrides";
import { Label } from "@/components/ui/label";

interface Props {
  theme: ThemeName;
  overrides: ThemeOverrides | null;
  onChange: (next: ThemeOverrides | null) => void;
  /** False when the theme is Custom: its colours live in the separate
      "Your colours" panel, not here. */
  showColors: boolean;
}

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; blurb: string }[] = [
  { key: "bg", label: "Background", blurb: "The page behind everything" },
  { key: "accent", label: "Accent", blurb: "Buttons, links and highlights" },
  { key: "secondary", label: "Secondary", blurb: "Soft surfaces and chips" },
  { key: "card", label: "Message card", blurb: "The cards your fragments sit on" },
  { key: "ink", label: "Text", blurb: "The writing on the wall" },
];

function sameDecorations(a: Decoration[], b: Decoration[]): boolean {
  return a.length === b.length && a.every((d) => b.includes(d));
}

export function ThemeEditor({ theme, overrides, onChange, showColors }: Props) {
  // Custom has no preset to inherit from: neutral defaults.
  const base =
    theme === CUSTOM_THEME_NAME
      ? {
          defaults: { bg: "#2b1d16", accent: "#e8a87c", secondary: "#3a2a20", card: "#33241b", ink: "#f7ead9" },
          font: "cormorant" as ThemeFont,
          decorations: [] as Decoration[],
          cardStyle: "rounded" as CardStyle,
        }
      : {
          defaults: themeDef(theme)?.defaults ?? themeDef("moonlight")!.defaults,
          font: themeDef(theme)?.font ?? "cormorant",
          decorations: themeDef(theme)?.decorations ?? [],
          cardStyle: themeDef(theme)?.cardStyle ?? "rounded",
        };

  const colors: ThemeColors = { ...base.defaults, ...overrides?.colors };
  const font = overrides?.font ?? base.font;
  const decorations = overrides?.decorations ?? base.decorations;
  const cardStyle = overrides?.cardStyle ?? base.cardStyle;

  // Rebuild the override object from the effective values, keeping
  // only what differs from the theme's own defaults.
  function emit(next: {
    colors: ThemeColors;
    font: ThemeFont;
    decorations: Decoration[];
    cardStyle: CardStyle;
  }) {
    const out: ThemeOverrides = {};
    const colorDiff: ThemeColors = {};
    (Object.keys(base.defaults) as (keyof ThemeColors)[]).forEach((key) => {
      if (next.colors[key] && next.colors[key] !== base.defaults[key]) {
        colorDiff[key] = next.colors[key];
      }
    });
    if (Object.keys(colorDiff).length) out.colors = colorDiff;
    if (next.font !== base.font) out.font = next.font;
    if (!sameDecorations(next.decorations, base.decorations)) {
      out.decorations = next.decorations;
    }
    if (next.cardStyle !== base.cardStyle) out.cardStyle = next.cardStyle;
    onChange(Object.keys(out).length ? out : null);
  }

  function toggleDecoration(d: Decoration) {
    const next = decorations.includes(d)
      ? decorations.filter((x) => x !== d)
      : [...decorations, d];
    emit({ colors, font, decorations: next, cardStyle });
  }

  return (
    <div className="space-y-5">
      {showColors && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Colours</p>
          {COLOR_FIELDS.map(({ key, label, blurb }) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={colors[key] ?? base.defaults[key]}
                onChange={(e) =>
                  emit({ colors: { ...colors, [key]: e.target.value }, font, decorations, cardStyle })
                }
                aria-label={label}
                className="h-10 w-12 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-1"
              />
              <div className="min-w-0">
                <Label className="text-sm">{label}</Label>
                <p className="truncate text-xs text-muted-foreground">
                  {blurb} · {colors[key] ?? base.defaults[key]}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium">Typography</p>
        <div className="flex flex-wrap gap-2">
          {THEME_FONTS.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => emit({ colors, font: f.name, decorations, cardStyle })}
              aria-pressed={font === f.name}
              className={`rounded-full border px-4 py-2 text-[15px] transition ${
                font === f.name
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background/40 text-muted-foreground hover:border-primary/50"
              }`}
              style={{ fontFamily: THEME_FONT_STACKS[f.name] }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Decorations</p>
        <p className="text-xs text-muted-foreground">
          Little motifs that drift around your wall. Pick none, one, or a few.
        </p>
        <div className="flex flex-wrap gap-2">
          {DECORATIONS.map((d) => {
            const on = decorations.includes(d.name);
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => toggleDecoration(d.name)}
                aria-pressed={on}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Message cards</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CARD_STYLES.map((c) => {
            const on = cardStyle === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => emit({ colors, font, decorations, cardStyle: c.name })}
                aria-pressed={on}
                className={`rounded-2xl border p-3 text-left transition ${
                  on
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/40 hover:border-primary/50"
                }`}
              >
                <p className="text-sm font-medium">{c.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
