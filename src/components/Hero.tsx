import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Props {
  displayName: string;
  username: string;
  isOwner: boolean;
  onBegin: () => void;
}

export function Hero({ displayName, username, isOwner, onBegin }: Props) {
  const name = displayName.trim() || username;
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--gradient-sanctuary)" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />

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
          <ThemeToggle />
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
