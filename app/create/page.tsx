"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Globe, Lock, ImagePlus, X, Calendar, MapPin, Check, Clock } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { createClient } from "@/lib/supabase/client";
import { createGCalEvent, updateGCalEvent, deleteGCalEvent } from "@/lib/google-calendar";
import { createMSEvent, updateMSEvent, deleteMSEvent } from "@/lib/microsoft-calendar";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { SearchBar } from "@/components/SearchBar";
import { Toast, useToast } from "@/components/Toast";
import { EVENT_COLORS, EVENT_COLOR_LABEL, getEventColorStyles } from "@/lib/event-colors";
import type { CalendarProvider, EventColor, EventVisibility, SentEvent, Profile } from "@/lib/types";

const PROVIDER_LABEL: Record<CalendarProvider, string> = {
  google: "Google Calendar",
  microsoft: "Outlook Calendar",
};

const PROVIDER_SCOPES: Record<CalendarProvider, string> = {
  google: "https://www.googleapis.com/auth/calendar.events",
  microsoft: "Calendars.ReadWrite offline_access",
};

type Attendee = { email: string; profile?: Profile };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreatePage() {
  const { user, loading, signOut } = useUser();
  const toast = useToast();
  const [events, setEvents] = useState<SentEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Following profiles for attendee autocomplete
  const [followingProfiles, setFollowingProfiles] = useState<Profile[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<EventVisibility>("private");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [contactInput, setContactInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [color, setColor] = useState<EventColor>("zinc");
  const [isOnline, setIsOnline] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showCoords, setShowCoords] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const contactInputRef = useRef<HTMLInputElement>(null);

  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!imageFile) { setFilePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  const imagePreview = filePreviewUrl ?? imageUrl;

  // Close suggestions on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const flag = user.provider
        ? localStorage.getItem(`cal_connected_${user.provider}`) === "true"
        : false;
      setCalendarConnected(Boolean(session?.provider_token) && flag);

      // Load events + following profiles in parallel
      const [eventsRes, followingRes] = await Promise.all([
        supabase
          .from("sent_events")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id),
      ]);

      setEvents((eventsRes.data ?? []) as SentEvent[]);

      const followedIds = (followingRes.data ?? []).map((r) => r.following_id);
      if (followedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", followedIds);
        setFollowingProfiles((profiles ?? []) as Profile[]);
      }

      setEventsLoading(false);

      const params = new URLSearchParams(window.location.search);

      if (user.provider && params.get("connected") === "1") {
        localStorage.setItem(`cal_connected_${user.provider}`, "true");
        setCalendarConnected(true);
        window.history.replaceState({}, "", "/create");
      }

      // Auto-open edit form when navigated with ?edit=ID
      const editId = params.get("edit");
      if (editId) {
        const evToEdit = ((eventsRes.data ?? []) as SentEvent[]).find((e) => e.id === editId);
        if (evToEdit) {
          const byEmail = new Map(
            ((followingRes.data ?? []) as { following_id: string }[]).map(() => ["", undefined as unknown as Profile])
          );
          // Use profiles loaded above for the chip lookup
          const loadedProfiles: Profile[] = [];
          const followedIds2 = (followingRes.data ?? []).map((r) => r.following_id);
          if (followedIds2.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("*")
              .in("id", followedIds2);
            (profs ?? []).forEach((p) => loadedProfiles.push(p as Profile));
          }
          const emailMap = new Map(loadedProfiles.filter((p) => p.email).map((p) => [p.email!, p]));
          setEditingId(evToEdit.id);
          setTitle(evToEdit.title);
          setVisibility(evToEdit.visibility);
          setStartAt(toLocalInput(evToEdit.start_at));
          setEndAt(toLocalInput(evToEdit.end_at));
          setAttendees(evToEdit.attendee_emails.map((email) => ({ email, profile: emailMap.get(email) })));
          setLocation(evToEdit.location ?? "");
          setDescription(evToEdit.description ?? "");
          setImageUrl(evToEdit.image_url);
          setColor(evToEdit.color ?? "zinc");
          setIsOnline(evToEdit.is_online ?? false);
          setCapacity(evToEdit.capacity ?? null);
          setLatitude(evToEdit.latitude ?? null);
          setLongitude(evToEdit.longitude ?? null);
          setShowCoords(!!(evToEdit.latitude || evToEdit.longitude));
          window.history.replaceState({}, "", "/create");
          setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
      }
    })();
  }, [user]);

  async function handleConnectCalendar() {
    if (connecting || !user || !user.provider) return;
    setConnecting(true);
    const supabase = createClient();
    const oauthProvider = user.provider === "microsoft" ? "azure" : "google";
    const queryParams: { [key: string]: string } =
      user.provider === "google"
        ? { access_type: "offline", prompt: "consent" }
        : { prompt: "consent" };
    await supabase.auth.signInWithOAuth({
      provider: oauthProvider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/create?connected=1")}`,
        scopes: PROVIDER_SCOPES[user.provider],
        queryParams,
      },
    });
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setVisibility("private");
    setStartAt("");
    setEndAt("");
    setAttendees([]);
    setContactInput("");
    setLocation("");
    setDescription("");
    setImageFile(null);
    setImageUrl(null);
    setColor("zinc");
    setIsOnline(false);
    setCapacity(null);
    setLatitude(null);
    setLongitude(null);
    setShowCoords(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function startEdit(ev: SentEvent) {
    setEditingId(ev.id);
    setTitle(ev.title);
    setVisibility(ev.visibility);
    setStartAt(toLocalInput(ev.start_at));
    setEndAt(toLocalInput(ev.end_at));
    // Match emails back to profiles where possible
    const byEmail = new Map(
      followingProfiles.filter((p) => p.email).map((p) => [p.email!, p])
    );
    setAttendees(ev.attendee_emails.map((email) => ({ email, profile: byEmail.get(email) })));
    setContactInput("");
    setLocation(ev.location ?? "");
    setDescription(ev.description ?? "");
    setImageFile(null);
    setImageUrl(ev.image_url);
    setColor(ev.color ?? "zinc");
    setIsOnline(ev.is_online ?? false);
    setCapacity(ev.capacity ?? null);
    setLatitude(ev.latitude ?? null);
    setLongitude(ev.longitude ?? null);
    setShowCoords(!!(ev.latitude || ev.longitude));
    if (imageInputRef.current) imageInputRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Attendee helpers
  const alreadyAdded = new Set(attendees.map((a) => a.email));

  const suggestions = contactInput.trim()
    ? followingProfiles.filter((p) => {
        if (!p.email || alreadyAdded.has(p.email)) return false;
        const q = contactInput.trim().toLowerCase();
        return (
          (p.full_name ?? "").toLowerCase().includes(q) ||
          (p.username ?? "").toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q)
        );
      })
    : [];

  function addAttendeeByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized || alreadyAdded.has(normalized)) return;
    const profile = followingProfiles.find((p) => p.email?.toLowerCase() === normalized);
    setAttendees((prev) => [...prev, { email: normalized, profile }]);
    setContactInput("");
    setShowSuggestions(false);
  }

  function selectContact(p: Profile) {
    if (!p.email) return;
    setAttendees((prev) => [...prev, { email: p.email!, profile: p }]);
    setContactInput("");
    setShowSuggestions(false);
    contactInputRef.current?.focus();
  }

  function removeAttendee(email: string) {
    setAttendees((prev) => prev.filter((a) => a.email !== email));
  }

  function handleContactKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      const val = contactInput.trim();
      // If there's exactly one suggestion and it matches well, select it
      if (suggestions.length === 1 && !val.includes("@")) {
        selectContact(suggestions[0]);
      } else if (val.includes("@")) {
        addAttendeeByEmail(val);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "Backspace" && contactInput === "" && attendees.length > 0) {
      removeAttendee(attendees[attendees.length - 1].email);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.show("error", "Solo se permiten imágenes JPG, PNG, WebP o GIF.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.show("error", "La imagen no puede pesar más de 5 MB.");
      e.target.value = "";
      return;
    }
    setImageFile(file);
    setImageUrl(null);
  }

  function clearImage() {
    setImageFile(null);
    setImageUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function uploadImage(file: File): Promise<string> {
    if (!user) throw new Error("No user");
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("event-images")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    if (error) throw error;
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function deleteStorageImage(url: string) {
    const marker = "/event-images/";
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = url.slice(idx + marker.length);
    const supabase = createClient();
    await supabase.storage.from("event-images").remove([path]);
  }

  async function getProviderToken(): Promise<string | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.provider_token ?? null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !user) return;
    setSubmitting(true);

    try {
      // Flush any raw email still in the input
      const pendingEmail = contactInput.trim();
      const allAttendees = [...attendees];
      if (pendingEmail.includes("@") && !alreadyAdded.has(pendingEmail.toLowerCase())) {
        allAttendees.push({ email: pendingEmail.toLowerCase() });
        setAttendees(allAttendees);
        setContactInput("");
      }

      const attendeeEmails = allAttendees.map((a) => a.email);
      const start = new Date(startAt);
      const end = new Date(endAt);
      const supabase = createClient();

      let finalImageUrl: string | null = imageUrl;
      if (imageFile) finalImageUrl = await uploadImage(imageFile);

      const eventArgs = {
        title,
        description,
        location,
        startAt: start,
        endAt: end,
        attendeeEmails,
        imageUrl: finalImageUrl ?? undefined,
      };

      const needsProviderCall = user.provider !== null && attendeeEmails.length > 0;
      let token: string | null = null;
      if (needsProviderCall) {
        token = await getProviderToken();
        if (!token) {
          toast.show("error", "No hay token del calendario. Reconectá tu calendario.");
          return;
        }
      }

      if (editingId) {
        const existing = events.find((e) => e.id === editingId);
        if (!existing) throw new Error("Evento no encontrado");

        if (existing.image_url && existing.image_url !== finalImageUrl) {
          deleteStorageImage(existing.image_url).catch(() => {});
        }

        if (token && existing.provider_event_id) {
          if (existing.provider === "microsoft") {
            await updateMSEvent({ ...eventArgs, msToken: token, eventId: existing.provider_event_id });
          } else {
            await updateGCalEvent({ ...eventArgs, googleToken: token, eventId: existing.provider_event_id });
          }
        }

        const { data: updated, error } = await supabase
          .from("sent_events")
          .update({
            title,
            visibility,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            location: location || null,
            description: description || null,
            attendee_emails: attendeeEmails,
            image_url: finalImageUrl,
            color,
            is_online: isOnline,
            capacity: capacity,
            latitude: isOnline ? null : latitude,
            longitude: isOnline ? null : longitude,
          })
          .eq("id", editingId)
          .select()
          .single();

        if (error) throw error;
        setEvents((prev) => prev.map((e) => (e.id === editingId ? (updated as SentEvent) : e)));
        toast.show("success", "Evento actualizado");
      } else {
        let providerEventId: string | null = null;
        if (token) {
          providerEventId =
            user.provider === "microsoft"
              ? await createMSEvent({ ...eventArgs, msToken: token })
              : await createGCalEvent({ ...eventArgs, googleToken: token });
        }

        const { data: inserted, error } = await supabase
          .from("sent_events")
          .insert({
            creator_id: user.id,
            title,
            visibility,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            location: location || null,
            description: description || null,
            attendee_emails: attendeeEmails,
            provider: user.provider ?? "google",
            provider_event_id: providerEventId,
            image_url: finalImageUrl,
            color,
            is_online: isOnline,
            capacity: capacity,
            latitude: isOnline ? null : latitude,
            longitude: isOnline ? null : longitude,
          })
          .select()
          .single();

        if (error) throw error;
        setEvents((prev) => [inserted as SentEvent, ...prev]);
        toast.show("success", visibility === "public" ? "Evento publicado" : "Evento enviado");

        // Auto-friend + notify invitees who are Agenddi users
        if (attendeeEmails.length > 0 && inserted) {
          try {
            const { data: matched } = await supabase
              .from("profiles")
              .select("id, email, username, full_name")
              .in("email", attendeeEmails);
            const matchedProfiles = (matched as Array<{ id: string; email: string; username: string | null; full_name: string | null }> | null) ?? [];
            if (matchedProfiles.length > 0) {
              // Auto-mutual follow with each matched invitee (skip if already follows)
              const followRows = matchedProfiles.flatMap((p) => [
                { follower_id: user.id, following_id: p.id },
                { follower_id: p.id, following_id: user.id },
              ]);
              await supabase.from("follows").upsert(followRows, {
                onConflict: "follower_id,following_id",
                ignoreDuplicates: true,
              });

              // Event invite notification for each
              const notifs = matchedProfiles.map((p) => ({
                user_id: p.id,
                type: "event_invite",
                data: {
                  event_id: (inserted as SentEvent).id,
                  event_title: title,
                  event_url: user.profile.username ? `/u/${user.profile.username}/e/${(inserted as SentEvent).id}` : "",
                  creator_id: user.id,
                  creator_name: user.profile.full_name ?? user.profile.username ?? "Someone",
                  creator_username: user.profile.username,
                  creator_avatar: user.profile.avatar_url,
                },
              }));
              await supabase.from("notifications").insert(notifs);
            }
          } catch (notifyErr) {
            console.warn("Auto-friend/notify on invite failed:", notifyErr);
          }
        }
      }

      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      const msg =
        err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
      if (msg.toLowerCase().includes("insufficient authentication scope") ||
          msg.toLowerCase().includes("invalid_grant") ||
          msg.toLowerCase().includes("unauthorized")) {
        // Token expired or missing calendar scope — force reconnect
        if (user?.provider) {
          localStorage.removeItem(`cal_connected_${user.provider}`);
        }
        setCalendarConnected(false);
        toast.show("error", "Tu sesión del calendario venció. Reconectá tu calendario arriba.");
      } else {
        toast.show("error", `No se pudo guardar: ${msg}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ev: SentEvent) {
    if (deletingId) return;
    if (!confirm(`¿Cancelar "${ev.title}"?`)) return;
    setDeletingId(ev.id);
    try {
      if (ev.provider_event_id && ev.attendee_emails.length > 0) {
        const token = await getProviderToken();
        if (token) {
          if (ev.provider === "microsoft") {
            await deleteMSEvent(token, ev.provider_event_id);
          } else {
            await deleteGCalEvent(token, ev.provider_event_id);
          }
        }
      }

      const supabase = createClient();
      const { error } = await supabase.from("sent_events").delete().eq("id", ev.id);
      if (error) throw error;

      if (ev.image_url) deleteStorageImage(ev.image_url).catch(() => {});

      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
      if (editingId === ev.id) resetForm();
      toast.show("success", "Evento cancelado");
    } catch (err) {
      console.error("Delete error:", err);
      const msg =
        err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
      toast.show("error", `No se pudo cancelar: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || !user || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Cargando…</div>
      </div>
    );
  }

  const hasOAuthProvider = user.provider !== null;
  const needsCalendarConnect = hasOAuthProvider && !calendarConnected;
  const calendarRequired = hasOAuthProvider && (visibility === "private" || attendees.length > 0);

  return (
    <div className="min-h-screen bakery-bg">
      <NavBar
        username={user.profile.username}
        fullName={user.profile.full_name}
        avatarUrl={user.profile.avatar_url}
        onSignOut={signOut}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {needsCalendarConnect && user.provider && (
          <section className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
            <h2 className="text-base font-semibold text-zinc-900 mb-2">
              Conectá tu {PROVIDER_LABEL[user.provider]}
            </h2>
            <p className="text-sm text-zinc-600 mb-4">
              Necesitás darle permiso a la app para crear eventos en tu calendario (solo si querés
              invitar gente). Para eventos públicos sin invitados podés saltearlo.
            </p>
            <button
              onClick={handleConnectCalendar}
              disabled={connecting}
              className="px-4 h-10 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60"
            >
              {connecting ? "Conectando…" : `Conectar ${PROVIDER_LABEL[user.provider]}`}
            </button>
          </section>
        )}

        <section className="bg-white rounded-3xl card-shadow p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              {editingId ? "Editar evento" : "Nuevo evento"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-zinc-500 hover:text-zinc-900 transition"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                visibility === "private"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <Lock className="h-4 w-4" /> Privado
            </button>
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                visibility === "public"
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <Globe className="h-4 w-4" /> Público
            </button>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            {visibility === "private"
              ? "Solo los invitados verán este evento. Recibirán una invitación al calendario."
              : "Aparecerá en tu perfil público. Los invitados son opcionales."}
          </p>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              required
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-[#8b5a3c] focus:ring-4 focus:ring-[#8b5a3c]/10 transition text-sm"
            />
            {/* Start date + time */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-2 uppercase tracking-wider">Inicio</label>
              <div className="flex gap-2">
                <DatePicker
                  value={startAt ? startAt.split("T")[0] : ""}
                  onChange={(d) => setStartAt(d ? `${d}T${(startAt.split("T")[1] || "12:00").slice(0,5)}` : "")}
                  placeholder="Date"
                />
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a3c] pointer-events-none" strokeWidth={2.5} />
                  <input
                    type="time"
                    value={startAt ? (startAt.split("T")[1] || "").slice(0,5) : ""}
                    onChange={(e) => {
                      const date = startAt.split("T")[0] || new Date().toISOString().slice(0,10);
                      setStartAt(`${date}T${e.target.value}`);
                    }}
                    style={{ height: "3.25rem" }}
                    className="pl-11 pr-4 rounded-2xl bg-stone-50 border-2 border-stone-200 text-sm font-bold text-stone-800 tabular-nums focus:outline-none focus:border-[#8b5a3c] focus:bg-white transition tracking-tight"
                  />
                </div>
              </div>
            </div>

            {/* End date + time */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-2 uppercase tracking-wider">Fin</label>
              <div className="flex gap-2">
                <DatePicker
                  value={endAt ? endAt.split("T")[0] : ""}
                  onChange={(d) => setEndAt(d ? `${d}T${(endAt.split("T")[1] || "13:00").slice(0,5)}` : "")}
                  placeholder="Date"
                />
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a3c] pointer-events-none" strokeWidth={2.5} />
                  <input
                    type="time"
                    value={endAt ? (endAt.split("T")[1] || "").slice(0,5) : ""}
                    onChange={(e) => {
                      const date = endAt.split("T")[0] || startAt.split("T")[0] || new Date().toISOString().slice(0,10);
                      setEndAt(`${date}T${e.target.value}`);
                    }}
                    style={{ height: "3.25rem" }}
                    className="pl-11 pr-4 rounded-2xl bg-stone-50 border-2 border-stone-200 text-sm font-bold text-stone-800 tabular-nums focus:outline-none focus:border-[#8b5a3c] focus:bg-white transition tracking-tight"
                  />
                </div>
              </div>
            </div>

            {/* Attendee chip picker */}
            <div ref={suggestionRef} className="relative">
              <label className="block text-xs text-zinc-500 mb-1">Invitados (opcional)</label>
              <div
                className="min-h-[42px] w-full px-2 py-1.5 rounded-lg border border-zinc-300 focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-1.5 cursor-text"
                onClick={() => contactInputRef.current?.focus()}
              >
                {attendees.map((a) => (
                  <span
                    key={a.email}
                    className="flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-medium"
                  >
                    {a.profile ? (
                      <span className="flex items-center gap-1">
                        <Avatar src={a.profile.avatar_url} name={a.profile.full_name} size="xs" />
                        {a.profile.full_name ?? a.profile.username}
                      </span>
                    ) : (
                      a.email
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeAttendee(a.email); }}
                      className="ml-0.5 text-blue-600 hover:text-blue-900 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={contactInputRef}
                  type="text"
                  value={contactInput}
                  onChange={(e) => { setContactInput(e.target.value); setShowSuggestions(true); }}
                  onKeyDown={handleContactKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={attendees.length === 0 ? "Buscar contacto o escribir email…" : ""}
                  className="flex-1 min-w-[160px] text-sm outline-none bg-transparent py-0.5"
                />
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && (contactInput.trim() !== "") && (
                <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {suggestions.length > 0 ? (
                    suggestions.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectContact(p)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 text-left transition"
                        >
                          <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-zinc-900 truncate">
                              {p.full_name ?? p.username}
                            </div>
                            <div className="text-xs text-zinc-500 truncate">@{p.username}</div>
                          </div>
                        </button>
                      </li>
                    ))
                  ) : (
                    contactInput.includes("@") ? (
                      <li>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addAttendeeByEmail(contactInput)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-50 text-left text-sm text-zinc-700"
                        >
                          Agregar <span className="font-medium">{contactInput.trim()}</span>
                        </button>
                      </li>
                    ) : (
                      <li className="px-3 py-2.5 text-xs text-zinc-400">
                        Sin contactos que coincidan. Escribí un email completo para invitar a alguien externo.
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>

            {/* Location — paste a Google Maps URL or use current location */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-2 uppercase tracking-wider">Ubicación</label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a3c] pointer-events-none" strokeWidth={2.5} />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Pegá un link de Google Maps o escribí la dirección"
                    className="w-full pl-11 pr-3 rounded-2xl bg-stone-50 border-2 border-stone-200 text-sm text-stone-800 focus:outline-none focus:border-[#8b5a3c] focus:bg-white transition"
                    style={{ height: "3.25rem" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.show("error", "Tu navegador no soporta geolocalización.");
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        const { latitude, longitude } = pos.coords;
                        try {
                          const r = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                            { headers: { "Accept-Language": "es" } }
                          );
                          const data = await r.json();
                          const addr = data.display_name as string | undefined;
                          if (addr) {
                            setLocation(addr);
                            toast.show("success", "Ubicación actual cargada.");
                          } else {
                            setLocation(`https://www.google.com/maps?q=${latitude},${longitude}`);
                            toast.show("success", "Coordenadas cargadas.");
                          }
                        } catch {
                          setLocation(`https://www.google.com/maps?q=${latitude},${longitude}`);
                          toast.show("success", "Coordenadas cargadas.");
                        }
                      },
                      () => toast.show("error", "No se pudo obtener tu ubicación."),
                      { timeout: 10000 }
                    );
                  }}
                  className="shrink-0 px-4 rounded-2xl bg-stone-900 text-[#faf6ef] text-sm font-bold hover:bg-[#8b5a3c] transition btn-modern whitespace-nowrap flex items-center gap-1.5"
                  style={{ height: "3.25rem" }}
                  title="Usar mi ubicación actual"
                >
                  <MapPin className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Mi ubicación</span>
                </button>
              </div>
            </div>

            {/* Online toggle + capacity */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="h-4 w-4 rounded accent-violet-600"
                />
                <span className="text-sm text-zinc-700">Evento online</span>
              </label>
              {!isOnline && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-500 whitespace-nowrap">Cupos máximos:</label>
                  <input
                    type="number"
                    min={1}
                    value={capacity ?? ""}
                    onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : null)}
                    placeholder="∞"
                    className="w-20 px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-[#8b5a3c] focus:ring-4 focus:ring-[#8b5a3c]/10 transition text-sm text-center"
                  />
                </div>
              )}
            </div>


            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-[#8b5a3c] focus:ring-4 focus:ring-[#8b5a3c]/10 transition text-sm resize-none"
            />

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Imagen del evento" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Quitar imagen"
                  className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition text-sm"
              >
                <ImagePlus className="h-4 w-4" />
                Subir imagen (opcional)
              </button>
            )}

            <div>
              <label className="block text-xs text-zinc-500 mb-2">Color del evento</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_COLORS.map((c) => {
                  const styles = getEventColorStyles(c);
                  const active = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      title={EVENT_COLOR_LABEL[c]}
                      aria-label={EVENT_COLOR_LABEL[c]}
                      className={`h-8 w-8 rounded-full ${styles.dot} flex items-center justify-center transition ring-offset-2 ${
                        active ? `ring-2 ${styles.ring}` : "hover:scale-110"
                      }`}
                    >
                      {active && <Check className="h-4 w-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live preview */}
            {(title || imagePreview || startAt) && (
              <div className="pt-2">
                <p className="text-xs text-zinc-500 mb-2">Vista previa</p>
                <div
                  className={`rounded-2xl border overflow-hidden ${getEventColorStyles(color).card} ${getEventColorStyles(color).border}`}
                >
                  {imagePreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt={title || "Preview"} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-zinc-900 truncate">
                      {title || "Título del evento"}
                    </h3>
                    {startAt && (
                      <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(startAt).toLocaleString("es-AR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {location && (
                      <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (calendarRequired && needsCalendarConnect)}
              className="w-full h-13 rounded-2xl bg-stone-900 text-[#faf6ef] font-extrabold text-base hover:bg-stone-700 transition disabled:opacity-60 tracking-tight btn-modern"
              style={{ height: "3.25rem" }}
            >
              {submitting ? "..." : editingId ? "Guardar" : "Crear"}
            </button>
            {calendarRequired && needsCalendarConnect && (
              <p className="text-xs text-amber-600 text-center">
                Conectá tu calendario para invitar gente.
              </p>
            )}
          </form>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-3">Tus eventos</h2>
          <div className="mb-3">
            <SearchBar value={query} onChange={setQuery} placeholder="Buscar tus eventos…" />
          </div>
          {(() => {
            const q = query.trim().toLowerCase();
            const filtered = q
              ? events.filter(
                  (e) =>
                    e.title.toLowerCase().includes(q) ||
                    (e.description ?? "").toLowerCase().includes(q) ||
                    (e.location ?? "").toLowerCase().includes(q) ||
                    e.attendee_emails.some((em) => em.toLowerCase().includes(q))
                )
              : events;
            if (filtered.length === 0) {
              return (
                <div className="text-sm text-zinc-500 text-center py-8 bg-white rounded-2xl border border-zinc-200">
                  {q ? "Sin resultados." : "Todavía no creaste ningún evento."}
                </div>
              );
            }
            return (
              <ul className="space-y-2">
                {filtered.map((ev) => {
                  const evStyles = getEventColorStyles(ev.color);
                  return (
                    <li
                      key={ev.id}
                      className={`rounded-2xl border overflow-hidden shadow-sm transition ${evStyles.card} ${
                        editingId === ev.id ? "border-blue-400 ring-2 ring-blue-100" : evStyles.border
                      }`}
                    >
                      {ev.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.image_url} alt={ev.title} className="w-full h-32 object-cover" />
                      )}
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-zinc-900 truncate">{ev.title}</h3>
                            {ev.visibility === "public" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                <Globe className="h-3 w-3" /> Público
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                                <Lock className="h-3 w-3" /> Privado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{formatDate(ev.start_at)}</p>
                          {ev.location && (
                            <p className="text-xs text-zinc-500 mt-0.5">📍 {ev.location}</p>
                          )}
                          {ev.attendee_emails.length > 0 && (
                            <p className="text-xs text-zinc-400 mt-1.5 truncate">
                              Para: {ev.attendee_emails.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => startEdit(ev)}
                            disabled={deletingId === ev.id}
                            aria-label="Editar"
                            title="Editar"
                            className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition disabled:opacity-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev)}
                            disabled={deletingId === ev.id}
                            aria-label="Cancelar evento"
                            title="Cancelar evento"
                            className="h-8 w-8 flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          >
                            {deletingId === ev.id ? (
                              <span className="text-xs">…</span>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </section>
      </main>

      <Toast state={toast.state} />
    </div>
  );
}
