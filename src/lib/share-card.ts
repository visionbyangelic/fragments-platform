import { cardPalette, CUSTOM_THEME_NAME } from "@/lib/themes";
import {
  customCardPalette,
  parseCustomTheme,
  type CustomTheme,
} from "@/lib/custom-theme";

// Renders a published Q&A as a story-ready card drawn on a canvas
// in a chosen theme, then hands it to the share sheet on mobile or
// downloads it elsewhere.
//
// The file is a JPEG, not a PNG: same 1080 x 1350 picture, roughly
// a tenth of the weight (a PNG of this gradient card runs to well
// over a megabyte; the JPEG lands around 100-200 KB), so it costs
// far less mobile data to save and to post.

const W = 1080;
const H = 1350;
const PAD = 84;
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Inter", system-ui, sans-serif';

export type CardSize = "story" | "compact";

export const CARD_SIZES: Record<
  CardSize,
  { width: number; height: number; label: string; blurb: string }
> = {
  story: {
    width: 1080,
    height: 1350,
    label: "Story",
    blurb: "1080 × 1350 · crisp, for stories",
  },
  compact: {
    width: 720,
    height: 900,
    label: "Compact",
    blurb: "720 × 900 · much lighter file",
  },
};

export interface ShareCardOptions {
  /** Any of the wall themes; defaults to the wall's own theme. */
  theme?: string;
  /** The wall's own colours when its theme is Custom. */
  customTheme?: CustomTheme | null;
  /** Story (1080 x 1350) or Compact (720 x 900). Defaults to Story. */
  size?: CardSize;
}

export interface AnswerCardInput {
  question: string;
  answer: string;
  username: string;
  displayName: string;
  theme: string;
  /** The wall's own colours when its theme is Custom. */
  customTheme?: CustomTheme | null;
}

/** A custom wall's cards wear its own colours; presets wear theirs. */
function paletteFor(theme: string, custom?: CustomTheme | null) {
  const picks = parseCustomTheme(custom);
  if (theme === CUSTOM_THEME_NAME && picks) return customCardPalette(picks);
  return cardPalette(theme);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function renderAnswerCanvas(
  input: AnswerCardInput,
  theme: string,
  custom?: CustomTheme | null,
): Promise<HTMLCanvasElement> {
  const pal = paletteFor(theme, custom);
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  // Sanctuary gradient background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, pal.bg[0]);
  grad.addColorStop(0.5, pal.bg[1]);
  grad.addColorStop(1, pal.bg[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft aura glow
  const aura = ctx.createRadialGradient(W * 0.25, H * 0.15, 0, W * 0.25, H * 0.15, 620);
  aura.addColorStop(0, pal.accent + "55");
  aura.addColorStop(1, pal.accent + "00");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, W, H);

  const innerW = W - PAD * 2;
  let y = 96;

  // Wordmark
  ctx.fillStyle = pal.muted;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText("F R A G M E N T S", PAD, y);
  y += 52;
  ctx.fillStyle = pal.ink;
  ctx.font = `italic 600 44px ${SERIF}`;
  ctx.fillText(`${input.displayName}'s wall`, PAD, y);
  y += 84;

  // The question
  ctx.fillStyle = pal.accent;
  ctx.font = `600 26px ${SANS}`;
  ctx.fillText("SOMEONE ASKED", PAD, y);
  y += 26;

  let qSize = 68;
  let qLines: string[] = [];
  for (;;) {
    ctx.font = `600 ${qSize}px ${SERIF}`;
    qLines = wrapLines(ctx, input.question, innerW);
    if (qLines.length <= 5 || qSize <= 40) break;
    qSize -= 6;
  }
  ctx.fillStyle = pal.ink;
  const qLineH = qSize * 1.16;
  for (const line of qLines) {
    y += qLineH;
    ctx.fillText(line, PAD, y);
  }
  y += 64;

  // The answer, on a letter card. Shrink the type until it fits the
  // space left above the footer.
  const footerTop = H - 210;
  let aSize = 56;
  let aLines: string[] = [];
  let boxH = 0;
  for (;;) {
    ctx.font = `500 ${aSize}px ${SERIF}`;
    aLines = wrapLines(ctx, input.answer, innerW - 96);
    boxH = aLines.length * aSize * 1.22 + 150;
    if (y + boxH <= footerTop || aSize <= 32) break;
    aSize -= 4;
  }
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 42;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, PAD, y, innerW, boxH, 28);
  ctx.fillStyle = pal.letter;
  ctx.fill();
  ctx.restore();

  let ay = y + 78;
  ctx.font = `500 ${aSize}px ${SERIF}`;
  ctx.fillStyle = pal.letterInk;
  for (const line of aLines) {
    ctx.fillText(line, PAD + 48, ay);
    ay += aSize * 1.22;
  }
  ctx.font = `italic 600 36px ${SERIF}`;
  ctx.fillStyle = pal.letterInk;
  ctx.globalAlpha = 0.75;
  ctx.fillText(`— ${input.displayName}`, PAD + 48, ay + 16);
  ctx.globalAlpha = 1;

  // Footer: the wall link, the whole point of the card
  const link = `myfragments.vercel.app/${input.username}`;
  ctx.font = `600 40px ${SANS}`;
  const linkW = ctx.measureText(link).width;
  const pillW = linkW + 72;
  const pillX = (W - pillW) / 2;
  const pillY = H - 168;
  roundRect(ctx, pillX, pillY, pillW, 84, 42);
  ctx.fillStyle = pal.accent;
  ctx.fill();
  ctx.fillStyle = pal.bg[1];
  ctx.textAlign = "center";
  ctx.fillText(link, W / 2, pillY + 56);
  ctx.textAlign = "left";
  ctx.fillStyle = pal.muted;
  ctx.font = `500 30px ${SANS}`;
  const tag = "Leave a little something";
  ctx.fillText(tag, (W - ctx.measureText(tag).width) / 2, H - 44);

  return canvas;
}

function canvasToJpeg(
  source: HTMLCanvasElement,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  let canvas = source;
  if (source.width !== width || source.height !== height) {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    ctx.drawImage(source, 0, 0, width, height);
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not render the card"))),
      "image/jpeg",
      quality,
    );
  });
}

export async function renderAnswerCard(
  input: AnswerCardInput,
  options: ShareCardOptions = {},
): Promise<Blob> {
  const size = CARD_SIZES[options.size ?? "story"];
  const canvas = await renderAnswerCanvas(
    input,
    options.theme ?? input.theme,
    options.customTheme ?? input.customTheme,
  );
  return canvasToJpeg(canvas, size.width, size.height, 0.85);
}

/** Small JPEG data URL for the live preview in the save dialog. */
export async function renderAnswerCardPreview(
  input: AnswerCardInput,
  options: ShareCardOptions = {},
): Promise<string> {
  const canvas = await renderAnswerCanvas(
    input,
    options.theme ?? input.theme,
    options.customTheme ?? input.customTheme,
  );
  const small = document.createElement("canvas");
  small.width = 360;
  small.height = 450;
  const ctx = small.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(canvas, 0, 0, 360, 450);
  return small.toDataURL("image/jpeg", 0.8);
}

export async function shareAnswerCard(
  input: AnswerCardInput,
  options: ShareCardOptions = {},
): Promise<"shared" | "downloaded"> {
  const blob = await renderAnswerCard(input, options);
  const file = new File([blob], `fragments-${input.username}.jpg`, { type: "image/jpeg" });

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    await nav.share({ files: [file], title: "Fragments" });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
