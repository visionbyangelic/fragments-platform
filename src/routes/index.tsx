import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession } from "@/hooks/use-session";
import { Link2, Lock, MessagesSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fragments — Leave an anonymous message" },
      {
        name: "description",
        content:
          "Claim your link, share it anywhere, and collect anonymous fragments: kind words, memories and questions from the people who pass through.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { profile, user, loading } = useSession();

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-sanctuary)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-6">
          <span className="font-serif text-xl tracking-tight">Fragments</span>
          <div className="flex items-center gap-2">
            {!loading && profile ? (
              <>
                <Link
                  to="/$username"
                  params={{ username: profile.username }}
                  className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card/70"
                >
                  Your wall
                </Link>
                <Link
                  to="/gate"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Your gate
                </Link>
              </>
            ) : !loading && user ? (
              <Link
                to="/gate"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Finish setting up
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card/70"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Claim your link
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <h1 className="font-serif text-5xl leading-tight sm:text-7xl">
            Leave an <span className="text-gradient">anonymous</span> message
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/80">
            Fragments is a wall of your own. Claim a link, share it anywhere,
            and the people who pass through your life leave you fragments:
            memories, kind words and questions. You read everything, answer
            what you want, and keep what you love.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
            >
              Claim your link
            </Link>
            <Link
              to="/$username"
              params={{ username: "angelic" }}
              className="rounded-full border border-border bg-card/40 px-8 py-3 font-medium backdrop-blur transition hover:bg-card/70"
            >
              See an example wall
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="glass rounded-4xl p-8">
            <Link2 className="h-7 w-7 text-primary" aria-hidden />
            <h2 className="mt-4 font-serif text-2xl">1. Claim your link</h2>
            <p className="mt-2 text-foreground/75">
              Pick a name and your wall is live instantly, with its own link
              and its own private backend that only you can open.
            </p>
          </div>
          <div className="glass rounded-4xl p-8">
            <MessagesSquare className="h-7 w-7 text-primary" aria-hidden />
            <h2 className="mt-4 font-serif text-2xl">2. Share it anywhere</h2>
            <p className="mt-2 text-foreground/75">
              Your story, your bio, your status. Visitors write signed or
              anonymous, and they can ask you questions too.
            </p>
          </div>
          <div className="glass rounded-4xl p-8">
            <Lock className="h-7 w-7 text-primary" aria-hidden />
            <h2 className="mt-4 font-serif text-2xl">3. Or seal it shut</h2>
            <p className="mt-2 text-foreground/75">
              A fragment can be sealed until a future day. Nobody can read it
              before then, not even you. It opens itself when the day comes.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-3xl text-center">
          <Sparkles className="mx-auto h-7 w-7 text-primary" aria-hidden />
          <h2 className="mt-4 font-serif text-4xl text-gradient">Anonymous means anonymous</h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/75">
            Some apps tease you with paid hints about who wrote what. We will
            never do that. A fragment with no name on it stays nameless
            forever, and every wall is moderated by the person it belongs to.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
          >
            Get your wall
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <p className="font-serif text-base text-foreground/80">Fragments</p>
        <p className="mt-1">Made with care by Angelic Charles</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <a
            href="https://x.com/visionbyangelic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card/70"
          >
            X
          </a>
          <a
            href="https://angelic.pxxlspace.cv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card/70"
          >
            Portfolio
          </a>
        </div>
      </footer>
    </div>
  );
}
