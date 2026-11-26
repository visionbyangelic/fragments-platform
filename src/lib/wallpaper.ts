// Wall wallpaper: a picture the owner uploads as their wall's
// background. The picture lives in Supabase Storage (bucket
// "wallpapers", one folder per owner) and its public URL is saved on
// the profile (profiles.wallpaper_url). The wall paints that picture
// over the theme's background; the theme's colours, fonts and
// decorations stay exactly as they are.
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "wallpapers";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB before shrinking
const MAX_EDGE_PX = 1600; // longest side after shrinking
const SMALL_ENOUGH_BYTES = 1.5 * 1024 * 1024;

/** Only our own storage URLs ever become a background. */
export function isWallpaperUrl(url: string): boolean {
  return (
    url.startsWith("https://") &&
    url.includes(`/storage/v1/object/public/${BUCKET}/`)
  );
}

/** The dark scrim that sits between a wallpaper picture and the
    wall's text, so words stay readable no matter how bright the
    picture is: darkest behind the hero title, lighter toward the
    edges. ChatGPT's suggestion, applied as given. */
const WALLPAPER_OVERLAY =
  "linear-gradient(to bottom, rgba(20, 15, 25, 0.35), rgba(20, 15, 25, 0.55), rgba(20, 15, 25, 0.4))";

/** The words over a wallpaper picture can only ever be light: a
    dark colour would vanish into the darkened picture. Six light
    choices, white first — the default when nothing is picked. */
export const WALLPAPER_TEXT_COLORS = [
  { name: "white", label: "White", value: "#ffffff" },
  { name: "cream", label: "Cream", value: "#fff3d6" },
  { name: "gold", label: "Soft gold", value: "#efd9a0" },
  { name: "blush", label: "Blush", value: "#fbdce8" },
  { name: "lavender", label: "Pale lavender", value: "#e3d9f8" },
  { name: "sky", label: "Pale sky", value: "#d6e9f8" },
] as const;

export type WallpaperTextColor = (typeof WALLPAPER_TEXT_COLORS)[number]["value"];

/** Only our own six light colours ever become wallpaper text. */
export function isWallpaperTextColor(value: unknown): value is WallpaperTextColor {
  return (
    typeof value === "string" &&
    (WALLPAPER_TEXT_COLORS as readonly { value: string }[]).some(
      (c) => c.value.toLowerCase() === value.toLowerCase(),
    )
  );
}

/** Paints the wallpaper over the theme's background on this page.
    Pass null (or anything that is not one of our storage URLs) and
    the theme's own background comes back. The text colour rides
    along: the words over the picture wear it, white when nothing
    was picked. */
export function applyWallpaperImage(url: string | null, textColor?: string | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!url || !isWallpaperUrl(url)) {
    clearWallpaperImage();
    return;
  }
  root.style.setProperty("--wallpaper-image", `url("${url}")`);
  root.style.setProperty("--wallpaper-size", "cover");
  root.style.setProperty("--wallpaper-overlay", WALLPAPER_OVERLAY);
  if (isWallpaperTextColor(textColor)) {
    root.style.setProperty("--wallpaper-text", textColor);
  } else {
    root.style.removeProperty("--wallpaper-text");
  }
  // The wall's bare text (hero, headings, footer) goes photo-safe
  // white while a picture is behind it — see styles.css.
  root.classList.add("has-wallpaper");
}

export function clearWallpaperImage(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.removeProperty("--wallpaper-image");
  root.style.removeProperty("--wallpaper-size");
  root.style.removeProperty("--wallpaper-overlay");
  root.style.removeProperty("--wallpaper-text");
  root.classList.remove("has-wallpaper");
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// A phone photo is far bigger than a wall background needs, and
// visitors pay for every byte on mobile data — so a big picture is
// shrunk to 1600px on its longest side before it is uploaded. A
// small picture goes up exactly as it is.
async function prepareWallpaper(file: File): Promise<{ blob: Blob; ext: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not a picture.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That picture is over 10 MB — pick a smaller one.");
  }
  const needsConvert =
    file.type === "image/heic" || file.type === "image/heif";
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    throw new Error("That picture could not be read — try a JPG or PNG.");
  }
  const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
  if (longEdge <= MAX_EDGE_PX && file.size <= SMALL_ENOUGH_BYTES && !needsConvert) {
    const rawExt = (file.name.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return { blob: file, ext: rawExt || "jpg" };
  }
  const scale = MAX_EDGE_PX / longEdge;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("That picture could not be read — try a JPG or PNG.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outType, 0.82),
  );
  if (!blob) throw new Error("That picture could not be read — try a JPG or PNG.");
  return { blob, ext: outType === "image/png" ? "png" : "jpg" };
}

/** Uploads the picture into the owner's own storage folder and
    returns its public URL, ready to save on the profile. */
export async function uploadWallpaper(
  file: File,
  authUserId: string,
): Promise<string> {
  if (!authUserId) {
    throw new Error("Sign in again — your account could not be confirmed.");
  }
  const { blob, ext } = await prepareWallpaper(file);
  const path = `${authUserId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: false,
  });
  if (error) {
    throw new Error("The upload did not go through — check your connection and try again.");
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function wallpaperPathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  return decodeURIComponent(url.slice(i + marker.length));
}

/** Deletes a wallpaper file by its public URL. Best effort — a
    leftover file is harmless, the wall no longer points at it. */
export async function deleteWallpaperByUrl(url: string): Promise<void> {
  const path = wallpaperPathFromUrl(url);
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}
