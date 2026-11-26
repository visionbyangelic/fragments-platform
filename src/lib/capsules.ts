import { supabase } from "@/integrations/supabase/client";

// Time capsules: a title and a date, with contributions sealed until
// it. Anyone can contribute while it is sealed; nobody reads a
// contribution before the day — not even the owner. The public view
// reads the message as null until the reveal date, in the same shape
// as sealed fragments.

const sb = supabase as unknown as {
  from: (table: string) => any;
};

export type Capsule = {
  id: string;
  profile_id: string;
  title: string;
  reveal_date: string;
  created_at: string;
};

export type CapsuleContribution = {
  id: string;
  capsule_id: string;
  name: string | null;
  message: string | null;
  created_at: string;
};

export async function fetchCapsules(profileId: string): Promise<Capsule[]> {
  const { data, error } = await sb
    .from("capsules")
    .select("*")
    .eq("profile_id", profileId)
    .order("reveal_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Capsule[];
}

export async function createCapsule(input: {
  profile_id: string;
  title: string;
  reveal_date: string;
}): Promise<Capsule> {
  const title = input.title.trim();
  if (title.length < 3 || title.length > 80) {
    throw new Error("Give the capsule a title (3 to 80 characters)");
  }
  const reveal = new Date(input.reveal_date);
  if (Number.isNaN(reveal.getTime()) || reveal <= new Date()) {
    throw new Error("Pick a future day for it to open");
  }
  const { data, error } = await sb
    .from("capsules")
    .insert({ profile_id: input.profile_id, title, reveal_date: reveal.toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return data as Capsule;
}

export async function deleteCapsule(capsuleId: string): Promise<void> {
  const { error } = await sb.from("capsules").delete().eq("id", capsuleId);
  if (error) throw error;
}

export async function fetchCapsuleContributions(capsuleId: string): Promise<CapsuleContribution[]> {
  const { data, error } = await sb
    .from("capsule_contributions_public")
    .select("*")
    .eq("capsule_id", capsuleId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CapsuleContribution[];
}

export async function contributeToCapsule(input: {
  capsule_id: string;
  name: string | null;
  message: string;
  sender_username?: string | null;
  sender_visitor_id?: string | null;
}): Promise<void> {
  const clean = input.message.trim();
  if (clean.length < 1 || clean.length > 3000) {
    throw new Error("Write something to seal away (1 to 3000 characters)");
  }
  const { error } = await sb.from("capsule_contributions").insert({
    capsule_id: input.capsule_id,
    name: input.name?.trim() || null,
    message: clean,
    sender_username: input.sender_username ?? null,
    sender_visitor_id: input.sender_visitor_id ?? null,
  });
  if (error) throw error;
}
