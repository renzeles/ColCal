"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, MapPin, RotateCcw, Search, Share2, Users, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { DatePicker } from "./DatePicker";
import { generateWorldEvents } from "@/lib/world-events";

export type DemoEvent = {
  id: string;
  title: string;
  venue: string;
  hood: string;
  city: string;
  country?: string;
  location: string;
  dateLabel: string;
  timeLabel: string;
  image: string;
  startISO: string;
  endISO: string;
  spots: number;
  attendees: string[];
};

// ── Image pool by category ───────────────────────────────────────────────────
const I = {
  food: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&h=500",
  ],
  bar: [
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&h=500",
  ],
  music: [
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&h=500",
  ],
  art: [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1577083552431-6e5fd01f1b81?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&h=500",
  ],
  outdoor: [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&h=500",
  ],
  wellness: [
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=800&h=500",
  ],
  dance: [
    "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=800&h=500",
  ],
  comedy: [
    "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&h=500",
  ],
  wine: [
    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&h=500",
  ],
  sport: [
    "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&h=500",
  ],
};

type Cat = keyof typeof I;
let _imgCounter = 0;
function img(cat: Cat) {
  const arr = I[cat];
  return arr[_imgCounter++ % arr.length];
}

// ── Event helper ─────────────────────────────────────────────────────────────
const FIRSTS = ["Martina", "Lucas", "Sofía", "Andrés", "Valentina", "Tomás", "Camila", "Ignacio", "Florencia", "Ramiro", "Paula", "Diego", "Carolina", "Julieta", "Marcos", "Renata", "Bruno", "Elena", "Nicolás", "Agustina", "Felipe", "Lucía", "Mateo", "Catalina", "Joaquín"];
const LASTS = ["R.", "F.", "M.", "P.", "G.", "K.", "B.", "W.", "D.", "S.", "T.", "V.", "N.", "A.", "L.", "C."];

function attendees(n: number, seed: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.min(n, 6); i++) {
    const a = FIRSTS[(seed + i * 3) % FIRSTS.length];
    const b = LASTS[(seed + i * 7) % LASTS.length];
    out.push(`${a} ${b}`);
  }
  return out;
}

function ev(
  id: number,
  title: string,
  venue: string,
  hood: string,
  city: string,
  iso: string,
  durationHrs: number,
  spots: number,
  cat: Cat
): DemoEvent {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationHrs * 3_600_000);
  const dateLabel = start
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .replace(/\./g, "");
  const timeLabel = start.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return {
    id: String(id),
    title,
    venue,
    hood,
    city,
    location: `${hood}, ${city}`,
    dateLabel,
    timeLabel,
    image: img(cat),
    startISO: iso,
    endISO: end.toISOString().slice(0, 19),
    spots,
    attendees: attendees(Math.min(spots, 5), id),
  };
}

// ── 100 events across Argentina ──────────────────────────────────────────────
const AR_EVENTS: DemoEvent[] = [
  // ─── CABA ───
  ev(1,  "Chef en Vivo",            "La Parrilla del Puerto", "Puerto Madero",  "CABA", "2026-05-16T21:00:00", 2.5, 12, "food"),
  ev(2,  "Rolling Stones Tribute",  "Bar Hood",               "Palermo",        "CABA", "2026-05-17T22:00:00", 3,    5, "music"),
  ev(3,  "Noche de Jazz",           "Club del Vino",          "Chacarita",      "CABA", "2026-05-21T20:30:00", 2.5, 20, "music"),
  ev(4,  "Mercado de Arte",         "Plaza Serrano",          "Palermo Soho",   "CABA", "2026-05-23T11:00:00", 8,   80, "art"),
  ev(5,  "Stand Up Comedy",         "El Cotorro",             "San Telmo",      "CABA", "2026-05-29T21:30:00", 2,    3, "comedy"),
  ev(6,  "Cócteles con Historia",   "Florería Atlántico",     "Retiro",         "CABA", "2026-05-27T20:00:00", 3,   18, "bar"),
  ev(7,  "Cena Maridaje",           "Tegui",                  "Palermo",        "CABA", "2026-05-30T20:30:00", 3,    8, "wine"),
  ev(8,  "DJ Set Electrónico",      "Niceto Club",            "Palermo Hollywood", "CABA", "2026-06-05T23:30:00", 4, 60, "music"),
  ev(9,  "Yoga al Amanecer",        "Parque Las Heras",       "Palermo",        "CABA", "2026-06-07T07:00:00", 1.5, 25, "wellness"),
  ev(10, "Tour de Murales",         "Punto de Encuentro",     "Villa Crespo",   "CABA", "2026-06-08T15:00:00", 2,   15, "art"),
  ev(11, "Trivia Pub",              "Antares",                "Almagro",        "CABA", "2026-06-09T20:00:00", 2.5, 30, "bar"),
  ev(12, "Cine al Aire Libre",      "Plaza Irlanda",          "Caballito",      "CABA", "2026-06-10T19:30:00", 2.5, 50, "outdoor"),
  ev(13, "Brunch Dominical",        "Birkin",                 "Palermo Soho",   "CABA", "2026-06-14T11:00:00", 3,   20, "food"),
  ev(14, "Milonga para Principiantes", "El Beso",             "Balvanera",      "CABA", "2026-06-15T21:00:00", 3,   16, "dance"),
  ev(15, "Charla TED",              "Konex",                  "Abasto",         "CABA", "2026-06-17T19:00:00", 2,  100, "art"),
  ev(16, "Festival Ramen",          "Barrio Chino",           "Belgrano",       "CABA", "2026-06-19T12:00:00", 6,  150, "food"),
  ev(17, "Banda Indie",             "Vinilo",                 "Almagro",        "CABA", "2026-06-20T22:00:00", 3,   25, "music"),
  ev(18, "Catación de Café",        "Lab Tostadores",         "Palermo Hollywood", "CABA", "2026-06-21T16:00:00", 1.5, 14, "food"),
  ev(19, "Recorrido Histórico",     "Cabildo",                "Monserrat",      "CABA", "2026-06-22T10:00:00", 2,   30, "art"),
  ev(20, "Salsa & Bachata",         "La Viruta",              "Palermo Soho",   "CABA", "2026-06-23T22:30:00", 4,   40, "dance"),
  ev(21, "Clase de Cerámica",       "Estudio Tierra",         "Villa Urquiza",  "CABA", "2026-06-24T18:00:00", 2.5, 10, "art"),
  ev(22, "After Office",            "Buller Brewing",         "Recoleta",       "CABA", "2026-06-25T19:00:00", 3,   45, "bar"),
  ev(23, "Trail Running",           "Reserva Costanera",      "Costanera Sur",  "CABA", "2026-06-26T08:00:00", 2,   35, "sport"),
  ev(24, "Cena Vegana",             "Buenos Aires Verde",     "Palermo",        "CABA", "2026-06-27T20:30:00", 2.5, 18, "food"),
  ev(25, "Show de Tango",           "Bar Sur",                "San Telmo",      "CABA", "2026-06-28T21:00:00", 2,   40, "dance"),
  ev(26, "Lectura de Poesía",       "Eterna Cadencia",        "Palermo",        "CABA", "2026-06-29T19:30:00", 1.5, 25, "art"),
  ev(27, "Pizza Tour",              "Pizzería Güerrín",       "Microcentro",    "CABA", "2026-07-01T20:00:00", 3,   16, "food"),
  ev(28, "Mercado Orgánico",        "Bonpland",               "Palermo Hollywood", "CABA", "2026-07-04T10:00:00", 5, 200, "food"),
  ev(29, "Concierto de Cámara",     "Teatro Coliseo",         "Retiro",         "CABA", "2026-07-05T20:00:00", 2.5, 80, "music"),
  ev(30, "Workshop de Fotografía",  "Centro Cultural Recoleta","Recoleta",      "CABA", "2026-07-06T15:00:00", 3,   12, "art"),
  ev(31, "Carrera Nocturna 5K",     "Plaza San Martín",       "Retiro",         "CABA", "2026-07-08T19:30:00", 1.5, 100, "sport"),
  ev(32, "Cena a Ciegas",           "Casa Ada",               "Coghlan",        "CABA", "2026-07-10T20:00:00", 3,   12, "food"),
  ev(33, "Open Mic",                "La Tangente",            "Villa Crespo",   "CABA", "2026-07-11T21:30:00", 2.5, 30, "comedy"),
  ev(34, "Picnic Cinéfilo",         "Bosques de Palermo",     "Palermo",        "CABA", "2026-07-12T16:00:00", 3,   60, "outdoor"),
  ev(35, "Taller de Pan de Masa Madre","Cocu",                "Recoleta",       "CABA", "2026-07-13T11:00:00", 3,    8, "food"),
  ev(36, "Funk en Vivo",            "Café Vinilo",            "Almagro",        "CABA", "2026-07-15T22:00:00", 3,   28, "music"),
  ev(37, "Speed Friending",         "Ninina",                 "Palermo",        "CABA", "2026-07-16T19:00:00", 2,   24, "bar"),
  ev(38, "Visita Guiada",           "Teatro Colón",           "San Nicolás",    "CABA", "2026-07-17T11:30:00", 1.5, 25, "art"),
  ev(39, "Drag Brunch",             "Pride Café",             "San Telmo",      "CABA", "2026-07-18T13:00:00", 2.5, 35, "comedy"),
  ev(40, "Karaoke Indie",           "Casa Brandon",           "Villa Crespo",   "CABA", "2026-07-19T22:00:00", 4,   45, "music"),
  ev(41, "Clase de Surf en Río",    "Costanera Norte",        "Núñez",          "CABA", "2026-07-20T09:00:00", 2,   12, "sport"),
  ev(42, "Cata de Cerveza Artesanal","On Tap",                "Palermo",        "CABA", "2026-07-22T19:00:00", 2,   20, "bar"),
  ev(43, "Charla de Astronomía",    "Planetario",             "Palermo",        "CABA", "2026-07-23T20:30:00", 1.5, 75, "art"),
  ev(44, "Asado de Barrio",         "Plazoleta del Pilar",    "Recoleta",       "CABA", "2026-07-25T13:00:00", 4,   30, "food"),
  ev(45, "Festival Indie",          "Konex",                  "Abasto",         "CABA", "2026-07-26T18:00:00", 6,  300, "music"),
  ev(46, "Yoga + Sound Bath",       "Templo Verde",           "Belgrano",       "CABA", "2026-07-28T18:00:00", 1.5, 18, "wellness"),
  ev(47, "Recorrido Boquense",      "Caminito",               "La Boca",        "CABA", "2026-07-29T11:00:00", 2,   25, "art"),
  ev(48, "Café & Vinyl",            "Lo de Joaquín Alberdi",  "Palermo",        "CABA", "2026-07-30T15:00:00", 3,   20, "music"),
  ev(49, "Speakeasy Cocktail Lab",  "Frank's",                "Palermo Hollywood", "CABA", "2026-07-31T21:00:00", 3, 14, "bar"),
  ev(50, "Festival de Empanadas",   "Plaza Mafalda",          "Colegiales",     "CABA", "2026-08-01T12:00:00", 6,  120, "food"),
  ev(51, "Cumbia Pop",              "Strummer",               "Villa Crespo",   "CABA", "2026-08-02T22:30:00", 4,   80, "dance"),
  ev(52, "Maratón de Cortos",       "Cine Lorca",             "San Nicolás",    "CABA", "2026-08-03T18:30:00", 3,   60, "art"),
  ev(53, "Caminata Histórica",      "Casa Rosada",            "Monserrat",      "CABA", "2026-08-05T10:30:00", 2,   30, "art"),
  ev(54, "Bondiola y Cerveza",      "Antares",                "Caballito",      "CABA", "2026-08-06T20:00:00", 2.5, 40, "food"),
  ev(55, "Workshop Sushi",          "Osaka",                  "Puerto Madero",  "CABA", "2026-08-07T19:00:00", 2.5,  6, "food"),
  ev(56, "Bicicleteada",            "Reserva Ecológica",      "Costanera Sur",  "CABA", "2026-08-08T09:00:00", 3,   50, "sport"),
  ev(57, "Tributo a Spinetta",      "Café La Humedad",        "Boedo",          "CABA", "2026-08-09T22:00:00", 3,   35, "music"),
  ev(58, "Mercado Vintage",         "Galpón de Bellas Artes", "Mataderos",      "CABA", "2026-08-10T11:00:00", 7,  100, "art"),
  ev(59, "Cena con Strangers",      "Casa Saltshaker",        "Recoleta",       "CABA", "2026-08-12T20:30:00", 3,   10, "food"),
  ev(60, "Improvisación Teatral",   "Paseo La Plaza",         "San Nicolás",    "CABA", "2026-08-13T21:00:00", 2,   60, "comedy"),
  ev(61, "Picnic Eléctrico",        "Parque Centenario",      "Caballito",      "CABA", "2026-08-15T17:00:00", 4,   80, "outdoor"),
  ev(62, "Catación de Vermut",      "Bar 6",                  "Palermo Soho",   "CABA", "2026-08-16T19:30:00", 2,   16, "bar"),
  ev(63, "Slam de Poesía",          "Casa de la Poesía",      "San Telmo",      "CABA", "2026-08-17T20:00:00", 2.5, 40, "art"),
  ev(64, "Skate Sesión",            "Skatepark Costanera",    "Costanera Sur",  "CABA", "2026-08-18T16:00:00", 2,   25, "sport"),
  ev(65, "Cena de Pasta Fresca",    "I Latina",               "Colegiales",     "CABA", "2026-08-19T20:30:00", 2.5, 22, "food"),

  // ─── GBA / Provincia ───
  ev(66, "Atardecer en Tigre",      "Puerto de Frutos",       "Tigre Centro",   "Buenos Aires", "2026-05-30T17:00:00", 3,  50, "outdoor"),
  ev(67, "Festival del Río",        "Costanera",              "San Isidro",     "Buenos Aires", "2026-06-13T11:00:00", 8, 200, "outdoor"),
  ev(68, "Cervecería Bonaerense",   "Patagonia Brewing",      "Vicente López",  "Buenos Aires", "2026-06-19T19:00:00", 3,  35, "bar"),
  ev(69, "Bandas en Quilmes",       "Teatro Metropolitan",    "Quilmes Centro", "Buenos Aires", "2026-06-26T21:00:00", 3,  80, "music"),
  ev(70, "Feria del Libro",         "Pasaje Dardo Rocha",     "La Plata",       "Buenos Aires", "2026-07-04T11:00:00", 7, 250, "art"),
  ev(71, "Surf en Mardel",          "Playa Grande",           "Mar del Plata",  "Buenos Aires", "2026-07-12T08:00:00", 3,  20, "sport"),
  ev(72, "Cena en Pinamar",         "Tantamar",               "Cariló",         "Buenos Aires", "2026-07-18T21:00:00", 3,  16, "food"),
  ev(73, "Trekking Sierras",        "Cerro La Movediza",      "Tandil",         "Buenos Aires", "2026-07-25T09:00:00", 5,  30, "outdoor"),
  ev(74, "Asado en Pilar",          "Estancia La Carolina",   "Pilar",          "Buenos Aires", "2026-08-01T13:00:00", 5,  60, "food"),
  ev(75, "Festival de Jazz",        "Centro Cultural Pasaje", "Olivos",         "Buenos Aires", "2026-08-08T20:00:00", 3,  90, "music"),

  // ─── Córdoba ───
  ev(76, "Cuarteto en Vivo",        "Sala del Rey",           "Nueva Córdoba",  "Córdoba", "2026-06-06T22:00:00", 4, 200, "music"),
  ev(77, "Café de Especialidad",    "El Trébol",              "Güemes",         "Córdoba", "2026-06-13T10:30:00", 2,  20, "food"),
  ev(78, "Trekking en Sierras",     "La Cumbrecita",          "Calamuchita",    "Córdoba", "2026-06-21T08:00:00", 6,  40, "outdoor"),
  ev(79, "Festival Doc",            "Cineclub Hugo del Carril","Centro",        "Córdoba", "2026-07-04T17:00:00", 4,  90, "art"),
  ev(80, "Bachata Cordobesa",       "Estudio Tropical",       "Cerro de las Rosas","Córdoba", "2026-07-19T22:00:00", 3, 50, "dance"),

  // ─── Rosario ───
  ev(81, "Atardecer en el Paraná",  "Parque España",          "Pichincha",      "Rosario", "2026-06-12T18:00:00", 2.5, 50, "outdoor"),
  ev(82, "Show de Trova",           "La Sede",                "Centro",         "Rosario", "2026-06-26T21:30:00", 3,  60, "music"),
  ev(83, "Mercado Gourmet",         "Mercado del Patio",      "Pichincha",      "Rosario", "2026-07-11T11:00:00", 6, 180, "food"),
  ev(84, "Pintura al Aire Libre",   "Monumento a la Bandera", "Centro",         "Rosario", "2026-07-25T15:00:00", 3,  20, "art"),

  // ─── Mendoza ───
  ev(85, "Cata en Bodega",          "Bodega Achaval-Ferrer",  "Luján de Cuyo",  "Mendoza", "2026-06-07T15:00:00", 3,  18, "wine"),
  ev(86, "Ruta del Vino",           "Catena Zapata",          "Agrelo",         "Mendoza", "2026-06-21T11:00:00", 5,  24, "wine"),
  ev(87, "Trekking Cordillera",     "Vallecitos",             "Las Heras",      "Mendoza", "2026-07-12T07:00:00", 8,  20, "outdoor"),
  ev(88, "Cena en los Andes",       "Los Olivos",             "Chacras de Coria","Mendoza","2026-07-26T20:30:00", 3,  16, "food"),
  ev(89, "Feria de Diseño",         "Arena Maipú",            "Maipú",          "Mendoza", "2026-08-08T14:00:00", 6,  90, "art"),

  // ─── Patagonia ───
  ev(90, "Esquí Nocturno",          "Cerro Catedral",         "Bariloche",      "Río Negro", "2026-07-04T19:00:00", 3,  40, "sport"),
  ev(91, "Fondue & Música",         "Club Andino",            "Bariloche Centro","Río Negro","2026-07-11T21:00:00", 3,  30, "food"),
  ev(92, "Travesía Lacustre",       "Lago Lácar",             "San Martín de los Andes", "Neuquén", "2026-07-18T09:00:00", 6, 25, "outdoor"),
  ev(93, "Glaciar Perito Moreno",   "Parque Nacional",        "El Calafate",    "Santa Cruz", "2026-08-02T10:00:00", 7,  30, "outdoor"),
  ev(94, "Trekking del Fin del Mundo","Sendero Costero",      "Ushuaia",        "Tierra del Fuego", "2026-08-15T09:00:00", 6, 22, "outdoor"),
  ev(95, "Festival Cervecero",      "Centro Cívico",          "El Bolsón",      "Río Negro", "2026-08-22T13:00:00", 8, 300, "bar"),

  // ─── Norte ───
  ev(96, "Peña Folklórica",         "La Casona del Molino",   "Salta Capital",  "Salta",     "2026-06-14T22:00:00", 4, 80, "music"),
  ev(97, "Empanadas y Vino Patero", "Casa de los Jiménez",    "Cafayate",       "Salta",     "2026-07-05T13:00:00", 3, 20, "food"),
  ev(98, "Cabalgata por los Cerros","Estancia La Bordoñese",  "Tafí del Valle", "Tucumán",   "2026-07-19T10:00:00", 5, 18, "outdoor"),
  ev(99, "Carnaval del Norte",      "Plaza Belgrano",         "Humahuaca",      "Jujuy",     "2026-08-01T17:00:00", 6, 500, "dance"),
  ev(100,"Cataratas al Atardecer",  "Parque Nacional",        "Iguazú",         "Misiones",  "2026-08-09T16:00:00", 4, 40, "outdoor"),
];

// Worldwide events generated at module load (~5000 events across 50 cities)
const EVENTS: DemoEvent[] = [
  ...AR_EVENTS.map((e) => ({ ...e, country: "Argentina" })),
  ...generateWorldEvents(),
];

function gCalLink(ev: DemoEvent) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", ev.title);
  url.searchParams.set("dates", `${fmt(new Date(ev.startISO))}/${fmt(new Date(ev.endISO))}`);
  url.searchParams.set("details", `${ev.venue} · ${ev.location}${ev.country ? ", " + ev.country : ""}`);
  url.searchParams.set("location", `${ev.venue}, ${ev.location}${ev.country ? ", " + ev.country : ""}`);
  return url.toString();
}

const AVATAR_COLORS = [
  "bg-[#0f766e]", "bg-[#c2410c]", "bg-[#ca8a04]",
  "bg-stone-700", "bg-pink-700", "bg-blue-700", "bg-emerald-700",
];

function nameColor(name: string) {
  const code = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function EventDetailModal({
  ev, onClose, copied, onShare, onAdd,
}: {
  ev: DemoEvent;
  onClose: () => void;
  copied: string | null;
  onShare: (ev: DemoEvent) => void;
  onAdd?: (ev: DemoEvent) => void;
}) {
  const { t } = useT();
  const spotsClass =
    ev.spots <= 3 ? "bg-red-100 text-red-700"
    : ev.spots <= 7 ? "bg-amber-100 text-amber-700"
    : "bg-emerald-100 text-emerald-700";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-[#fbf6ee] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ev.image} alt={ev.title} className="w-full h-52 sm:h-64 object-cover" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
          aria-label={t("ne_close")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 space-y-4">
          <h3 className="text-2xl font-bold text-stone-900 leading-tight font-extrabold tracking-tight">
            {ev.title}
          </h3>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2 text-sm text-stone-600">
              <Calendar className="h-4 w-4 text-[#8b5a3c] shrink-0 mt-0.5" />
              <div>
                <div>{ev.dateLabel}</div>
                <div className="font-semibold tabular-nums text-stone-800">{ev.timeLabel}</div>
              </div>
            </div>

            {/* Address — venue + hood + city */}
            <div className="flex items-start gap-2 text-sm text-stone-600">
              <MapPin className="h-4 w-4 text-[#8b5a3c] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-stone-800">{ev.venue}</div>
                <div className="text-stone-500 text-xs">{ev.hood} · {ev.city}{ev.country ? `, ${ev.country}` : ""}</div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ev.venue}, ${ev.hood}, ${ev.city}${ev.country ? ", " + ev.country : ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-[#8b5a3c] hover:text-[#6b4423] transition cursor-pointer"
                >
                  {t("open_in_maps")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${spotsClass}`}>
            {ev.spots === 1 ? t("ne_spot_one") : t("ne_spot_many", { n: ev.spots })}
          </span>

          {ev.attendees.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Users className="h-4 w-4 text-[#8b5a3c]" />
                <span className="text-sm font-semibold text-stone-700">
                  {ev.attendees.length === 1 ? t("ne_attend_one") : t("ne_attend_many", { n: ev.attendees.length })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ev.attendees.map((name) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div
                      className={`h-10 w-10 rounded-full ${nameColor(name)} flex items-center justify-center text-white text-xs font-bold`}
                      title={name}
                    >
                      {initials(name)}
                    </div>
                    <span className="text-[10px] text-stone-500 max-w-[40px] text-center leading-tight truncate">
                      {name.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {onAdd ? (
              <button
                onClick={() => { onAdd(ev); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-900 text-[#faf6ef] text-sm font-semibold hover:bg-stone-700 transition cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                {t("ne_add")}
              </button>
            ) : (
              <a
                href={gCalLink(ev)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-900 text-[#faf6ef] text-sm font-semibold hover:bg-stone-700 transition cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                {t("ne_add_cal")}
              </a>
            )}
            <button
              onClick={() => onShare(ev)}
              className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              aria-label={t("ne_share")}
            >
              <Share2 className="h-4 w-4" />
              {copied === ev.id && <span className="ml-1.5 text-xs font-medium">{t("ne_copied")}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Diacritic-insensitive normalizer
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function formatPickedDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function NearbyEvents({ onAdd }: { onAdd?: (ev: DemoEvent) => void }) {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [pickedDate, setPickedDate] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<DemoEvent | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntilRef = useRef(0);
  // Mouse drag state
  const dragRef = useRef<{ down: boolean; startX: number; startScroll: number; moved: boolean }>({
    down: false, startX: 0, startScroll: 0, moved: false,
  });

  const allCities = useMemo(() => {
    const set = new Set<string>();
    EVENTS.forEach((e) => set.add(e.city));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  // GPS detection on mount → set default city if it matches one in events
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (!r.ok || cancelled) return;
          const data = await r.json();
          const detected =
            data.address?.city ||
            data.address?.town ||
            data.address?.state ||
            data.address?.country;
          if (!detected) return;
          const match = allCities.find((c) => norm(c) === norm(detected));
          if (match && !cancelled) setSelectedCity(match);
        } catch { /* silent */ }
      },
      () => {},
      { timeout: 10000, maximumAge: 600000 }
    );
    return () => { cancelled = true; };
  }, [allCities]);

  const filteredEvents = useMemo(() => {
    const q = norm(query.trim());
    return EVENTS.filter((e) => {
      if (q) {
        const matches =
          norm(e.title).includes(q) ||
          norm(e.venue).includes(q) ||
          norm(e.hood).includes(q) ||
          norm(e.city).includes(q);
        if (!matches) return false;
      }
      if (pickedDate && e.startISO.slice(0, 10) !== pickedDate) return false;
      if (selectedCity !== "all" && e.city !== selectedCity) return false;
      return true;
    });
  }, [query, pickedDate, selectedCity]);

  const n = filteredEvents.length;
  const total = EVENTS.length;
  const isFiltering = query.trim().length > 0 || pickedDate.length > 0 || selectedCity !== "all";

  function pauseAutoRotate(ms = 6000) {
    pausedUntilRef.current = Date.now() + ms;
  }

  function clearAll() {
    setQuery("");
    setPickedDate("");
    setSelectedCity("all");
  }

  // Reset scroll when filter changes
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [query, pickedDate, selectedCity]);

  function getStride(): number {
    const el = trackRef.current;
    if (!el) return 0;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return 0;
    return first.offsetWidth + 12;
  }

  function scrollByCard(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    pauseAutoRotate();
    const stride = getStride();
    if (!stride) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    let target = el.scrollLeft + stride * dir;
    if (target > maxScroll + 5) target = 0;
    if (target < -5) target = maxScroll;
    el.scrollTo({ left: target, behavior: "smooth" });
  }

  // Auto-rotate every 4.5s — pauses on user interaction
  useEffect(() => {
    const id = setInterval(() => {
      if (selected !== null) return;
      if (Date.now() < pausedUntilRef.current) return;
      const el = trackRef.current;
      if (!el) return;
      const stride = getStride();
      if (!stride) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft + stride > maxScroll) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: stride, behavior: "smooth" });
      }
    }, 4500);
    return () => clearInterval(id);
  }, [selected, n]);

  // Mouse drag-to-scroll
  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el) return;
    dragRef.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft, moved: false };
    pauseAutoRotate();
  }
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d.down) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.pageX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    el.scrollLeft = d.startScroll - dx;
  }
  function endDrag() { dragRef.current.down = false; }

  async function share(ev: DemoEvent) {
    const text = `${ev.title} · ${ev.dateLabel} ${ev.timeLabel} · ${ev.venue} · ${ev.hood}`;
    if (navigator.share) {
      try { await navigator.share({ title: ev.title, text }); return; } catch { /**/ }
    }
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(ev.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <section className="bg-white rounded-[28px] card-shadow p-5 sm:p-8">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="h-3 w-3 text-[#8b5a3c]" strokeWidth={3} />
              <span className="eyebrow">{t("ne_label")}</span>
            </div>
            <h3 className="text-2xl sm:text-[34px] text-stone-900 leading-[1.05] font-extrabold tracking-tighter">
              {t("ne_title")}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => scrollByCard(-1)} aria-label={t("ne_prev")} className="h-9 w-9 rounded-full bg-stone-100 hover:bg-[#8b5a3c] text-stone-500 hover:text-white flex items-center justify-center transition btn-modern">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => scrollByCard(1)} aria-label={t("ne_next")} className="h-9 w-9 rounded-full bg-stone-100 hover:bg-[#8b5a3c] text-stone-500 hover:text-white flex items-center justify-center transition btn-modern">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* City dropdown — its own row below the title */}
        <div className="flex items-center gap-2 mb-5">
          <CityFilter
            cities={allCities}
            value={selectedCity}
            onChange={setSelectedCity}
            allLabel={t("ne_city_all")}
            searchPlaceholder={t("ne_city_search")}
          />
          <p className="text-sm text-stone-500 font-medium truncate">
            {isFiltering ? t("ne_showing", { n, total }) : t("ne_count", { n })}
          </p>
        </div>

        {/* Search + date picker + single clear */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#8b5a3c]" strokeWidth={2.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ne_search")}
              className="w-full rounded-2xl bg-stone-50 border border-stone-200 text-[15px] text-stone-900 font-medium focus:outline-none focus:border-[#8b5a3c] focus:bg-white focus:ring-4 focus:ring-[#8b5a3c]/8 transition-all placeholder:text-stone-400 placeholder:font-normal"
              style={{ paddingLeft: "3.25rem", paddingRight: "1rem", height: "3.25rem" }}
            />
          </div>

          <div className="flex gap-2">
            <DatePicker value={pickedDate} onChange={setPickedDate} placeholder="Date" />
            <ClearButton active={isFiltering} onClick={clearAll} label={t("ne_clear")} />
          </div>
        </div>

        {/* Carousel or empty state */}
        {n === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-3xl mb-3">🥐</div>
            <p className="text-sm text-stone-600">
              {t("ne_no_results")}{" "}
              {query && <span className="font-bold text-[#8b5a3c]">&ldquo;{query}&rdquo;</span>}
              {query && pickedDate && " · "}
              {pickedDate && (
                <span className="font-bold text-[#8b5a3c]">{formatPickedDate(pickedDate)}</span>
              )}
            </p>
            <button
              onClick={clearAll}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#8b5a3c] hover:text-[#6b4423] uppercase tracking-wider cursor-pointer"
            >
              {t("ne_clear")} →
            </button>
          </div>
        ) : (
          // Drag/swipe carousel — native scroll-snap, 3 cards visible, auto-rotates
          <div className="relative">
            <div
              ref={trackRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1 cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: "pan-y" }}
            >
              {filteredEvents.map((e) => (
                <div
                  key={e.id}
                  className="snap-start shrink-0 w-[78%] sm:w-[45%] md:w-[31%]"
                  onClickCapture={(ev) => {
                    // Prevent click after a drag
                    if (dragRef.current.moved) { ev.stopPropagation(); ev.preventDefault(); dragRef.current.moved = false; }
                  }}
                >
                  <EventCard ev={e} copied={copied} onShare={share} onOpen={() => setSelected(e)} onAdd={onAdd} />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
          </div>
        )}
      </section>

      {selected && (
        <EventDetailModal ev={selected} onClose={() => setSelected(null)} copied={copied} onShare={share} onAdd={onAdd} />
      )}
    </>
  );
}

function CityFilter({
  cities, value, onChange, allLabel, searchPlaceholder,
}: {
  cities: string[];
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = cities.filter((c) => norm(c).includes(norm(search.trim())));
  const label = value === "all" ? allLabel : value;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition ${
          value === "all"
            ? "bg-stone-100 text-stone-600 hover:bg-stone-200"
            : "bg-[#8b5a3c] text-white hover:bg-[#6b4423]"
        }`}
      >
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown className="h-3 w-3" strokeWidth={3} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)} />
          <div
            className="
              z-50 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden
              fixed left-2 right-2 top-20 sm:top-auto
              sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-[260px]
              animate-in fade-in slide-in-from-top-2 duration-150
            "
          >
            <div className="p-2 border-b border-stone-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" strokeWidth={2.5} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:border-[#8b5a3c] focus:bg-white"
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-[300px] overflow-y-auto py-1">
              <li>
                <button
                  onClick={() => { onChange("all"); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-4 py-2 text-sm font-semibold transition ${
                    value === "all" ? "bg-[#fbf6ee] text-[#8b5a3c]" : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {allLabel}
                </button>
              </li>
              {filtered.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                    className={`w-full text-left px-4 py-2 text-sm transition ${
                      value === c ? "bg-[#fbf6ee] text-[#8b5a3c] font-semibold" : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {c}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-stone-400 text-center">—</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function ClearButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!active}
      style={{ height: "3.25rem", width: "3.25rem" }}
      className={`shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer btn-modern ${
        active
          ? "bg-[#fbf6ee] border-[#8b5a3c]/30 text-[#8b5a3c] hover:bg-white hover:border-[#8b5a3c] hover:rotate-[-90deg]"
          : "bg-stone-50 border-stone-200 text-stone-300 cursor-not-allowed opacity-60"
      }`}
      aria-label={label}
      title={label}
    >
      <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.5} />
    </button>
  );
}

function EventCard({
  ev, copied, onShare, onOpen, onAdd,
}: {
  ev: DemoEvent;
  copied: string | null;
  onShare: (ev: DemoEvent) => void;
  onOpen: () => void;
  onAdd?: (ev: DemoEvent) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white card-shadow card-shadow-hover flex flex-col h-full">
      <button className="text-left w-full cursor-pointer" onClick={onOpen}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ev.image} alt={ev.title} className="w-full h-36 sm:h-40 object-cover" loading="lazy" />

        <div className="px-4 pt-3 pb-2">
          <h4 className="font-bold text-stone-900 text-base leading-snug line-clamp-2" style={{ fontFamily: "var(--font-serif)" }}>
            {ev.title}
          </h4>
          <p className="text-sm font-medium text-stone-600 truncate mt-1">{ev.venue}</p>
          <div className="flex items-center gap-1 text-xs text-stone-400 mt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{ev.city}</span>
          </div>
          <div className="flex items-start gap-1 text-xs text-stone-400 mt-0.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <div>{ev.dateLabel}</div>
              <div className="text-stone-500 font-medium tabular-nums">{ev.timeLabel}</div>
            </div>
          </div>
        </div>
      </button>

      <div className="flex gap-2 px-4 pb-4 mt-auto">
        {onAdd ? (
          <button
            onClick={() => onAdd(ev)}
            className="flex-1 flex items-center justify-center py-2 rounded-xl bg-stone-900 text-[#faf6ef] text-sm font-bold hover:bg-stone-700 transition cursor-pointer"
            aria-label="Agregar a Agenddi"
          >
            +
          </button>
        ) : (
          <a
            href={gCalLink(ev)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center py-2 rounded-xl bg-stone-900 text-[#faf6ef] text-sm font-bold hover:bg-stone-700 transition cursor-pointer"
            aria-label="Agregar al calendario"
          >
            +
          </a>
        )}
        <button
          onClick={() => onShare(ev)}
          className="flex items-center justify-center px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          aria-label="Compartir"
        >
          {copied === ev.id
            ? <span className="text-xs font-medium px-1">¡Copiado!</span>
            : <Share2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
