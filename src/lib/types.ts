export type Role = "grower" | "nurturer" | "both";

export type LangCode =
  | "en" | "es" | "ru" | "fr" | "de" | "pt" | "it" | "ja" | "zh" | "ar" | "ko" | "tr" | "uk" | "hi" | "ht"
  | "vi" | "id" | "pl" | "th";

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
  /** Phase 6 is a lifelong way of living, not a timed course to complete. */
  ongoing?: boolean;
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

export interface ActivityAttempt {
  id: string;
  activityId: string;
  completedAt: string;
  minutes: number;
  wordsAdded: number;
}

export interface LanguageJourney {
  lang: LangCode;
  phase: PhaseId;
  /** highest live-session meeting completed in THIS language — absent on
   *  journeys saved before the sequential meeting spine existed (the store
   *  self-heal derives it from hoursLogged on restore) */
  meetingProgress?: number;
  hoursLogged: number;
  minutesLogged: number;
  wordsMet: number;
  wordIds: string[];
  completed: string[];
  activityLog: ActivityAttempt[];
  achievements: Record<string, string>;
  week: number[];
  weekStartedAt: string;
  startedAt: string;
}

export interface Profile {
  name: string;
  role: Role;
  /** languages the user already lives in */
  knownLangs: LangCode[];
  /** the language being grown into (grower) */
  targetLang: LangCode;
  /** independent learning records; targetLang identifies the active one */
  journeys?: LanguageJourney[];
  /** languages a nurturer can nurture in — absent on accounts saved before this field existed */
  nurtureLangs?: LangCode[];
  /** nurturer training/certification status — gates the Nurturer Studio beyond role selection */
  nurturerCertStatus?: "not_started" | "passed" | "failed";
  /** most recent training-quiz score, 0-100 */
  nurturerCertScore?: number;
  /** total training-quiz attempts (pass or fail) */
  nurturerCertAttempts?: number;
  /** ISO date the nurturer most recently passed the training quiz */
  nurturerCertPassedAt?: string;
  /** ids of golden-rule quiz questions missed on the most recent attempt — for later owner review */
  nurturerCertMissed?: string[];
  /** show UI in target language for immersion */
  immersion: boolean;
  phase: PhaseId;
  /**
   * Highest Phase-1 meeting number COMPLETED via a live /session meeting.
   * Product rule: ONLY finishing a live session's full timer advances this
   * (AI-nurturer sessions count the same as human ones during the beta);
   * solo /practice grinding NEVER moves it. Meetings are sequential and
   * mandatory — the grower is always served the next meeting after this one.
   * Saved and restored PER LANGUAGE with the active journey (see
   * LanguageJourney.meetingProgress) so progress never leaks across languages.
   */
  meetingProgress?: number;
  hoursLogged: number;
  /** exact cumulative minutes; hoursLogged is the rounded display value */
  minutesLogged?: number;
  wordsMet: number;
  /** known card ids, used to avoid counting the same pictured word twice */
  wordIds?: string[];
  streak: number;
  /** ids of completed activities */
  completed: string[];
  /** repeatable attempts; completed remains the unique curriculum checklist */
  activityLog?: ActivityAttempt[];
  /** achievement id → first-earned ISO date; synced with the account */
  achievements?: Record<string, string>;
  bookings: SessionBooking[];
  /** day-of-week activity minutes for the chart, Mon..Sun */
  week: number[];
  /** ISO date of the Monday represented by `week` */
  weekStartedAt?: string;
  createdAt: string;
  /** home city — shown on the map at city level only, never an exact location */
  city?: string;
  country?: string;
  /** what the participant loves — picture-card worlds a nurturer can start from */
  interests?: string[];
  /** why this language — one or more reasons (e.g. "family roots", "someone I love") */
  motivation?: string[];
  /** daily watering commitment in minutes (20 / 40 / 60 / 120 = all-in) */
  dailyMinutes?: number;
  /** open to language exchange — you nurture yours, they nurture theirs */
  exchange?: boolean;
  /* ---- Tandem-style profile (shown when someone taps you on /world) ---- */
  /** profile photo (synced from the Clerk account image) */
  photoUrl?: string;
  /** a short "about me" */
  bio?: string;
  /** the kind of exchange partner you're hoping to meet */
  idealPartner?: string;
  /** what you want to achieve in the language */
  goals?: string;
  /** certificates / credentials, e.g. "DELE B2", "TEFL" */
  certificates?: string[];
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
  /* ---- marketplace fields (Preply-style listing). All optional so the
     AI nurturer + legacy callers keep working without them. ---- */
  /** native region / dialect headline, e.g. "Cap-Haïtien · Native" */
  region?: string;
  /** PPP-adjusted rate the grower pays per hour, in USD */
  ratePerHourUsd?: number;
  /** completed the Nuri GPA method certification */
  methodCertified?: boolean;
  /** open to time-for-time exchange (nurture yours, they nurture theirs) */
  exchangeOpen?: boolean;
  /** lifetime count of growers nurtured into the language */
  growersNurtured?: number;
  /** GPA phases this nurturer guides, e.g. "1–3" */
  phasesGuided?: string;
}

export interface ForumPost {
  id: string;
  author: string;
  authorRole: Role;
  lang: LangCode;
  category: "find-nurturer" | "phase-help" | "wins" | "culture" | "tools";
  title: string;
  body: string;
  replies: { author: string; body: string; ago: string; isNurturer?: boolean }[];
  likes: number;
  ago: string;
}

export interface VocabItem {
  id: string;
  emoji: string;     // the "picture card" — meaning carried by image, never translation
  /** authentic Phase-1 meeting this card is introduced in (Rough-and-Ready Dozen order) */
  meeting?: number;
  words: Partial<Record<LangCode, string>>;
}

export interface VocabDomain {
  id: string;
  emoji: string;
  /** authentic Phase-1 meeting this set first appears in */
  meeting?: number;
  /** names shown in each UI language */
  names: Partial<Record<LangCode, string>>;
  color: string;
  items: VocabItem[];
}
