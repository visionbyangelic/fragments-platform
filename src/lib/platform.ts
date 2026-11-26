import { supabase } from "@/integrations/supabase/client";
import { isThemeName } from "@/lib/themes";
import type { CustomTheme } from "@/lib/custom-theme";
import type { ThemeOverrides } from "@/lib/theme-overrides";

// Platform-level data: profiles (one per wall), reports, account helpers.
// The generated Database type does not include our tables, so we use a
// loosely typed client for these queries.
const sb = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  theme: string;
  custom_theme: CustomTheme | null;
  theme_overrides: ThemeOverrides | null;
  wall_open: boolean;
  email_notifications: boolean;
  custom_prompt: string | null;
  suspended: boolean;
  is_platform_admin: boolean;
  auth_user_id: string | null;
  created_at: string;
};

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// Names that would collide with routes or platform functions.
export const RESERVED_USERNAMES = new Set([
  "admin",
  "support",
  "fragments",
  "login",
  "logout",
  "signup",
  "signin",
  "gate",
  "heavenly-gate",
  "api",
  "www",
  "mail",
  "help",
  "about",
  "index",
  "home",
  "settings",
  "platform",
  "official",
  "team",
  "null",
  "undefined",
]);

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("username", normalizeUsername(username))
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function fetchProfileByAuthUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const name = normalizeUsername(username);
  if (!USERNAME_RE.test(name) || RESERVED_USERNAMES.has(name)) return false;
  const existing = await fetchProfileByUsername(name);
  return !existing;
}

export async function createProfile(input: {
  username: string;
  display_name: string;
  auth_user_id: string;
  theme?: string;
  custom_theme?: CustomTheme | null;
}): Promise<Profile> {
  const username = normalizeUsername(input.username);
  const { data, error } = await sb
    .from("profiles")
    .insert({
      username,
      display_name: input.display_name.trim(),
      auth_user_id: input.auth_user_id,
      theme: isThemeName(input.theme) ? input.theme : "dusk",
      custom_theme: input.custom_theme ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  id: string,
  patch: Partial<
    Pick<
      Profile,
      "display_name" | "theme" | "custom_theme" | "theme_overrides" | "wall_open" | "email_notifications" | "custom_prompt" | "suspended"
    >
  >, // custom_prompt is the owner's ask line, shown to every visitor.
): Promise<void> {
  const { error } = await sb.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

// Links the seeded "angelic" profile to the platform owner's account.
// A no-op for every other signed-in user (the database function checks
// the caller's email).
export async function claimAngelicProfile(): Promise<void> {
  try {
    await sb.rpc("claim_angelic_profile");
  } catch {
    /* not the owner, nothing to claim */
  }
}

export async function reportWall(profileId: string, reason: string | null): Promise<void> {
  const { error } = await sb.from("reports").insert({ profile_id: profileId, reason });
  if (error) throw error;
}

export type Report = {
  id: string;
  profile_id: string;
  reason: string | null;
  created_at: string;
};

export async function fetchReports(): Promise<Report[]> {
  const { data, error } = await sb
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Report[];
}
