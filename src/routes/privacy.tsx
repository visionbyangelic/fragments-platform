import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · Fragments" },
      {
        name: "description",
        content: "What Fragments collects, what it never does with it, and how to ask for your data to be deleted.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="glass rounded-4xl p-8 sm:p-10">
          <h1 className="font-serif text-3xl">Privacy</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated 26 November 2026. Plain words, no legalese.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="font-serif text-xl">What I collect</h2>
              <p className="mt-2">
                To run your wall I keep your wall name, display name and the
                email you signed up with. Your email is never shown on your
                wall. I keep the fragments and questions left on your wall,
                along with the name the sender typed, the colour they picked,
                and whether the message is sealed and when it opens.
              </p>
              <p className="mt-2">
                If you leave a fragment while signed in, Fragments keeps a
                note of which account it came from. While a fragment is marked
                anonymous, the wall&apos;s owner can&apos;t see that note.
                Your browser also gets a random visitor id, stored on your own
                device, which is how one vote per poll and one reaction per
                fragment work.
              </p>
              <p className="mt-2">
                Poll votes, reactions, replies, time capsule contributions and
                Dear Future Me letters are stored with the wall they belong to.
                A sealed fragment stays hidden until the day you chose — even
                from the wall&apos;s owner.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl">Signing in with Google</h2>
              <p className="mt-2">
                If you sign in with Google, Google shares your name and email
                with Fragments — only what you approve on Google&apos;s screen.
                Nothing else from your Google account is read.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl">What I never do</h2>
              <p className="mt-2">
                I never sell your data, never show ads, and never let
                third-party trackers follow you around the site. Your wall is
                yours: only you can change it, hide or delete its fragments,
                and close it.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl">Where it lives</h2>
              <p className="mt-2">
                Walls and messages are stored with Supabase in the EU, and the
                site itself is hosted by Vercel. Signing in, resetting a
                password and confirming your email are handled by Supabase.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl">Deleting your data</h2>
              <p className="mt-2">
                You can delete any fragment, question, poll, capsule or letter
                from your gate. To delete your whole account and wall, write to
                me at{" "}
                <a
                  href="mailto:visionbyangelic@gmail.com"
                  className="underline underline-offset-2"
                >
                  visionbyangelic@gmail.com
                </a>{" "}
                from the email on the account and I will remove it.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl">Questions</h2>
              <p className="mt-2">
                Anything unclear, write to me at{" "}
                <a
                  href="mailto:visionbyangelic@gmail.com"
                  className="underline underline-offset-2"
                >
                  visionbyangelic@gmail.com
                </a>
                .
              </p>
            </section>
          </div>

          <p className="mt-10 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
            >
              Back to Fragments
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
