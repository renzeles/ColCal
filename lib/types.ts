export type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  description: string | null;
};

export type CalendarProvider = "google" | "microsoft";

export type EventVisibility = "public" | "private";

export type EventColor =
  | "zinc"
  | "red"
  | "orange"
  | "amber"
  | "emerald"
  | "sky"
  | "violet"
  | "pink";

export type SentEvent = {
  id: string;
  creator_id: string;
  title: string;
  start_at: string;
  end_at: string;
  location: string | null;
  description: string | null;
  attendee_emails: string[];
  provider: CalendarProvider;
  provider_event_id: string | null;
  visibility: EventVisibility;
  image_url: string | null;
  color: EventColor;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  is_online: boolean;
  source?: "created" | "joined";
  created_at: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};
