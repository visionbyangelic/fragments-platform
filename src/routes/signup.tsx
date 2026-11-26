import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isReservedUsername,
  isUsernameAvailable,
  normalizeUsername,
  USERNAME_RE,
} from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemePicker } from "@/components/ThemePicker";
import { useTheme, type ThemeName } from "@/context/ThemeContext";
import { CUSTOM_THEME_NAME } from "@/lib/themes";
import { DEFAULT_CUSTOM_THEME } from "@/lib/custom-theme";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Claim your link · Fragments" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

export const PENDING_PROFILE_KEY = "fragments-pending-profile";

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [themeChoice, setThemeChoice] = useState<ThemeName>("dusk");
  const { setTheme } = useTheme();
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "ok" | "taken" | "invalid" | "reserved">("idle");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    const name = normalizeUsername(username);
    if (!name) {
      setUsernameState("idle");
      return;
    }
    if (!USERNAME_RE.test(name)) {
      setUsernameState("invalid");
      return;
    }
    if (isReservedUsername(name)) {
      setUsernameState("reserved");
      return;
    }
    setUsernameState("checking");
    const t = setTimeout(async () => {
      try {
        setUsernameState((await isUsernameAvailable(name)) ? "ok" : "taken");
      } catch {
        setUsernameState("idle");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [username]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeUsername(username);
    if (!USERNAME_RE.test(name)) {
      toast.error("Pick a username with 3 to 20 letters, numbers or underscores");
      return;
    }
    if (usernameState === "taken") {
      toast.error("That username is taken");
      return;
    }
    if (usernameState === "reserved") {
      toast.error("That name belongs to Fragments — pick another one");
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          username: name,
          display_name: displayName.trim() || name,
          theme: themeChoice,
          custom_theme:
            themeChoice === CUSTOM_THEME_NAME ? DEFAULT_CUSTOM_THEME : null,
        }),
      );
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/gate` },
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Account created. One last step: claim your wall");
        navigate({ to: "/gate" });
      } else {
        setConfirmSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  if (confirmSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm rounded-4xl p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to {email}. Open it, then sign in and
            your wall @{normalizeUsername(username)} will be waiting to claim.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass w-full max-w-sm rounded-4xl p-8">
        <div className="mb-6 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl">Claim your link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your wall, your rules. Set up in under a minute.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              className="bg-background/70"
              autoComplete="username"
            />
            <p className="text-xs text-muted-foreground">
              {usernameState === "checking" && "Checking…"}
              {usernameState === "ok" && `Your link will be /${normalizeUsername(username)}`}
              {usernameState === "taken" && "That username is taken."}
              {usernameState === "reserved" && "That name belongs to Fragments — pick another one."}
              {usernameState === "invalid" &&
                "3 to 20 characters: small letters, numbers, underscores."}
              {usernameState === "idle" && "This becomes your link and your wall's name."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your wall greets people"
              className="bg-background/70"
            />
          </div>
          <div className="space-y-2">
            <Label>Your wall's theme</Label>
            <ThemePicker
              value={themeChoice}
              onChange={(t) => {
                setThemeChoice(t);
                setTheme(t, t === CUSTOM_THEME_NAME ? DEFAULT_CUSTOM_THEME : undefined);
              }}
              customTheme={DEFAULT_CUSTOM_THEME}
            />
            <p className="text-xs text-muted-foreground">
              Tap one and this page shows it live. Your wall is born in the
              theme you pick, and you can change it anytime in your gate.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/70"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/70"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full">
            {busy ? "Please wait…" : "Create my wall"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have a wall?{" "}
          <Link to="/login" className="underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
