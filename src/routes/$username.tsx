import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hero } from "@/components/Hero";
import { SubmissionForm } from "@/components/SubmissionForm";
import { FragmentCard } from "@/components/FragmentCard";
import { QASection } from "@/components/QASection";
import { SerendipityModal } from "@/components/SerendipityModal";
import {
  fetchEntries,
  fetchSealedEntries,
  subscribeToEntries,
  type Entry,
  type SealedEntry,
} from "@/lib/entries";
import { fetchQuestions, subscribeToQuestions } from "@/lib/questions";
import { fetchProfileByUsername, reportWall, USERNAME_RE } from "@/lib/platform";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/context/ThemeContext";
import { isThemeName } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Dices,
  Flag,
  Lock,
  MessageCircleQuestionMark as MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} · Fragments` },
      {
        name: "description",
        content: `Leave an anonymous message for @${params.username} on Fragments.`,
      },
      { property: "og:title", content: `Leave a message for @${params.username}` },
      {
        property: "og:description",
        content: "A fragment, a memory, a question. Signed or anonymous.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Wall,
});

function SealedCard({ entry, index }: { entry: SealedEntry; index: number }) {
  const opens = new Date(entry.reveal_date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div
      className="mb-5 break-inside-avoid animate-float-up"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
    >
      <div className="glass block w-full rounded-3xl p-6 text-left">
        <Lock className="mb-3 h-5 w-5 text-primary" aria-hidden />
        <p className="font-serif text-xl leading-snug">Sealed until {opens}</p>
        <p className="mt-3 text-sm italic text-muted-foreground">
          from {entry.name?.trim() ? entry.name : "Anonymous"}. It opens itself
          on the day, for everyone at once.
        </p>
      </div>
    </div>
  );
}

function Wall() {
  const { username } = Route.useParams();
  const { profile: myProfile } = useSession();
  const { setTheme } = useTheme();
  const formRef = useRef<HTMLDivElement>(null);
  const themedFor = useRef<string | null>(null);
  const [serendipityOpen, setSerendipityOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState<"board" | "ama">("board");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfileByUsername(username),
  });

  const profileId = profile?.id;
  const { data: entries = [], refetch } = useQuery({
    queryKey: ["entries", profileId],
    queryFn: () => fetchEntries(profileId!),
    enabled: !!profileId,
  });
  const { data: sealed = [] } = useQuery({
    queryKey: ["sealed", profileId],
    queryFn: () => fetchSealedEntries(profileId!),
    enabled: !!profileId,
  });
  const { data: questions = [], refetch: refetchQuestions } = useQuery({
    queryKey: ["questions", profileId],
    queryFn: () => fetchQuestions(profileId!),
    enabled: !!profileId,
  });

  useEffect(() => {
    if (!profileId) return;
    const unsubEntries = subscribeToEntries(() => refetch(), profileId);
    const unsubQuestions = subscribeToQuestions(() => refetchQuestions(), profileId);
    return () => {
      unsubEntries();
      unsubQuestions();
    };
  }, [profileId, refetch, refetchQuestions]);

  // A wall wears its owner's theme until the visitor picks their own.
  useEffect(() => {
    if (profile && themedFor.current !== profile.id) {
      themedFor.current = profile.id;
      setTheme(isThemeName(profile.theme) ? profile.theme : "dusk");
    }
  }, [profile, setTheme]);

  if (profileLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass max-w-md rounded-4xl p-10 text-center">
          <h1 className="font-serif text-4xl">No wall here yet</h1>
          <p className="mt-3 text-muted-foreground">
            Nobody has claimed @{username} yet.
            {USERNAME_RE.test(username) ? " It could be yours." : ""}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground transition hover:opacity-90"
            >
              Claim this name
            </Link>
            <Link
              to="/"
              className="rounded-full border border-border bg-card/40 px-6 py-2.5 font-medium backdrop-blur transition hover:bg-card/70"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = myProfile?.id === profile.id;
  const ownerName = profile.display_name.trim() || profile.username;

  if (profile.suspended && !isOwner && !myProfile?.is_platform_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass max-w-md rounded-4xl p-10 text-center">
          <h1 className="font-serif text-4xl">This wall is unavailable</h1>
          <p className="mt-3 text-muted-foreground">
            @{profile.username} cannot be visited right now.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const publicFragments = entries.filter(
    (e: Entry) => !e.is_private && (isOwner || e.is_visible),
  );

  function scrollToForm() {
    setTab("board");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function submitReport() {
    setReporting(true);
    try {
      await reportWall(profile!.id, reportReason.trim() || null);
      toast.success("Reported. Thank you for flagging it.");
      setReportOpen(false);
      setReportReason("");
    } catch {
      toast.error("Could not send the report");
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Hero
        displayName={profile.display_name}
        username={profile.username}
        isOwner={isOwner}
        onBegin={scrollToForm}
      />

      {isOwner && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-primary/90 px-6 py-2 text-sm text-primary-foreground backdrop-blur">
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-4 w-4" />
            {editMode
              ? "Editing enabled, use the buttons on each fragment"
              : "This is your wall. Your gate holds everything, including the private view."}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/gate"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1 transition hover:bg-primary-foreground/30"
            >
              Open gate
            </Link>
            <button
              onClick={() => setEditMode(!editMode)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1 transition hover:bg-primary-foreground/30"
            >
              {editMode ? "Done editing" : "Edit wall"}
            </button>
          </div>
        </div>
      )}

      <SerendipityModal
        open={serendipityOpen}
        onOpenChange={setSerendipityOpen}
        profileId={profile.id}
        ownerName={ownerName}
      />

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 flex justify-center">
          <div className="glass grid w-full max-w-md grid-cols-2 rounded-4xl p-1">
            <button
              onClick={() => setTab("board")}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition ${
                tab === "board" ? "bg-primary text-primary-foreground" : "text-foreground/70"
              }`}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Fragments
            </button>
            <button
              onClick={() => setTab("ama")}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition ${
                tab === "ama" ? "bg-primary text-primary-foreground" : "text-foreground/70"
              }`}
            >
              <MessageCircleQuestion className="h-4 w-4" aria-hidden />
              Q&A
            </button>
          </div>
        </div>

        {tab === "board" ? (
          <>
            {publicFragments.length === 0 && sealed.length === 0 ? (
              <p className="mb-16 text-center text-muted-foreground">
                No fragments yet. Be the first to leave one.
              </p>
            ) : (
              <div className="mb-20 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {sealed.map((entry, i) => (
                  <SealedCard key={entry.id} entry={entry} index={i} />
                ))}
                {publicFragments.map((entry: Entry, i: number) => (
                  <FragmentCard
                    key={entry.id}
                    entry={entry}
                    index={i}
                    isOwner={isOwner}
                    editMode={editMode}
                  />
                ))}
              </div>
            )}

            <div ref={formRef} className="mx-auto max-w-2xl scroll-mt-24">
              <div className="mb-8 text-center">
                <h2 className="font-serif text-4xl text-gradient">Leave a fragment</h2>
                <p className="mt-3 text-muted-foreground">
                  {profile.custom_prompt?.trim() ||
                    `A few words that will live on this wall, seal it for a future day, or flip the switch below and ask ${ownerName} a question instead.`}
                </p>
              </div>
              {profile.wall_open ? (
                <SubmissionForm profileId={profile.id} ownerName={ownerName} />
              ) : (
                <div className="glass rounded-4xl p-8 text-center text-muted-foreground">
                  This wall is closed to new fragments for now.
                </div>
              )}
            </div>
          </>
        ) : (
          <QASection
            questions={questions}
            isOwner={isOwner}
            ownerName={ownerName}
            editMode={editMode}
            wallUsername={profile.username}
            wallTheme={profile.theme}
          />
        )}
      </main>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <p className="font-serif text-base text-foreground/80">Fragments</p>
        <p className="mt-1">This wall belongs to @{profile.username}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card/70"
          >
            Get your own wall
          </Link>
          <button
            onClick={() => setSerendipityOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card/70"
          >
            <Dices className="h-3.5 w-3.5" /> Serendipity
          </button>
          {!isOwner && (
            <button
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card/70"
            >
              <Flag className="h-3.5 w-3.5" /> Report this wall
            </button>
          )}
        </div>
      </footer>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="glass border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Report this wall</DialogTitle>
            <DialogDescription>
              Tell the Fragments team what is wrong with @{profile.username}.
              The wall's owner will not see this report.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="What happened? (optional)"
            rows={4}
            maxLength={500}
            className="bg-white/60"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReportOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={reporting} className="rounded-full">
              {reporting ? "Sending…" : "Send report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
