import { supabase } from "@/integrations/supabase/client";

// The wall owner's public reply to a fragment: one reply per
// fragment, shown under the card for everyone.

const sb = supabase as unknown as {
  from: (table: string) => any;
};

export type FragmentReply = {
  entry_id: string;
  reply: string;
  created_at: string;
};

export async function fetchReplies(entryIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (entryIds.length === 0) return out;
  const { data, error } = await sb
    .from("fragment_replies")
    .select("entry_id, reply")
    .in("entry_id", entryIds);
  if (error) throw error;
  for (const row of (data ?? []) as FragmentReply[]) {
    out.set(row.entry_id, row.reply);
  }
  return out;
}

export async function saveReply(entryId: string, reply: string): Promise<void> {
  const clean = reply.trim();
  if (clean.length < 1 || clean.length > 1000) {
    throw new Error("A reply is 1 to 1000 characters");
  }
  const { error } = await sb
    .from("fragment_replies")
    .upsert({ entry_id: entryId, reply: clean, updated_at: new Date().toISOString() }, { onConflict: "entry_id" });
  if (error) throw error;
}

export async function deleteReply(entryId: string): Promise<void> {
  const { error } = await sb.from("fragment_replies").delete().eq("entry_id", entryId);
  if (error) throw error;
}
