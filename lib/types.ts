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
  created_at: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};
