import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Bookmark,
  Facebook,
  Ghost,
  Globe,
  Instagram,
  Linkedin,
  Music,
  Music2,
  Twitch,
  Twitter,
  Youtube,
} from "lucide-react";
import type { SocialLink, SocialPlatform } from "@/lib/social";

interface Props {
  displayName: string;
  username: string;
  isOwner: boolean;
  onBegin: () => void;
  /** The owner's theme control (the palette button in the header).
      Visitors get none: a wall wears its owner's theme, and only the
      owner changes it. */
  themeControl?: ReactNode;
  /** The owner's short introduction, shown under the wall's name. */
  bio?: string | null;
  /** Validated social links, shown as "Find me elsewhere". */
  socialLinks?: SocialLink[];
}

const SOCIAL_ICONS: Record<SocialPlatform, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Music2,
  x: Twitter,
  facebook: Facebook,
  snapchat: Ghost,
  youtube: Youtube,
  pinterest: Bookmark,
  linkedin: Linkedin,
  spotify: Music,
  twitch: Twitch,
  website: Globe,
};

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  facebook: "Facebook",
  snapchat: "Snapchat",
  youtube: "YouTube",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  spotify: "Spotify",
  twitch: "Twitch",
  website: "Website",
};

export function Hero({ displayName, username, isOwner, onBegin, themeControl, bio, socialLinks }: Props) {
  const name = displayName.trim() || username;
  return (
    <header className="relative overflow-hidden">
      {/* The wall's pattern lives here too, layered over the
          sanctuary gradient: before this, the hero's two opaque
          layers hid the pattern, so a theme like Starry Night only
          showed below the hero, where the fragments are. The
          background fades out toward the bottom instead of ending
          on a solid band, so the pattern carries on down the page. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "var(--gradient-aura), var(--gradient-sanctuary)",
          backgroundSize: "var(--wall-pattern-size, auto), auto",
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-6">
        <Link to="/" className="font-serif text-xl tracking-tight">
          Fragments
        </Link>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Link
              to="/gate"
              className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card/70"
            >
              Your gate
            </Link>
          ) : (
            <Link
              to="/signup"
              className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card/70"
            >
              Get your own wall
            </Link>
          )}
          {themeControl}
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:py-36">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
          @{username}
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-7xl">
          {name}&rsquo;s sanctuary of <span className="text-gradient">fragments</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/80">
          {bio?.trim() ||
            "A living archive of memories, questions, little truths and kind words from the people who pass through. Leave something behind, signed or anonymous."}
        </p>
        {socialLinks && socialLinks.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Find me elsewhere
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {socialLinks.map((link) => {
                const Icon = SOCIAL_ICONS[link.platform];
                return (
                  <a
                    key={link.platform + link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABELS[link.platform]}
                    title={SOCIAL_LABELS[link.platform]}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card/70"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {SOCIAL_LABELS[link.platform]}
                  </a>
                );
              })}
            </div>
          </div>
        )}
        <button
          onClick={onBegin}
          className="mt-10 rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
        >
          Leave a fragment
        </button>
      </div>
    </header>
  );
}
