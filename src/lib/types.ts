export type Role = "grower" | "nurturer" | "both";

export type LangCode =
  | "en" | "es" | "ru" | "fr" | "de" | "pt" | "it" | "ja" | "zh" | "ar" | "ko" | "tr" | "uk" | "hi" | "ht";

export interface Language {
  code: LangCode;
  name: string;        // English name
  nativeName: string;  // Endonym
  flag: string;        // emoji
  tts: string;         // BCP-47 locale for speechSynthesis
  rtl?: boolean;
}

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6;

export interface PhaseActivity {
  id: string;
  name: string;
  description: string;
  /** what the nurturer does / what the grower does */
  how: string;
  minutes: number;
  kind: "listening" | "speaking" | "vocabulary" | "literacy" | "culture" | "conversation";
  /** route of a playable in-app version, if one exists */
  practiceHref?: string;
}

export interface Phase {
  id: PhaseId;
  slug: string;
  name: string;
  tagline: string;
  hours: number;          // length of the phase
  startHour: number;      // cumulative start
  color: string;          // accent token
  emoji: string;
  vocabTarget: string;
  description: string;
  principles: string[];
  activities: PhaseActivity[];
  milestones: string[];
  /**
   * The research-true learning sequence: ordered sub-stages of the phase
   * (e.g. 1A listening-only → 1B constrained talking). Each part references
   * activities by id; unreferenced activities run throughout the phase.
   */
  parts?: { id: string; title: string; hours: string; focus: string; activityIds: string[] }[];
}

export interface SessionBooking {
  id: string;
  nurturerId: string;
  /** ISO date (yyyy-mm-dd) */
  date: string;
  /** HH:MM 24h */
  time: string;
  minutes: number;
  activity: string;
  done?: boolean;
}

export interface Profile {
  name: string;
  role: Role;
  /** languages the user already lives in */
  knownLangs: LangCode[];
  /** the language being grown into (grower) */
  targetLang: LangCode;
  /** languages a nurturer can nurture in */
  nurtureLangs: LangCode[];
  /** show UI in target language for immersion */
  immersion: boolean;
  phase: PhaseId;
  hoursLogged: number;
  wordsMet: number;
  streak: number;
  /** ids of completed activities */
  completed: string[];
  bookings: SessionBooking[];
  /** day-of-week activity minutes for the chart, Mon..Sun */
  week: number[];
  createdAt: string;
  /** home city — shown on the map at city level only, never an exact location */
  city?: string;
  country?: string;
  /** what the participant loves — picture-card worlds a nurturer can start from */
  interests?: string[];
  /** why this language (e.g. "family roots", "someone I love") */
  motivation?: string;
  /** daily watering commitment in minutes (10 / 20 / 40) */
  dailyMinutes?: number;
  /** open to language exchange — you nurture yours, they nurture theirs */
  exchange?: boolean;
}

export interface Nurturer {
  id: string;
  name: string;
  langs: LangCode[];
  city: string;
  bio: string;
  tags: string[];
  sessions: number;
  rating: number;
  online: boolean;
  color: string; // avatar gradient seed
}

export interface ForumPost {
  id: string;
  author: string;
  authorRole: Role;
  lang: LangCode;
  category: "find-nurturer" | "phase-help" | "wins" | "culture" | "tools";
  title: string;
  body: string;
  replies: { author: string; body: string; ago: string }[];
  likes: number;
  ago: string;
}

export interface VocabItem {
  id: string;
  emoji: string;     // the "picture card" — meaning carried by image, never translation
  words: Partial<Record<LangCode, string>>;
}

export interface VocabDomain {
  id: string;
  emoji: string;
  /** names shown in each UI language */
  names: Partial<Record<LangCode, string>>;
  color: string;
  items: VocabItem[];
}
