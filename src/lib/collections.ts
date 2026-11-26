import { supabase } from "@/integrations/supabase/client";

// Memory Box collections: the owner's private labels for fragments.
// A collection is a name; its items are fragment ids. Nothing here
// is ever public.

const sb = supabase as unknown as {
  from: (table: string) => any;
};

export type Collection = {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
};

export async function fetchCollections(profileId: string): Promise<Collection[]> {
  const { data, error } = await sb
    .from("collections")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Collection[];
}

export async function createCollection(profileId: string, name: string): Promise<Collection> {
  const clean = name.trim();
  if (clean.length < 1 || clean.length > 40) {
    throw new Error("A collection name is 1 to 40 characters");
  }
  const { data, error } = await sb
    .from("collections")
    .insert({ profile_id: profileId, name: clean })
    .select("*")
    .single();
  if (error) throw error;
  return data as Collection;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const { error } = await sb.from("collections").delete().eq("id", collectionId);
  if (error) throw error;
}

export async function fetchCollectionEntryIds(collectionId: string): Promise<string[]> {
  const { data, error } = await sb
    .from("collection_items")
    .select("entry_id")
    .eq("collection_id", collectionId);
  if (error) throw error;
  return ((data ?? []) as { entry_id: string }[]).map((r) => r.entry_id);
}

/** Every (collection, entry) pair the owner has filed, for the whole
    wall at once — so a card knows which collections it is already in. */
export async function fetchAllCollectionItems(profileId: string): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const cols = await fetchCollections(profileId);
  for (const c of cols) {
    out.set(c.id, await fetchCollectionEntryIds(c.id));
  }
  return out;
}

export async function addToCollection(collectionId: string, entryId: string): Promise<void> {
  const { error } = await sb
    .from("collection_items")
    .insert({ collection_id: collectionId, entry_id: entryId });
  if (error) throw error;
}

export async function removeFromCollection(collectionId: string, entryId: string): Promise<void> {
  const { error } = await sb
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("entry_id", entryId);
  if (error) throw error;
}
