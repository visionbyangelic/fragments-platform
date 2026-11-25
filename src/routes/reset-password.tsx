import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

// /reset-password — the landing page for the reset link emailed from
// the sign-in page ("Forgot your password?"). Supabase puts the
// recovery session in the URL hash; the client picks it up on load,
// and once the session is there the owner sets a new password.
export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password · Fragments" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"checking" | "ok" | "expired">("checking");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setReady(data.session ? "ok" : "expired");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady("ok");
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password changed. Welcome back.");
      navigate({ to: "/gate" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm rounded-4xl p-8 text-center">
        <KeyRound className="mx-auto mb-3 h-8 w-8 text-primary" />
        <h1 className="font-serif text-3xl">Set a new password</h1>
        {ready === "checking" && (
          <p className="mt-2 text-sm text-muted-foreground">Checking your reset link…</p>
        )}
        {ready === "expired" && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              This reset link has expired or was already used. Ask for a new
              one from the sign-in page.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground transition hover:opacity-90"
            >
              Back to sign in
            </Link>
          </>
        )}
        {ready === "ok" && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/60"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? "Please wait…" : "Change password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
