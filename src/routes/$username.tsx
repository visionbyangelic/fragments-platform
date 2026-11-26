import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hero } from "@/components/Hero";
import { SubmissionForm } from "@/components/SubmissionForm";
import { FragmentCard } from "@/components/FragmentCard";
import { QASection } from "@/components/QASection";
import { SerendipityModal } from "@/components/SerendipityModal";
import { PollCard } from "@/components/PollCard";
import { CapsuleSection } from "@/components/CapsuleSection";
import {
  fetchEntries,
  fetchSealedEntries,
  subscribeToEntries,
  type Entry,
  type SealedEntry,
} from "@/lib/entries";
import { fetchQuestions, subscribeToQuestions } from "@/lib/questions";
import { fetchActivePoll, type Poll } from "@/lib/polls";
import { fetchCapsules, type Capsule } from "@/lib/capsules";
import { fetchReactions, type ReactionCounts } from "@/lib/reactions";
import { fetchReplies } from "@/lib/replies";
import { getVisitorId } from "@/lib/visitor";
import { parseSocialLinks, showSection } from "@/lib/social";
import { fetchProfileByUsername, reportWall, updateProfile, USERNAME_RE } from "@/lib/platform";
import { useSession } from "@/hooks/use-session";
import { useTheme, applyThemeToDocument } from "@/context/ThemeContext";
import { CUSTOM_THEME_NAME, isThemeName, themeDef } from "@/lib/themes";
import { parseCustomTheme } from "@/lib/custom-theme";
import { parseThemeOverrides } from "@/lib/theme-overrides";
import { WallDecorations } from "@/components/WallDecorations";
import { WallThemeControl } from "@/components/WallThemeControl";
import { applyWallpaperImage, clearWallpaperImage } from "@/lib/wallpaper";
import type { Decoration } from "@/lib/themes";
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
        content: `Leave a little something for @${params.username} on Fragments.`,
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
  // Decorations the theme panel is previewing; null means the saved ones.
  const [previewDecorations, setPreviewDecorations] = useState<Decoration[] | null>(null);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
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
  const { data: activePoll = null } = useQuery({
    queryKey: ["active-poll", profileId],
    queryFn: () => fetchActivePoll(profileId!).catch(() => null as Poll | null),
    enabled: !!profileId,
  });
  const { data: capsules = [] } = useQuery({
    queryKey: ["capsules", profileId],
    queryFn: () => fetchCapsules(profileId!).catch(() => [] as Capsule[]),
    enabled: !!profileId,
  });
  const publicEntryIds = entries.map((e: Entry) => e.id);
  const { data: reactionsMap = new Map<string, ReactionCounts>(), refetch: refetchReactions } = useQuery({
    queryKey: ["reactions", profileId, publicEntryIds.join(",")],
    queryFn: () => fetchReactions(publicEntryIds, getVisitorId()).catch(() => new Map()),
    enabled: !!profileId && publicEntryIds.length > 0,
  });
  const { data: repliesMap = new Map<string, string>(), refetch: refetchReplies } = useQuery({
    queryKey: ["replies", profileId, publicEntryIds.join(",")],
    queryFn: () => fetchReplies(publicEntryIds).catch(() => new Map()),
    enabled: !!profileId && publicEntryIds.length > 0,
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

  // A wall wears its owner's theme. Visitors never change it — the
  // theme control in the header is the owner's alone.
  useEffect(() => {
    if (profile && themedFor.current !== profile.id) {
      themedFor.current = profile.id;
      const name = isThemeName(profile.theme) ? profile.theme : "moonlight";
      const custom =
        name === CUSTOM_THEME_NAME ? parseCustomTheme(profile.custom_theme) : undefined;
      const overrides = parseThemeOverrides(profile.theme_overrides);
      setTheme(name, custom, overrides);
      // The document gets the theme directly too, same as the gate:
      // the saved look lands even if the context state is stale.
      applyThemeToDocument(name, custom, overrides);
    }
  }, [profile, setTheme]);

  // A wall with a wallpaper picture wears the picture instead of the
  // theme's background, and the words over it wear the owner's
  // picked text colour (white when nothing was picked). The effect
  // cleans up when the wall unmounts, so the picture never leaks
  // onto the next page.
  const wallpaperUrl = profile?.wallpaper_url ?? null;
  const wallpaperTextColor = profile?.wallpaper_text_color ?? null;
  useEffect(() => {
    applyWallpaperImage(wallpaperUrl, wallpaperTextColor);
    return () => clearWallpaperImage();
  }, [wallpaperUrl, wallpaperTextColor]);

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

  const publicFragments = entries
    .filter((e: Entry) => !e.is_private && (isOwner || e.is_visible))
    // The featured fragment sits first on the wall.
    .sort((a: Entry, b: Entry) => {
      if (a.id === profile.featured_entry_id) return -1;
      if (b.id === profile.featured_entry_id) return 1;
      return 0;
    });

  const qaOn = showSection(profile.sections, "qa");
  const effectiveTab = tab === "ama" && !qaOn ? "board" : tab;

  async function toggleFeatured(entryId: string) {
    try {
      await updateProfile(profile!.id, {
        featured_entry_id: profile!.featured_entry_id === entryId ? null : entryId,
      });
      toast.success(
        profile!.featured_entry_id === entryId
          ? "Featured fragment removed"
          : "Fragment featured on your wall",
      );
      refetchProfile();
    } catch {
      toast.error("Could not change the featured fragment");
    }
  }

  // The wall's decorations: the owner's overrides win, else the
  // theme's own defaults — or the theme panel's preview, while it is
  // open.
  const wallThemeName = isThemeName(profile.theme) ? profile.theme : "moonlight";
  const wallDecorations =
    previewDecorations ??
    parseThemeOverrides(profile.theme_overrides)?.decorations ??
    themeDef(wallThemeName)?.decorations ??
    [];

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
      <WallDecorations decorations={wallDecorations} />
      <div className="relative">
      <Hero
        displayName={profile.display_name}
        username={profile.username}
        isOwner={isOwner}
        onBegin={scrollToForm}
        bio={profile.bio}
        socialLinks={
          showSection(profile.sections, "social")
            ? parseSocialLinks(profile.social_links)
            : []
        }
        themeControl={
          isOwner ? (
            <WallThemeControl
              profile={profile}
              onSaved={() => refetchProfile()}
              onPreviewDecorations={setPreviewDecorations}
            />
          ) : undefined
        }
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
          <div className={`glass grid w-full max-w-md ${qaOn ? "grid-cols-2" : "grid-cols-1"} rounded-4xl p-1`}>
            <button
              onClick={() => setTab("board")}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition ${
                effectiveTab === "board" ? "bg-primary text-primary-foreground" : "text-foreground/70"
              }`}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Fragments
            </button>
            {qaOn && (
              <button
                onClick={() => setTab("ama")}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition ${
                  effectiveTab === "ama" ? "bg-primary text-primary-foreground" : "text-foreground/70"
                }`}
              >
                <MessageCircleQuestion className="h-4 w-4" aria-hidden />
                Q&A
              </button>
            )}
          </div>
        </div>

        {effectiveTab === "board" ? (
          <>
            {activePoll && showSection(profile.sections, "poll") && (
              <div className="mx-auto mb-12 max-w-2xl">
                <PollCard poll={activePoll} visitorId={getVisitorId()} />
              </div>
            )}

            {profile.qotd?.trim() && (
              <div className="frag-card glass mx-auto mb-12 max-w-2xl rounded-[var(--card-radius)] p-6 text-center sm:p-7">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Question of the day
                </p>
                <p className="mt-3 font-serif text-2xl leading-snug">{profile.qotd}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Answer it below, as a fragment.
                </p>
              </div>
            )}

            {showSection(profile.sections, "guestbook") && publicFragments.length > 0 && (
              <h2 className="mb-6 text-center font-serif text-3xl text-gradient">
                Guestbook — signatures from visitors
              </h2>
            )}

            {publicFragments.length === 0 && sealed.length === 0 ? (
              <p className="mb-16 text-center text-muted-foreground">
                No fragments yet. Be the first to leave one.
              </p>
            ) : (
              <div className="mb-20 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {showSection(profile.sections, "sealed") &&
                  sealed.map((entry, i) => (
                    <SealedCard key={entry.id} entry={entry} index={i} />
                  ))}
                {publicFragments.map((entry: Entry, i: number) => (
                  <FragmentCard
                    key={entry.id}
                    entry={entry}
                    index={i}
                    isOwner={isOwner}
                    editMode={editMode}
                    ownerName={ownerName}
                    reactions={reactionsMap.get(entry.id)}
                    reply={repliesMap.get(entry.id) ?? null}
                    onReacted={() => {
                      refetchReactions();
                      refetchReplies();
                    }}
                    featured={profile.featured_entry_id === entry.id}
                    onFeature={isOwner && editMode ? () => toggleFeatured(entry.id) : undefined}
                    wallUsername={profile.username}
                    wallTheme={wallThemeName}
                    customTheme={parseCustomTheme(profile.custom_theme)}
                  />
                ))}
              </div>
            )}

            {capsules.length > 0 && (
              <CapsuleSection
                capsules={capsules}
                profileId={profile.id}
                wallOpen={profile.wall_open}
                myUsername={myProfile?.username ?? null}
              />
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
                <SubmissionForm profileId={profile.id} ownerName={ownerName} qaEnabled={qaOn} />
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
            customTheme={parseCustomTheme(profile.custom_theme)}
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
            className="bg-background/70"
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
    </div>
  );
}
