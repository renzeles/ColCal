import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ProfileClient } from "./ProfileClient";

type PageProps = {
  params: Promise<{ username: string }>;
};

async function fetchProfile(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) {
    return { title: "Usuario no encontrado · Agenddi" };
  }

  const displayName = profile.full_name ?? profile.username ?? username;
  const title = `${displayName} (@${profile.username}) · Agenddi`;
  const description =
    profile.description ?? `Mirá los eventos públicos de ${displayName} en Agenddi.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
    twitter: {
      card: profile.avatar_url ? "summary" : "summary_large_image",
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await fetchProfile(username);
  return <ProfileClient username={username} initialProfile={profile} />;
}
