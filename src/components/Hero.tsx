import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  displayName: string;
  username: string;
  isOwner: boolean;
  onBegin: () => void;
  /** The owner's theme control (the palette button in the header).
      Visitors get none: a wall wears its owner's theme, and only the
      owner changes it. */
  themeControl?: ReactNode;
}

export function Hero({ displayName, username, isOwner, onBegin, themeControl }: Props) {
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
          A living archive of memories, questions, little truths and kind words
          from the people who pass through. Leave something behind, signed or
          anonymous.
        </p>
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
