import { supabase } from "@/integrations/supabase/client";

export type Entry = {
  id: string;
  profile_id: string;
  name: string | null;
  message: string;
  color: string;
  shape: string;
  is_visible: boolean;
  is_private: boolean;
  is_favorite: boolean;
  reveal_date: string | null;
  /** The sender's wall username when they were signed in and not
      anonymous. Only ever shown to the wall's owner. */
  sender_username: string | null;
  created_at: string;
};

// A sealed fragment before its reveal date. The database view only
// exposes these safe fields; the message itself stays unreadable
// through the API until the date arrives, even for the wall's owner.
export type SealedEntry = {
  id: string;
  profile_id: string;
  name: string | null;
  reveal_date: string;
  created_at: string;
};

// The generated Database type does not yet include our tables, so we use a
// loosely typed client for these queries.
const sb = supabase as unknown as {
  from: (table: string) => any;
  channel: typeof supabase.channel;
  removeChannel: typeof supabase.removeChannel;
};

export const FRAGMENT_COLORS = [
  { value: "blush", label: "Blush", token: "--frag-blush" },
  { value: "lavender", label: "Lavender", token: "--frag-lavender" },
  { value: "lilac", label: "Lilac", token: "--frag-lilac" },
  { value: "sky", label: "Sky", token: "--frag-sky" },
  { value: "mint", label: "Mint", token: "--frag-mint" },
  { value: "peach", label: "Peach", token: "--frag-peach" },
] as const;

export const FRAGMENT_SHAPES = [
  { value: "rounded", label: "Rounded" },
  { value: "cloud", label: "Cloud" },
  { value: "square", label: "Square" },
] as const;

export function colorStyle(color: string): React.CSSProperties {
  const found = FRAGMENT_COLORS.find((c) => c.value === color) ?? FRAGMENT_COLORS[0];
  return {
    background: `var(${found.token})`,
    color: "var(--frag-foreground)",
  };
}

export function shapeClass(shape: string): string {
  switch (shape) {
    case "square":
      return "rounded-md";
    case "cloud":
      return "rounded-[2.5rem]";
    default:
      // The wall's card radius: the theme's own corner, or the card
      // style the owner picked in the editor.
      return "rounded-[var(--card-radius)]";
  }
}

export async function fetchEntries(profileId: string): Promise<Entry[]> {
  const { data, error } = await sb
    .from("entries")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function fetchSealedEntries(profileId: string): Promise<SealedEntry[]> {
  const { data, error } = await sb
    .from("sealed_entries")
    .select("*")
    .eq("profile_id", profileId)
    .order("reveal_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SealedEntry[];
}

export async function submitEntry(input: {
  profile_id: string;
  name: string | null;
  message: string;
  color: string;
  shape: string;
  reveal_date?: string | null;
  /** The sender's own wall username. Only the caller ever passes
      their own — the database refuses anyone else's. */
  sender_username?: string | null;
}): Promise<string> {
  const { data, error } = await sb
    .from("entries")
    .insert({
      profile_id: input.profile_id,
      name: input.name,
      message: input.message,
      color: input.color,
      shape: input.shape,
      is_private: false,
      is_visible: true,
      reveal_date: input.reveal_date ?? null,
      sender_username: input.sender_username ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function setEntryVisibility(id: string, is_visible: boolean): Promise<void> {
  const { error } = await sb.from("entries").update({ is_visible }).eq("id", id);
  if (error) throw error;
}

export async function setEntryFavorite(id: string, is_favorite: boolean): Promise<void> {
  const { error } = await sb.from("entries").update({ is_favorite }).eq("id", id);
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await sb.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToEntries(onChange: () => void, profileId: string) {
  const channel = sb
    .channel(`entries-changes-${profileId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "entries",
        filter: `profile_id=eq.${profileId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}

export async function fetchRandomEntry(profileId: string): Promise<Entry | null> {
  const { count, error: countError } = await sb
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("is_visible", true)
    .eq("is_private", false);

  if (countError || !count || count === 0) return null;

  const randomOffset = Math.floor(Math.random() * count);

  const { data, error } = await sb
    .from("entries")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_visible", true)
    .eq("is_private", false)
    .range(randomOffset, randomOffset)
    .maybeSingle();

  if (error || !data) return null;
  return data as Entry;
}
