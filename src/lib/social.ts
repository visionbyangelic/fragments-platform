// Social links: links only, never uploads — a photo upload would
// eat the free storage tier, a link costs nothing. A bare username
// works too: type just your handle and the link is built for you
// (instagram.com/you, tiktok.com/@you, and so on). Every url is
// checked before it is shown: https only, and the host must belong
// to the platform it claims to be.

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "snapchat"
  | "youtube"
  | "pinterest"
  | "linkedin"
  | "spotify"
  | "twitch"
  | "website";

export const SOCIAL_PLATFORMS: {
  platform: SocialPlatform;
  label: string;
  hosts: string[] | null;
  /** How a bare username becomes a link: {u} is the handle. Null
      means the platform takes full links only (a bare username
      has nowhere to go). */
  usernameUrl: ((u: string) => string) | null;
}[] = [
  { platform: "instagram", label: "Instagram", hosts: ["instagram.com", "www.instagram.com"], usernameUrl: (u) => `https://instagram.com/${u}` },
  { platform: "tiktok", label: "TikTok", hosts: ["tiktok.com", "www.tiktok.com"], usernameUrl: (u) => `https://tiktok.com/@${u}` },
  { platform: "x", label: "X", hosts: ["x.com", "twitter.com", "www.x.com", "www.twitter.com"], usernameUrl: (u) => `https://x.com/${u}` },
  { platform: "facebook", label: "Facebook", hosts: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"], usernameUrl: (u) => `https://facebook.com/${u}` },
  { platform: "snapchat", label: "Snapchat", hosts: ["snapchat.com", "www.snapchat.com"], usernameUrl: (u) => `https://snapchat.com/add/${u}` },
  { platform: "youtube", label: "YouTube", hosts: ["youtube.com", "www.youtube.com", "youtu.be"], usernameUrl: (u) => `https://youtube.com/@${u}` },
  { platform: "pinterest", label: "Pinterest", hosts: ["pinterest.com", "www.pinterest.com"], usernameUrl: (u) => `https://pinterest.com/${u}` },
  { platform: "linkedin", label: "LinkedIn", hosts: ["linkedin.com", "www.linkedin.com"], usernameUrl: (u) => `https://linkedin.com/in/${u}` },
  { platform: "spotify", label: "Spotify", hosts: ["open.spotify.com", "spotify.com"], usernameUrl: (u) => `https://open.spotify.com/user/${u}` },
  { platform: "twitch", label: "Twitch", hosts: ["twitch.tv", "www.twitch.tv"], usernameUrl: (u) => `https://twitch.tv/${u}` },
  { platform: "website", label: "Website", hosts: null, usernameUrl: null },
];

export type SocialLink = { platform: SocialPlatform; url: string };

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return SOCIAL_PLATFORMS.some((p) => p.platform === value);
}

const USERNAME_RE = /^[A-Za-z0-9._-]+$/;

/** A social entry becomes a full https link, or null when it cannot.
    Three shapes are accepted, in order:
    - a full link to the platform (https://instagram.com/you);
    - a bare host and path (instagram.com/you) — the scheme is added;
    - just the username (you, or @you) — the platform's link is built.
    A full link that points at the wrong platform is still rejected,
    and a username with spaces or strange characters is rejected. */
export function validateSocialUrl(platform: SocialPlatform, raw: string): string | null {
  const def = SOCIAL_PLATFORMS.find((p) => p.platform === platform);
  if (!def) return null;
  const input = raw.trim();
  if (!input) return null;

  const check = (candidate: string): string | null => {
    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      return null;
    }
    if (parsed.protocol !== "https:") return null;
    if (def.hosts && !def.hosts.includes(parsed.hostname.toLowerCase())) return null;
    return parsed.toString();
  };

  // A full link, or one missing only its scheme.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) return check(input);
  if (input.includes("/")) return check(`https://${input.replace(/^\/+/, "")}`);

  // A bare domain for a website (mysite.com) — the one row with no
  // username to build from.
  if (!def.usernameUrl && input.includes(".") && !/\s/.test(input)) {
    return check(`https://${input}`);
  }

  // Just a username — @you and you are the same handle.
  const handle = input.replace(/^@+/, "");
  if (!def.usernameUrl) return null;
  if (!USERNAME_RE.test(handle)) return null;
  return check(def.usernameUrl(handle));
}

export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  const out: SocialLink[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const { platform, url } = item as { platform?: unknown; url?: unknown };
    if (!isSocialPlatform(platform) || typeof url !== "string") continue;
    const clean = validateSocialUrl(platform, url);
    if (clean) out.push({ platform, url: clean });
  }
  return out;
}

/** Which wall sections show. Absent means shown — old walls keep everything. */
export type WallSections = {
  poll?: boolean;
  guestbook?: boolean;
  qa?: boolean;
  social?: boolean;
  sealed?: boolean;
};

export function showSection(sections: WallSections | null | undefined, key: keyof WallSections): boolean {
  return sections?.[key] !== false;
}
