import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CUSTOM_THEME_NAME, isThemeName, type ThemeName } from "@/lib/themes";
import { DEFAULT_CUSTOM_THEME, parseCustomTheme } from "@/lib/custom-theme";
import { parseThemeOverrides } from "@/lib/theme-overrides";
import type { Profile } from "@/lib/platform";
import { ThemeEditorPanel } from "@/components/ThemeEditorPanel";
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
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

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

  function restoreSaved() {
    setTheme(
      savedTheme,
      savedTheme === CUSTOM_THEME_NAME ? savedCustom : undefined,
      savedOverrides,
    );
    onPreviewDecorations(null);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Change wall theme"
        title="Change wall theme"
        className="rounded-full border border-border bg-card/40 p-2.5 backdrop-blur transition hover:bg-card/70"
      >
        <Palette className="h-4 w-4" aria-hidden />
      </button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) restoreSaved();
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

          <ThemeEditorPanel
            profile={profile}
            onSaved={() => {
              onSaved();
              setOpen(false);
            }}
            onPreviewDecorations={onPreviewDecorations}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
