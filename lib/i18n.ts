"use client";

import { useEffect, useState } from "react";

export type Lang = "en" | "es";
const STORAGE_KEY = "agenddi_lang";

type Dict = Record<string, { en: string; es: string }>;

const dict: Dict = {
  // ── NavBar ──
  nav_home: { en: "Home", es: "Inicio" },
  nav_create: { en: "Create", es: "Crear" },
  nav_contacts: { en: "Contacts", es: "Contactos" },
  nav_logout: { en: "Sign out", es: "Salir" },

  // ── Landing ──
  landing_login: { en: "Sign in", es: "Iniciar sesión" },
  landing_hero: { en: "Discover", es: "Descubrí" },
  landing_subtitle: {
    en: "Events near you, in your city, with your people —",
    es: "Eventos cerca tuyo, en tu ciudad, con tu gente —",
  },
  landing_subtitle_accent: { en: "effortlessly", es: "sin esfuerzo" },
  landing_public_events: { en: "Public events", es: "Eventos públicos" },

  // ── NearbyEvents ──
  ne_label: { en: "Near you", es: "Cerca tuyo" },
  ne_title: { en: "Events near you", es: "Eventos cerca tuyo" },
  ne_count: { en: "{n} events across the world", es: "{n} eventos en todo el mundo" },
  ne_city_all: { en: "All cities", es: "Todas las ciudades" },
  ne_city_search: { en: "Find city…", es: "Buscar ciudad…" },
  ne_all: { en: "All", es: "Todos" },
  ne_add: { en: "Add to Agenddi", es: "Agregar a Agenddi" },
  ne_add_cal: { en: "Add to calendar", es: "Agregar al calendario" },
  ne_share: { en: "Share", es: "Compartir" },
  ne_copied: { en: "Copied!", es: "¡Copiado!" },
  ne_spot_one: { en: "1 spot left", es: "Queda 1 cupo" },
  ne_spot_many: { en: "{n} spots left", es: "Quedan {n} cupos" },
  ne_attend_one: { en: "1 person going", es: "1 persona va" },
  ne_attend_many: { en: "{n} people going", es: "{n} personas van" },
  ne_close: { en: "Close", es: "Cerrar" },
  ne_search: { en: "Search by keyword, neighborhood, city…", es: "Buscar por palabra, barrio, ciudad…" },
  ne_no_results: { en: "No events match", es: "Ningún evento coincide con" },
  ne_clear: { en: "Clear", es: "Limpiar" },
  ne_showing: { en: "Showing {n} of {total}", es: "Mostrando {n} de {total}" },
  ne_prev: { en: "Previous", es: "Anterior" },
  ne_next: { en: "Next", es: "Siguiente" },

  // ── Main page (HomePage) ──
  page_tab_discover: { en: "Discover", es: "Descubrí" },
  page_tab_events: { en: "Events", es: "Eventos" },
  filter_all: { en: "All", es: "Todos" },
  page_tab_agenddi: { en: "My Agenddi", es: "Mi Agenddi" },
  page_tab_calendar: { en: "Calendar", es: "Calendario" },
  agenda_sub_contacts: { en: "Contacts", es: "Contactos" },
  agenda_sub_channels: { en: "Channels", es: "Canales" },
  agenda_sub_calendar: { en: "Calendar", es: "Calendario" },
  agenda_sub_profile: { en: "Profile", es: "Perfil" },
  create_event_cta: { en: "Create", es: "Crear" },
  create_event_sub: { en: "Share with your people", es: "Compartilo con tu gente" },
  channels_empty: { en: "No channels yet. Create one to share events with a group.", es: "Todavía no tenés canales. Creá uno para compartir eventos con un grupo." },
  contacts_search_people: { en: "Search people…", es: "Buscar personas…" },
  channels_search: { en: "Search channels…", es: "Buscar canales…" },
  join: { en: "Join", es: "Unirme" },
  joined: { en: "Joined", es: "Unido" },
  contacts_search_empty: { en: "No people found.", es: "No se encontraron personas." },
  channels_search_empty: { en: "No channels found.", es: "No se encontraron canales." },
  channels_create: { en: "New channel", es: "Nuevo canal" },
  channel_name: { en: "Channel name", es: "Nombre del canal" },
  channel_desc: { en: "Description (optional)", es: "Descripción (opcional)" },
  channel_create_btn: { en: "Create channel", es: "Crear canal" },
  cancel: { en: "Cancel", es: "Cancelar" },
  share: { en: "Share", es: "Compartir" },
  delete: { en: "Delete", es: "Eliminar" },
  edit_profile: { en: "Edit profile", es: "Editar perfil" },
  view_public_profile: { en: "View public profile", es: "Ver perfil público" },
  open_in_maps: { en: "Open in Google Maps", es: "Abrir en Google Maps" },
  address_label: { en: "Address", es: "Dirección" },
  page_filter_public: { en: "Public", es: "Públicos" },
  page_filter_private: { en: "Private", es: "Privados" },
  page_filter_mine: { en: "Mine", es: "Míos" },
  page_search_events: { en: "Search events…", es: "Buscar eventos…" },
  page_no_results: { en: "No results for your search.", es: "Sin resultados para tu búsqueda." },
  page_no_following: {
    en: "You're not following anyone yet.",
    es: "No estás siguiendo a nadie todavía.",
  },
  page_no_following_hint: {
    en: "Search profiles and follow them to see their public events.",
    es: "Buscá perfiles y seguilos para ver sus eventos públicos.",
  },
  page_following_no_events: {
    en: "The people you follow haven't published events yet.",
    es: "Las personas que seguís no publicaron eventos todavía.",
  },
  page_no_private: {
    en: "You haven't been invited to any private event yet.",
    es: "No te invitaron a ningún evento privado todavía.",
  },
  page_no_mine: { en: "You haven't created any events yet.", es: "Todavía no creaste ningún evento." },
  page_first_event: { en: "Create your first event →", es: "Creá tu primer evento →" },
  page_upcoming: { en: "Upcoming events", es: "Próximos eventos" },
  page_no_day_events: { en: "No events this day.", es: "Sin eventos este día." },
  page_no_upcoming: { en: "No upcoming events.", es: "No hay eventos próximos." },
  page_loading: { en: "Loading…", es: "Cargando…" },
  page_confirmed: { en: "confirmed", es: "confirmó" },
  page_confirmed_many: { en: "confirmed", es: "confirmaron" },

  // RSVP
  rsvp_confirm: { en: "Confirm", es: "Confirmar" },
  rsvp_confirmed: { en: "Confirmed", es: "Confirmado" },
  rsvp_decline: { en: "Can't go", es: "No puedo ir" },
  rsvp_declined: { en: "Can't go", es: "No puedo" },
  follow_btn: { en: "Follow", es: "Seguir" },

  // ── Contacts ──
  contacts_title: { en: "Contacts", es: "Contactos" },
  contacts_invite: { en: "Invite to Agenddi", es: "Invitar a Agenddi" },
  contacts_invite_short: { en: "Invite", es: "Invitar" },
  contacts_copied: { en: "Copied", es: "Copiado" },
  contacts_search: { en: "Search Agenddi users…", es: "Buscar usuarios en Agenddi…" },
  contacts_searching: { en: "Searching…", es: "Buscando…" },
  contacts_no_results: { en: "No users found.", es: "No se encontraron usuarios." },
  contacts_tab_contacts: { en: "Contacts", es: "Contactos" },
  contacts_tab_following: { en: "Following", es: "Seguidos" },
  contacts_add: { en: "Add", es: "Añadir" },
  contacts_pending: { en: "Pending", es: "Enviada" },
  contacts_contact: { en: "Contact", es: "Contacto" },
  contacts_empty_contacts: { en: "No contacts yet.", es: "Todavía no tenés contactos." },
  contacts_empty_following: { en: "Not following anyone yet.", es: "Todavía no seguís a nadie." },

  // ── Notifications ──
  notif_title: { en: "Notifications", es: "Notificaciones" },
  notif_empty: { en: "No notifications yet.", es: "No tenés notificaciones todavía." },
  notif_accept: { en: "Accept", es: "Aceptar" },
  notif_reject: { en: "Reject", es: "Rechazar" },
  notif_wants_connect: { en: "wants to connect with you.", es: "quiere conectar contigo." },
  notif_accepted: { en: "accepted your request.", es: "aceptó tu solicitud." },
  notif_rejected: { en: "Request rejected.", es: "Solicitud rechazada." },
  notif_invited: { en: "invited you to", es: "te invitó a" },
  notif_now_contact: { en: "You're now a contact of", es: "¡Ahora sos contacto de" },
};

const listeners = new Set<(l: Lang) => void>();
let _lang: Lang = "en";

function getInitial(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "es" || saved === "en" ? (saved as Lang) : "en";
}

export function useT() {
  const [lang, setLangState] = useState<Lang>(_lang);

  useEffect(() => {
    _lang = getInitial();
    setLangState(_lang);
    const cb = (l: Lang) => setLangState(l);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const t = (key: keyof typeof dict | string, vars?: Record<string, string | number>) => {
    const entry = dict[key];
    let str = entry ? entry[lang] : key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
    return str;
  };

  const setLang = (l: Lang) => {
    _lang = l;
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
    listeners.forEach((cb) => cb(l));
  };

  return { t, lang, setLang };
}
