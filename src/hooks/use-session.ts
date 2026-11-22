import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  claimAngelicProfile,
  fetchProfileByAuthUserId,
  type Profile,
} from "@/lib/platform";

// Central auth state for the platform: the Supabase session plus the
// profile (wall) owned by the signed-in user, if they have claimed one.
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const claimedFor = useRef<string | null>(null);

  const refreshProfile = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    // The platform owner's seeded profile links itself on first sign-in.
    if (claimedFor.current !== s.user.id) {
      claimedFor.current = s.user.id;
      await claimAngelicProfile();
    }
    try {
      setProfile(await fetchProfileByAuthUserId(s.user.id));
    } catch {
      setProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // defer the profile lookup to avoid deadlocks inside the callback
      setTimeout(() => refreshProfile(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      refreshProfile(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return { session, user: session?.user ?? null, profile, loading, refreshProfile, signOut };
}
