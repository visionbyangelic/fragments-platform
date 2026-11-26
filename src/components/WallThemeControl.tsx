import { useEffect, useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useSession } from "@/hooks/use-session";
import { CUSTOM_THEME_NAME, isThemeName, themeDef, type ThemeName } from "@/lib/themes";
import { DEFAULT_CUSTOM_THEME, parseCustomTheme, type CustomTheme } from "@/lib/custom-theme";
import { parseThemeOverrides, type ThemeOverrides } from "@/lib/theme-overrides";
import { updateProfile, type Profile } from "@/lib/platform";
import { ThemePicker } from "@/components/ThemePicker";
import { ThemeEditor } from "@/components/ThemeEditor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Decoration } from "@/lib/themes";

interface Props {
  /** The wall whose look this changes. */
  profile: Profile;
  /** After a save, so the wall can refetch its profile and show the
      new decorations. */
  onSaved: () => void;
  /** Live decoration preview on the wall behind the dialog; null
      means "use the saved decorations". */
  onPreviewDecorations: (d: Decoration[] | null) => void;
}

// The wall's theme control, for the owner only. It sits in the wall
// header as a palette button — visitors never see it — and opens the
// gallery and editor right there on the wall. Picking repaints the
// wall live behind the dialog, but nothing is saved until "Save
// theme" is pressed; closing without saving puts the saved look
// back. The wall wears what its owner picks, for everyone.
export function WallThemeControl({ profile, onSaved, onPreviewDecorations }: Props) {
  const { session, refreshProfile } = useSession();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // The saved look, for the draft baseline. Memoised on the JSON so a
  // refetched profile with the same values does not retrigger.
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

  const [draftTheme, setDraftTheme] = useState<ThemeName>(savedTheme);
  const [draftCustom, setDraftCustom] = useState<CustomTheme>(savedCustom);
  const [draftOverrides, setDraftOverrides] = useState<ThemeOverrides | null>(savedOverrides);

  const dirty =
    draftTheme !== savedTheme ||
    JSON.stringify(draftCustom) !== JSON.stringify(savedCustom) ||
    JSON.stringify(draftOverrides) !== JSON.stringify(savedOverrides);

  // Live preview while the dialog is open: the wall behind it wears
  // the draft, decorations included.
  useEffect(() => {
    if (!open) return;
    setTheme(
      draftTheme,
      draftTheme === CUSTOM_THEME_NAME ? draftCustom : undefined,
      draftOverrides,
    );
    onPreviewDecorations(
      draftOverrides?.decorations ?? themeDef(draftTheme)?.decorations ?? [],
    );
  }, [open, draftTheme, draftCustom, draftOverrides, setTheme, onPreviewDecorations]);

  function handleOpen() {
    setDraftTheme(savedTheme);
    setDraftCustom(savedCustom);
    setDraftOverrides(savedOverrides);
    setOpen(true);
  }

  function handleCancel() {
    setTheme(
      savedTheme,
      savedTheme === CUSTOM_THEME_NAME ? savedCustom : undefined,
      savedOverrides,
    );
    onPreviewDecorations(null);
    setOpen(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        theme: draftTheme,
        custom_theme: draftTheme === CUSTOM_THEME_NAME ? draftCustom : null,
        theme_overrides: draftOverrides,
      });
      toast.success("Your wall's new look is saved");
      refreshProfile(session);
      onPreviewDecorations(null);
      onSaved();
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
        onClick={handleOpen}
        aria-label="Change wall theme"
        title="Change wall theme"
        className="rounded-full border border-border bg-card/40 p-2.5 backdrop-blur transition hover:bg-card/70"
      >
        <Palette className="h-4 w-4" aria-hidden />
      </button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleCancel();
        }}
      >
        <DialogContent className="glass max-h-[85vh] overflow-y-auto border-none sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Your wall's look</DialogTitle>
            <DialogDescription>
              Pick a theme to preview it live on your wall — save it below
              to keep it, or close to go back to your saved look.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <ThemePicker value={draftTheme} onChange={setDraftTheme} customTheme={draftCustom} />

            {draftTheme === CUSTOM_THEME_NAME && (
              <div className="space-y-3 rounded-3xl border border-border bg-background/40 p-4">
                <p className="text-sm font-medium">Your colours</p>
                <p className="text-xs text-muted-foreground">
                  Pick three colours and the whole wall follows them. The
                  preview changes as you pick.
                </p>
                {(
                  [
                    ["bg", "Background", "The page behind everything"],
                    ["accent", "Accent", "Buttons, links and highlights"],
                    ["ink", "Text", "The writing on the wall"],
                  ] as const
                ).map(([key, label, blurb]) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={draftCustom[key]}
                      onChange={(e) =>
                        setDraftCustom({ ...draftCustom, [key]: e.target.value })
                      }
                      aria-label={label}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-1"
                    />
                    <div className="min-w-0">
                      <Label className="text-sm">{label}</Label>
                      <p className="truncate text-xs text-muted-foreground">
                        {blurb} · {draftCustom[key]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <ThemeEditor
              theme={draftTheme}
              overrides={draftOverrides}
              onChange={setDraftOverrides}
              showColors={draftTheme !== CUSTOM_THEME_NAME}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="flex-1 rounded-full"
              >
                {saving ? "Saving…" : "Save theme"}
              </Button>
              <Button variant="secondary" onClick={handleCancel} className="rounded-full">
                Cancel
              </Button>
              <Button
                variant="ghost"
                onClick={() => setDraftOverrides(null)}
                disabled={!draftOverrides}
                className="rounded-full"
              >
                Reset to theme defaults
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
