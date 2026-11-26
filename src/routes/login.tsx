import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Fragments" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const value = login.trim();
      if (value.includes("@")) {
        // Email sign-in goes straight to Supabase, as before.
        const { error } = await supabase.auth.signInWithPassword({
          email: value,
          password,
        });
        if (error) throw error;
      } else {
        // A wall name: the server finds the account's email and signs
        // in with it, so the email never reaches the browser.
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: value, password }),
        });
        const data = (await res.json()) as {
          error?: string;
          access_token?: string;
          refresh_token?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Sign in failed");
        if (!data.access_token || !data.refresh_token) {
          throw new Error("Sign in failed");
        }
        const { error } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (error) throw error;
      }
      navigate({ to: "/gate" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (error) throw error;
      toast.success("Check your email for the reset link");
      setForgot(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the reset email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm rounded-4xl p-8">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to open your gate: your fragments, your questions, your wall.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login">Email or wall name</Label>
            <Input
              id="login"
              type="text"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="you@example.com or yourname"
              className="bg-background/70"
              autoComplete="username"
            />
            <p className="text-xs text-muted-foreground">
              Your wall name works too, for example angelic.
            </p>
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
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full">
            {busy ? "Please wait…" : "Sign in"}
          </Button>
        </form>
        {forgot ? (
          <form onSubmit={handleForgot} className="mt-4 space-y-2">
            <Label htmlFor="reset-email">Email for the reset link</Label>
            <Input
              id="reset-email"
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-background/70"
              autoComplete="email"
            />
            <Button
              type="submit"
              disabled={busy}
              variant="outline"
              className="w-full rounded-full"
            >
              {busy ? "Please wait…" : "Send reset link"}
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setForgot(true)}
            className="mt-4 block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Forgot your password?
          </button>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="underline-offset-4 hover:underline">
            Claim your link
          </Link>
        </p>
      </div>
    </div>
  );
}
