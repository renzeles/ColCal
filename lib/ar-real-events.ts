import type { DemoEvent } from "@/components/NearbyEvents";

// ─── Image pool ─────────────────────────────────────────────────────────────
const IMG = {
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
  cinema: [
    "https://images.unsplash.com/photo-1489599735734-79b4af4e1d4b?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&h=500",
  ],
  theater: [
    "https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=800&h=500",
  ],
  ski: [
    "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=800&h=500",
  ],
  adventure: [
    "https://images.unsplash.com/photo-1517428878-d4adc54f0fa7?auto=format&fit=crop&w=800&h=500",
  ],
};

type Cat = keyof typeof IMG;

// ─── Argentina cities + neighborhoods (weighted distribution) ───────────────
const CITIES: { name: string; weight: number; hoods: string[] }[] = [
  {
    name: "CABA", weight: 60,
    hoods: [
      "Palermo", "Palermo Soho", "Palermo Hollywood", "Recoleta", "San Telmo",
      "Belgrano", "Caballito", "Villa Crespo", "Almagro", "Chacarita",
      "Saavedra", "Núñez", "Colegiales", "Boedo", "Floresta", "Flores",
      "Constitución", "Barracas", "La Boca", "Puerto Madero", "Retiro",
      "San Nicolás", "Once", "Balvanera", "Monserrat", "Parque Patricios",
      "Villa Devoto", "Villa del Parque", "Mataderos", "Villa Urquiza",
      "Abasto", "Coghlan", "Microcentro",
    ],
  },
  { name: "La Plata", weight: 6, hoods: ["Centro", "Norte", "Tolosa", "City Bell", "Gonnet"] },
  { name: "Tigre", weight: 3, hoods: ["Tigre Centro", "Nordelta", "Don Torcuato", "Rincón de Milberg"] },
  { name: "San Isidro", weight: 3, hoods: ["Centro", "Acassuso", "Beccar", "Martínez"] },
  { name: "Vicente López", weight: 3, hoods: ["Olivos", "Florida", "La Lucila", "Munro"] },
  { name: "Mar del Plata", weight: 5, hoods: ["Centro", "Playa Grande", "Los Troncos", "Punta Mogotes", "Constitución"] },
  { name: "Mendoza", weight: 5, hoods: ["Centro", "Chacras de Coria", "Godoy Cruz", "Luján de Cuyo", "Maipú"] },
  { name: "Córdoba", weight: 5, hoods: ["Nueva Córdoba", "Güemes", "Cerro de las Rosas", "Centro", "General Paz"] },
  { name: "Rosario", weight: 4, hoods: ["Centro", "Pichincha", "Fisherton", "Echesortu", "Macrocentro"] },
  { name: "Bariloche", weight: 2, hoods: ["Centro", "Llao Llao", "Cerro Catedral", "Playa Bonita"] },
  { name: "Salta", weight: 2, hoods: ["Centro", "San Lorenzo", "Cafayate"] },
  { name: "Tucumán", weight: 1, hoods: ["Centro", "Yerba Buena", "Tafí del Valle"] },
  { name: "Pinamar", weight: 1, hoods: ["Centro", "Cariló", "Ostende"] },
];
const TOTAL_WEIGHT = CITIES.reduce((s, c) => s + c.weight, 0);

function pickCity(seed: number) {
  let r = ((seed * 9301 + 49297) >>> 0) % TOTAL_WEIGHT;
  for (const c of CITIES) {
    if (r < c.weight) return c;
    r -= c.weight;
  }
  return CITIES[0];
}

// ─── Invented venue names ───────────────────────────────────────────────────
const PREFIXES = ["Bar", "Café", "Espacio", "Club", "Sala", "Casa", "Patio", "Taller", "Estudio", "Centro", "Hostería", "Galpón"];
const NAMES = [
  "Aurora", "Limón", "Marea", "Mística", "Ronda", "Faro", "Bohemia", "Mosaico",
  "Aroma", "Luna", "Telar", "Sombra", "Vereda", "Tierra", "Bruma", "Ámbar",
  "Cardenal", "Olivo", "Mocambo", "Trova", "Esquina", "Velero", "Sirena",
  "Querido", "Refugio", "Mirador", "Tiempo", "Lince", "Brisa", "Cuarzo",
  "Maíz", "Trébol", "Caoba", "Origen", "Cisne", "Lirio", "Cumbre", "Niebla",
];

function venueName(seed: number) {
  return `${PREFIXES[seed % PREFIXES.length]} ${NAMES[(seed * 7 + 3) % NAMES.length]}`;
}

// ─── Categories with default times ──────────────────────────────────────────
type CatEntry = { cat: Cat; baseHour: number; durHr: number; weight: number };
const CATS: CatEntry[] = [
  { cat: "music", baseHour: 21, durHr: 3, weight: 22 },
  { cat: "food", baseHour: 21, durHr: 2.5, weight: 18 },
  { cat: "bar", baseHour: 20, durHr: 3, weight: 12 },
  { cat: "wine", baseHour: 19, durHr: 2, weight: 8 },
  { cat: "art", baseHour: 18, durHr: 2.5, weight: 10 },
  { cat: "theater", baseHour: 20, durHr: 2, weight: 8 },
  { cat: "comedy", baseHour: 21, durHr: 2, weight: 6 },
  { cat: "cinema", baseHour: 20, durHr: 2, weight: 5 },
  { cat: "dance", baseHour: 22, durHr: 4, weight: 6 },
  { cat: "wellness", baseHour: 8, durHr: 1.5, weight: 5 },
  { cat: "outdoor", baseHour: 10, durHr: 3, weight: 5 },
  { cat: "sport", baseHour: 9, durHr: 2, weight: 4 },
  { cat: "adventure", baseHour: 9, durHr: 5, weight: 2 },
  { cat: "ski", baseHour: 9, durHr: 6, weight: 1 },
];
const TOTAL_CAT_WEIGHT = CATS.reduce((s, c) => s + c.weight, 0);

function pickCat(seed: number): CatEntry {
  let r = ((seed * 31337 + 7919) >>> 0) % TOTAL_CAT_WEIGHT;
  for (const c of CATS) {
    if (r < c.weight) return c;
    r -= c.weight;
  }
  return CATS[0];
}

// ─── Title pools per category ───────────────────────────────────────────────
const TITLES: Record<Cat, string[]> = {
  music: [
    "Noche acústica", "Banda emergente", "Indie en vivo", "Set DJ", "Concierto íntimo",
    "Jazz quartet", "Folklore en vivo", "Tributo a Soda Stereo", "Tributo a Spinetta",
    "Tributo a Charly", "Tributo a Cerati", "Set electrónico", "Funk en vivo",
    "Blues night", "Orquesta típica", "Cumbia pop", "Reggae session", "Rock barrial",
    "Showcase de bandas", "Open mic musical",
  ],
  food: [
    "Cena maridada", "Menú degustación", "Cocina abierta", "Brunch dominical",
    "Asado experience", "Pasta fresca night", "Sushi omakase", "Cooking class: empanadas",
    "Chef en vivo", "Cena a ciegas", "Burger fest", "Picada gourmet",
    "Cena vegana", "Ramen night", "Cena de pasta", "Mariscos del día",
  ],
  bar: [
    "Cocktails de autor", "Cerveza artesanal night", "After office", "Speakeasy session",
    "Trivia & beers", "Vermut & vinilo", "Catación de gin", "Whisky tasting",
    "Cervecero invitado", "Karaoke night", "Pub quiz", "Cocktail masterclass",
  ],
  wine: [
    "Cata de Malbec", "Maridaje de vinos", "Cata a ciegas", "Vinos naturales",
    "Catación: bodegas boutique", "Cata + tapas", "Cata vertical", "Vinos del valle",
    "Bodega + cena", "Cata con sommelier", "Cata de espumantes",
  ],
  art: [
    "Cerámica y vino", "Taller de torno", "Pintura sobre arcilla", "Iniciación a cerámica",
    "Workshop de acuarela", "Feria de productores", "Mercado de diseño", "Mercado vintage",
    "Inauguración de muestra", "Visita guiada", "Workshop de collage", "Vasija + vino",
    "Pintura al óleo", "Dibujo de modelo vivo", "Taller de fotografía",
  ],
  theater: [
    "Estreno: La espera", "Off Corrientes", "Función única", "Drama: Vecinos",
    "Comedia: El malentendido", "Monólogo: Solo en casa", "Función para principiantes",
    "Teatro experimental", "Lectura dramatizada", "Bunraku argentino",
  ],
  comedy: [
    "Stand up & cerveza", "Open mic comedia", "Improv show", "Noche de comedia",
    "Microcomedia", "Standuperos invitados", "Comedy battle", "Comedia bilingüe",
  ],
  cinema: [
    "Cine al aire libre", "Cineclub: ciclo argentino", "Festival de cortos",
    "Estreno + Q&A", "Doble función", "Cineclub: clásicos", "Documental + debate",
    "Cine bajo las estrellas",
  ],
  dance: [
    "Milonga", "Práctica + show", "Clase de tango", "Bachata night", "Salsa social",
    "Reggaetón class", "Swing night", "Forró en vivo", "Tango para principiantes",
    "Folklore + peña", "Hip hop session",
  ],
  wellness: [
    "Yoga al amanecer", "Meditación guiada", "Sound bath", "Vinyasa flow",
    "Pilates", "Mindfulness session", "Yin yoga", "Respiración consciente",
    "Reiki grupal", "Tai chi en el parque",
  ],
  outdoor: [
    "Picnic nocturno", "Caminata histórica", "Bici tour", "Yoga al aire libre",
    "Avistaje de aves", "Recorrido por la reserva", "Trekking urbano", "Stand-up paddle",
    "Kayak al atardecer", "Cabalgata por las sierras",
  ],
  sport: [
    "Trail running", "5K nocturno", "Bike day", "Pádel social", "Fútbol 5 abierto",
    "Yoga + bici", "Bouldering session", "Class de boxing", "Tenis abierto",
    "Spinning grupal",
  ],
  adventure: [
    "Skydive day", "Parapente", "Bungee jump", "Travesía en kayak",
    "Trekking de altura", "Rafting", "Tirolesa", "Caving", "Rappel",
  ],
  ski: [
    "Día de esquí", "Clase de snowboard", "Esquí nocturno", "Ski + après",
    "Travesía de esquí de fondo", "Iniciación snowboard",
  ],
};

// ─── Attendee names ─────────────────────────────────────────────────────────
const FIRSTS = ["Martina","Lucas","Sofía","Andrés","Valentina","Tomás","Camila","Ignacio","Florencia","Ramiro","Paula","Diego","Carolina","Julieta","Marcos","Renata","Bruno","Elena","Nicolás","Agustina","Felipe","Lucía","Mateo","Catalina","Joaquín","Juana","Pedro","Manuela","Joaco","Delfina","Bautista","Olivia","Tobías"];
const LASTS = ["R.","F.","M.","P.","G.","B.","S.","T.","V.","N.","A.","L.","C.","D."];

function attendees(n: number, seed: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.min(n, 6); i++) {
    out.push(`${FIRSTS[(seed + i * 7) % FIRSTS.length]} ${LASTS[(seed * 3 + i * 5) % LASTS.length]}`);
  }
  return out;
}

// ─── Ticket platform mapping ────────────────────────────────────────────────
function ticketInfo(cat: Cat, title: string, venue: string): { url: string; label: "ticket" | "reserve" } {
  const q = encodeURIComponent(title);
  if (cat === "food") {
    return { url: `https://www.thefork.com.ar/buscar?search=${encodeURIComponent(venue)}`, label: "reserve" };
  }
  if (cat === "theater") return { url: `https://www.plateanet.com/Search?txt=${q}`, label: "ticket" };
  if (cat === "cinema") return { url: `https://www.allaccess.com.ar/?s=${q}`, label: "ticket" };
  if (cat === "wellness" || cat === "art" || cat === "wine") {
    return { url: `https://www.eventbrite.com.ar/d/argentina/all-events/?q=${q}`, label: "ticket" };
  }
  if (cat === "adventure" || cat === "outdoor" || cat === "sport" || cat === "ski") {
    return { url: `https://www.eventbrite.com.ar/d/argentina/all-events/?q=${q}`, label: "ticket" };
  }
  if (cat === "dance") return { url: `https://www.plateanet.com/Search?txt=${q}`, label: "ticket" };
  if (cat === "bar") return { url: `https://www.eventbrite.com.ar/d/argentina/all-events/?q=${q}`, label: "ticket" };
  return { url: `https://www.ticketek.com.ar/buscador?Term=${q}`, label: "ticket" };
}

// ─── Generator: cover every day from today forward ──────────────────────────
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAYS_FORWARD = 180; // ~6 months
const EVENTS_PER_DAY = (day: number) => 8 + (day % 7); // 8-14 events per day

function makeEvent(
  id: number,
  title: string,
  venue: string,
  hood: string,
  city: string,
  iso: string,
  durHr: number,
  cat: Cat,
): DemoEvent {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durHr * 3_600_000);
  const dateLabel = start
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .replace(/\./g, "");
  const timeLabel = start.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const imgArr = IMG[cat];
  const image = imgArr[id % imgArr.length];
  const spots = 5 + ((id * 17) % 80);
  const ticket = ticketInfo(cat, title, venue);
  return {
    id: `ar${id}`,
    title,
    venue,
    hood,
    city,
    country: "Argentina",
    location: `${hood}, ${city}`,
    dateLabel,
    timeLabel,
    image,
    startISO: iso,
    endISO: end.toISOString().slice(0, 19),
    spots,
    attendees: attendees(Math.min(spots, 5), id),
    ticketUrl: ticket.url,
    ticketLabel: ticket.label,
  };
}

// Deterministic shuffle (so events from same day/city don't cluster)
function shuffle<T>(arr: T[], seed = 42): T[] {
  const a = [...arr];
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateArRealEvents(): DemoEvent[] {
  const events: DemoEvent[] = [];
  const today = startOfToday();
  let id = 1;

  for (let dayIdx = 0; dayIdx < DAYS_FORWARD; dayIdx++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayIdx);
    const dayISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const count = EVENTS_PER_DAY(dayIdx);
    for (let i = 0; i < count; i++) {
      const seed = id;
      const city = pickCity(seed);
      const hood = city.hoods[seed % city.hoods.length];
      const catEntry = pickCat(seed);
      const cat = catEntry.cat;
      const pool = TITLES[cat];
      const title = pool[(seed * 13 + i * 5) % pool.length];
      const venue = venueName(seed);
      // Hour variation: ±1 hour around baseHour
      const hour = Math.max(7, Math.min(23, catEntry.baseHour + ((seed % 3) - 1)));
      const minutes = (i % 2 === 0) ? "00" : "30";
      const iso = `${dayISO}T${String(hour).padStart(2, "0")}:${minutes}:00`;
      events.push(makeEvent(id, title, venue, hood, city.name, iso, catEntry.durHr, cat));
      id++;
    }
  }

  return shuffle(events, 7777);
}
