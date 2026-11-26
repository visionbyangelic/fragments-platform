import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import {
  createProfile,
  fetchAllProfiles,
  fetchReports,
  isReservedUsername,
  isUsernameAvailable,
  normalizeUsername,
  updateProfile,
  USERNAME_RE,
  type Profile,
} from "@/lib/platform";
import {
  fetchEntries,
  fetchSealedEntries,
  subscribeToEntries,
  type SealedEntry,
} from "@/lib/entries";
import { fetchQuestions, subscribeToQuestions } from "@/lib/questions";
import { fetchPolls, closePoll, fetchVoteCounts, type Poll } from "@/lib/polls";
import { fetchCapsules, type Capsule } from "@/lib/capsules";
import { fetchLetters, type Letter } from "@/lib/letters";
import { fetchReactions, type ReactionCounts } from "@/lib/reactions";
import { fetchReplies } from "@/lib/replies";
import {
  addToCollection,
  createCollection,
  deleteCollection,
  fetchAllCollectionItems,
  fetchCollectionEntryIds,
  fetchCollections,
  removeFromCollection,
  type Collection,
} from "@/lib/collections";
import { getVisitorId } from "@/lib/visitor";
import { parseSocialLinks, showSection, SOCIAL_PLATFORMS, validateSocialUrl, type SocialLink, type WallSections } from "@/lib/social";
import { FragmentCard } from "@/components/FragmentCard";
import { QASection } from "@/components/QASection";
import { CreateSheet } from "@/components/CreateSheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeEditorPanel } from "@/components/ThemeEditorPanel";
import { useTheme, applyThemeToDocument } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PENDING_PROFILE_KEY } from "./signup";
import { WallDecorations } from "@/components/WallDecorations";
import { CUSTOM_THEME_NAME, isThemeName, themeDef } from "@/lib/themes";
import {
  DEFAULT_CUSTOM_THEME,
  parseCustomTheme,
  type CustomTheme,
} from "@/lib/custom-theme";
import { parseThemeOverrides } from "@/lib/theme-overrides";
import { toast } from "sonner";
import { Copy, Lock, ShieldCheck, Home, Inbox, Palette, User, Plus, Hourglass, Mail, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/gate")({
  head: () => ({
    meta: [
      { title: "Your gate · Fragments" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GatePage,
});

function ClaimWallForm({ userId, onClaimed }: { userId: string; onClaimed: () => void }) {
  const { setTheme } = useTheme();
  const [username, setUsername] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_PROFILE_KEY) ?? "{}").username ?? "";
    } catch {
      return "";
    }
  });
  const [displayName, setDisplayName] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_PROFILE_KEY) ?? "{}").display_name ?? "";
    } catch {
      return "";
    }
  });
  const [state, setState] = useState<"idle" | "checking" | "ok" | "taken" | "invalid" | "reserved">("idle");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const name = normalizeUsername(username);
    if (!name) return setState("idle");
    if (!USERNAME_RE.test(name)) return setState("invalid");
    if (isReservedUsername(name)) return setState("reserved");
    setState("checking");
    const t = setTimeout(async () => {
      try {
        setState((await isUsernameAvailable(name)) ? "ok" : "taken");
      } catch {
        setState("idle");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [username]);

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeUsername(username);
    if (!USERNAME_RE.test(name)) {
      toast.error("Pick a username with 3 to 20 letters, numbers or underscores");
      return;
    }
    if (isReservedUsername(name)) {
      toast.error("That name belongs to Fragments — pick another one");
      return;
    }
    setBusy(true);
    try {
      // No theme is picked here: the wall is born in a random theme,
      // and the welcome prompt right after points at the Themes tab.
      const created = await createProfile({
        username: name,
        display_name: displayName.trim() || name,
        auth_user_id: userId,
      });
      if (isThemeName(created.theme)) setTheme(created.theme);
      localStorage.removeItem(PENDING_PROFILE_KEY);
      toast.success("Your wall is live");
      onClaimed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not claim that name");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass w-full max-w-sm rounded-4xl p-8">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl">Claim your wall</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One last step. Choose the name your link will carry.
          </p>
        </div>
        <form onSubmit={claim} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claim-username">Username</Label>
            <Input
              id="claim-username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              className="bg-background/70"
            />
            <p className="text-xs text-muted-foreground">
              {state === "checking" && "Checking…"}
              {state === "ok" && `Your link will be /${normalizeUsername(username)}`}
              {state === "taken" && "That username is taken."}
              {state === "reserved" && "That name belongs to Fragments — pick another one."}
              {state === "invalid" && "3 to 20 characters: small letters, numbers, underscores."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="claim-display">Display name</Label>
            <Input
              id="claim-display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your wall greets people"
              className="bg-background/70"
            />
          </div>
          <Button type="submit" disabled={busy || state === "taken" || state === "reserved"} className="w-full rounded-full">
            {busy ? "Please wait…" : "Open my wall"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function SealedRow({ entry }: { entry: SealedEntry }) {
  const opens = new Date(entry.reveal_date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="glass flex items-center gap-4 rounded-3xl p-5">
      <Lock className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-medium">Sealed until {opens}</p>
        <p className="text-sm text-muted-foreground">
          from {entry.name?.trim() ? entry.name : "Anonymous"}. Even you cannot
          read it early. It opens itself on the day.
        </p>
      </div>
    </div>
  );
}

function PlatformSection() {
  const queryClient = useQueryClient();
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: fetchAllProfiles,
  });
  const { data: reports = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });
  const byId = new Map(profiles.map((p) => [p.id, p]));

  async function toggleSuspend(p: Profile) {
    try {
      await updateProfile(p.id, { suspended: !p.suspended });
      toast.success(p.suspended ? `@${p.username} restored` : `@${p.username} suspended`);
      queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
    } catch {
      toast.error("Could not update that wall");
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-serif text-3xl">Reports</h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No reports. Quiet platform.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="glass rounded-3xl p-5">
                <p className="font-medium">
                  Wall: @{byId.get(r.profile_id)?.username ?? "unknown"}
                </p>
                <p className="mt-1 text-sm text-foreground/80">
                  {r.reason?.trim() ? r.reason : "No reason given."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="font-serif text-3xl">All walls</h2>
        <div className="mt-4 space-y-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5"
            >
              <div>
                <p className="font-medium">
                  @{p.username}
                  {p.is_platform_admin && " · platform owner"}
                  {p.suspended && " · suspended"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {p.display_name} · joined {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
              {!p.is_platform_admin && (
                <Button
                  size="sm"
                  variant={p.suspended ? "secondary" : "destructive"}
                  onClick={() => toggleSuspend(p)}
                  className="rounded-full"
                >
                  {p.suspended ? "Unsuspend" : "Suspend"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GatePage() {
  const navigate = useNavigate();
  const { session, user, profile, loading, refreshProfile, signOut } = useSession();
  const { setTheme } = useTheme();
  const [tab, setTab] = useState<"home" | "inbox" | "themes" | "profile" | "platform">("home");
  const [inboxTab, setInboxTab] = useState<"fragments" | "questions" | "memory">("fragments");
  const [createOpen, setCreateOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [socialDraft, setSocialDraft] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<WallSections>({});
  const [qotd, setQotd] = useState("");
  const [wallOpen, setWallOpen] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [memoryFilter, setMemoryFilter] = useState<"all" | "favourites" | string>("all");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  // The gate wears the owner's saved look. The theme itself is
  // changed from the wall's palette button or the Themes tab here.
  const savedTheme = isThemeName(profile?.theme) ? profile.theme : "moonlight";
  const gateDecorations =
    parseThemeOverrides(profile?.theme_overrides)?.decorations ??
    themeDef(savedTheme)?.decorations ??
    [];

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? "");
      const links = parseSocialLinks(profile.social_links);
      const draft: Record<string, string> = {};
      for (const l of links) draft[l.platform] = l.url;
      setSocialDraft(draft);
      setSections(profile.sections ?? {});
      setQotd(profile.qotd ?? "");
      setWallOpen(profile.wall_open);
      setEmailNotifications(profile.email_notifications ?? true);
      setCustomPrompt(profile.custom_prompt ?? "");
    }
  }, [profile]);

  // The gate wears the owner's saved theme, so it looks like the wall
  // it manages.
  useEffect(() => {
    if (!profile) return;
    const custom =
      savedTheme === CUSTOM_THEME_NAME
        ? (parseCustomTheme(profile.custom_theme) ?? DEFAULT_CUSTOM_THEME)
        : undefined;
    const overrides = parseThemeOverrides(profile.theme_overrides);
    setTheme(savedTheme, custom, overrides);
    // The document gets the theme directly too: the context state can
    // sit on a stale theme from an earlier visit, and the gate kept
    // loading dark while the saved theme said otherwise.
    applyThemeToDocument(savedTheme, custom, overrides);
  }, [profile, savedTheme, setTheme]);

  // First visit after the wall is born: prompt the owner to make it
  // theirs — a theme, a bio, a question of the day. Dismissed once
  // (any button), it never comes back on this browser.
  useEffect(() => {
    if (!profile) return;
    try {
      if (!localStorage.getItem("fragments-welcome-seen")) setWelcomeOpen(true);
    } catch {
      setWelcomeOpen(true);
    }
  }, [profile]);

  function dismissWelcome() {
    try {
      localStorage.setItem("fragments-welcome-seen", "1");
    } catch {
      /* storage is a convenience, never a blocker */
    }
    setWelcomeOpen(false);
  }

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
  const { data: polls = [], refetch: refetchPolls } = useQuery({
    queryKey: ["polls", profileId],
    queryFn: () => fetchPolls(profileId!).catch(() => [] as Poll[]),
    enabled: !!profileId,
  });
  const { data: capsules = [], refetch: refetchCapsules } = useQuery({
    queryKey: ["capsules", profileId],
    queryFn: () => fetchCapsules(profileId!).catch(() => [] as Capsule[]),
    enabled: !!profileId,
  });
  const { data: letters = [], refetch: refetchLetters } = useQuery({
    queryKey: ["letters", profileId],
    queryFn: () => fetchLetters(profileId!).catch(() => [] as Letter[]),
    enabled: !!profileId,
  });
  const { data: collections = [], refetch: refetchCollections } = useQuery({
    queryKey: ["collections", profileId],
    queryFn: () => fetchCollections(profileId!).catch(() => [] as Collection[]),
    enabled: !!profileId,
  });
  const entryIds = entries.map((e) => e.id);
  const { data: reactionsMap = new Map<string, ReactionCounts>(), refetch: refetchReactions } = useQuery({
    queryKey: ["reactions", profileId, entryIds.join(",")],
    queryFn: () => fetchReactions(entryIds, getVisitorId()).catch(() => new Map()),
    enabled: !!profileId && entryIds.length > 0,
  });
  const { data: repliesMap = new Map<string, string>(), refetch: refetchReplies } = useQuery({
    queryKey: ["replies", profileId, entryIds.join(",")],
    queryFn: () => fetchReplies(entryIds).catch(() => new Map()),
    enabled: !!profileId && entryIds.length > 0,
  });
  const { data: memoryEntryIds = [] } = useQuery({
    queryKey: ["collection-items", memoryFilter],
    queryFn: () =>
      memoryFilter !== "all" && memoryFilter !== "favourites"
        ? fetchCollectionEntryIds(memoryFilter).catch(() => [] as string[])
        : Promise.resolve([] as string[]),
    enabled: memoryFilter !== "all" && memoryFilter !== "favourites",
  });
  const { data: allCollectionItems = new Map<string, string[]>(), refetch: refetchAllCollectionItems } = useQuery({
    queryKey: ["all-collection-items", profileId],
    queryFn: () => fetchAllCollectionItems(profileId!).catch(() => new Map()),
    enabled: !!profileId,
  });

  function collectionsContaining(entryId: string): string[] {
    const out: string[] = [];
    for (const [collectionId, ids] of allCollectionItems) {
      if (ids.includes(entryId)) out.push(collectionId);
    }
    return out;
  }

  function refreshAll() {
    refreshProfile(session);
    refetch();
    refetchQuestions();
    refetchPolls();
    refetchCapsules();
    refetchLetters();
    refetchCollections();
    refetchReactions();
    refetchReplies();
  }

  useEffect(() => {
    if (!profileId) return;
    const unsubEntries = subscribeToEntries(() => refetch(), profileId);
    const unsubQuestions = subscribeToQuestions(() => refetchQuestions(), profileId);
    return () => {
      unsubEntries();
      unsubQuestions();
    };
  }, [profileId, refetch, refetchQuestions]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  if (!user) return null;
  if (!profile) {
    return <ClaimWallForm userId={user.id} onClaimed={() => refreshProfile(session)} />;
  }

  const wallUrl = `${window.location.origin}/${profile.username}`;
  const ownerName = profile.display_name.trim() || profile.username;
  const unanswered = questions.filter((q) => !q.answer).length;
  const activePoll = polls.find((p) => !p.closed && (!p.expires_at || new Date(p.expires_at) > new Date())) ?? null;

  async function saveSettings() {
    const links: SocialLink[] = [];
    for (const [platform, url] of Object.entries(socialDraft)) {
      if (!url.trim()) continue;
      const clean = validateSocialUrl(platform as SocialLink["platform"], url);
      if (!clean) {
        toast.error(`That ${platform} entry does not look right — type just your username, or a full link to ${platform}`);
        return;
      }
      links.push({ platform: platform as SocialLink["platform"], url: clean });
    }
    setSaving(true);
    try {
      await updateProfile(profile!.id, {
        display_name: displayName.trim() || profile!.username,
        bio: bio.trim() || null,
        social_links: links,
        sections,
        qotd: qotd.trim() || null,
        wall_open: wallOpen,
        email_notifications: emailNotifications,
        custom_prompt: customPrompt.trim() || null,
      });
      toast.success("Settings saved");
      refreshProfile(session);
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(wallUrl);
      toast.success("Your link is copied");
    } catch {
      toast.error("Copy failed, long-press the link instead");
    }
  }

  async function toggleFeatured(entryId: string) {
    try {
      await updateProfile(profile!.id, {
        featured_entry_id: profile!.featured_entry_id === entryId ? null : entryId,
      });
      toast.success(profile!.featured_entry_id === entryId ? "Featured fragment removed" : "Fragment featured on your wall");
      refreshProfile(session);
    } catch {
      toast.error("Could not change the featured fragment");
    }
  }

  async function closeActivePoll() {
    if (!activePoll) return;
    try {
      await closePoll(activePoll.id);
      toast.success("Poll closed — the results stay on your wall");
      refetchPolls();
    } catch {
      toast.error("Could not close the poll");
    }
  }

  async function createCollectionSubmit() {
    try {
      await createCollection(profile!.id, newCollectionName);
      toast.success("Collection created");
      setNewCollectionName("");
      refetchCollections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the collection");
    }
  }

  async function toggleCollectionMembership(collectionId: string, entryId: string, inIt: boolean) {
    try {
      if (inIt) await removeFromCollection(collectionId, entryId);
      else await addToCollection(collectionId, entryId);
      toast.success(inIt ? "Removed from the collection" : "Filed into the collection");
      refetchAllCollectionItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change that");
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  type Moment = { date: Date; label: string; detail: string };
  const moments: Moment[] = [
    ...sealed.map((s) => ({
      date: new Date(s.reveal_date),
      label: "A sealed fragment",
      detail: `Opens ${new Date(s.reveal_date).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`,
    })),
    ...capsules.map((c) => ({
      date: new Date(c.reveal_date),
      label: c.title,
      detail: `Capsule opens ${new Date(c.reveal_date).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`,
    })),
    ...(activePoll && activePoll.expires_at
      ? [
          {
            date: new Date(activePoll.expires_at),
            label: "Your poll",
            detail: `Closes ${new Date(activePoll.expires_at).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`,
          },
        ]
      : []),
    ...(letters.map((l) => ({
      date: new Date(l.deliver_date),
      label: "Dear Future Me",
      detail: `Arrives ${new Date(l.deliver_date).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`,
    }))),
  ]
    .filter((m) => m.date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  const memoryEntries = entries.filter((e) => {
    const q = search.trim().toLowerCase();
    if (q && !e.message.toLowerCase().includes(q) && !(e.name ?? "").toLowerCase().includes(q)) return false;
    if (memoryFilter === "favourites" && !e.is_favorite) return false;
    if (memoryFilter !== "all" && memoryFilter !== "favourites" && !memoryEntryIds.includes(e.id)) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <WallDecorations decorations={gateDecorations} />
      <div className="relative">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-6">
        <Link to="/" className="font-serif text-xl tracking-tight">
          Fragments
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/$username"
            params={{ username: profile.username }}
            className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card/70"
          >
            View my wall
          </Link>
          {profile.is_platform_admin && (
            <button
              onClick={() => setTab("platform")}
              className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card/70"
            >
              Platform
            </button>
          )}
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card/70"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 pb-32">
        {tab === "home" && (
          <div className="space-y-8">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl">
                {greeting}. <span className="text-gradient">{ownerName}</span>
              </h1>
              <p className="mt-2 text-muted-foreground">Your little corner is waiting.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="glass rounded-3xl p-5 text-center">
                <p className="font-serif text-3xl">{entries.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Fragments received</p>
              </div>
              <div className="glass rounded-3xl p-5 text-center">
                <p className="font-serif text-3xl">{sealed.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Sealed messages</p>
              </div>
              <div className="glass rounded-3xl p-5 text-center">
                <p className="font-serif text-3xl">{unanswered}</p>
                <p className="mt-1 text-xs text-muted-foreground">Questions waiting</p>
              </div>
              <div className="glass rounded-3xl p-5 text-center">
                <p className="font-serif text-3xl">{capsules.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Time capsules</p>
              </div>
            </div>

            <div className="glass rounded-4xl p-6 sm:p-8">
              <p className="text-sm font-medium">Your wall</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">{wallUrl}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={copyLink} className="rounded-full">
                  <Copy className="mr-2 h-4 w-4" /> Share wall
                </Button>
                <Link
                  to="/$username"
                  params={{ username: profile.username }}
                  className="inline-flex items-center rounded-full border border-border bg-card/40 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-card/70"
                >
                  Preview
                </Link>
              </div>
            </div>

            {activePoll && (
              <div className="glass rounded-4xl p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
                  <p className="text-sm font-medium">Your live poll</p>
                </div>
                <p className="mt-2 font-serif text-2xl leading-snug">{activePoll.question}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={closeActivePoll} className="rounded-full">
                    Close the poll
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setTab("inbox")}
                    className="rounded-full"
                  >
                    See it on your wall
                  </Button>
                </div>
              </div>
            )}

            {letters.length > 0 && (
              <div className="glass rounded-4xl p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" aria-hidden />
                  <p className="text-sm font-medium">Dear Future Me</p>
                </div>
                <div className="mt-3 space-y-3">
                  {letters.map((l) => {
                    const due = new Date(l.deliver_date) <= new Date();
                    return (
                      <div key={l.id} className="rounded-3xl border border-border bg-background/40 p-4">
                        {due ? (
                          <>
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{l.letter}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Arrived {new Date(l.deliver_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · kept private unless you share it
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            A letter, sealed until {new Date(l.deliver_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Your upcoming moments</h2>
              </div>
              {moments.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing sealed for the future yet. Create a capsule or a
                  sealed fragment and it will wait here.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {moments.map((m, i) => (
                    <div key={i} className="glass flex items-center gap-4 rounded-3xl p-5">
                      <Hourglass className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <div>
                        <p className="font-medium">{m.label}</p>
                        <p className="text-sm text-muted-foreground">{m.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "inbox" && (
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="glass flex flex-wrap justify-center gap-1 rounded-4xl p-1">
                {(
                  [
                    ["fragments", `Fragments (${entries.length + sealed.length})`],
                    ["questions", `Questions (${unanswered} waiting)`],
                    ["memory", "Memory Box"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setInboxTab(key)}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                      inboxTab === key ? "bg-primary text-primary-foreground" : "text-foreground/70"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {inboxTab === "fragments" && (
              <>
                {sealed.length > 0 && (
                  <div className="mx-auto max-w-3xl space-y-3">
                    {sealed.map((s) => (
                      <SealedRow key={s.id} entry={s} />
                    ))}
                  </div>
                )}
                {entries.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Nothing here yet. Share your link and the fragments will come.
                  </p>
                ) : (
                  <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                    {entries.map((entry, i) => (
                      <FragmentCard
                        key={entry.id}
                        entry={entry}
                        index={i}
                        isOwner
                        editMode
                        ownerName={ownerName}
                        reactions={reactionsMap.get(entry.id)}
                        reply={repliesMap.get(entry.id) ?? null}
                        onReacted={() => {
                          refetchReactions();
                          refetchReplies();
                        }}
                        featured={profile.featured_entry_id === entry.id}
                        onFeature={() => toggleFeatured(entry.id)}
                        collections={collections}
                        inCollections={collectionsContaining(entry.id)}
                        onCollectionToggle={(collectionId, inIt) => toggleCollectionMembership(collectionId, entry.id, inIt)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {inboxTab === "questions" && (
              <QASection
                questions={questions}
                isOwner
                ownerName={ownerName}
                editMode
                wallUsername={profile.username}
                wallTheme={profile.theme}
                customTheme={parseCustomTheme(profile.custom_theme)}
              />
            )}

            {inboxTab === "memory" && (
              <div className="space-y-6">
                <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your fragments…"
                    className="bg-background/70"
                  />
                  <select
                    value={memoryFilter}
                    onChange={(e) => setMemoryFilter(e.target.value as typeof memoryFilter)}
                    aria-label="Filter your fragments"
                    className="rounded-full border border-border bg-background/70 px-4 py-2.5 text-sm"
                  >
                    <option value="all">All fragments</option>
                    <option value="favourites">Favourites</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mx-auto flex max-w-2xl gap-2">
                  <Input
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="New collection name…"
                    maxLength={40}
                    className="bg-background/70"
                  />
                  <Button
                    onClick={createCollectionSubmit}
                    disabled={!newCollectionName.trim()}
                    className="shrink-0 rounded-full"
                  >
                    Create
                  </Button>
                </div>
                {collections.length > 0 && memoryFilter !== "all" && memoryFilter !== "favourites" && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await deleteCollection(memoryFilter);
                          toast.success("Collection deleted");
                          setMemoryFilter("all");
                          refetchCollections();
                        } catch {
                          toast.error("Could not delete the collection");
                        }
                      }}
                      className="rounded-full text-destructive"
                    >
                      Delete this collection
                    </Button>
                  </div>
                )}
                {memoryEntries.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Nothing saved here yet. Keep a fragment with the star, or
                    file one into a collection, and it will wait here.
                  </p>
                ) : (
                  <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                    {memoryEntries.map((entry, i) => (
                      <FragmentCard
                        key={entry.id}
                        entry={entry}
                        index={i}
                        isOwner
                        editMode
                        ownerName={ownerName}
                        reactions={reactionsMap.get(entry.id)}
                        reply={repliesMap.get(entry.id) ?? null}
                        onReacted={() => {
                          refetchReactions();
                          refetchReplies();
                        }}
                        featured={profile.featured_entry_id === entry.id}
                        onFeature={() => toggleFeatured(entry.id)}
                        collections={collections}
                        inCollections={collectionsContaining(entry.id)}
                        onCollectionToggle={(collectionId, inIt) => toggleCollectionMembership(collectionId, entry.id, inIt)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "themes" && (
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-2 text-center font-serif text-4xl">Make it yours</h1>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              Pick a theme to preview it live — save it below to keep it.
            </p>
            <ThemeEditorPanel profile={profile} onSaved={() => refreshProfile(session)} />
          </div>
        )}

        {tab === "profile" && (
          <div className="glass mx-auto max-w-2xl space-y-6 rounded-4xl p-8">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Display name</Label>
              <Input
                id="settings-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-bio">Your introduction</Label>
              <Textarea
                id="settings-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A little space for thoughts, questions and things left unsaid…"
                rows={3}
                maxLength={200}
                className="bg-background/70"
              />
              <p className="text-xs text-muted-foreground">
                Shown under your wall's name, instead of the usual line.
              </p>
            </div>
            <div className="space-y-3">
              <Label>Find me elsewhere</Label>
              <p className="text-xs text-muted-foreground">
                For most, just your username works — type it alone and the
                link is made for you. Spotify and LinkedIn need your full
                profile link, so paste that in instead. Your website takes
                a link or just your domain. Anything that does not match
                is left out.
              </p>
              {SOCIAL_PLATFORMS.map((p) => (
                <div key={p.platform} className="flex items-center gap-3">
                  <Label htmlFor={`social-${p.platform}`} className="w-20 shrink-0 text-sm">
                    {p.label}
                  </Label>
                  <Input
                    id={`social-${p.platform}`}
                    value={socialDraft[p.platform] ?? ""}
                    onChange={(e) => setSocialDraft({ ...socialDraft, [p.platform]: e.target.value })}
                    placeholder={p.placeholder}
                    className="bg-background/70"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Label>Wall sections</Label>
              <p className="text-xs text-muted-foreground">
                Choose which parts of your wall visitors see.
              </p>
              {(
                [
                  ["poll", "Poll"],
                  ["guestbook", "Guestbook"],
                  ["qa", "Question box"],
                  ["social", "Social links"],
                  ["sealed", "Sealed fragments"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label htmlFor={`section-${key}`}>{label}</Label>
                  <Switch
                    id={`section-${key}`}
                    checked={showSection(sections, key)}
                    onCheckedChange={(v) => setSections({ ...sections, [key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-qotd">Question of the day</Label>
              <Input
                id="settings-qotd"
                value={qotd}
                onChange={(e) => setQotd(e.target.value)}
                placeholder="What's one thing that made today worth it?"
                maxLength={200}
                className="bg-background/70"
              />
              <p className="text-xs text-muted-foreground">
                An optional daily prompt on your wall, for visitors to answer
                as fragments. Leave it blank to hide it.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-prompt">Your wall's prompt</Label>
              <Textarea
                id="settings-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Tell me something you've never told anyone…"
                rows={3}
                maxLength={140}
                className="bg-background/70"
              />
              <p className="text-xs text-muted-foreground">
                This shows above the fragment form instead of the usual line.
                Leave it blank to keep the usual line.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="wall-open">Wall open</Label>
                <p className="text-xs text-muted-foreground">
                  When closed, nobody can leave new fragments or questions.
                </p>
              </div>
              <Switch id="wall-open" checked={wallOpen} onCheckedChange={setWallOpen} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="email-notifications">Email notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get an email when someone leaves a fragment or asks a
                  question
                  {user?.email ? ` — sent to ${user.email}` : ""}.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Heads up: these emails aren't sending yet — email is still
                  being set up. Your fragments still arrive here instantly.
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Button onClick={saveSettings} disabled={saving} className="w-full rounded-full">
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        )}

        {tab === "platform" && profile.is_platform_admin && <PlatformSection />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {(
            [
              ["home", "Home", Home],
              ["inbox", "Inbox", Inbox],
              ["create", "Create", Plus],
              ["themes", "Themes", Palette],
              ["profile", "Profile", User],
            ] as const
          ).map(([key, label, Icon]) => {
            const active = tab === key || (key === "create" && createOpen);
            if (key === "create") {
              return (
                <button
                  key={key}
                  onClick={() => setCreateOpen(true)}
                  aria-label="Create something"
                  className="flex flex-col items-center gap-1 py-3 text-primary"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => setTab(key as "home" | "inbox" | "themes" | "profile")}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <CreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        profile={profile}
        onCreated={refreshAll}
      />

      <Dialog
        open={welcomeOpen}
        onOpenChange={(v) => {
          if (!v) dismissWelcome();
        }}
      >
        <DialogContent className="glass max-h-[85vh] overflow-y-auto border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Your wall is live — make it yours
            </DialogTitle>
            <DialogDescription>
              Your wall was born in a random theme. Take a minute to make
              it yours: pick a theme you love, add a bio, set your
              question of the day.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                dismissWelcome();
                setTab("themes");
              }}
              className="w-full rounded-full"
            >
              Choose my theme
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                dismissWelcome();
                setTab("profile");
              }}
              className="w-full rounded-full"
            >
              Add my bio
            </Button>
            <Button
              variant="ghost"
              onClick={dismissWelcome}
              className="w-full rounded-full"
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
