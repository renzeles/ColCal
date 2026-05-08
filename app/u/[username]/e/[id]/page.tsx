import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, SentEvent } from "@/lib/types";
import { EventClient } from "./EventClient";

type PageProps = {
  params: Promise<{ username: string; id: string }>;
};

async function fetchEvent(username: string, id: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (!profile) return null;

  const { data: event } = await supabase
    .from("sent_events")
    .select("*")
    .eq("id", id)
    .eq("creator_id", profile.id)
    .maybeSingle();

  if (!event) return null;
  return { event: event as SentEvent, creator: profile as Profile };
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, id } = await params;
  const data = await fetchEvent(username, id);

  if (!data) {
    return { title: "Evento no encontrado · Agenddi" };
  }

  const { event, creator } = data;
  const creatorName = creator.full_name ?? creator.username ?? username;
  const title = `${event.title} · Agenddi`;
  const description =
    event.description?.slice(0, 200) ??
    `${creatorName} te invita: ${formatShort(event.start_at)}${
      event.location ? ` · ${event.location}` : ""
    }`;

  return {
    title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.image_url ? [{ url: event.image_url }] : undefined,
    },
    twitter: {
      card: event.image_url ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images: event.image_url ? [event.image_url] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { username, id } = await params;
  const data = await fetchEvent(username, id);
  if (!data) notFound();

  return <EventClient event={data.event} creator={data.creator} />;
}
