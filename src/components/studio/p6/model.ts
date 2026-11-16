/**
 * Phase 6 data shapes + pure helpers. Everything here is device-local state
 * the seven Phase 6 tools persist under `lange.studio.{activityId}.v1`.
 * No scores live here: these are ledgers and mirrors.
 */

export const P6 = {
  hours: "p6-hours",
  cop: "p6-cop",
  read: "p6-read",
  needs: "p6-needs",
  rare: "p6-rare",
  expert: "p6-expert",
  remedial: "p6-remedial",
} as const;

/* ------------------------------- dates ------------------------------- */

/** Local calendar day, yyyy-mm-dd (never UTC-shifted). */
export function localIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1, 12);
}

/** The Monday of the week `d` falls in, as a local yyyy-mm-dd. */
export function weekStart(d: Date = new Date()): string {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return localIso(x);
}

export function shiftWeek(weekIso: string, by: number): string {
  const x = parseIso(weekIso);
  x.setDate(x.getDate() + by * 7);
  return localIso(x);
}

/** Is a day (or a full ISO timestamp) inside the week starting `weekIso`? */
export function inWeek(when: string, weekIso: string): boolean {
  const day = when.length > 10 ? localIso(new Date(when)) : when;
  return day >= weekIso && day < shiftWeek(weekIso, 1);
}

export function fmtDay(iso: string, locale: string): string {
  try {
    return parseIso(iso).toLocaleDateString(locale, { month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

export function fmtWeek(weekIso: string, locale: string): string {
  const end = parseIso(weekIso);
  end.setDate(end.getDate() + 6);
  return `${fmtDay(weekIso, locale)} – ${fmtDay(localIso(end), locale)}`;
}

/** Short weekday name for a Monday-based index (0 = Monday). */
export function dayName(index: number, locale: string, width: "short" | "long" = "short"): string {
  try {
    // 1 Jan 2024 was a Monday
    return new Date(2024, 0, 1 + index, 12).toLocaleDateString(locale, { weekday: width });
  } catch {
    return String(index + 1);
  }
}

/** Minutes as hours with one decimal, trimmed ("90" → "1.5", "120" → "2"). */
export function fmtHours(minutes: number): string {
  const h = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const clampInt = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? Math.round(value) : min));

/* ------------------------------ postcards ------------------------------ */

/** A short note to carry to a partner: a phrase overheard, a question, a hole. */
export interface Postcard {
  id: string;
  text: string;
  at: string;
  done: boolean;
}

/* ----------------------------- host hours ------------------------------ */

export const DAY_PARTS = ["morning", "midday", "afternoon", "evening"] as const;
/** each part of the day is a four-hour block: 4 × 4 × 7 = 112 waking hours */
export const BLOCK_HOURS = 4;
/** the guide's round number for a waking week */
export const WAKING_HOURS = 100;
export const LIFE_DOMAINS = ["work", "home", "friends", "errands", "media", "faith", "learning"] as const;
export const DOMAIN_ICON: Record<string, string> = {
  work: "💼",
  home: "🏠",
  friends: "🫖",
  errands: "🛒",
  media: "📺",
  faith: "🕊️",
  learning: "🎓",
  team: "👥",
};

export interface HoursWeek {
  /** `${day}-${part}` → hours (0..4) of that block lived in the host language */
  cells: Record<string, number>;
  domains: string[];
  note: string;
}

export interface HoursClaim {
  id: string;
  /** Monday of the week this block is to be claimed in */
  forWeek: string;
  day: number;
  part: number;
  what: string;
  kept?: "yes" | "partly" | "no";
}

export interface HoursState {
  weeks: Record<string, HoursWeek>;
  claims: HoursClaim[];
}

export const HOURS_INITIAL: HoursState = { weeks: {}, claims: [] };
export const EMPTY_WEEK: HoursWeek = { cells: {}, domains: [], note: "" };

export const weekHostHours = (week?: HoursWeek): number =>
  week ? Object.values(week.cells).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0) : 0;

export const hostShare = (hours: number): number =>
  Math.min(100, Math.round((hours / WAKING_HOURS) * 100));

/* ------------------------ communities of practice ----------------------- */

export const COP_DOMAINS = ["work", "home", "friends", "errands", "faith", "team", "learning"] as const;
/** how many authored "one change" idea starters each domain has */
export const COP_IDEA_COUNT: Record<string, number> = {
  work: 3,
  home: 3,
  friends: 3,
  errands: 2,
  faith: 2,
  team: 2,
  learning: 2,
};

export type CopLanguage = "home" | "mixed" | "host";

export interface CopCheck {
  at: string;
  outcome: "done" | "partly" | "notyet";
  note: string;
}

export interface CopCircle {
  id: string;
  domain: string;
  name: string;
  people: string;
  runsIn: CopLanguage;
  /** host people there talk to one another, not only to the grower */
  hostToHost: boolean;
  change: string;
  /** yyyy-mm-dd to look again, "" when none is set */
  checkOn: string;
  checks: CopCheck[];
  createdAt: string;
}

export interface CopState {
  circles: CopCircle[];
}

export const COP_INITIAL: CopState = { circles: [] };

/* -------------------------------- reading ------------------------------- */

export const READ_KINDS = [
  "news",
  "fiction",
  "nonfiction",
  "professional",
  "school",
  "magazine",
  "signs",
  "messages",
  "instructions",
  "poetry",
  "other",
] as const;
export type ReadKind = (typeof READ_KINDS)[number];

export const READ_ICON: Record<ReadKind, string> = {
  news: "📰",
  fiction: "📖",
  nonfiction: "📚",
  professional: "🧰",
  school: "🎒",
  magazine: "🗞️",
  signs: "🪧",
  messages: "💬",
  instructions: "📋",
  poetry: "🎶",
  other: "🔖",
};

export type ReadFit = "" | "easy" | "stretch" | "over";

export interface ReadEntry {
  id: string;
  title: string;
  kind: ReadKind;
  minutes: number;
  pages: number;
  date: string;
  fit: ReadFit;
  /** who is reading the same piece */
  partner: string;
  /** host-language words and phrases to ask about */
  words: string[];
  note: string;
}

export interface ReadState {
  entries: ReadEntry[];
}

export const READ_INITIAL: ReadState = { entries: [] };

/* ----------------------------- needs analysis --------------------------- */

/** starter bank of communication situations (names are st6_bank_{id} strings) */
export const NEEDS_BANK = [
  "toast",
  "car",
  "hair",
  "school",
  "comfort",
  "present",
  "wedding",
  "doctor",
  "landlord",
  "office",
  "story",
  "bargain",
  "explainwork",
  "disagree",
  "blessing",
  "neighbor",
] as const;

export const BANK_ICON: Record<string, string> = {
  toast: "🥂",
  car: "🔧",
  hair: "💇",
  school: "🏫",
  comfort: "🤍",
  present: "📊",
  wedding: "💒",
  doctor: "🩺",
  landlord: "🔑",
  office: "🏛️",
  story: "😄",
  bargain: "🤝",
  explainwork: "🧭",
  disagree: "⚖️",
  blessing: "🙏",
  neighbor: "🚪",
};

export interface Situation {
  id: string;
  /** typed by the grower; empty when it came from the bank */
  name: string;
  /** bank id, when it came from the starter bank */
  seed?: string;
  /** how often it comes up, 0–5 */
  freq: number;
  /** how much it matters when it does, 0–5 */
  imp: number;
  /** how well it already goes, 0–10 (subtracted) */
  skill: number;
}

export interface NeedsState {
  situations: Situation[];
  targetId: string | null;
  confirmedAt: string | null;
}

export const NEEDS_INITIAL: NeedsState = { situations: [], targetId: null, confirmedAt: null };

/** Display name of a situation / track: localized when it came from the bank. */
export const bankLabel = (item: { name: string; seed?: string }, t: (key: string) => string): string =>
  item.seed ? t(`st6_bank_${item.seed}`) : item.name;

/** The guide's sum: how often + how important − how well you already do it. */
export const needScore = (s: Pick<Situation, "freq" | "imp" | "skill">): number => s.freq + s.imp - s.skill;

/* -------------------------- discourse pipeline -------------------------- */

export const STAGES = ["prelude", "a", "b", "script", "roleplay", "capstone"] as const;
export type StageId = (typeof STAGES)[number];

/** how many checklist lines each stage has (labels are st6_d_{stage}_c{i}) */
export const STAGE_CHECKS: Record<StageId, number> = {
  prelude: 4,
  a: 4,
  b: 4,
  script: 3,
  roleplay: 3,
  capstone: 4,
};

/** the guide keeps the grower in the lead for 10–20 hours before Stage B */
export const STAGE_A_MIN_HOURS = 10;
export const STAGE_A_MAX_HOURS = 20;

export interface TrackSession {
  id: string;
  date: string;
  minutes: number;
  stage: StageId;
  /** all five special-growth marks were true of this session */
  qualifies: boolean;
  note: string;
}

export interface Capstone {
  id: string;
  date: string;
  what: string;
  reflection: string;
}

export interface Track {
  id: string;
  name: string;
  seed?: string;
  goal: 100 | 300;
  steps: Record<string, boolean>;
  sessions: TrackSession[];
  /** minutes measured at this workbench (solo work; never counted as mediated hours) */
  bench: { date: string; minutes: number }[];
  postcards: Postcard[];
  capstones: Capstone[];
  /** the brainstormed list of real occasions / people / parts */
  occasions: string;
  /** which authored rehearsal script was last used */
  script: string;
  startedAt: string;
}

export interface RareState {
  tracks: Track[];
  activeId: string | null;
}

export const RARE_INITIAL: RareState = { tracks: [], activeId: null };

export const blankTrack = (id: string, name: string, seed?: string): Track => ({
  id,
  name,
  seed,
  goal: 100,
  steps: {},
  sessions: [],
  bench: [],
  postcards: [],
  capstones: [],
  occasions: "",
  script: "",
  startedAt: new Date().toISOString(),
});

export function trackMinutes(track: Track) {
  let mediated = 0;
  let other = 0;
  let stageA = 0;
  for (const s of track.sessions) {
    if (s.qualifies) mediated += s.minutes;
    else other += s.minutes;
    if (s.stage === "a") stageA += s.minutes;
  }
  const bench = track.bench.reduce((sum, b) => sum + b.minutes, 0);
  return { mediated, other, stageA, bench };
}

/** Everything spent on this discourse inside one week (sessions + workbench). */
export function trackWeekMinutes(track: Track, weekIso: string): number {
  const sessions = track.sessions.filter((s) => inWeek(s.date, weekIso)).reduce((sum, s) => sum + s.minutes, 0);
  const bench = track.bench.filter((b) => inWeek(b.date, weekIso)).reduce((sum, b) => sum + b.minutes, 0);
  return sessions + bench;
}

/* --------------------------- expert interviewing ------------------------ */

export type PersonStatus = "toask" | "agreed" | "met";

export interface ExpertPerson {
  id: string;
  name: string;
  status: PersonStatus;
}

export interface ExpertQuestion {
  id: string;
  /** written in the host language */
  text: string;
  asked: boolean;
}

export type ExpertSessionKind = "interview" | "course" | "other";

export interface ExpertSession {
  id: string;
  date: string;
  minutes: number;
  kind: ExpertSessionKind;
  /** new words met in this sitting */
  words: number;
  note: string;
}

export interface ExpertTopic {
  id: string;
  name: string;
  why: string;
  people: ExpertPerson[];
  questions: ExpertQuestion[];
  /** host-language words of this field, in the order they were met */
  vocab: string[];
  sessions: ExpertSession[];
  postcards: Postcard[];
  startedAt: string;
}

export interface ExpertState {
  topics: ExpertTopic[];
  activeId: string | null;
}

export const EXPERT_INITIAL: ExpertState = { topics: [], activeId: null };

/* ------------------------------- remedial ------------------------------- */

/** The reflective checks. Every answer runs 0 (the Phase 6 road) → 2 (the plateau). */
export const DIAG_QUESTIONS = ["follow", "understand", "hearing", "asked", "newwords", "changed", "special"] as const;
export type DiagQuestion = (typeof DIAG_QUESTIONS)[number];

export type DiagRoute = "understanding" | "lifestyle" | "coasting" | "onroad";

export interface Diagnostic {
  id: string;
  at: string;
  answers: Partial<Record<DiagQuestion, number>>;
  /** host hours of the audited week this look was judged against, when one existed */
  hostHours: number | null;
  /** words added to the Word Log that week */
  wordsWeek: number;
  route: DiagRoute;
}

export interface PickupSession {
  id: string;
  date: string;
  minutes: number;
  words: number;
  what: string;
}

export interface PickupLive {
  startedAt: number;
  words: number;
  what: string;
}

export interface RemedialState {
  diagnostics: Diagnostic[];
  pickups: PickupSession[];
  live: PickupLive | null;
}

export const REMEDIAL_INITIAL: RemedialState = { diagnostics: [], pickups: [], live: null };

/** Condition 1 of the Phase 6 road: you understand most of what is said around you. */
export function understandsMost(answers: Partial<Record<DiagQuestion, number>>): boolean {
  const follow = answers.follow ?? 0;
  const understand = answers.understand ?? 0;
  return !(follow === 2 || understand === 2 || (follow === 1 && understand === 1));
}

/** Condition 2: you do, in fact, keep hearing a lot of it. */
export function hearsALot(answers: Partial<Record<DiagQuestion, number>>, hostHours: number | null): boolean {
  const hearing = answers.hearing ?? 0;
  if (hearing === 2) return false;
  if (hostHours !== null && hostHours < 10) return false;
  return true;
}

/**
 * Where the answers point. Not a score: the guide's own fork. A gap in
 * understanding is the big one (special-growth hours); a gap in exposure is
 * the fixable one (lifestyle); neither gap but no new words is coasting.
 */
export function diagRoute(answers: Partial<Record<DiagQuestion, number>>, hostHours: number | null): DiagRoute {
  if (!understandsMost(answers)) return "understanding";
  if (!hearsALot(answers, hostHours)) return "lifestyle";
  if ((answers.asked ?? 0) === 2 || (answers.newwords ?? 0) === 2 || (answers.changed ?? 0) === 2) return "coasting";
  return "onroad";
}

/** the remedial pace the guide sets: ten new words an hour */
export const PICKUP_PACE = 10;

/** talk-through cards for hole finding (prompts are st6_m_card_{id} strings) */
export const HOLE_CARDS = [
  { id: "film", icon: "🎞️" },
  { id: "kitchen", icon: "🍲" },
  { id: "body", icon: "🩹" },
  { id: "fix", icon: "🛞" },
  { id: "tools", icon: "🧰" },
  { id: "feeling", icon: "😳" },
  { id: "money", icon: "🏦" },
  { id: "game", icon: "🪁" },
  { id: "weather", icon: "⛅" },
  { id: "work", icon: "🧭" },
  { id: "sides", icon: "⚖️" },
  { id: "window", icon: "🪟" },
  { id: "ceremony", icon: "💐" },
] as const;
