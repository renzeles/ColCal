import type { DemoEvent } from "@/components/NearbyEvents";

// ── Image pool by category ───────────────────────────────────────────────────
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
  cinema: [
    "https://images.unsplash.com/photo-1489599735734-79b4af4e1d4b?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&h=500",
  ],
  theater: [
    "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=800&h=500",
  ],
  ski: [
    "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1605540436563-5bca919ae766?auto=format&fit=crop&w=800&h=500",
  ],
  adventure: [
    "https://images.unsplash.com/photo-1517428878-d4adc54f0fa7?auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1521133573892-e44906baee46?auto=format&fit=crop&w=800&h=500",
  ],
};

type Cat = keyof typeof IMG;

// ── Event templates: title + venue + category ────────────────────────────────
type Tpl = { t: string; v: string; c: Cat; h: number; dur: number };

const TPL: Tpl[] = [
  { t: "Chef's Table", v: "Trattoria Romana", c: "food", h: 20, dur: 2.5 },
  { t: "Wine pairing dinner", v: "Vinería del Centro", c: "wine", h: 21, dur: 3 },
  { t: "Brunch club", v: "Sunday Café", c: "food", h: 11, dur: 2.5 },
  { t: "Speakeasy cocktails", v: "Hidden Bar", c: "bar", h: 21, dur: 3 },
  { t: "Jazz Quartet Live", v: "Blue Room", c: "music", h: 22, dur: 3 },
  { t: "Indie rock night", v: "Rooftop Club", c: "music", h: 22, dur: 4 },
  { t: "Electronic DJ set", v: "Club Underground", c: "music", h: 23, dur: 5 },
  { t: "Classical chamber", v: "Concert Hall", c: "music", h: 20, dur: 2 },
  { t: "Modern art exhibition", v: "Contemporary Gallery", c: "art", h: 18, dur: 3 },
  { t: "Photo walk", v: "City Center", c: "art", h: 16, dur: 2.5 },
  { t: "Open-air cinema", v: "Riverside Park", c: "cinema", h: 21, dur: 2.5 },
  { t: "Film festival opening", v: "Cinema Royal", c: "cinema", h: 19, dur: 3 },
  { t: "Theater premiere", v: "City Theater", c: "theater", h: 20, dur: 2.5 },
  { t: "Stand-up comedy night", v: "Comedy Club", c: "comedy", h: 21, dur: 2 },
  { t: "Improv show", v: "Black Box", c: "comedy", h: 21, dur: 2 },
  { t: "Sunrise yoga", v: "Beach Studio", c: "wellness", h: 7, dur: 1.5 },
  { t: "Meditation circle", v: "Wellness Loft", c: "wellness", h: 19, dur: 1 },
  { t: "Salsa social", v: "Dance Hall", c: "dance", h: 22, dur: 4 },
  { t: "Tango milonga", v: "Cultural Center", c: "dance", h: 22, dur: 4 },
  { t: "Trail run", v: "Mountain Park", c: "sport", h: 8, dur: 2 },
  { t: "Skydiving experience", v: "Skydive Center", c: "adventure", h: 10, dur: 3 },
  { t: "Paragliding flight", v: "Mountain Top", c: "adventure", h: 11, dur: 2 },
  { t: "Bungee jumping", v: "Bridge Spot", c: "adventure", h: 12, dur: 2 },
  { t: "Ski lesson", v: "Mountain Resort", c: "ski", h: 9, dur: 4 },
  { t: "Snowboard session", v: "Snow Park", c: "ski", h: 10, dur: 4 },
  { t: "Hike & picnic", v: "National Park", c: "outdoor", h: 9, dur: 5 },
  { t: "Beach volleyball", v: "Coast Club", c: "sport", h: 16, dur: 2 },
  { t: "Sunset SUP", v: "Waterfront", c: "sport", h: 18, dur: 2 },
  { t: "Coffee cupping", v: "Roastery", c: "food", h: 15, dur: 1.5 },
  { t: "Cooking class", v: "Culinary Studio", c: "food", h: 18, dur: 3 },
  { t: "Craft beer tasting", v: "Microbrewery", c: "bar", h: 19, dur: 2 },
  { t: "Whisky masterclass", v: "Old Distillery", c: "bar", h: 20, dur: 2.5 },
  { t: "Vinyl listening night", v: "Record Shop", c: "music", h: 21, dur: 3 },
  { t: "Drag brunch", v: "Pride Hall", c: "comedy", h: 13, dur: 2.5 },
  { t: "Pottery workshop", v: "Clay Studio", c: "art", h: 15, dur: 3 },
  { t: "Life drawing class", v: "Art Loft", c: "art", h: 19, dur: 2 },
  { t: "Open mic poetry", v: "Bookshop Café", c: "art", h: 19, dur: 2 },
  { t: "Indie cinema double feature", v: "Arthouse Cinema", c: "cinema", h: 20, dur: 4 },
  { t: "Shakespeare in the park", v: "Public Garden", c: "theater", h: 19, dur: 2.5 },
  { t: "Burlesque show", v: "Variety Stage", c: "theater", h: 22, dur: 2 },
  { t: "Tasting menu", v: "Michelin Bistro", c: "food", h: 20, dur: 3 },
  { t: "Farmers market", v: "Town Square", c: "food", h: 9, dur: 5 },
  { t: "Sushi omakase", v: "Sushi Counter", c: "food", h: 19, dur: 2.5 },
  { t: "Cycling tour", v: "Bike Co.", c: "sport", h: 9, dur: 3 },
  { t: "Climbing session", v: "Boulder Gym", c: "sport", h: 18, dur: 2 },
  { t: "Sound bath", v: "Crystal Studio", c: "wellness", h: 19, dur: 1.5 },
  { t: "Forest bath walk", v: "Forest Reserve", c: "wellness", h: 10, dur: 2.5 },
  { t: "House party rooftop", v: "Sky Bar", c: "dance", h: 23, dur: 5 },
  { t: "Latin dance class", v: "Studio Tropical", c: "dance", h: 20, dur: 2 },
  { t: "Improvised theater", v: "Black Box", c: "theater", h: 20, dur: 2 },
];

// ── Cities worldwide: [city, country, hoods, eventCount] ─────────────────────
type CityRow = [city: string, country: string, hoods: string[], count: number];

const CITIES: CityRow[] = [
  // Australia — Adelaide gets 150
  ["Adelaide", "Australia", ["CBD","Glenelg","North Adelaide","Norwood","Unley","Hindmarsh","Port Adelaide","Prospect","Burnside","Brighton","West Lakes","Henley Beach","Magill","Marion","Salisbury","Mawson Lakes","Stirling","Mount Barker","Semaphore","McLaren Vale"], 150],
  ["Sydney", "Australia", ["CBD","Bondi","Surry Hills","Newtown","Manly","Paddington","Darlinghurst","Glebe","Potts Point","Marrickville"], 120],
  ["Melbourne", "Australia", ["CBD","Fitzroy","St Kilda","Carlton","Brunswick","South Yarra","Richmond","Collingwood","Footscray","Prahran"], 120],
  ["Brisbane", "Australia", ["CBD","Fortitude Valley","South Brisbane","West End","New Farm","Paddington","Teneriffe","Newstead"], 80],
  ["Perth", "Australia", ["CBD","Fremantle","Northbridge","Subiaco","Leederville","Cottesloe","Mount Lawley"], 70],

  // Europe
  ["Paris", "France", ["Le Marais","Saint-Germain","Montmartre","Bastille","Belleville","Latin Quarter","Pigalle","Canal Saint-Martin","Champs-Élysées","Oberkampf"], 150],
  ["London", "UK", ["Soho","Shoreditch","Camden","Notting Hill","Brixton","Hackney","Peckham","Mayfair","King's Cross","Dalston"], 150],
  ["Berlin", "Germany", ["Mitte","Kreuzberg","Neukölln","Friedrichshain","Prenzlauer Berg","Charlottenburg","Schöneberg","Wedding"], 120],
  ["Madrid", "Spain", ["Malasaña","Chueca","La Latina","Lavapiés","Salamanca","Chamberí","Retiro","Moncloa"], 110],
  ["Barcelona", "Spain", ["Gracia","El Born","Gothic Quarter","Eixample","Poble Sec","Raval","Sant Antoni","Barceloneta","Poblenou"], 110],
  ["Rome", "Italy", ["Trastevere","Monti","Testaccio","Pigneto","Centro Storico","San Lorenzo","Prati","Ostiense"], 100],
  ["Milan", "Italy", ["Brera","Navigli","Porta Romana","Isola","Tortona","Centro","Porta Venezia","Lambrate"], 90],
  ["Amsterdam", "Netherlands", ["Jordaan","De Pijp","Oud-Zuid","Centrum","Noord","Oost","West"], 90],
  ["Vienna", "Austria", ["Innere Stadt","Neubau","Mariahilf","Leopoldstadt","Wieden","Josefstadt"], 70],
  ["Lisbon", "Portugal", ["Alfama","Bairro Alto","Chiado","Príncipe Real","Belém","LX Factory","Mouraria"], 80],
  ["Stockholm", "Sweden", ["Södermalm","Östermalm","Norrmalm","Vasastan","Gamla Stan","Kungsholmen"], 70],
  ["Copenhagen", "Denmark", ["Nørrebro","Vesterbro","Frederiksberg","Christianshavn","Østerbro","Indre By"], 70],
  ["Dublin", "Ireland", ["Temple Bar","Smithfield","Stoneybatter","Portobello","Rathmines","Docklands"], 70],
  ["Prague", "Czechia", ["Vinohrady","Žižkov","Karlín","Staré Město","Holešovice","Smíchov"], 70],
  ["Budapest", "Hungary", ["District VII","District V","District VIII","District IX","Buda Castle","Újlipótváros"], 70],
  ["Athens", "Greece", ["Plaka","Psyrri","Exarchia","Koukaki","Kolonaki","Monastiraki"], 70],

  // North America
  ["New York", "USA", ["Brooklyn","Manhattan","Williamsburg","Bushwick","East Village","West Village","SoHo","Harlem","Astoria","Queens","DUMBO"], 200],
  ["Los Angeles", "USA", ["Silver Lake","Echo Park","Venice","Santa Monica","DTLA","Hollywood","Highland Park","Culver City","WeHo"], 160],
  ["San Francisco", "USA", ["Mission","Hayes Valley","SoMa","North Beach","Castro","Marina","Haight-Ashbury","Dogpatch"], 110],
  ["Chicago", "USA", ["Wicker Park","Logan Square","Pilsen","River North","West Loop","Lincoln Park","Hyde Park"], 100],
  ["Miami", "USA", ["South Beach","Wynwood","Brickell","Coconut Grove","Little Havana","Design District"], 90],
  ["Austin", "USA", ["East Austin","South Congress","Rainey Street","Downtown","Mueller","Zilker"], 80],
  ["Seattle", "USA", ["Capitol Hill","Ballard","Fremont","Belltown","Queen Anne","Pioneer Square","U-District"], 80],
  ["Boston", "USA", ["North End","Back Bay","South End","Cambridge","Allston","Jamaica Plain"], 70],
  ["Toronto", "Canada", ["Queen West","Kensington Market","Distillery","Yorkville","The Annex","Leslieville","Liberty Village"], 100],
  ["Montreal", "Canada", ["Mile End","Plateau","Old Montreal","Saint-Henri","Verdun","Outremont"], 90],
  ["Vancouver", "Canada", ["Gastown","Yaletown","Kitsilano","Mount Pleasant","Commercial Drive","West End"], 80],

  // Mexico
  ["Mexico City", "Mexico", ["Roma","Condesa","Polanco","Coyoacán","Centro Histórico","San Ángel","Juárez","Doctores"], 150],
  ["Guadalajara", "Mexico", ["Chapultepec","Lafayette","Providencia","Centro","Andares","Americana"], 70],
  ["Monterrey", "Mexico", ["San Pedro","Centro","Cumbres","Valle Oriente","Barrio Antiguo"], 50],

  // Japan
  ["Tokyo", "Japan", ["Shibuya","Shinjuku","Ginza","Akihabara","Harajuku","Roppongi","Asakusa","Ikebukuro","Daikanyama","Nakameguro","Shimokitazawa"], 200],
  ["Kyoto", "Japan", ["Gion","Pontocho","Arashiyama","Higashiyama","Downtown","Fushimi"], 70],
  ["Osaka", "Japan", ["Namba","Umeda","Shinsekai","Tennoji","Amerikamura","Dotonbori"], 80],

  // South Africa
  ["Cape Town", "South Africa", ["City Bowl","Bo-Kaap","Sea Point","Camps Bay","Woodstock","Observatory","Green Point","V&A Waterfront"], 100],
  ["Johannesburg", "South Africa", ["Maboneng","Sandton","Melville","Braamfontein","Rosebank","Parkhurst","Newtown"], 70],

  // Brazil
  ["São Paulo", "Brazil", ["Vila Madalena","Pinheiros","Jardins","Itaim","Vila Olímpia","Liberdade","Bela Vista","Higienópolis"], 140],
  ["Rio de Janeiro", "Brazil", ["Ipanema","Copacabana","Leblon","Santa Teresa","Lapa","Botafogo","Urca","Jardim Botânico"], 120],
  ["Salvador", "Brazil", ["Pelourinho","Barra","Rio Vermelho","Pituba","Itapuã"], 50],

  // Uruguay
  ["Montevideo", "Uruguay", ["Pocitos","Carrasco","Punta Carretas","Ciudad Vieja","Cordón","Parque Rodó","Tres Cruces"], 80],
  ["Punta del Este", "Uruguay", ["La Barra","José Ignacio","Maldonado","Punta Ballena","Manantiales"], 40],

  // SE Asia
  ["Bangkok", "Thailand", ["Sukhumvit","Silom","Sathorn","Thonglor","Ari","Phra Nakhon","Bangrak","Ekkamai"], 120],
  ["Singapore", "Singapore", ["Tiong Bahru","Chinatown","Tanjong Pagar","Holland Village","Bugis","Kampong Glam","Orchard","River Valley"], 100],
  ["Bali", "Indonesia", ["Canggu","Seminyak","Ubud","Uluwatu","Sanur","Pererenan","Berawa"], 100],
  ["Ho Chi Minh", "Vietnam", ["District 1","District 2","Binh Thanh","District 3","Thao Dien","District 7"], 70],
  ["Manila", "Philippines", ["Makati","BGC","Poblacion","Quezon City","Malate","Intramuros"], 60],
  ["Kuala Lumpur", "Malaysia", ["Bukit Bintang","Bangsar","KLCC","Mont Kiara","Damansara","Chinatown","TTDI"], 60],
];

const FIRSTS = [
  "Emma","Liam","Olivia","Noah","Sophia","Lucas","Amelia","Mateo","Ava","Yuki","Hiro","Aiko","Camila","Diego","Sofía","Marie","Pierre","Louis","Charlotte","Marco","Giulia","Lukas","Anna","Felix","Mia","João","Pedro","Ana","Jack","Charlie","Tom","Liu","Wei","Hana","Aisha","Omar","Zara","Ravi","Priya","Kai","Maya","Theo","Iris","Henry","Eva"
];
const LASTS = ["A.","B.","C.","D.","E.","F.","G.","H.","K.","L.","M.","N.","P.","R.","S.","T.","V.","W.","Z."];

function attendees(n: number, seed: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.min(n, 6); i++) {
    out.push(`${FIRSTS[(seed + i * 7) % FIRSTS.length]} ${LASTS[(seed * 3 + i * 5) % LASTS.length]}`);
  }
  return out;
}

function makeEvent(
  id: number,
  tpl: Tpl,
  hood: string,
  city: string,
  country: string,
  iso: string
): DemoEvent {
  const start = new Date(iso);
  const end = new Date(start.getTime() + tpl.dur * 3_600_000);
  const dateLabel = start
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .replace(/\./g, "");
  const timeLabel = start.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const spots = 3 + ((id * 17) % 147);
  const imgArr = IMG[tpl.c];
  const image = imgArr[id % imgArr.length];
  return {
    id: `w${id}`,
    title: tpl.t,
    venue: tpl.v,
    hood,
    city,
    country,
    location: `${hood}, ${city}`,
    dateLabel,
    timeLabel,
    image,
    startISO: iso,
    endISO: end.toISOString().slice(0, 19),
    spots,
    attendees: attendees(Math.min(spots, 5), id),
  };
}

// Deterministic shuffle — keeps cities mixed
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

export function generateWorldEvents(): DemoEvent[] {
  const events: DemoEvent[] = [];
  let id = 1;

  for (const [city, country, hoods, count] of CITIES) {
    for (let i = 0; i < count; i++) {
      const tpl = TPL[(id * 13 + i * 7) % TPL.length];
      const hood = hoods[i % hoods.length];
      // Spread dates: May 2026 → Oct 2026 (6 months × ~28 days)
      const monthIdx = Math.floor((i * 31) % 6);
      const month = 5 + monthIdx; // 5..10
      const day = 1 + ((i * 11 + 3) % 28); // 1..28
      const minuteSlot = i % 2 === 0 ? "00" : "30";
      const iso = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(tpl.h).padStart(2, "0")}:${minuteSlot}:00`;
      events.push(makeEvent(id, tpl, hood, city, country, iso));
      id++;
    }
  }

  return shuffle(events, 3141);
}
