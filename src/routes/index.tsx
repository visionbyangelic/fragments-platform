import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { fetchProfileByUsername } from "@/lib/platform";
import { fetchEntries } from "@/lib/entries";
import { FragmentCard } from "@/components/FragmentCard";
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

// The hero preview is the example wall itself, live: Angelic's real
// fragments, rendered with the wall's own FragmentCard, newest first,
// public ones only — the same filter the wall uses. Nothing here is
// invented; while it loads, or if it fails, the panel shows the
// wall's name and a link to the real thing instead of made-up words.
function WallPreview() {
  const { data: profile } = useQuery({
    queryKey: ["landing-preview-profile"],
    queryFn: () => fetchProfileByUsername("angelic"),
  });
  const { data: entries } = useQuery({
    queryKey: ["landing-preview-entries", profile?.id],
    queryFn: () => fetchEntries(profile!.id),
    enabled: !!profile?.id,
  });
  const shown = (entries ?? [])
    .filter((e) => !e.is_private && e.is_visible)
    .slice(0, 3);
  const name = profile?.display_name?.trim() || "Angelic";

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="glass rounded-4xl p-6 shadow-[var(--shadow-soft)] sm:p-7">
        <p className="font-serif text-2xl leading-snug">
          {name}'s <span className="text-gradient">sanctuary of fragments</span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {profile?.bio?.trim() ||
            "A living archive of memories, questions, little truths and kind words from the people who pass through. Leave something behind, signed or anonymous."}
        </p>
        <Link
          to="/$username"
          params={{ username: "angelic" }}
          className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Leave a fragment +
        </Link>

        <p className="mt-7 text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
          GUESTBOOK
        </p>
        <div className="mt-3">
          {shown.map((entry, i) => (
            <FragmentCard
              key={entry.id}
              entry={entry}
              index={i}
              isOwner={false}
            />
          ))}
          {shown.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              The wall is loading — or waiting for its first fragment.
            </p>
          )}
        </div>

        <Link
          to="/$username"
          params={{ username: "angelic" }}
          className="mt-2 inline-block text-sm font-medium text-primary transition hover:opacity-80"
        >
          See the full wall →
        </Link>
      </div>
    </div>
  );
}

// The front door. It wears the normal site theme, like every other
// page that is not a wall — I tried giving it its own bright pink
// look and it was wrong for the site. And it sells what Fragments
// actually is — a wall of your own where people leave a little
// something behind — not just an anonymous-message app. Anonymous is
// one choice a writer can make, not the product.
function Landing() {
  const { profile, user, loading } = useSession();

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden">
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
                  Claim your wall
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 sm:pt-16 lg:grid-cols-2 lg:pb-28">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              A wall that's yours
            </p>
            <h1 className="mt-6 font-serif text-5xl leading-tight sm:text-6xl">
              Your corner of the internet, where people leave{" "}
              <span className="text-gradient">a little something</span>{" "}
              behind
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/80 lg:mx-0">
              Fragments is a wall of your own. Claim a link, share it
              anywhere, and the people who pass through your life leave you
              kind words, memories, questions, votes in your poll and notes
              sealed for later. Signed or anonymous — you read everything,
              answer what you want, and keep what you love.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
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
          <WallPreview />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-4xl leading-tight">
            One wall,{" "}
            <span className="text-gradient">everything people want</span>{" "}
            to leave you
          </h2>
          <p className="mt-4 text-lg text-foreground/75">
            A fragment is only the start. Your wall holds the whole
            conversation with the people who pass through.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-4xl leading-tight">
              Up in <span className="text-gradient">three steps</span>
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
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

        <div className="mx-auto mt-20 max-w-3xl text-center">
          <h2 className="font-serif text-4xl leading-tight">
            Your wall is <span className="text-gradient">waiting</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-foreground/75">
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
