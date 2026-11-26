import { supabase } from "@/integrations/supabase/client";

// Reactions: a heart, a laugh, or warmth on a fragment. One per
// browser per fragment per kind, keyed by the visitor id — the same
// id that tags fragments since migration 007. A reaction row is
// ~150 bytes.

const sb = supabase as unknown as {
  from: (table: string) => any;
};

export type ReactionKind = "heart" | "laugh" | "warm";

export const REACTION_KINDS: { kind: ReactionKind; label: string; glyph: string }[] = [
  { kind: "heart", label: "Heart", glyph: "❤️" },
  { kind: "laugh", label: "Laughter", glyph: "😂" },
  { kind: "warm", label: "Warmth", glyph: "🫶" },
];

export type ReactionCounts = Record<ReactionKind, number> & { mine: ReactionKind[] };

const EMPTY: ReactionCounts = { heart: 0, laugh: 0, warm: 0, mine: [] };

export async function fetchReactions(entryIds: string[], visitorId: string | null): Promise<Map<string, ReactionCounts>> {
  const out = new Map<string, ReactionCounts>();
  if (entryIds.length === 0) return out;
  const { data, error } = await sb
    .from("reactions")
    .select("entry_id, visitor_id, emoji")
    .in("entry_id", entryIds);
  if (error) throw error;
  for (const row of (data ?? []) as { entry_id: string; visitor_id: string; emoji: ReactionKind }[]) {
    const counts = out.get(row.entry_id) ?? { ...EMPTY, mine: [] };
    if (row.emoji === "heart" || row.emoji === "laugh" || row.emoji === "warm") {
      counts[row.emoji] += 1;
      if (visitorId && row.visitor_id === visitorId && !counts.mine.includes(row.emoji)) {
        counts.mine.push(row.emoji);
      }
    }
    out.set(row.entry_id, counts);
  }
  return out;
}

export async function toggleReaction(
  entryId: string,
  kind: ReactionKind,
  visitorId: string | null,
): Promise<boolean> {
  if (!visitorId) throw new Error("Could not tell this browser apart — try again");
  const existing = await sb
    .from("reactions")
    .select("id")
    .eq("entry_id", entryId)
    .eq("visitor_id", visitorId)
    .eq("emoji", kind)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    const { error } = await sb.from("reactions").delete().eq("id", (existing.data as { id: string }).id);
    if (error) throw error;
    return false;
  }
  const { error } = await sb
    .from("reactions")
    .insert({ entry_id: entryId, visitor_id: visitorId, emoji: kind });
  if (error) throw error;
  return true;
}
