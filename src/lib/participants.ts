import type { LangCode } from "./types";

/**
 * Demo growers around the planet — real people growing into a language
 * far from where it is spoken (and often happy to trade: they nurture
 * you in their own language while you nurture them in yours).
 *
 * PRIVACY: everyone is pinned at CITY level only — lat/lng here are the
 * city's coordinates, never a person's exact location.
 */
export type Participant = {
  id: string;
  name: string;
  /** "both" = also nurtures their own language(s) — open to exchange */
  role: "grower" | "both";
  city: string;
  country: string;
  lat: number;
  lng: number;
  /** the language they are growing into */
  growingLang: LangCode;
  /** languages they already live in */
  knownLangs: LangCode[];
  phase: number;
  bio: string;
  tags: string[];
  color: string;
  online: boolean;
};

export const PARTICIPANTS: Participant[] = [
  { id: "tasha", name: "Tasha Reed", role: "grower", city: "Atlanta", country: "United States", lat: 33.749, lng: -84.388, growingLang: "ru", knownLangs: ["en"], phase: 2, bio: "Night-shift nurse who listens to her nurturer's picture stories on the train home. Dreams of reading her grandmother's letters one day.", tags: ["family stories", "night owl"], color: "#7c5cff", online: true },
  { id: "minjun", name: "Minjun Park", role: "both", city: "Busan", country: "South Korea", lat: 35.1796, lng: 129.0756, growingLang: "es", knownLangs: ["ko", "en"], phase: 3, bio: "Barista pulling espresso by the harbor. Narrates his latte art in Spanish to anyone who will listen.", tags: ["coffee", "exchange"], color: "#ff8a1e", online: true },
  { id: "amara", name: "Amara Okafor", role: "grower", city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, growingLang: "fr", knownLangs: ["en"], phase: 1, bio: "Fashion designer collecting fabric words first. Her picture cards are swatches from her own studio.", tags: ["design", "hands-on"], color: "#b8f03c", online: true },
  { id: "diego", name: "Diego Fontana", role: "both", city: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, growingLang: "ja", knownLangs: ["es", "en"], phase: 2, bio: "Tango teacher growing into Japanese one bento word at a time. Will trade dance words for train words.", tags: ["music", "exchange"], color: "#ffd234", online: false },
  { id: "ines", name: "Inês Almeida", role: "both", city: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, growingLang: "de", knownLangs: ["pt"], phase: 1, bio: "Architecture student sketching her city while her nurturer names every window and doorway in German.", tags: ["drawing", "exchange"], color: "#3ddc84", online: true },
  { id: "liam", name: "Liam O'Connor", role: "grower", city: "Galway", country: "Ireland", lat: 53.2707, lng: -9.0568, growingLang: "pt", knownLangs: ["en"], phase: 2, bio: "Fisherman who fell for Porto on one rainy holiday. Now his tackle box doubles as a picture-card kit.", tags: ["sea life", "patient"], color: "#ff5d5d", online: false },
  { id: "yusuf", name: "Yusuf Demir", role: "grower", city: "Istanbul", country: "Türkiye", lat: 41.0082, lng: 28.9784, growingLang: "it", knownLangs: ["tr", "en"], phase: 3, bio: "Ferry engineer who cooks his way through Italian — every Sunday a new dish, every dish a new word world.", tags: ["food", "weekends"], color: "#a78bfa", online: true },
  { id: "hana", name: "Hana Kobayashi", role: "both", city: "Nagoya", country: "Japan", lat: 35.1815, lng: 136.9066, growingLang: "en", knownLangs: ["ja"], phase: 2, bio: "Potter who narrates her wheel in slow, warm Japanese for growers — and wants the same gift back in English.", tags: ["crafts", "exchange"], color: "#ff8a1e", online: true },
  { id: "wei", name: "Wei Chen", role: "both", city: "Hangzhou", country: "China", lat: 30.2741, lng: 120.1551, growingLang: "fr", knownLangs: ["zh"], phase: 1, bio: "Tea farmer by the West Lake. Wants to walk a Lyon market the way visitors walk his tea terraces.", tags: ["tea", "exchange"], color: "#b8f03c", online: false },
  { id: "sofia", name: "Sofia Lindqvist", role: "grower", city: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686, growingLang: "es", knownLangs: ["en"], phase: 4, bio: "Pediatrician whose Spanish grew from picture books to full sobremesas. Now she just wants more stories.", tags: ["stories", "evenings"], color: "#7c5cff", online: true },
  { id: "rafael", name: "Rafael Souza", role: "both", city: "Recife", country: "Brazil", lat: -8.0476, lng: -34.877, growingLang: "zh", knownLangs: ["pt", "en"], phase: 1, bio: "Capoeira instructor learning Mandarin through food carts and gestures — his whole body does the talking.", tags: ["movement", "exchange"], color: "#ffd234", online: true },
  { id: "priya", name: "Priya Nair", role: "grower", city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, growingLang: "en", knownLangs: ["hi"], phase: 3, bio: "Train announcer growing her English past the platform. Loves nurturers who talk about everyday kitchens.", tags: ["routines", "warm"], color: "#3ddc84", online: true },
  { id: "olga", name: "Olga Petrenko", role: "both", city: "Kraków", country: "Poland", lat: 50.0647, lng: 19.945, growingLang: "de", knownLangs: ["uk", "ru"], phase: 2, bio: "Bookbinder who grows German between glue and thread. Happily nurtures Ukrainian or Russian in return.", tags: ["books", "exchange"], color: "#ff5d5d", online: false },
  { id: "jack", name: "Jack Thompson", role: "grower", city: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, growingLang: "zh", knownLangs: ["en"], phase: 2, bio: "Tram driver whose Mandarin lives in dumpling shops along his own route. Asks for the spicy one, every time.", tags: ["food", "humor"], color: "#a78bfa", online: true },
  { id: "camila", name: "Camila Reyes", role: "both", city: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, growingLang: "ja", knownLangs: ["es"], phase: 1, bio: "Muralist painting her first hundred Japanese words onto her studio wall — one picture at a time, GPA style.", tags: ["art", "exchange"], color: "#ff8a1e", online: true },
  { id: "emile", name: "Émile Garnier", role: "both", city: "Montreal", country: "Canada", lat: 45.5017, lng: -73.5673, growingLang: "ru", knownLangs: ["fr", "en"], phase: 3, bio: "Hockey coach riding along with his nurturer's taxi stories. Trades French rink talk for Russian winter talk.", tags: ["sport", "exchange"], color: "#7c5cff", online: false },
  { id: "fatima", name: "Fatima El Mansouri", role: "both", city: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898, growingLang: "it", knownLangs: ["ar", "fr"], phase: 2, bio: "Pastry chef folding Italian into her mornings the way she folds dough. Nurtures Arabic and French in return.", tags: ["baking", "exchange"], color: "#b8f03c", online: true },
];

/**
 * People connected to a language: growing into it, or already living in it
 * (exchange potential — they can nurture you while you nurture them).
 */
export const participantsForLang = (lang: LangCode): Participant[] =>
  PARTICIPANTS.filter((p) => p.growingLang === lang || p.knownLangs.includes(lang));

/**
 * City coordinates for every nurturer in src/lib/nurturers.ts (the Nurturer
 * type stores only the city name). CITY level only — never exact locations.
 */
export const NURTURER_COORDS: Record<string, { lat: number; lng: number }> = {
  lucia: { lat: 39.4699, lng: -0.3763 },     // Valencia
  mateo: { lat: -13.532, lng: -71.9675 },    // Cusco
  anya: { lat: 41.7151, lng: 44.8271 },      // Tbilisi
  dmitri: { lat: 43.2389, lng: 76.8897 },    // Almaty
  camille: { lat: 45.764, lng: 4.8357 },     // Lyon
  karim: { lat: 43.2965, lng: 5.3698 },      // Marseille
  greta: { lat: 51.3397, lng: 12.3731 },     // Leipzig
  joao: { lat: 41.1579, lng: -8.6291 },      // Porto
  elena: { lat: 41.1171, lng: 16.8719 },     // Bari
  haruka: { lat: 34.6937, lng: 135.5023 },   // Osaka
  kenji: { lat: 43.0618, lng: 141.3545 },    // Sapporo
  liwei: { lat: 30.5728, lng: 104.0668 },    // Chengdu
  zhangmin: { lat: 24.8801, lng: 102.8329 }, // Kunming
  maggie: { lat: 53.8008, lng: -1.5491 },    // Leeds
  dwayne: { lat: 33.749, lng: -84.388 },     // Atlanta
};

/** Country names for the nurturers' cities (for "City, Country" labels). */
export const NURTURER_COUNTRIES: Record<string, string> = {
  lucia: "Spain",
  mateo: "Peru",
  anya: "Georgia",
  dmitri: "Kazakhstan",
  camille: "France",
  karim: "France",
  greta: "Germany",
  joao: "Portugal",
  elena: "Italy",
  haruka: "Japan",
  kenji: "Japan",
  liwei: "China",
  zhangmin: "China",
  maggie: "United Kingdom",
  dwayne: "United States",
};
