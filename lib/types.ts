export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  is_public: boolean;
  created_at: string;
  creator?: Profile;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type SidebarSelection =
  | { kind: "self" }
  | { kind: "friend"; id: string; name: string; avatar?: string | null }
  | { kind: "group"; id: string; name: string; avatar?: string | null }
  | { kind: "place"; id: string; name: string };

export type CalendarView = "grid" | "feed";

export type AppNotification = {
  id: string;
  type: "calendar_request" | "calendar_approved" | "calendar_rejected";
  from_user_id: string | null;
  from_user_name: string | null;
  from_user_avatar: string | null;
  read: boolean;
  created_at: string;
};

export type PermissionStatus = "none" | "pending" | "approved" | "rejected";
