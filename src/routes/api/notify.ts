import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// POST /api/notify — tells a wall owner by email that something new
// landed on their wall. Called by the visitor's browser right after a
// fragment or question is saved, with keepalive so it still goes out
// if they close the tab straight away.
//
// Nothing here trusts the caller: the email only goes to the wall's
// owner (looked up server-side, never from the request), only for a
// row that really exists and was created in the last 10 minutes, only
// if the owner has notifications on, and only once per row — the
// notification_log insert below is the dedupe, and a failed send
// removes it so a retry can still go through.
//
// Sending is via SendGrid (free tier, 100/day). It needs three
// environment variables on the server, all set in Vercel:
//   SENDGRID_API_KEY — a SendGrid key with Mail Send permission
//   NOTIFY_FROM      — the verified single sender, e.g. visionbyangelic@gmail.com
//   SUPABASE_SERVICE_ROLE_KEY — from the Supabase dashboard (API settings)
// Until those are set the route answers 503 and the site works exactly
// as before, just without emails.
//
// A sealed fragment is never quoted in the email: even the owner
// cannot read it before its day, so the email only says one is waiting.

type NotifyKind = "fragment" | "question";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isRecent(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs >= 0 && ageMs <= 10 * 60 * 1000;
}

export const Route = createFileRoute("/api/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Bad request" }, 400);
        }
        const kind = (body as { kind?: unknown })?.kind;
        const id = (body as { id?: unknown })?.id;
        if (
          (kind !== "fragment" && kind !== "question") ||
          typeof id !== "string" ||
          !/^[0-9a-f-]{36}$/i.test(id)
        ) {
          return json({ error: "Bad request" }, 400);
        }

        const sendgridKey = process.env.SENDGRID_API_KEY;
        const from = process.env.NOTIFY_FROM;
        if (!sendgridKey || !from) {
          return json({ error: "Notifications are not configured yet" }, 503);
        }

        // Server-only Supabase client (service role). Imported lazily:
        // route files ship to the client bundle, so this must never be
        // a top-level import.
        let admin: {
          from: (table: string) => any;
          auth: {
            admin: {
              getUserById: (userId: string) => Promise<{
                data: { user: { email?: string } | null };
              }>;
            };
          };
        };
        try {
          const mod = await import("@/integrations/supabase/client.server");
          admin = mod.supabaseAdmin as typeof admin;
          // Touch it once so a missing SUPABASE_URL / service key fails
          // here, inside this try, instead of further down.
          admin.from("profiles");
        } catch {
          return json({ error: "Notifications are not configured yet" }, 503);
        }

        const table = kind === "fragment" ? "entries" : "questions";
        const { data: row, error: rowError } = await admin
          .from(table)
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (rowError || !row) return json({ error: "Not found" }, 404);
        if (!isRecent(row.created_at as string)) {
          return json({ skipped: "stale" });
        }

        const { data: profile, error: profileError } = await admin
          .from("profiles")
          .select("id, username, display_name, email_notifications, auth_user_id")
          .eq("id", row.profile_id as string)
          .maybeSingle();
        if (profileError || !profile) return json({ error: "Not found" }, 404);
        if (profile.email_notifications === false) {
          return json({ skipped: "owner opted out" });
        }

        // Dedupe: one email per row, ever.
        const { error: logError } = await admin.from("notification_log").insert({
          kind,
          row_id: id,
          profile_id: profile.id as string,
        });
        if (logError) {
          // 23505 = already logged, i.e. already sent.
          if ((logError as { code?: string }).code === "23505") {
            return json({ skipped: "already sent" });
          }
          return json({ error: "Could not record the notification" }, 500);
        }

        let ownerEmail: string | undefined;
        if (typeof profile.auth_user_id === "string" && profile.auth_user_id) {
          try {
            const { data } = await admin.auth.admin.getUserById(
              profile.auth_user_id,
            );
            ownerEmail = data?.user?.email ?? undefined;
          } catch {
            ownerEmail = undefined;
          }
        }
        if (!ownerEmail) {
          await admin.from("notification_log").delete().eq("kind", kind).eq("row_id", id);
          return json({ skipped: "owner has no email address" });
        }

        const origin = new URL(request.url).origin;
        const wallUrl = `${origin}/${profile.username as string}`;
        const gateUrl = `${origin}/gate`;
        const ownerName = (profile.display_name as string)?.trim() || (profile.username as string);
        const senderName =
          typeof row.name === "string" && row.name.trim() ? row.name.trim() : "Anonymous";

        let subject: string;
        let text: string;
        let html: string;
        if (kind === "fragment") {
          const sealed =
            typeof row.reveal_date === "string" &&
            new Date(row.reveal_date).getTime() > Date.now();
          subject = sealed
            ? `Someone left you a sealed fragment on Fragments`
            : `Someone left a fragment on your wall`;
          if (sealed) {
            const opens = new Date(row.reveal_date as string).toLocaleDateString(
              undefined,
              { year: "numeric", month: "long", day: "numeric" },
            );
            text = [
              `Hi ${ownerName},`,
              ``,
              `${senderName} left a sealed fragment on your wall. It opens on ${opens} — not even you can read it before then.`,
              ``,
              `Your wall: ${wallUrl}`,
              `Your gate: ${gateUrl}`,
            ].join("\n");
            html = `<p>Hi ${escapeHtml(ownerName)},</p><p><strong>${escapeHtml(senderName)}</strong> left a sealed fragment on your wall. It opens on ${escapeHtml(opens)} — not even you can read it before then.</p><p><a href="${escapeHtml(wallUrl)}">Your wall</a> · <a href="${escapeHtml(gateUrl)}">Your gate</a></p>`;
          } else {
            text = [
              `Hi ${ownerName},`,
              ``,
              `${senderName} left this on your wall:`,
              ``,
              `"${row.message as string}"`,
              ``,
              `Your wall: ${wallUrl}`,
              `Your gate: ${gateUrl}`,
            ].join("\n");
            html = `<p>Hi ${escapeHtml(ownerName)},</p><p><strong>${escapeHtml(senderName)}</strong> left this on your wall:</p><blockquote>${escapeHtml(row.message as string)}</blockquote><p><a href="${escapeHtml(wallUrl)}">Your wall</a> · <a href="${escapeHtml(gateUrl)}">Your gate</a></p>`;
          }
        } else {
          subject = `Someone asked you a question on Fragments`;
          text = [
            `Hi ${ownerName},`,
            ``,
            `${senderName} asked you a question:`,
            ``,
            `"${row.question as string}"`,
            ``,
            `Answer it in your gate: ${gateUrl}`,
          ].join("\n");
          html = `<p>Hi ${escapeHtml(ownerName)},</p><p><strong>${escapeHtml(senderName)}</strong> asked you a question:</p><blockquote>${escapeHtml(row.question as string)}</blockquote><p><a href="${escapeHtml(gateUrl)}">Answer it in your gate</a></p>`;
        }

        const sendRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: ownerEmail }] }],
            from: { email: from, name: "Fragments" },
            subject,
            content: [
              { type: "text/plain", value: text },
              { type: "text/html", value: html },
            ],
          }),
        });
        if (!sendRes.ok) {
          // Let a retry send it: drop the dedupe row.
          await admin.from("notification_log").delete().eq("kind", kind).eq("row_id", id);
          return json({ error: "The email could not be sent" }, 502);
        }

        return json({ sent: true });
      },
    },
  },
});
