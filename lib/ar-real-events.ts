import type { DemoEvent } from "@/components/NearbyEvents";

// ─── Image pool (same as world-events) ──────────────────────────────────────
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
  ],
  adventure: [
    "https://images.unsplash.com/photo-1517428878-d4adc54f0fa7?auto=format&fit=crop&w=800&h=500",
  ],
};

type Cat = keyof typeof IMG;

// ─── Real Argentine venues with their typical event types ────────────────────
type Venue = {
  name: string;
  hood: string;
  city: string;
  types: Cat[];
  base?: number; // base hour (default varies by type)
};

const VENUES: Venue[] = [
  // ── CABA — Música ──
  { name: "Niceto Club", hood: "Palermo Hollywood", city: "CABA", types: ["music"], base: 23 },
  { name: "Café Vinilo", hood: "Palermo", city: "CABA", types: ["music"], base: 22 },
  { name: "La Trastienda", hood: "San Telmo", city: "CABA", types: ["music"], base: 22 },
  { name: "Centro Cultural Konex", hood: "Abasto", city: "CABA", types: ["music", "theater"], base: 21 },
  { name: "Vorterix", hood: "Colegiales", city: "CABA", types: ["music"], base: 22 },
  { name: "Café Berlín", hood: "Belgrano", city: "CABA", types: ["music"], base: 22 },
  { name: "El Emergente", hood: "Boedo", city: "CABA", types: ["music"], base: 22 },
  { name: "CAFF", hood: "Boedo", city: "CABA", types: ["music"], base: 21 },
  { name: "Strummer Bar", hood: "Palermo", city: "CABA", types: ["music", "bar"], base: 22 },
  { name: "Mod Club", hood: "Palermo Hollywood", city: "CABA", types: ["music"], base: 23 },
  { name: "Lucille", hood: "Palermo", city: "CABA", types: ["music", "bar"], base: 21 },
  { name: "Bebop Club", hood: "Palermo", city: "CABA", types: ["music"], base: 21 },
  { name: "Thelonious Bar", hood: "Palermo", city: "CABA", types: ["music"], base: 22 },
  { name: "Movistar Arena", hood: "Villa Crespo", city: "CABA", types: ["music"], base: 21 },
  { name: "Teatro Vorterix Rosario", hood: "Centro", city: "Rosario", types: ["music"], base: 22 },

  // ── CABA — Tango / Milongas ──
  { name: "La Catedral del Tango", hood: "Almagro", city: "CABA", types: ["dance", "music"], base: 22 },
  { name: "Salón Canning", hood: "Palermo", city: "CABA", types: ["dance"], base: 22 },
  { name: "El Beso", hood: "Balvanera", city: "CABA", types: ["dance"], base: 21 },
  { name: "La Viruta Tango Club", hood: "Palermo Soho", city: "CABA", types: ["dance"], base: 22 },
  { name: "Café de los Angelitos", hood: "Balvanera", city: "CABA", types: ["dance", "music"], base: 21 },
  { name: "Bar Sur", hood: "San Telmo", city: "CABA", types: ["dance"], base: 21 },
  { name: "Sunderland Club", hood: "Villa Urquiza", city: "CABA", types: ["dance"], base: 22 },
  { name: "Confitería Ideal", hood: "Microcentro", city: "CABA", types: ["dance"], base: 22 },

  // ── CABA — Teatro ──
  { name: "Paseo La Plaza", hood: "San Nicolás", city: "CABA", types: ["theater", "comedy"], base: 20 },
  { name: "Teatro San Martín", hood: "San Nicolás", city: "CABA", types: ["theater"], base: 20 },
  { name: "Teatro Cervantes", hood: "San Nicolás", city: "CABA", types: ["theater"], base: 20 },
  { name: "El Cubo", hood: "Abasto", city: "CABA", types: ["theater"], base: 21 },
  { name: "Espacio Callejón", hood: "Almagro", city: "CABA", types: ["theater"], base: 21 },
  { name: "Multiteatro Comafi", hood: "San Nicolás", city: "CABA", types: ["theater"], base: 20 },
  { name: "Teatro Picadero", hood: "San Nicolás", city: "CABA", types: ["theater"], base: 20 },
  { name: "Teatro Maipo", hood: "San Nicolás", city: "CABA", types: ["theater"], base: 21 },
  { name: "Teatro Liceo", hood: "San Nicolás", city: "CABA", types: ["theater"], base: 21 },
  { name: "Teatro Colón", hood: "San Nicolás", city: "CABA", types: ["music", "theater"], base: 20 },
  { name: "Astor Piazzolla", hood: "Microcentro", city: "CABA", types: ["theater", "music"], base: 21 },
  { name: "Centro Cultural Caras y Caretas", hood: "Balvanera", city: "CABA", types: ["theater", "music"], base: 20 },

  // ── CABA — Comedia ──
  { name: "El Cotorro", hood: "San Telmo", city: "CABA", types: ["comedy"], base: 21 },
  { name: "La Tangente", hood: "Villa Crespo", city: "CABA", types: ["comedy", "music"], base: 21 },
  { name: "Cantares", hood: "Palermo", city: "CABA", types: ["comedy"], base: 21 },

  // ── CABA — Cine ──
  { name: "Sala Lugones", hood: "San Nicolás", city: "CABA", types: ["cinema"], base: 19 },
  { name: "Cine Lorca", hood: "San Nicolás", city: "CABA", types: ["cinema"], base: 20 },
  { name: "Cosmos UBA", hood: "Recoleta", city: "CABA", types: ["cinema"], base: 19 },
  { name: "Cineclub Núcleo", hood: "Microcentro", city: "CABA", types: ["cinema"], base: 19 },
  { name: "Espacio INCAA Gaumont", hood: "San Nicolás", city: "CABA", types: ["cinema"], base: 19 },

  // ── CABA — Food / Parrillas / Restaurants ──
  { name: "Don Julio", hood: "Palermo", city: "CABA", types: ["food", "wine"], base: 21 },
  { name: "La Cabrera", hood: "Palermo", city: "CABA", types: ["food"], base: 21 },
  { name: "El Preferido", hood: "San Telmo", city: "CABA", types: ["food", "wine"], base: 20 },
  { name: "Mishiguene", hood: "Palermo", city: "CABA", types: ["food", "wine"], base: 21 },
  { name: "Anchoita", hood: "Chacarita", city: "CABA", types: ["food", "wine"], base: 21 },
  { name: "Tegui", hood: "Palermo", city: "CABA", types: ["food", "wine"], base: 21 },
  { name: "Trescha", hood: "Palermo", city: "CABA", types: ["food", "wine"], base: 21 },
  { name: "Las Pizarras", hood: "Palermo", city: "CABA", types: ["food"], base: 21 },
  { name: "Sucre", hood: "Belgrano", city: "CABA", types: ["food", "wine"], base: 21 },
  { name: "Cabaña Las Lilas", hood: "Puerto Madero", city: "CABA", types: ["food"], base: 21 },
  { name: "La Brigada", hood: "San Telmo", city: "CABA", types: ["food"], base: 21 },
  { name: "Parrilla Peña", hood: "Almagro", city: "CABA", types: ["food"], base: 21 },
  { name: "Aramburu", hood: "Recoleta", city: "CABA", types: ["food", "wine"], base: 20 },
  { name: "Crizia", hood: "Palermo", city: "CABA", types: ["food"], base: 21 },

  // ── CABA — Cocktail Bars ──
  { name: "Florería Atlántico", hood: "Retiro", city: "CABA", types: ["bar"], base: 20 },
  { name: "Frank's Bar", hood: "Palermo Hollywood", city: "CABA", types: ["bar"], base: 21 },
  { name: "Verne Club", hood: "Palermo", city: "CABA", types: ["bar"], base: 21 },
  { name: "878", hood: "Villa Crespo", city: "CABA", types: ["bar"], base: 21 },
  { name: "Tres Monos", hood: "Palermo", city: "CABA", types: ["bar"], base: 20 },
  { name: "Bar 6", hood: "Palermo Soho", city: "CABA", types: ["bar"], base: 20 },
  { name: "Doppelgänger", hood: "San Telmo", city: "CABA", types: ["bar"], base: 21 },
  { name: "Presidente Bar", hood: "Recoleta", city: "CABA", types: ["bar"], base: 20 },

  // ── CABA — Vinos ──
  { name: "Aldo's Restaurante", hood: "Recoleta", city: "CABA", types: ["wine", "food"], base: 20 },
  { name: "Pain et Vin", hood: "Palermo", city: "CABA", types: ["wine"], base: 19 },
  { name: "Lo de Joaquín Alberdi", hood: "Palermo", city: "CABA", types: ["wine"], base: 19 },
  { name: "Casa Vinya", hood: "Palermo", city: "CABA", types: ["wine"], base: 19 },
  { name: "Vico Wine Bar", hood: "Palermo", city: "CABA", types: ["wine"], base: 19 },

  // ── CABA — Cervecerías artesanales ──
  { name: "Buller Brewing", hood: "Recoleta", city: "CABA", types: ["bar"], base: 20 },
  { name: "Antares", hood: "Palermo", city: "CABA", types: ["bar"], base: 20 },
  { name: "Strange Brewing", hood: "Villa Crespo", city: "CABA", types: ["bar"], base: 20 },
  { name: "Bröeders", hood: "Belgrano", city: "CABA", types: ["bar"], base: 20 },
  { name: "On Tap", hood: "Palermo", city: "CABA", types: ["bar"], base: 19 },

  // ── CABA — Talleres / Cerámica ──
  { name: "Estudio Tierra", hood: "Villa Urquiza", city: "CABA", types: ["art"], base: 18 },
  { name: "Taller La Sombrerería", hood: "Chacarita", city: "CABA", types: ["art"], base: 19 },
  { name: "Vasija Studio", hood: "Villa Crespo", city: "CABA", types: ["art"], base: 18 },
  { name: "Anti Cerámica", hood: "Almagro", city: "CABA", types: ["art"], base: 18 },

  // ── CABA — Centros culturales ──
  { name: "Centro Cultural Recoleta", hood: "Recoleta", city: "CABA", types: ["art", "music"], base: 19 },
  { name: "Centro Cultural Borges", hood: "Retiro", city: "CABA", types: ["art"], base: 18 },
  { name: "Centro Cultural San Martín", hood: "San Nicolás", city: "CABA", types: ["art", "theater"], base: 19 },
  { name: "Usina del Arte", hood: "La Boca", city: "CABA", types: ["music", "art"], base: 20 },
  { name: "MALBA", hood: "Palermo", city: "CABA", types: ["art", "cinema"], base: 19 },
  { name: "Museo MAMBA", hood: "San Telmo", city: "CABA", types: ["art"], base: 18 },

  // ── CABA — Mercados / Ferias ──
  { name: "Feria de Mataderos", hood: "Mataderos", city: "CABA", types: ["food", "art"], base: 12 },
  { name: "Mercado de San Telmo", hood: "San Telmo", city: "CABA", types: ["food"], base: 12 },
  { name: "Mercado de Bonpland", hood: "Palermo Hollywood", city: "CABA", types: ["food"], base: 11 },
  { name: "Feria de Plaza Francia", hood: "Recoleta", city: "CABA", types: ["art"], base: 11 },
  { name: "Mercado de Pulgas", hood: "Colegiales", city: "CABA", types: ["art"], base: 11 },

  // ── CABA — Outdoor / Sports ──
  { name: "Bosques de Palermo", hood: "Palermo", city: "CABA", types: ["outdoor", "sport"], base: 9 },
  { name: "Reserva Ecológica Costanera Sur", hood: "Puerto Madero", city: "CABA", types: ["outdoor", "sport"], base: 8 },
  { name: "Parque Centenario", hood: "Caballito", city: "CABA", types: ["outdoor"], base: 10 },
  { name: "Costanera Norte", hood: "Núñez", city: "CABA", types: ["sport", "outdoor"], base: 9 },
  { name: "Planetario Galileo Galilei", hood: "Palermo", city: "CABA", types: ["art"], base: 20 },

  // ── CABA — Wellness ──
  { name: "Inspira Loft", hood: "Palermo", city: "CABA", types: ["wellness"], base: 8 },
  { name: "Lotus Yoga", hood: "Palermo", city: "CABA", types: ["wellness"], base: 8 },
  { name: "Templo Verde", hood: "Belgrano", city: "CABA", types: ["wellness"], base: 18 },

  // ── GBA / Provincia ──
  { name: "Puerto de Frutos", hood: "Tigre Centro", city: "Tigre", types: ["food", "art"], base: 11 },
  { name: "Centro Cultural San Isidro", hood: "San Isidro", city: "San Isidro", types: ["theater", "music"], base: 20 },
  { name: "Quinta Trabucco", hood: "Florida", city: "Vicente López", types: ["outdoor"], base: 10 },
  { name: "Pasaje Dardo Rocha", hood: "Centro", city: "La Plata", types: ["art", "music"], base: 20 },
  { name: "Teatro Argentino", hood: "Centro", city: "La Plata", types: ["theater", "music"], base: 21 },

  // ── Mar del Plata ──
  { name: "Casino Central", hood: "Centro", city: "Mar del Plata", types: ["music", "theater"], base: 21 },
  { name: "Teatro Auditorium", hood: "Playa Grande", city: "Mar del Plata", types: ["theater"], base: 21 },
  { name: "Playa Grande", hood: "Playa Grande", city: "Mar del Plata", types: ["sport", "outdoor"], base: 9 },

  // ── Mendoza ──
  { name: "Bodega Catena Zapata", hood: "Luján de Cuyo", city: "Mendoza", types: ["wine"], base: 11 },
  { name: "Bodega Salentein", hood: "Valle de Uco", city: "Mendoza", types: ["wine"], base: 11 },
  { name: "Bodega Achaval-Ferrer", hood: "Perdriel", city: "Mendoza", types: ["wine"], base: 11 },
  { name: "Bodega Trapiche", hood: "Maipú", city: "Mendoza", types: ["wine"], base: 11 },
  { name: "Bodega Bressia", hood: "Agrelo", city: "Mendoza", types: ["wine"], base: 12 },
  { name: "Centro Cultural Le Parc", hood: "Godoy Cruz", city: "Mendoza", types: ["art", "music"], base: 20 },

  // ── Córdoba ──
  { name: "Sala del Rey", hood: "Nueva Córdoba", city: "Córdoba", types: ["music"], base: 22 },
  { name: "Cineclub Hugo del Carril", hood: "Centro", city: "Córdoba", types: ["cinema"], base: 19 },
  { name: "Teatro del Libertador", hood: "Centro", city: "Córdoba", types: ["theater"], base: 20 },
  { name: "Plaza de la Música", hood: "Alta Córdoba", city: "Córdoba", types: ["music"], base: 22 },
  { name: "Quality Espacio", hood: "Cerro de las Rosas", city: "Córdoba", types: ["music"], base: 22 },

  // ── Rosario ──
  { name: "Centro Cultural Roberto Fontanarrosa", hood: "Centro", city: "Rosario", types: ["art", "theater"], base: 19 },
  { name: "Centro Cultural Parque España", hood: "Pichincha", city: "Rosario", types: ["music", "art"], base: 20 },
  { name: "Bar El Cairo", hood: "Centro", city: "Rosario", types: ["bar", "music"], base: 21 },
  { name: "Teatro El Círculo", hood: "Centro", city: "Rosario", types: ["theater", "music"], base: 21 },

  // ── Patagonia ──
  { name: "Cerro Catedral", hood: "Bariloche", city: "Bariloche", types: ["ski", "sport"], base: 9 },
  { name: "Club Andino Bariloche", hood: "Centro", city: "Bariloche", types: ["sport", "outdoor"], base: 8 },
  { name: "Cerro Otto", hood: "Bariloche", city: "Bariloche", types: ["outdoor"], base: 10 },
  { name: "Lago Lácar", hood: "San Martín de los Andes", city: "Neuquén", types: ["outdoor", "sport"], base: 9 },
  { name: "Glaciar Perito Moreno", hood: "Los Glaciares", city: "El Calafate", types: ["outdoor", "adventure"], base: 9 },
  { name: "Cerro Chapelco", hood: "San Martín de los Andes", city: "Neuquén", types: ["ski"], base: 9 },

  // ── Norte ──
  { name: "La Casona del Molino", hood: "Centro", city: "Salta", types: ["music"], base: 22 },
  { name: "Teatro Provincial Salta", hood: "Centro", city: "Salta", types: ["theater"], base: 21 },
  { name: "Casa de los Jiménez", hood: "Centro", city: "Cafayate", types: ["wine", "food"], base: 13 },
  { name: "Quebrada de Humahuaca", hood: "Humahuaca", city: "Jujuy", types: ["outdoor"], base: 9 },
  { name: "Iglesia de Tilcara", hood: "Tilcara", city: "Jujuy", types: ["art"], base: 11 },

  // ── Mesopotamia ──
  { name: "Parque Nacional Iguazú", hood: "Cataratas", city: "Puerto Iguazú", types: ["outdoor", "adventure"], base: 9 },

  // ── Restaurantes con tango / música en vivo ──
  { name: "Café Tortoni", hood: "Monserrat", city: "CABA", types: ["dance", "food"], base: 21 },
  { name: "Esquina Carlos Gardel", hood: "Abasto", city: "CABA", types: ["dance", "food"], base: 21 },
  { name: "El Querandí", hood: "Monserrat", city: "CABA", types: ["dance", "food"], base: 21 },
  { name: "La Ventana Tango", hood: "San Telmo", city: "CABA", types: ["dance", "food"], base: 21 },
  { name: "Madero Tango", hood: "Puerto Madero", city: "CABA", types: ["dance", "food"], base: 21 },
  { name: "Las Violetas", hood: "Almagro", city: "CABA", types: ["food", "music"], base: 19 },
  { name: "36 Billares", hood: "San Nicolás", city: "CABA", types: ["food", "music"], base: 19 },
  { name: "La Poesía", hood: "San Telmo", city: "CABA", types: ["food", "music"], base: 20 },
  { name: "Café La Biela", hood: "Recoleta", city: "CABA", types: ["food"], base: 16 },
  { name: "Gran Café Tortoni", hood: "Monserrat", city: "CABA", types: ["food", "music"], base: 18 },

  // ── Más venues importantes CABA ──
  { name: "Luna Park", hood: "San Nicolás", city: "CABA", types: ["music", "sport"], base: 21 },
  { name: "Estadio Único", hood: "La Plata", city: "La Plata", types: ["music", "sport"], base: 21 },
  { name: "Hipódromo de Palermo", hood: "Palermo", city: "CABA", types: ["sport", "outdoor"], base: 20 },
  { name: "Hipódromo de San Isidro", hood: "San Isidro", city: "San Isidro", types: ["sport"], base: 15 },
  { name: "Tecnópolis", hood: "Villa Martelli", city: "Buenos Aires", types: ["art", "music"], base: 17 },
  { name: "Centro Cultural Kirchner", hood: "San Nicolás", city: "CABA", types: ["music", "art"], base: 19 },
  { name: "Teatro Coliseo", hood: "Retiro", city: "CABA", types: ["music", "theater"], base: 20 },
  { name: "ND Ateneo", hood: "Retiro", city: "CABA", types: ["music", "theater"], base: 21 },
  { name: "Hotel Bauen", hood: "San Nicolás", city: "CABA", types: ["theater", "music"], base: 21 },

  // ── Más Mendoza ──
  { name: "Bodega Zuccardi", hood: "Maipú", city: "Mendoza", types: ["wine", "food"], base: 12 },
  { name: "Bodega Norton", hood: "Luján de Cuyo", city: "Mendoza", types: ["wine"], base: 11 },
  { name: "Bodega Bianchi", hood: "San Rafael", city: "Mendoza", types: ["wine"], base: 11 },
  { name: "Bodega Ruca Malen", hood: "Luján de Cuyo", city: "Mendoza", types: ["wine", "food"], base: 13 },

  // ── Más Bariloche y Patagonia ──
  { name: "Cervecería Patagonia", hood: "Llao Llao", city: "Bariloche", types: ["bar", "food"], base: 17 },
  { name: "Cerro Bayo", hood: "Villa La Angostura", city: "Neuquén", types: ["ski"], base: 9 },
  { name: "Hosteria Las Balsas", hood: "Villa La Angostura", city: "Neuquén", types: ["food", "wine"], base: 21 },
  { name: "Las Buttes", hood: "Bariloche", city: "Bariloche", types: ["food", "wine"], base: 21 },

  // ── Más Salta/Norte ──
  { name: "Tren a las Nubes", hood: "San Antonio de los Cobres", city: "Salta", types: ["adventure", "outdoor"], base: 7 },
  { name: "Bodega Piattelli", hood: "Cafayate", city: "Cafayate", types: ["wine"], base: 12 },
  { name: "Bodega El Esteco", hood: "Cafayate", city: "Cafayate", types: ["wine"], base: 12 },

  // ── Más Córdoba ──
  { name: "La Cumbrecita", hood: "Calamuchita", city: "Villa General Belgrano", types: ["outdoor"], base: 10 },
  { name: "Centro Cultural Córdoba", hood: "Nueva Córdoba", city: "Córdoba", types: ["music", "art"], base: 20 },
  { name: "Forja", hood: "Nueva Córdoba", city: "Córdoba", types: ["music"], base: 22 },

  // ── Costa atlántica ──
  { name: "Cariló Beach Club", hood: "Cariló", city: "Pinamar", types: ["food", "music"], base: 21 },
  { name: "Espacio Clarín", hood: "Centro", city: "Mar del Plata", types: ["theater"], base: 21 },
];

// ─── Title templates per category (Argentine flavor) ─────────────────────────
const TRIBUTES = ["Soda Stereo", "Spinetta", "Charly García", "Fito Páez", "Sumo", "Patricio Rey", "Divididos", "Los Redondos", "Calamaro", "Cerati", "Babasónicos", "Bersuit"];
const GENRES = ["indie", "rock", "jazz", "blues", "electrónica", "funk", "soul", "folk", "experimental"];
const PLAYS = ["La vida es sueño", "Macbeth", "Casa de muñecas", "Esperando a Godot", "El loco y la triste", "Despedida", "Tarde de un fauno", "Un enemigo del pueblo", "Tres hermanas"];
const STANDUP = ["Stand up & cerveza", "Open mic", "Improv en vivo", "Noche de comedia", "Comedia stand up", "Microcomedia"];

const TITLE_POOLS: Record<Cat, ((seed: number, venue: Venue) => string)[]> = {
  music: [
    (s) => `Tributo a ${TRIBUTES[s % TRIBUTES.length]}`,
    (s) => `Noche de ${GENRES[s % GENRES.length]}`,
    (s, v) => `${v.name.split(" ")[0]} Sessions`,
    () => "Bandas emergentes en vivo",
    () => "Set acústico",
    () => "Orquesta típica en vivo",
    () => "Showcase de bandas",
    () => "DJ residente",
  ],
  theater: [
    (s) => `Estreno: ${PLAYS[s % PLAYS.length]}`,
    () => "Función única",
    () => "Off Corrientes",
    (s) => PLAYS[s % PLAYS.length],
    () => "Función especial",
  ],
  comedy: [
    (s) => STANDUP[s % STANDUP.length],
    () => "Stand up & cerveza",
    () => "Open mic comedia",
    () => "Improv show",
    () => "Noche de monólogos",
  ],
  food: [
    () => "Cena maridada",
    () => "Menú degustación",
    () => "Open kitchen",
    () => "Asado argentino",
    () => "Cooking class: empanadas",
    () => "Pasta fresca night",
    () => "Brunch dominical",
  ],
  wine: [
    () => "Cata de vinos de Mendoza",
    () => "Maridaje de Malbec",
    () => "Cata a ciegas",
    () => "Vinos naturales argentinos",
    () => "Tasting: bodegas boutique",
    () => "Cena con bodeguero",
  ],
  bar: [
    () => "Catación de cocktails",
    () => "Cerveza artesanal nights",
    () => "Speakeasy session",
    () => "After office",
    () => "Trivia & beers",
    () => "Vermut & vinilo",
  ],
  art: [
    () => "Cerámica y vino",
    () => "Taller de torno",
    () => "Pintura sobre cerámica",
    () => "Feria de productores",
    () => "Mercado de diseño",
    () => "Inauguración de muestra",
    () => "Visita guiada",
    () => "Workshop creativo",
  ],
  cinema: [
    () => "Cine al aire libre",
    () => "Cineclub: ciclo argentino",
    () => "Festival de cortos",
    () => "Estreno + Q&A",
    () => "Sesión BAFICI",
    () => "Doble función",
  ],
  dance: [
    () => "Milonga",
    () => "Práctica + show",
    () => "Clase de tango",
    () => "Noche de bachata",
    () => "Salsa social",
    () => "Tango para principiantes",
  ],
  outdoor: [
    () => "Picnic nocturno",
    () => "Caminata histórica",
    () => "Bici tour",
    () => "Yoga al aire libre",
    () => "Avistaje de aves",
    () => "Recorrido por la reserva",
  ],
  wellness: [
    () => "Yoga al amanecer",
    () => "Meditación guiada",
    () => "Sound bath",
    () => "Vinyasa flow",
    () => "Pilates al amanecer",
  ],
  sport: [
    () => "Trail running",
    () => "5K nocturno",
    () => "Bike day",
    () => "SUP atardecer",
    () => "Class de boxing",
  ],
  ski: [
    () => "Día de esquí",
    () => "Clase de snowboard",
    () => "Esquí nocturno",
    () => "Ski + après",
  ],
  adventure: [
    () => "Travesía en kayak",
    () => "Trekking guiado",
    () => "Cabalgata por las sierras",
    () => "Travesía 4x4",
  ],
};

// ─── Attendee names (mix of AR-friendly) ────────────────────────────────────
const FIRSTS = ["Martina","Lucas","Sofía","Andrés","Valentina","Tomás","Camila","Ignacio","Florencia","Ramiro","Paula","Diego","Carolina","Julieta","Marcos","Renata","Bruno","Elena","Nicolás","Agustina","Felipe","Lucía","Mateo","Catalina","Joaquín","Juana","Pedro","Manuela","Joaco","Delfina","Bautista","Olivia","Tobías"];
const LASTS = ["R.","F.","M.","P.","G.","B.","S.","T.","V.","N.","A.","L.","C.","D."];

function attendees(n: number, seed: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.min(n, 6); i++) {
    out.push(`${FIRSTS[(seed + i * 7) % FIRSTS.length]} ${LASTS[(seed * 3 + i * 5) % LASTS.length]}`);
  }
  return out;
}

// ─── Generator ──────────────────────────────────────────────────────────────
const TODAY = new Date("2026-05-12T00:00:00");
const MAX_DAYS = 180; // ~6 months ahead

function dateForIndex(i: number): { iso: string; hour: number } {
  // Spread events over ~6 months, varying time of day
  const dayOffset = Math.floor((i * 11 + i % 7) % MAX_DAYS);
  const d = new Date(TODAY);
  d.setDate(d.getDate() + dayOffset);
  return {
    iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    hour: 0, // hour set by venue base
  };
}

// ─── Ticket platforms (real Argentine ticket sites) ──────────────────────────
function ticketInfo(venue: Venue, cat: Cat, title: string): { url: string; label: "ticket" | "reserve" } {
  const name = venue.name.toLowerCase();
  const q = encodeURIComponent(title);

  // Restaurants → reserve via TheFork or Google Maps
  if (cat === "food") {
    return {
      url: `https://www.thefork.com.ar/buscar?cityId=&search=${encodeURIComponent(venue.name)}`,
      label: "reserve",
    };
  }

  // Big arena venues
  if (name.includes("movistar arena") || name.includes("luna park") || name.includes("estadio único"))
    return { url: `https://www.ticketek.com.ar/buscador?Term=${q}`, label: "ticket" };

  // Teatro Colón
  if (name.includes("teatro colón"))
    return { url: "https://teatrocolon.org.ar/es/programacion", label: "ticket" };

  // CCK (Centro Cultural Kirchner)
  if (name.includes("kirchner"))
    return { url: "https://www.cck.gob.ar/agenda/", label: "ticket" };

  // Self-ticketed venues
  if (name.includes("vorterix")) return { url: "https://www.vorterix.com/agenda", label: "ticket" };
  if (name.includes("la trastienda")) return { url: "https://www.latrastienda.com/", label: "ticket" };
  if (name.includes("niceto")) return { url: "https://www.nicetoclub.com/", label: "ticket" };
  if (name.includes("konex")) return { url: "https://www.ccknnex.com.ar/agenda", label: "ticket" };
  if (name.includes("usina del arte")) return { url: "https://www.usinadelarte.org/", label: "ticket" };
  if (name.includes("malba")) return { url: "https://www.malba.org.ar/agenda/", label: "ticket" };
  if (name.includes("recoleta")) return { url: "https://www.centroculturalrecoleta.org/", label: "ticket" };

  // Theater → Plateanet (the main theater ticket platform in Argentina)
  if (cat === "theater") return { url: `https://www.plateanet.com/Search?txt=${q}`, label: "ticket" };

  // Cinema → All Access / Sala Lugones / generic
  if (cat === "cinema") return { url: `https://www.allaccess.com.ar/?s=${q}`, label: "ticket" };

  // Workshops / wellness / art / wine → Eventbrite
  if (cat === "wellness" || cat === "art" || cat === "wine") {
    return {
      url: `https://www.eventbrite.com.ar/d/argentina/all-events/?q=${q}`,
      label: "ticket",
    };
  }

  // Tango venues (dance) → own site / Plateanet
  if (cat === "dance") {
    if (name.includes("ventana") || name.includes("madero") || name.includes("querandí") || name.includes("gardel") || name.includes("tortoni")) {
      return { url: `https://www.thefork.com.ar/buscar?search=${encodeURIComponent(venue.name)}`, label: "reserve" };
    }
    return { url: `https://www.plateanet.com/Search?txt=${q}`, label: "ticket" };
  }

  // Adventure / outdoor → Eventbrite or platform-specific
  if (cat === "adventure" || cat === "outdoor" || cat === "sport" || cat === "ski") {
    return {
      url: `https://www.eventbrite.com.ar/d/argentina/all-events/?q=${q}`,
      label: "ticket",
    };
  }

  // Default music + everything else → Ticketek (biggest AR platform)
  return {
    url: `https://www.ticketek.com.ar/buscador?Term=${q}`,
    label: "ticket",
  };
}

function makeRealEvent(id: number, venue: Venue, cat: Cat, i: number): DemoEvent {
  const { iso } = dateForIndex(id);
  const baseHour = venue.base ?? (cat === "wellness" ? 8 : cat === "outdoor" ? 10 : cat === "food" ? 21 : 20);
  // small variation: ±0 or +30 minutes
  const minute = (id + i) % 2 === 0 ? "00" : "30";
  const startISO = `${iso}T${String(baseHour).padStart(2, "0")}:${minute}:00`;

  // Duration by cat
  const durHr = ({
    music: 3, theater: 2, comedy: 2, food: 2.5, wine: 2, bar: 3, art: 2.5,
    cinema: 2, dance: 4, outdoor: 3, wellness: 1.5, sport: 2, ski: 6, adventure: 5,
  } as Record<Cat, number>)[cat];

  const start = new Date(startISO);
  const end = new Date(start.getTime() + durHr * 3_600_000);
  const dateLabel = start
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .replace(/\./g, "");
  const timeLabel = start.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  // Pick a title from the pool
  const pool = TITLE_POOLS[cat];
  const titleFn = pool[(id + i * 3) % pool.length];
  const title = titleFn(id + i, venue);

  const imgArr = IMG[cat];
  const image = imgArr[id % imgArr.length];
  const spots = 5 + ((id * 17) % 80);
  const ticket = ticketInfo(venue, cat, title);

  return {
    id: `ar${id}`,
    title,
    venue: venue.name,
    hood: venue.hood,
    city: venue.city,
    country: "Argentina",
    location: `${venue.hood}, ${venue.city}`,
    dateLabel,
    timeLabel,
    image,
    startISO,
    endISO: end.toISOString().slice(0, 19),
    spots,
    attendees: attendees(Math.min(spots, 5), id),
    ticketUrl: ticket.url,
    ticketLabel: ticket.label,
  };
}

// Deterministic shuffle so events from same venue don't cluster
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
  let id = 1;
  // For each venue, generate multiple events from its supported types
  for (const venue of VENUES) {
    const eventsPerVenue = 8 + (id % 8); // 8-15 events per venue (~1400-1700 events total)
    for (let i = 0; i < eventsPerVenue; i++) {
      const cat = venue.types[i % venue.types.length];
      events.push(makeRealEvent(id, venue, cat, i));
      id++;
    }
  }
  return shuffle(events, 7777);
}
