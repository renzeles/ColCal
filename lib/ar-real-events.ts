import type { DemoEvent } from "@/components/NearbyEvents";
import { IMG, type ImgCat } from "./event-images";
type Cat = ImgCat;

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
const PREFIXES = [
  "Bar", "Café", "Espacio", "Club", "Sala", "Casa", "Patio", "Taller",
  "Estudio", "Centro", "Hostería", "Galpón", "Escuela", "Academia",
  "Instituto", "Gimnasio", "Loft", "Atelier",
];
const NAMES = [
  "Aurora", "Limón", "Marea", "Mística", "Ronda", "Faro", "Bohemia", "Mosaico",
  "Aroma", "Luna", "Telar", "Sombra", "Vereda", "Tierra", "Bruma", "Ámbar",
  "Cardenal", "Olivo", "Mocambo", "Trova", "Esquina", "Velero", "Sirena",
  "Querido", "Refugio", "Mirador", "Tiempo", "Lince", "Brisa", "Cuarzo",
  "Maíz", "Trébol", "Caoba", "Origen", "Cisne", "Lirio", "Cumbre", "Niebla",
  "Arce", "Vértice", "Galera", "Manantial", "Sendero", "Latido", "Pulso",
  "Pampa", "Norte", "Sur", "Esquinita", "Verbena", "Glorieta", "Andén",
];

function venueName(seed: number) {
  return `${PREFIXES[seed % PREFIXES.length]} ${NAMES[(seed * 7 + 3) % NAMES.length]}`;
}

// ─── Categories with default times ──────────────────────────────────────────
type CatEntry = { cat: Cat; baseHour: number; durHr: number; weight: number };
const CATS: CatEntry[] = [
  { cat: "music", baseHour: 21, durHr: 3, weight: 16 },
  { cat: "food", baseHour: 20, durHr: 2.5, weight: 15 },  // up: more cooking classes
  { cat: "sport", baseHour: 10, durHr: 1.5, weight: 14 }, // up: many sport classes
  { cat: "wellness", baseHour: 8, durHr: 1.5, weight: 13 }, // up: tons of yoga variants
  { cat: "art", baseHour: 18, durHr: 2.5, weight: 12 },   // up: art workshops
  { cat: "dance", baseHour: 21, durHr: 2, weight: 10 },   // up: dance classes
  { cat: "bar", baseHour: 20, durHr: 3, weight: 8 },
  { cat: "wine", baseHour: 19, durHr: 2, weight: 6 },
  { cat: "theater", baseHour: 20, durHr: 2, weight: 6 },
  { cat: "comedy", baseHour: 21, durHr: 2, weight: 5 },
  { cat: "cinema", baseHour: 20, durHr: 2, weight: 4 },
  { cat: "outdoor", baseHour: 10, durHr: 3, weight: 6 },
  { cat: "adventure", baseHour: 9, durHr: 5, weight: 3 },
  { cat: "ski", baseHour: 9, durHr: 6, weight: 2 },
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

// ─── Title pools per category — heavy on classes & workshops ────────────────
const TITLES: Record<Cat, string[]> = {
  music: [
    // Shows
    "Noche acústica", "Banda emergente", "Indie en vivo", "Set DJ", "Concierto íntimo",
    "Jazz quartet", "Folklore en vivo", "Tributo a Soda Stereo", "Tributo a Spinetta",
    "Tributo a Charly", "Tributo a Cerati", "Set electrónico", "Funk en vivo",
    "Blues night", "Orquesta típica", "Cumbia pop", "Reggae session", "Rock barrial",
    "Showcase de bandas", "Open mic musical", "Trío de bossa", "Cuarteto de cuerdas",
    "Coro a capella", "Banda tributo a Queen", "Set vinyl",
    // Classes
    "Clase de guitarra para principiantes", "Clase de piano grupal", "Taller de canto",
    "Clase de batería", "Clase de ukelele", "Iniciación al DJ", "Producción musical: workshop",
    "Clase de bajo eléctrico", "Improvisación en jazz", "Clase de armónica",
    "Taller de composición", "Iniciación al saxo", "Clase de violín",
  ],
  food: [
    // Cenas / experiencias
    "Cena maridada", "Menú degustación", "Cocina abierta", "Brunch dominical",
    "Asado experience", "Pasta fresca night", "Sushi omakase",
    "Chef en vivo", "Cena a ciegas", "Burger fest", "Picada gourmet",
    "Cena vegana", "Ramen night", "Cena de pasta", "Mariscos del día",
    "Mexican night", "Noche italiana", "Cocina peruana",
    // Cooking classes
    "Cooking class: empanadas argentinas", "Taller de pasta fresca", "Sushi para principiantes",
    "Clase de pan de masa madre", "Workshop: tartas dulces", "Clase de pastelería francesa",
    "Asado para principiantes", "Cocina vegana: técnicas", "Clase de wok asiático",
    "Taller de fermentos: kimchi y kombucha", "Curso de café de especialidad",
    "Coctelería sin alcohol", "Taller de chocolatería", "Clase de pizza napolitana",
    "Taller de helados artesanales", "Sushi avanzado", "Cocina marroquí",
    "Cocina india: curries", "Repostería sin gluten",
  ],
  bar: [
    "Cocktails de autor", "Cerveza artesanal night", "After office", "Speakeasy session",
    "Trivia & beers", "Vermut & vinilo", "Catación de gin", "Whisky tasting",
    "Cervecero invitado", "Karaoke night", "Pub quiz", "Cocktail masterclass",
    "Tequila & mezcal tasting", "Ron del Caribe", "Taller de bartender",
    "Iniciación a la coctelería", "Clase de mixología",
  ],
  wine: [
    "Cata de Malbec", "Maridaje de vinos", "Cata a ciegas", "Vinos naturales",
    "Catación: bodegas boutique", "Cata + tapas", "Cata vertical", "Vinos del valle",
    "Bodega + cena", "Cata con sommelier", "Cata de espumantes",
    "Iniciación al vino", "Curso WSET nivel 1", "Cata de vinos patagónicos",
    "Cata de Cabernet", "Taller: cómo catar", "Vinos de altura", "Cata blind para amigos",
  ],
  art: [
    // Clases de arte
    "Cerámica y vino", "Taller de torno", "Pintura sobre arcilla", "Iniciación a cerámica",
    "Workshop de acuarela", "Workshop de collage", "Vasija + vino",
    "Pintura al óleo", "Dibujo de modelo vivo", "Taller de fotografía",
    "Clase de dibujo a lápiz", "Pintura abstracta para principiantes",
    "Taller de fotografía analógica", "Clase de stop-motion", "Taller de cianotipia",
    "Iniciación a la joyería", "Taller de tejido a dos agujas", "Curso de macramé",
    "Taller de costura básica", "Clase de caligrafía", "Workshop de tipografía",
    "Taller de bookbinding", "Iniciación al grabado", "Clase de mosaiquismo",
    "Taller de cuero artesanal", "Pintura japonesa sumi-e", "Workshop de origami",
    "Taller de serigrafía", "Clase de escultura en arcilla",
    // Mercados
    "Feria de productores", "Mercado de diseño", "Mercado vintage",
    "Inauguración de muestra", "Visita guiada", "Open studio",
  ],
  theater: [
    "Estreno: La espera", "Off Corrientes", "Función única", "Drama: Vecinos",
    "Comedia: El malentendido", "Monólogo: Solo en casa", "Función para principiantes",
    "Teatro experimental", "Lectura dramatizada", "Bunraku argentino",
    "Clase de actuación", "Taller de improvisación teatral", "Iniciación al clown",
    "Workshop de voz para actores", "Curso intensivo de actuación",
  ],
  comedy: [
    "Stand up & cerveza", "Open mic comedia", "Improv show", "Noche de comedia",
    "Microcomedia", "Standuperos invitados", "Comedy battle", "Comedia bilingüe",
    "Taller de stand up", "Iniciación al humor escénico",
  ],
  cinema: [
    "Cine al aire libre", "Cineclub: ciclo argentino", "Festival de cortos",
    "Estreno + Q&A", "Doble función", "Cineclub: clásicos", "Documental + debate",
    "Cine bajo las estrellas", "Maratón Hitchcock", "Ciclo: cine francés",
    "Taller de cine documental", "Workshop de guión",
  ],
  dance: [
    // Milongas y socials
    "Milonga", "Práctica + show", "Bachata night", "Salsa social",
    "Reggaetón class", "Swing night", "Forró en vivo", "Folklore + peña",
    // Classes
    "Clase de tango para principiantes", "Tango intermedio", "Tango avanzado",
    "Clase de salsa cubana", "Clase de bachata sensual", "Iniciación a la kizomba",
    "Clase de zouk brasileño", "Workshop de bachata moderna", "Salsa en línea",
    "Clase de hip hop", "Iniciación a la danza contemporánea",
    "Clase de jazz dance", "Heels class", "Twerk class", "Reggaetón femenino",
    "Iniciación al ballet", "Clase de break dance", "Taller de claqué",
    "Danza africana", "Clase de flamenco",
  ],
  wellness: [
    // Yoga (muchas variantes)
    "Yoga al amanecer", "Vinyasa flow", "Hatha yoga", "Yin yoga", "Yoga restaurativo",
    "Yoga kundalini", "Ashtanga yoga", "Power yoga", "Yoga prenatal",
    "Aero yoga", "Acroyoga para parejas", "Yoga + sound bath",
    "Yoga al atardecer", "Yoga en el parque", "Yoga para principiantes",
    "Yoga intermedio", "Yoga + meditación",
    // Meditation & body
    "Meditación guiada", "Sound bath", "Pilates", "Pilates con reformer",
    "Mindfulness session", "Respiración consciente", "Reiki grupal",
    "Tai chi en el parque", "Qi gong", "Eutonía",
    "Workshop de respiración wim hof", "Sesión de gong",
    "Iniciación a la meditación", "Retiro express de 2hs",
    "Mat pilates", "Stretching profundo",
  ],
  outdoor: [
    "Picnic nocturno", "Caminata histórica", "Bici tour", "Yoga al aire libre",
    "Avistaje de aves", "Recorrido por la reserva", "Trekking urbano", "Stand-up paddle",
    "Kayak al atardecer", "Cabalgata por las sierras",
    "Birdwatching guiado", "Trekking con linterna", "Picnic + lecturas",
    "Caminata sensorial", "Recorrido botánico", "Tour de murales",
  ],
  sport: [
    // Pickup + clases
    "Trail running", "5K nocturno", "Bike day", "Pádel social", "Fútbol 5 abierto",
    "Yoga + bici", "Bouldering session", "Tenis abierto", "Spinning grupal",
    "Vóley social", "Básquet pick-up", "Hockey femenino", "Rugby touch",
    // Clases
    "Clase de boxeo para principiantes", "Iniciación al kickboxing",
    "Clase de MMA", "Muay Thai", "Brazilian jiu-jitsu intro",
    "Crossfit foundation", "Funcional grupal", "Calistenia para principiantes",
    "Clase de escalada indoor", "Iniciación a la natación",
    "Clase de surf", "Clase de SUP", "Clase de kitesurf",
    "Clase de skate", "Iniciación al patín", "Roller dance",
    "Slackline en el parque", "Parkour para principiantes",
    "Iniciación al tenis", "Clase de pádel", "Clínica de pádel",
    "Spinning + DJ", "Bootcamp al aire libre", "Trote grupal",
    "Clase de yoga + running",
  ],
  adventure: [
    "Skydive day", "Parapente", "Bungee jump", "Travesía en kayak",
    "Trekking de altura", "Rafting", "Tirolesa", "Caving", "Rappel",
    "Clase de escalada en roca", "Iniciación al kayak", "Curso de supervivencia",
    "Travesía en MTB", "Sandboard en dunas",
  ],
  ski: [
    "Día de esquí", "Clase de snowboard", "Esquí nocturno", "Ski + après",
    "Travesía de esquí de fondo", "Iniciación snowboard",
    "Clase de esquí para principiantes", "Esquí intermedio", "Freeride day",
    "Iniciación al telemark",
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
const EVENTS_PER_DAY = (day: number) => 12 + (day % 8); // 12-19 events per day

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
