// Social links: links only, never uploads — a photo upload would
// eat the free storage tier, a link costs nothing. Every url is
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

export const SOCIAL_PLATFORMS: { platform: SocialPlatform; label: string; hosts: string[] | null }[] = [
  { platform: "instagram", label: "Instagram", hosts: ["instagram.com", "www.instagram.com"] },
  { platform: "tiktok", label: "TikTok", hosts: ["tiktok.com", "www.tiktok.com"] },
  { platform: "x", label: "X", hosts: ["x.com", "twitter.com", "www.x.com", "www.twitter.com"] },
  { platform: "facebook", label: "Facebook", hosts: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"] },
  { platform: "snapchat", label: "Snapchat", hosts: ["snapchat.com", "www.snapchat.com"] },
  { platform: "youtube", label: "YouTube", hosts: ["youtube.com", "www.youtube.com", "youtu.be"] },
  { platform: "pinterest", label: "Pinterest", hosts: ["pinterest.com", "www.pinterest.com"] },
  { platform: "linkedin", label: "LinkedIn", hosts: ["linkedin.com", "www.linkedin.com"] },
  { platform: "spotify", label: "Spotify", hosts: ["open.spotify.com", "spotify.com"] },
  { platform: "twitch", label: "Twitch", hosts: ["twitch.tv", "www.twitch.tv"] },
  { platform: "website", label: "Website", hosts: null },
];

export type SocialLink = { platform: SocialPlatform; url: string };

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return SOCIAL_PLATFORMS.some((p) => p.platform === value);
}

export function validateSocialUrl(platform: SocialPlatform, raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const def = SOCIAL_PLATFORMS.find((p) => p.platform === platform);
  if (!def) return null;
  if (def.hosts && !def.hosts.includes(parsed.hostname.toLowerCase())) return null;
  return parsed.toString();
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
