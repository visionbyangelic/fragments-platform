import { supabase } from "@/integrations/supabase/client";

// Dear Future Me letters. A placeholder for now: a letter is written,
// stored, and revealed on the owner's own dashboard when its day
// comes. The email that would deliver it is not built — that waits
// for the domain — and the feature is only switched on for the
// heaven test account until then.

const sb = supabase as unknown as {
  from: (table: string) => any;
};

export type Letter = {
  id: string;
  profile_id: string;
  letter: string;
  deliver_date: string;
  opened: boolean;
  created_at: string;
};

export async function fetchLetters(profileId: string): Promise<Letter[]> {
  const { data, error } = await sb
    .from("letters")
    .select("*")
    .eq("profile_id", profileId)
    .order("deliver_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Letter[];
}

export async function createLetter(input: {
  profile_id: string;
  letter: string;
  deliver_date: string;
}): Promise<Letter> {
  const clean = input.letter.trim();
  if (clean.length < 1 || clean.length > 5000) {
    throw new Error("Write a real letter (1 to 5000 characters)");
  }
  const deliver = new Date(input.deliver_date);
  if (Number.isNaN(deliver.getTime()) || deliver <= new Date()) {
    throw new Error("Pick a future day for it to arrive");
  }
  const { data, error } = await sb
    .from("letters")
    .insert({ profile_id: input.profile_id, letter: clean, deliver_date: deliver.toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return data as Letter;
}

export async function openLetter(letterId: string): Promise<void> {
  const { error } = await sb.from("letters").update({ opened: true }).eq("id", letterId);
  if (error) throw error;
}

export async function deleteLetter(letterId: string): Promise<void> {
  const { error } = await sb.from("letters").delete().eq("id", letterId);
  if (error) throw error;
}
