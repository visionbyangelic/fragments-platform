import { useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Palette } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useSession } from "@/hooks/use-session";
import {
  CUSTOM_THEME_NAME,
  isThemeName,
  LEGACY_THEMES,
  THEMES,
  themeDef,
  type ThemeDef,
  type ThemeName,
} from "@/lib/themes";
import {
  buildCustomThemeVars,
  DEFAULT_CUSTOM_THEME,
  parseCustomTheme,
  type CustomTheme,
} from "@/lib/custom-theme";
import { parseThemeOverrides } from "@/lib/theme-overrides";
import { updateProfile, type Profile } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Decoration } from "@/lib/themes";

interface Props {
  /** The wall whose look this changes. */
  profile: Profile;
  /** After a save, so the wall can refetch its profile and show the
      new decorations. */
  onSaved: () => void;
  /** Live decoration preview on the wall behind the sheet; null
      means "use the saved decorations". */
  onPreviewDecorations: (d: Decoration[] | null) => void;
}

// One preset as a quick swatch: the theme's own gradient, its accent
// dots, and its name in its own font — the whole set reads at a
// glance, so trying them is fast.
function PresetChip({
  t,
  selected,
  onPick,
}: {
  t: ThemeDef;
  selected: boolean;
  onPick: (theme: ThemeName) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(t.name)}
      aria-pressed={selected}
      className={`relative overflow-hidden rounded-2xl text-left ring-2 transition ${
        selected ? "ring-primary" : "ring-transparent hover:ring-border"
      }`}
    >
      <span
        data-theme={t.name}
        data-card-style={t.cardStyle}
        className="block px-2.5 pb-2 pt-3"
        style={{
          backgroundImage: "var(--gradient-aura), var(--gradient-sanctuary)",
          backgroundSize: "var(--wall-pattern-size, auto), auto",
        }}
      >
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--primary)" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--accent)" }} />
          <span
            className="h-3 w-3 rounded-full border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          />
        </span>
        <span
          className="mt-2 block font-serif text-sm leading-tight"
          style={{ color: "var(--foreground)" }}
        >
          {t.label}
        </span>
      </span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

// The owner's own colours, as a chip alongside the presets — picking
// it goes back to the saved custom look.
function CustomChip({
  selected,
  onPick,
  customTheme,
}: {
  selected: boolean;
  onPick: (theme: ThemeName) => void;
  customTheme: CustomTheme;
}) {
  const customVars = buildCustomThemeVars(customTheme).vars as CSSProperties;
  return (
    <button
      type="button"
      onClick={() => onPick(CUSTOM_THEME_NAME)}
      aria-pressed={selected}
      className={`relative overflow-hidden rounded-2xl text-left ring-2 transition ${
        selected ? "ring-primary" : "ring-transparent hover:ring-border"
      }`}
    >
      <span
        data-theme={CUSTOM_THEME_NAME}
        className="block px-2.5 pb-2 pt-3"
        style={{
          ...customVars,
          backgroundImage: "var(--gradient-aura), var(--gradient-sanctuary)",
          backgroundSize: "var(--wall-pattern-size, auto), auto",
        }}
      >
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--primary)" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--accent)" }} />
          <span
            className="h-3 w-3 rounded-full border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          />
        </span>
        <span
          className="mt-2 block font-serif text-sm leading-tight"
          style={{ color: "var(--foreground)" }}
        >
          Custom
        </span>
      </span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

// The wall's theme control, for the owner only. It sits in the wall
// header as a palette button — visitors never see it — and opens a
// bottom sheet for trying presets fast: tap one and the whole wall
// changes right away, tap another and it changes again, save to keep
// it or close to go back to the saved look. No colours, no editor
// here — that lives in the gate's Themes tab, where you can see and
// set everything. The wall wears what its owner picks, for everyone.
export function WallThemeControl({ profile, onSaved, onPreviewDecorations }: Props) {
  const { session, refreshProfile } = useSession();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const justSaved = useRef(false);

  const savedTheme: ThemeName = isThemeName(profile.theme) ? profile.theme : "moonlight";
  const savedCustom = useMemo(
    () => parseCustomTheme(profile.custom_theme) ?? DEFAULT_CUSTOM_THEME,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(profile.custom_theme ?? null)],
  );
  const savedOverrides = useMemo(
    () => parseThemeOverrides(profile.theme_overrides),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(profile.theme_overrides ?? null)],
  );

  const [picked, setPicked] = useState<ThemeName>(savedTheme);
  const dirty = picked !== savedTheme;

  // Trying a preset: the wall wears it at once, pure — no old
  // tweaks on top — including its own decorations, so what you see
  // is the preset itself. Picking Custom goes back to the saved
  // custom look, tweaks included.
  function preview(theme: ThemeName) {
    setPicked(theme);
    if (theme === CUSTOM_THEME_NAME) {
      setTheme(CUSTOM_THEME_NAME, savedCustom, savedOverrides);
      onPreviewDecorations(savedOverrides?.decorations ?? []);
    } else {
      setTheme(theme, undefined, null);
      onPreviewDecorations(themeDef(theme)?.decorations ?? []);
    }
  }

  function restoreSaved() {
    setTheme(
      savedTheme,
      savedTheme === CUSTOM_THEME_NAME ? savedCustom : undefined,
      savedOverrides,
    );
    onPreviewDecorations(null);
    setPicked(savedTheme);
    setOpen(false);
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      // A save just closed this — the picked look stays on the wall.
      if (justSaved.current) {
        justSaved.current = false;
        setOpen(false);
        return;
      }
      restoreSaved();
      return;
    }
    setPicked(savedTheme);
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        theme: picked,
        custom_theme: picked === CUSTOM_THEME_NAME ? savedCustom : null,
        theme_overrides: picked === CUSTOM_THEME_NAME ? savedOverrides : null,
      });
      toast.success("Your wall's new look is saved");
      refreshProfile(session);
      onPreviewDecorations(null);
      onSaved();
      justSaved.current = true;
      setOpen(false);
    } catch {
      toast.error("Could not save your theme");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Try a different look"
        title="Try a different look"
        className="rounded-full border border-border bg-card/40 p-2.5 backdrop-blur transition hover:bg-card/70"
      >
        <Palette className="h-4 w-4" aria-hidden />
      </button>

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[75vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-serif text-2xl">Try a look</DrawerTitle>
            <DrawerDescription>
              Tap a theme and your whole wall changes right away. Save to
              keep it, or close to go back to your saved look.
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-2">
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {THEMES.map((t) => (
                <PresetChip key={t.name} t={t} selected={picked === t.name} onPick={preview} />
              ))}
            </div>

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Classic
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {LEGACY_THEMES.map((t) => (
                <PresetChip key={t.name} t={t} selected={picked === t.name} onPick={preview} />
              ))}
            </div>

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Your colours
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              <CustomChip selected={picked === CUSTOM_THEME_NAME} onPick={preview} customTheme={savedCustom} />
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex-1 rounded-full"
            >
              {saving ? "Saving…" : "Save theme"}
            </Button>
            <DrawerClose asChild>
              <Button variant="secondary" className="rounded-full">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>

          <p className="pb-5 text-center text-xs text-muted-foreground">
            <Link to="/gate" onClick={restoreSaved} className="underline underline-offset-2">
              Fine-tune colours and details in settings
            </Link>
          </p>
        </DrawerContent>
      </Drawer>
    </>
  );
}
