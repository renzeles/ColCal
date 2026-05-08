"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CalendarProvider, Profile } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email: string | null;
  provider: CalendarProvider | null;
  profile: Profile;
};

function detectProvider(identities: { provider: string }[] | undefined): CalendarProvider | null {
  for (const id of identities ?? []) {
    if (id.provider === "azure") return "microsoft";
    if (id.provider === "google") return "google";
  }
  return null;
}

export function useUser(redirectIfMissing = true) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const u = auth.user;
      if (!u) {
        if (redirectIfMissing) window.location.href = "/login";
        setLoading(false);
        return;
      }
      const provider = detectProvider(u.identities);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();

      setUser({
        id: u.id,
        email: u.email ?? null,
        provider,
        profile: (profile ?? {
          id: u.id,
          email: u.email ?? null,
          username: null,
          full_name: (u.user_metadata?.full_name as string) ?? null,
          avatar_url: (u.user_metadata?.avatar_url as string) ?? null,
          description: null,
        }) as Profile,
      });
      setLoading(false);
    })();
  }, [redirectIfMissing]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function updateProfile(patch: Partial<Profile>) {
    setUser((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...patch } } : prev));
  }

  return { user, loading, signOut, updateProfile };
}
