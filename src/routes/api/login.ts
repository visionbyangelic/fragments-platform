import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// POST /api/login — sign in with a wall name instead of an email.
// The sign-in box sends the name (or an email) and the password; this
// route finds the account's real email server-side, signs in with it,
// and returns the session tokens for the browser to keep.
//
// The email never leaves the server: wall names are public, but the
// address behind one is not, so the lookup has to happen here with
// the service role key, never in the browser. Email sign-ins do not
// come through this route at all — the login page signs those in
// directly, so email login keeps working even before this key exists.
//
// Wall names are public, so guessing passwords against a name is
// easy: after 5 wrong passwords in 15 minutes the name locks for
// 15 minutes (login_attempts table, migration 002). Every failure
// answers the same generic message, so a wrong name and a wrong
// password look identical from outside.
//
// Needs SUPABASE_SERVICE_ROLE_KEY in Vercel. Until it is set the
// route answers 503 and name sign-in waits; email sign-in is
// unaffected.

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const WRONG = { error: "Incorrect name or password" };

export const Route = createFileRoute("/api/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Bad request" }, 400);
        }
        const login = (body as { login?: unknown })?.login;
        const password = (body as { password?: unknown })?.password;
        if (
          typeof login !== "string" ||
          typeof password !== "string" ||
          !login.trim() ||
          password.length < 6
        ) {
          return json({ error: "Bad request" }, 400);
        }
        // This route is only for wall names. Emails sign in directly
        // from the login page and never reach here.
        const name = login.trim().toLowerCase();
        if (!USERNAME_RE.test(name) || name.includes("@")) {
          return json(WRONG, 401);
        }

        let admin: {
          from: (table: string) => any;
          auth: {
            admin: {
              getUserById: (userId: string) => Promise<{
                data: { user: { email?: string } | null };
              }>;
            };
            signInWithPassword: (creds: {
              email: string;
              password: string;
            }) => Promise<{
              data: {
                session: {
                  access_token: string;
                  refresh_token: string;
                } | null;
              };
              error: { message: string } | null;
            }>;
          };
        };
        try {
          const mod = await import("@/integrations/supabase/client.server");
          admin = mod.supabaseAdmin as typeof admin;
          admin.from("profiles");
        } catch {
          return json(
            { error: "Name sign-in is not set up yet. Sign in with your email for now." },
            503,
          );
        }

        const since = new Date(Date.now() - LOCK_MINUTES * 60 * 1000).toISOString();
        const { count: failures } = await admin
          .from("login_attempts")
          .select("id", { count: "exact", head: true })
          .eq("identifier", name)
          .eq("success", false)
          .gte("created_at", since);
        if ((failures ?? 0) >= MAX_FAILURES) {
          return json(
            { error: "Too many wrong tries. Wait a bit and try again." },
            429,
          );
        }

        async function record(success: boolean): Promise<void> {
          try {
            await admin.from("login_attempts").insert({ identifier: name, success });
          } catch {
            /* a lost tally never blocks a sign-in */
          }
        }

        const { data: profile } = await admin
          .from("profiles")
          .select("auth_user_id")
          .eq("username", name)
          .maybeSingle();
        const authUserId = (profile as { auth_user_id?: unknown } | null)?.auth_user_id;
        if (typeof authUserId !== "string" || !authUserId) {
          await record(false);
          return json(WRONG, 401);
        }

        let email: string | undefined;
        try {
          const { data } = await admin.auth.admin.getUserById(authUserId);
          email = data?.user?.email ?? undefined;
        } catch {
          email = undefined;
        }
        if (!email) {
          await record(false);
          return json(WRONG, 401);
        }

        const { data, error } = await admin.auth.signInWithPassword({ email, password });
        if (error || !data.session) {
          await record(false);
          return json(WRONG, 401);
        }
        await record(true);
        return json({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      },
    },
  },
});
