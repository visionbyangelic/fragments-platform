import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Hourglass, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  contributeToCapsule,
  deleteCapsule,
  fetchCapsuleContributions,
  type Capsule,
  type CapsuleContribution,
} from "@/lib/capsules";
import { getVisitorId } from "@/lib/visitor";

// Time capsules on a wall. While one is sealed, visitors see a
// locked card and a small form to add their own message to it —
// nobody reads a contribution early, not even the owner. On the day
// it opens itself and the messages show.
export function CapsuleSection({
  capsules,
  profileId,
  wallOpen,
  myUsername,
}: {
  capsules: Capsule[];
  profileId: string;
  wallOpen: boolean;
  myUsername: string | null;
}) {
  const [contributions, setContributions] = useState<Record<string, CapsuleContribution[]>>({});
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openForm, setOpenForm] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all(
      capsules.map(async (c) => [c.id, await fetchCapsuleContributions(c.id)] as const),
    )
      .then((pairs) => {
        if (!live) return;
        const next: Record<string, CapsuleContribution[]> = {};
        for (const [id, rows] of pairs) next[id] = rows;
        setContributions(next);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [capsules]);

  if (capsules.length === 0) return null;

  const now = new Date();

  async function contribute(capsuleId: string) {
    setSending(true);
    try {
      await contributeToCapsule({
        capsule_id: capsuleId,
        name: name.trim() || null,
        message,
        sender_username: myUsername,
        sender_visitor_id: getVisitorId(),
      });
      toast.success("Sealed into the capsule");
      setMessage("");
      setOpenForm(null);
      const rows = await fetchCapsuleContributions(capsuleId);
      setContributions((prev) => ({ ...prev, [capsuleId]: rows }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add that");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-20">
      <h2 className="mb-6 text-center font-serif text-3xl text-gradient">Time capsules</h2>
      <div className="columns-1 gap-5 sm:columns-2">
        {capsules.map((capsule) => {
          const opens = new Date(capsule.reveal_date);
          const sealed = opens > now;
          const rows = contributions[capsule.id] ?? [];
          return (
            <div
              key={capsule.id}
              className="frag-card mb-5 break-inside-avoid rounded-[var(--card-radius)] p-6 sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {sealed ? (
                    <Lock className="mb-3 h-5 w-5 text-primary" aria-hidden />
                  ) : (
                    <Hourglass className="mb-3 h-5 w-5 text-primary" aria-hidden />
                  )}
                  <p className="font-serif text-2xl leading-snug">{capsule.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {sealed
                      ? `Opens ${opens.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · ${rows.length} sealed inside`
                      : `Opened ${opens.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`}
                  </p>
                </div>
                {sealed && wallOpen && (
                  <button
                    onClick={() => setOpenForm(openForm === capsule.id ? null : capsule.id)}
                    className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Contribute
                  </button>
                )}
              </div>

              {sealed && openForm === capsule.id && (
                <div className="mt-5 space-y-3">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    maxLength={60}
                    className="bg-background/70"
                  />
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Something for the day this opens…"
                    rows={3}
                    maxLength={3000}
                    className="bg-background/70"
                  />
                  <Button
                    onClick={() => contribute(capsule.id)}
                    disabled={sending || !message.trim()}
                    className="w-full rounded-full"
                  >
                    {sending ? "Sealing…" : "Seal it in"}
                  </Button>
                </div>
              )}

              {!sealed && (
                <div className="mt-5 space-y-4">
                  {rows.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">
                      It opened, and nothing was sealed inside.
                    </p>
                  ) : (
                    rows.map((row) => (
                      <div key={row.id} className="border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                          {row.message ?? "Sealed."}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          — {row.name?.trim() ? row.name : "Anonymous"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
