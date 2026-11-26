import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useSession } from "@/hooks/use-session";
import { CUSTOM_THEME_NAME, isThemeName, themeDef, type ThemeName } from "@/lib/themes";
import { DEFAULT_CUSTOM_THEME, parseCustomTheme, type CustomTheme } from "@/lib/custom-theme";
import { parseThemeOverrides, type ThemeOverrides } from "@/lib/theme-overrides";
import { updateProfile, type Profile } from "@/lib/platform";
import { deleteWallpaperByUrl, uploadWallpaper, WALLPAPER_TEXT_COLORS } from "@/lib/wallpaper";
import { ThemePicker } from "@/components/ThemePicker";
import { ThemeEditor } from "@/components/ThemeEditor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Decoration } from "@/lib/themes";

interface Props {
  /** The wall whose look this changes. */
  profile: Profile;
  /** After a save. */
  onSaved?: () => void;
  /** Live decoration preview; null means "use the saved decorations".
      Optional: the gate has no wall behind it to preview on. */
  onPreviewDecorations?: (d: Decoration[] | null) => void;
}

// The theme gallery + editor, without any button or dialog around it.
// The wall header dialog and the gate's Themes tab both render this:
// picking repaints live, nothing is saved until "Save theme", and
// Cancel puts the saved look back.
export function ThemeEditorPanel({ profile, onSaved, onPreviewDecorations }: Props) {
  const { session, refreshProfile } = useSession();
  const { setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

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

  // The wallpaper is a separate setting from the theme draft: it
  // saves the moment it is picked or removed, not with "Save theme".
  const [wallpaperBusy, setWallpaperBusy] = useState(false);
  const [wallpaperError, setWallpaperError] = useState<string | null>(null);
  const wallpaperFileRef = useRef<HTMLInputElement>(null);

  async function handleWallpaperFile(file: File | undefined) {
    if (!file || wallpaperBusy) return;
    if (!profile.auth_user_id) {
      setWallpaperError("Sign in again — your account could not be confirmed.");
      return;
    }
    const previous = profile.wallpaper_url;
    setWallpaperBusy(true);
    setWallpaperError(null);
    try {
      const url = await uploadWallpaper(file, profile.auth_user_id);
      await updateProfile(profile.id, { wallpaper_url: url });
      if (previous) await deleteWallpaperByUrl(previous);
      toast.success("Wallpaper set — open your wall to see it");
      refreshProfile(session);
      onSaved?.();
    } catch (e) {
      setWallpaperError(
        e instanceof Error ? e.message : "That picture could not be used.",
      );
    } finally {
      setWallpaperBusy(false);
    }
  }

  async function handleRemoveWallpaper() {
    const previous = profile.wallpaper_url;
    if (!previous || wallpaperBusy) return;
    setWallpaperBusy(true);
    setWallpaperError(null);
    try {
      await updateProfile(profile.id, { wallpaper_url: null });
      await deleteWallpaperByUrl(previous);
      toast.success("Wallpaper removed — your theme's background is back");
      refreshProfile(session);
      onSaved?.();
    } catch {
      setWallpaperError("Could not remove the wallpaper — try again.");
    } finally {
      setWallpaperBusy(false);
    }
  }

  // The colour of the words over the wallpaper picture. It saves
  // the moment it is picked, like the picture itself — and only
  // light colours are offered, because a dark colour would vanish
  // into the darkened picture.
  const [textColorBusy, setTextColorBusy] = useState(false);
  async function handleWallpaperTextColor(value: string) {
    if (textColorBusy) return;
    const current = profile.wallpaper_text_color ?? WALLPAPER_TEXT_COLORS[0].value;
    if (current.toLowerCase() === value.toLowerCase()) return;
    setTextColorBusy(true);
    try {
      await updateProfile(profile.id, { wallpaper_text_color: value });
      refreshProfile(session);
      onSaved?.();
    } catch {
      setWallpaperError("Could not save that colour — try again.");
    } finally {
      setTextColorBusy(false);
    }
  }

  const dirty =
    draftTheme !== savedTheme ||
    JSON.stringify(draftCustom) !== JSON.stringify(savedCustom) ||
    JSON.stringify(draftOverrides) !== JSON.stringify(savedOverrides);

  // Live preview while this panel is up: the page behind it wears the draft.
  useEffect(() => {
    setTheme(
      draftTheme,
      draftTheme === CUSTOM_THEME_NAME ? draftCustom : undefined,
      draftOverrides,
    );
    onPreviewDecorations?.(
      draftOverrides?.decorations ?? themeDef(draftTheme)?.decorations ?? [],
    );
  }, [draftTheme, draftCustom, draftOverrides, setTheme, onPreviewDecorations]);

  // A freshly loaded profile resets the draft to what is saved.
  useEffect(() => {
    setDraftTheme(savedTheme);
    setDraftCustom(savedCustom);
    setDraftOverrides(savedOverrides);
  }, [savedTheme, savedCustom, savedOverrides]);

  function handleCancel() {
    setTheme(
      savedTheme,
      savedTheme === CUSTOM_THEME_NAME ? savedCustom : undefined,
      savedOverrides,
    );
    onPreviewDecorations?.(null);
    setDraftTheme(savedTheme);
    setDraftCustom(savedCustom);
    setDraftOverrides(savedOverrides);
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
      onPreviewDecorations?.(null);
      onSaved?.();
    } catch {
      toast.error("Could not save your theme");
    } finally {
      setSaving(false);
    }
  }

  return (
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

      <div className="space-y-3 rounded-3xl border border-border bg-background/40 p-4">
        <p className="text-sm font-medium">Wallpaper</p>
        <p className="text-xs text-muted-foreground">
          Put one of your own pictures behind the whole wall instead of
          the theme's background. Your theme's colours, fonts and
          decorations stay exactly as they are.
        </p>
        {profile.wallpaper_url ? (
          <img
            src={profile.wallpaper_url}
            alt="Your wall's wallpaper"
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={wallpaperBusy}
            onClick={() => wallpaperFileRef.current?.click()}
            className="rounded-full"
          >
            {wallpaperBusy
              ? "Uploading…"
              : profile.wallpaper_url
                ? "Change picture"
                : "Choose a picture"}
          </Button>
          {profile.wallpaper_url ? (
            <Button
              variant="ghost"
              disabled={wallpaperBusy}
              onClick={handleRemoveWallpaper}
              className="rounded-full"
            >
              Remove wallpaper
            </Button>
          ) : null}
        </div>
        <input
          ref={wallpaperFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleWallpaperFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {wallpaperError ? (
          <p className="text-xs text-destructive">{wallpaperError}</p>
        ) : null}
        {profile.wallpaper_url ? (
          <div>
            <p className="text-xs font-medium">Words over your picture</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {WALLPAPER_TEXT_COLORS.map((c) => {
                const selected =
                  (profile.wallpaper_text_color ?? WALLPAPER_TEXT_COLORS[0].value).toLowerCase() ===
                  c.value.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleWallpaperTextColor(c.value)}
                    disabled={textColorBusy}
                    aria-label={c.label}
                    aria-pressed={selected}
                    title={c.label}
                    className={`h-8 w-8 rounded-full border transition ${
                      selected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border-border hover:scale-110"
                    }`}
                    style={{ background: c.value }}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Only light colours — dark words would vanish into the picture.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Add a picture first — then pick the colour of the words over it.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Pictures are shrunk to fit before upload, so the wall still
          loads fast for visitors.
        </p>
      </div>

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
  );
}
