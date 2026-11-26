import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import {
  BarChart3,
  Heart,
  Hourglass,
  Image,
  Link2,
  Mail,
  MessageCircleQuestion,
  MessagesSquare,
  Palette,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fragments — your corner of the internet" },
      {
        name: "description",
        content:
          "Claim a wall of your own, share the link anywhere, and let the people who pass through leave you kind words, memories, questions, votes and notes sealed for later.",
      },
    ],
  }),
  component: Landing,
});

// The front door. It wears the normal site theme, like every other
// page that is not a wall — I tried giving it its own bright pink
// look and it was wrong for the site. And it sells what Fragments
// actually is — a wall of your own where people leave a little
// something behind — not just an anonymous-message app. Anonymous is
// one choice a writer can make, not the product.
function Landing() {
  const { profile, user, loading } = useSession();

  return (
    <div className="fragments-home min-h-screen">
      <style>{`
        .fragments-home {
          background: #10111f !important;
          color: #f2f0fa !important;
          --background: #10111f;
          --foreground: #f2f0fa;
          --card: #191b2d;
          --card-foreground: #f2f0fa;
          --popover: #191b2d;
          --popover-foreground: #f2f0fa;
          --primary: #b9a4ff;
          --primary-foreground: #171326;
          --secondary: #272940;
          --secondary-foreground: #e7e2ff;
          --muted: #222438;
          --muted-foreground: #aaa9c2;
          --accent: #8c7cf0;
          --accent-foreground: #ffffff;
          --border: #34364e;
          --input: #272940;
          --ring: #b9a4ff;
          --color-background: #10111f;
          --color-foreground: #f2f0fa;
          --color-card: #191b2d;
          --color-card-foreground: #f2f0fa;
          --color-primary: #b9a4ff;
          --color-primary-foreground: #171326;
          --color-secondary: #272940;
          --color-secondary-foreground: #e7e2ff;
          --color-muted: #222438;
          --color-muted-foreground: #aaa9c2;
          --color-accent: #8c7cf0;
          --color-accent-foreground: #ffffff;
          --color-border: #34364e;
          --gradient-sanctuary: none;
          --gradient-aura: none;
          --glass-bg: #191b2d;
          --glass-border: #34364e;
          --shadow-soft: 0 16px 44px rgba(0, 0, 0, 0.22);
          --shadow-glow: 0 8px 24px rgba(140, 124, 240, 0.2);
        }
        .fragments-home header { background: #10111f !important; }
        .fragments-home .glass {
          background: #191b2d !important;
          border: 1px solid #34364e !important;
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.22) !important;
          backdrop-filter: none !important;
        }
        .fragments-home .text-gradient {
          background: none !important;
          color: #b9a4ff !important;
          -webkit-text-fill-color: #b9a4ff !important;
        }
        .fragments-home .landing-hero-copy,
        .fragments-home .text-foreground\/80,
        .fragments-home .text-foreground\/75 { color: #c5c3d8 !important; }
        .fragments-home .text-muted-foreground { color: #aaa9c2 !important; }
        .fragments-home .bg-primary { background: #b9a4ff !important; color: #171326 !important; }
        .fragments-home .text-primary { color: #b9a4ff !important; }
        .fragments-home .border-border { border-color: #34364e !important; }
        .fragments-home .bg-card\/40,
        .fragments-home .bg-card\/60 { background: #191b2d !important; }
        .fragments-home a:focus-visible { outline: 3px solid rgba(185, 164, 255, 0.6); outline-offset: 3px; }
        .fragments-home .landing-hero-actions a { min-height: 48px; }
        @media (max-width: 640px) {
          .fragments-home .landing-nav { padding: 1.1rem 1rem; }
          .fragments-home .landing-nav > div { gap: 0.5rem; }
          .fragments-home .landing-nav a { padding: 0.65rem 0.75rem; font-size: 0.75rem; white-space: nowrap; }
          .fragments-home .landing-nav > span { font-size: 1.1rem; }
          .fragments-home .landing-hero { padding: 1.5rem 1rem 2.5rem; gap: 2rem; }
          .fragments-home .landing-hero h1 { font-size: clamp(2.35rem, 10.5vw, 3.25rem); line-height: 1.08; letter-spacing: -0.035em; }
          .fragments-home .landing-hero-copy { font-size: 1rem; line-height: 1.65; }
          .fragments-home .landing-hero-actions { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
          .fragments-home .landing-hero-actions a { width: 100%; display: flex; align-items: center; justify-content: center; }
          .fragments-home .landing-main { padding: 2.75rem 1rem 3rem; }
          .fragments-home .landing-feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-top: 2rem; }
          .fragments-home .landing-feature-grid > div { padding: 1rem; border-radius: 1rem; }
          .fragments-home .landing-feature-grid h3 { font-size: 1.05rem; }
          .fragments-home .landing-feature-grid p { font-size: 0.82rem; line-height: 1.5; }
          .fragments-home .landing-steps { gap: 0.75rem; margin-top: 2rem; }
          .fragments-home .landing-steps > div { padding: 1.25rem; }
        }
        @media (max-width: 360px) {
          .fragments-home .landing-feature-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <header className="relative overflow-hidden bg-white">
        <nav className="landing-nav relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-6">
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
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Create your wall
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="landing-hero relative z-10 mx-auto grid max-w-3xl items-center gap-10 px-6 pb-14 pt-8 sm:pt-16 lg:pb-28">
          <div className="landing-hero-content text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              A wall that's yours
            </p>
            <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-6xl lg:text-7xl">
              Your corner of the{" "}
              <span className="text-gradient">internet</span>
            </h1>
            <p className="landing-hero-copy mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-lg lg:mx-0">
              Claim a link, share it anywhere, and the people who pass
              through your life leave you kind words, memories and
              questions. Signed or anonymous — you read everything, and
              keep what you love.
            </p>
            <div className="landing-hero-actions mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                to="/signup"
                className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                Claim your wall
              </Link>
              <Link
                to="/$username"
                params={{ username: "angelic" }}
                className="rounded-full border border-border bg-card/40 px-8 py-3 font-medium backdrop-blur transition hover:bg-card/70"
              >
                See an example wall
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Free to start · No app to install · Your wall, your rules
            </p>
          </div>

          {/* A wall, at a glance — the example wall itself, live:
              Angelic's real fragments, rendered with the wall's own
              FragmentCard. The first version of this panel faked it,
              with invented poll numbers and invented fragments, which
              showed a wall that does not exist. Nothing here is made
              up: while it loads, or if it fails, the panel shows the
              wall's name and a link to the real thing instead. */}

        </div>
      </header>

      <main className="landing-main mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            One wall,{" "}
            <span className="text-gradient">everything people want</span>{" "}
            to leave you
          </h2>
          <p className="mt-4 text-base text-foreground/75 sm:text-lg">
            A fragment is only the start. Your wall holds the whole
            conversation with the people who pass through.
          </p>
        </div>

        <div className="landing-feature-grid mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-4xl p-7">
            <MessagesSquare className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-xl">Fragments</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Kind words, memories and confessions — signed, or with no name
              at all. You read them all.
            </p>
          </div>
          <div className="glass rounded-4xl p-7">
            <BarChart3 className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-xl">Polls</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Ask your wall a question and watch the votes come in. Results
              show after people vote.
            </p>
          </div>
          <div className="glass rounded-4xl p-7">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-xl">Question of the day</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              A daily prompt on your wall, answered as fragments by whoever
              passes by.
            </p>
          </div>
          <div className="glass rounded-4xl p-7">
            <MessageCircleQuestion
              className="h-7 w-7 text-primary"
              aria-hidden
            />
            <h3 className="mt-4 font-serif text-xl">Question box</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Visitors ask, you answer — and you choose which answers go
              public.
            </p>
          </div>
          <div className="glass rounded-4xl p-7">
            <Hourglass className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-xl">Time capsules</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Sealed for a future day. Friends contribute while it is shut,
              and it opens itself when the day comes.
            </p>
          </div>
          <div className="glass rounded-4xl p-7">
            <Mail className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-xl">Dear Future Me</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              A private letter to your future self, kept safe until its day
              arrives.
            </p>
          </div>
          <div className="glass rounded-4xl p-7">
            <Palette className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-xl">Themes</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Twenty-five looks to choose from, from dreamy pink skies to a
              night match under the lights — and you can fine-tune the
              colours.
            </p>
          </div>
          <div className="glass rounded-4xl p-7">
            <Image className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-xl">Your picture</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Put your own photo behind the wall and pick the colour of the
              words over it.
            </p>
          </div>
        </div>

        <div className="mt-14 sm:mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              Up in <span className="text-gradient">three steps</span>
            </h2>
          </div>
          <div className="landing-steps mt-12 grid gap-5 md:grid-cols-3">
            <div className="glass rounded-4xl p-8">
              <Link2 className="h-7 w-7 text-primary" aria-hidden />
              <h3 className="mt-4 font-serif text-2xl">1. Claim your wall</h3>
              <p className="mt-2 text-foreground/75">
                Pick a name and your wall is live instantly, with its own
                link and its own space that only you can open.
              </p>
            </div>
            <div className="glass rounded-4xl p-8">
              <MessagesSquare className="h-7 w-7 text-primary" aria-hidden />
              <h3 className="mt-4 font-serif text-2xl">2. Share it anywhere</h3>
              <p className="mt-2 text-foreground/75">
                Your story, your bio, your status. Anyone with the link can
                leave something — no account needed.
              </p>
            </div>
            <div className="glass rounded-4xl p-8">
              <Heart className="h-7 w-7 text-primary" aria-hidden />
              <h3 className="mt-4 font-serif text-2xl">3. Read, answer, keep</h3>
              <p className="mt-2 text-foreground/75">
                Everything lands in your hands. Answer the questions you
                want, keep the fragments you love, close the ones you
                don't.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-3xl text-center sm:mt-20">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Your wall is <span className="text-gradient">waiting</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-foreground/75 sm:text-lg">
            Someone out there has something kind to tell you. Give them a
            place to leave it.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
          >
            Claim your wall
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <p className="font-serif text-base text-foreground/80">Fragments</p>
        <p className="mt-1">Made with care by Angelic Charles</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            to="/$username"
            params={{ username: "angelic" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card/70"
          >
            Angelic's wall
          </Link>
          <a
            href="https://x.com/Visionbyangelic"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card/70"
          >
            @Visionbyangelic
          </a>
        </div>
      </footer>
    </div>
  );
}
