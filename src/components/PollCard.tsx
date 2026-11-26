import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";
import { fetchMyVote, fetchVoteCounts, isPollOpen, vote, type Poll } from "@/lib/polls";

// The poll card on a wall: "A little question" with a POLL badge,
// just like the mockup. Visitors tap to vote; results show after
// they vote, or once the poll closes.
export function PollCard({ poll, visitorId }: { poll: Poll; visitorId: string | null }) {
  const [counts, setCounts] = useState<number[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);

  const open = isPollOpen(poll);
  const total = counts.reduce((a, b) => a + b, 0);

  useEffect(() => {
    let live = true;
    fetchVoteCounts(poll.id)
      .then((c) => live && setCounts(c))
      .catch(() => {});
    fetchMyVote(poll.id, visitorId)
      .then((v) => live && setMyVote(v))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [poll.id, visitorId]);

  async function cast(index: number) {
    if (!open || myVote !== null) return;
    setVoting(true);
    try {
      await vote(poll.id, index, visitorId);
      setMyVote(index);
      setCounts((prev) => {
        const next = [...prev];
        next[index] = (next[index] ?? 0) + 1;
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not vote");
    } finally {
      setVoting(false);
    }
  }

  const showResults = myVote !== null || !open;

  return (
    <div className="frag-card glass mb-5 break-inside-avoid rounded-[var(--card-radius)] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          A little question
        </p>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
          Poll
        </span>
      </div>
      <p className="mt-3 font-serif text-2xl leading-snug">{poll.question}</p>

      {!showResults ? (
        <div className="mt-5 space-y-2">
          {poll.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => cast(i)}
              disabled={voting}
              className="w-full rounded-full border border-border bg-background/40 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-background/70 disabled:opacity-60"
            >
              {opt}
            </button>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">Tap to vote →</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {poll.options.map((opt, i) => {
            const n = counts[i] ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className={myVote === i ? "font-semibold" : ""}>
                    {opt}
                    {myVote === i && " · your vote"}
                  </span>
                  <span className="text-muted-foreground">
                    {pct}% · {n}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-background/60">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            {total} {total === 1 ? "vote" : "votes"}
            {!open && " · this poll is closed"}
          </p>
        </div>
      )}
    </div>
  );
}
