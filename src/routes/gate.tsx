import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import {
  createProfile,
  fetchAllProfiles,
  fetchReports,
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
import { FragmentCard } from "@/components/FragmentCard";
import { QASection } from "@/components/QASection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme, type ThemeName } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PENDING_PROFILE_KEY } from "./signup";
import { ThemePicker } from "@/components/ThemePicker";
import { ThemeEditor } from "@/components/ThemeEditor";
import { WallDecorations } from "@/components/WallDecorations";
import { CUSTOM_THEME_NAME, isLegacyTheme, isThemeName, themeDef } from "@/lib/themes";
import {
  DEFAULT_CUSTOM_THEME,
  parseCustomTheme,
  type CustomTheme,
} from "@/lib/custom-theme";
import { parseThemeOverrides, type ThemeOverrides } from "@/lib/theme-overrides";
import { toast } from "sonner";
import { Copy, Lock, ShieldCheck } from "lucide-react";

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
  const [theme, setThemeChoice] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_PROFILE_KEY) ?? "{}").theme ?? "dusk";
    } catch {
      return "dusk";
    }
  });
  // A custom pick from signup travels with the pending profile; the
  // starter colours are what the Custom tile previews with.
  const pendingCustomTheme = (() => {
    try {
      return (
        parseCustomTheme(
          JSON.parse(localStorage.getItem(PENDING_PROFILE_KEY) ?? "{}").custom_theme,
        ) ?? DEFAULT_CUSTOM_THEME
      );
    } catch {
      return DEFAULT_CUSTOM_THEME;
    }
  })();
  const [state, setState] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const name = normalizeUsername(username);
    if (!name) return setState("idle");
    if (!USERNAME_RE.test(name)) return setState("invalid");
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
    setBusy(true);
    try {
      await createProfile({
        username: name,
        display_name: displayName.trim() || name,
        auth_user_id: userId,
        theme,
        custom_theme: theme === CUSTOM_THEME_NAME ? pendingCustomTheme : null,
      });
      setTheme(theme, theme === CUSTOM_THEME_NAME ? pendingCustomTheme : undefined);
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
          <div className="space-y-2">
            <Label>Your wall's theme</Label>
            <ThemePicker
              value={isThemeName(theme) ? theme : "dusk"}
              onChange={(t) => {
                setThemeChoice(t);
                setTheme(t, t === CUSTOM_THEME_NAME ? pendingCustomTheme : undefined);
              }}
              customTheme={pendingCustomTheme}
              legacy
            />
          </div>
          <Button type="submit" disabled={busy || state === "taken"} className="w-full rounded-full">
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
  const queryClient = useQueryClient();
  const { session, user, profile, loading, refreshProfile, signOut } = useSession();
  const { setTheme } = useTheme();
  const [tab, setTab] = useState<"fragments" | "questions" | "settings" | "platform">("fragments");
  const [displayName, setDisplayName] = useState("");
  const [wallOpen, setWallOpen] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  // The theme draft: what the settings tab previews. Nothing here is
  // saved until "Save theme" is pressed; Cancel returns to the saved
  // look, Reset clears the editor's overrides back to the theme's own
  // defaults. The new twelve themes are trialled on the owner's wall
  // only: every other account sees the old picker, and the
  // customisation editor is hidden from them too.
  const showNewThemes = profile?.is_platform_admin ?? false;
  const [draftTheme, setDraftTheme] = useState<ThemeName>("moonlight");
  const [draftCustom, setDraftCustom] = useState<CustomTheme>(DEFAULT_CUSTOM_THEME);
  const [draftOverrides, setDraftOverrides] = useState<ThemeOverrides | null>(null);
  const [themeSaving, setThemeSaving] = useState(false);

  // The saved look, for the draft baseline and for leaving the
  // settings tab. Memoised on the JSON so a refetched profile with
  // the same values does not retrigger the preview effect.
  const savedTheme: ThemeName = isThemeName(profile?.theme) ? profile.theme : "moonlight";
  const savedCustom = useMemo(
    () => parseCustomTheme(profile?.custom_theme) ?? DEFAULT_CUSTOM_THEME,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(profile?.custom_theme ?? null)],
  );
  const savedOverrides = useMemo(
    () => parseThemeOverrides(profile?.theme_overrides),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(profile?.theme_overrides ?? null)],
  );
  const themeDirty =
    draftTheme !== savedTheme ||
    JSON.stringify(draftCustom) !== JSON.stringify(savedCustom) ||
    JSON.stringify(draftOverrides) !== JSON.stringify(savedOverrides);

  // The decorations the gate shows: the draft's while customising,
  // the saved look everywhere else.
  const gateDecorations =
    tab === "settings"
      ? (draftOverrides?.decorations ?? themeDef(draftTheme)?.decorations ?? [])
      : (savedOverrides?.decorations ?? themeDef(savedTheme)?.decorations ?? []);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setWallOpen(profile.wall_open);
      setEmailNotifications(profile.email_notifications ?? true);
      setCustomPrompt(profile.custom_prompt ?? "");
      setDraftTheme(isThemeName(profile.theme) ? profile.theme : "moonlight");
      setDraftCustom(parseCustomTheme(profile.custom_theme) ?? DEFAULT_CUSTOM_THEME);
      setDraftOverrides(parseThemeOverrides(profile.theme_overrides));
    }
  }, [profile]);

  // Live preview: on the settings tab the draft repaints the whole
  // gate as it changes. Anywhere else the gate wears the saved look.
  useEffect(() => {
    if (!profile) return;
    if (tab === "settings") {
      setTheme(
        draftTheme,
        draftTheme === CUSTOM_THEME_NAME ? draftCustom : undefined,
        draftOverrides,
      );
    } else {
      setTheme(
        savedTheme,
        savedTheme === CUSTOM_THEME_NAME ? savedCustom : undefined,
        savedOverrides,
      );
    }
  }, [tab, draftTheme, draftCustom, draftOverrides, profile, savedTheme, savedCustom, savedOverrides, setTheme]);

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

  // The theme has its own save (below): picking a theme only previews
  // it, so a cancelled draft never leaks into the saved settings.
  async function saveSettings() {
    setSaving(true);
    try {
      await updateProfile(profile!.id, {
        display_name: displayName.trim() || profile!.username,
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

  async function saveTheme() {
    setThemeSaving(true);
    try {
      await updateProfile(profile!.id, {
        theme: draftTheme,
        custom_theme: draftTheme === CUSTOM_THEME_NAME ? draftCustom : null,
        theme_overrides: draftOverrides,
      });
      toast.success("Your wall's new look is saved");
      refreshProfile(session);
      queryClient.invalidateQueries({ queryKey: ["profile", profile!.username] });
    } catch {
      toast.error("Could not save your theme");
    } finally {
      setThemeSaving(false);
    }
  }

  function cancelTheme() {
    setDraftTheme(savedTheme);
    setDraftCustom(savedCustom);
    setDraftOverrides(savedOverrides);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(wallUrl);
      toast.success("Your link is copied");
    } catch {
      toast.error("Copy failed, long-press the link instead");
    }
  }

  const tabs = [
    { key: "fragments", label: `Fragments (${entries.length + sealed.length})` },
    { key: "questions", label: `Questions (${unanswered} waiting)` },
    { key: "settings", label: "Settings" },
    ...(profile.is_platform_admin ? [{ key: "platform", label: "Platform" }] : []),
  ] as const;

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
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card/70"
          >
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            Your gate
          </p>
          <h1 className="mt-3 font-serif text-5xl text-gradient sm:text-6xl">
            Everything left for you
          </h1>
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2">
            <Input value={wallUrl} readOnly className="bg-background/70 text-center" />
            <Button onClick={copyLink} className="shrink-0 rounded-full">
              <Copy className="mr-2 h-4 w-4" /> Copy link
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Share this link anywhere. Only you can open this gate.
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="glass flex flex-wrap justify-center gap-1 rounded-4xl p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  tab === t.key ? "bg-primary text-primary-foreground" : "text-foreground/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "fragments" && (
          <>
            {sealed.length > 0 && (
              <div className="mx-auto mb-10 max-w-3xl space-y-3">
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
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "questions" && (
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

        {tab === "settings" && (
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
              <Label>Customize my wall</Label>
              <ThemePicker
                value={draftTheme}
                onChange={setDraftTheme}
                customTheme={draftCustom}
                legacy={!showNewThemes}
              />
              {showNewThemes && isLegacyTheme(draftTheme) && (
                <p className="text-xs text-muted-foreground">
                  Your wall is still on an earlier theme. Pick one of the new
                  themes above to try it — nothing changes on your live wall
                  until you save.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Pick a theme to preview it live — the whole gate repaints as
                you browse. Save it below to keep it, or cancel to go back
                to your saved look.
              </p>
            </div>
            {draftTheme === CUSTOM_THEME_NAME && (
              <div className="space-y-3 rounded-3xl border border-border bg-background/40 p-4">
                <p className="text-sm font-medium">Your colours</p>
                <p className="text-xs text-muted-foreground">
                  Pick three colours and the whole wall follows them. The
                  preview changes as you pick.
                </p>
                {(
                  [
                    ["bg", "Background", "The page behind everything"],
                    ["accent", "Accent", "Buttons, links and highlights"],
                    ["ink", "Text", "The writing on the wall"],
                  ] as const
                ).map(([key, label, blurb]) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={draftCustom[key]}
                      onChange={(e) =>
                        setDraftCustom({ ...draftCustom, [key]: e.target.value })
                      }
                      aria-label={label}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-1"
                    />
                    <div className="min-w-0">
                      <Label className="text-sm">{label}</Label>
                      <p className="truncate text-xs text-muted-foreground">
                        {blurb} · {draftCustom[key]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showNewThemes && (
              <ThemeEditor
                theme={draftTheme}
                overrides={draftOverrides}
                onChange={setDraftOverrides}
                showColors={draftTheme !== CUSTOM_THEME_NAME}
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={saveTheme}
                disabled={!themeDirty || themeSaving}
                className="flex-1 rounded-full"
              >
                {themeSaving ? "Saving…" : "Save theme"}
              </Button>
              <Button
                variant="secondary"
                onClick={cancelTheme}
                disabled={!themeDirty}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                onClick={() => setDraftOverrides(null)}
                disabled={!draftOverrides}
                className="rounded-full"
              >
                Reset to theme defaults
              </Button>
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
      </div>
    </div>
  );
}
