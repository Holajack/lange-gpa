import type { Profile } from "./types";
import { VOCAB_DOMAINS } from "./vocab";
import { POPULATED_MEETINGS, effMeeting, nextMeetingFor } from "./sessionFlow";

/**
 * gates — the GPA advancement checkpoints: 1A → 1B ("talking begins")
 * and 1B → Phase 2 ("Congratulations! Celebrate!").
 *
 * Every gate has three legs, ALL required, and each leg maps to a
 * distinct behavior: MEET (live-session meetings, `meetingProgress`),
 * PRACTICE (words met — live decks alone can't cover all populated
 * words), and TIME (hours logged — a floor, not the driver). None is
 * substitutable for another; that's the honest engagement loop.
 *
 * The guide's literal numbers (~300 words for 1A, ~1,000 for Phase 1)
 * are unreachable with today's authored content, so every target is
 * DERIVED from vocab.ts at module load and converges on the guide's
 * numbers as meetings are authored. Because targets RISE with content,
 * consumers must never check the raw predicates alone — always the
 * stamp-or-predicate helpers (`gate1bPassed` / `phase1Complete`), which
 * honor the persisted `gatesPassed` stamps (once earned, never un-earned).
 *
 * Pure data + pure functions, no React — mirrors sessionFlow.ts.
 */

/* ------------------------- derived targets ------------------------- */

/** effective meeting number of every populated vocab card (all languages share the card set) */
const ITEM_MEETINGS: number[] = VOCAB_DOMAINS.flatMap((d) =>
  d.items.map((it) => effMeeting(d.id, it, d.meeting))
);

const POPULATED_1A = POPULATED_MEETINGS.filter((m) => m <= 15);

/** Last populated 1A meeting (guide: 1A = meetings 1–15) → 14 today; auto-extends as 1A meetings are authored. */
export const LAST_1A_MEETING: number = POPULATED_1A.length > 0 ? Math.max(...POPULATED_1A) : 0;

/** How many live 1A meetings exist to complete → 11 today. */
export const MEETINGS_1A_TOTAL: number = POPULATED_1A.length;

/** How many live Phase-1 meetings exist to complete (the whole spine) → 17 today. */
export const MEETINGS_PHASE1_TOTAL: number = POPULATED_MEETINGS.length;

/**
 * 1A word bar: min(guide's 300, 90% of the words available in populated
 * meetings ≤ 15) → 150 today — 0.9 headroom because decks random-sample,
 * and 150 lands exactly on the guide's own MP7 "150 words" milestone.
 */
export const WORDS_1A_TARGET: number = Math.min(
  300,
  Math.floor(0.9 * ITEM_MEETINGS.filter((m) => m <= 15).length)
);

/** Phase-1 word bar: min(guide's 1,000, 90% of all populated Phase-1 words) → 213 today. */
export const WORDS_PHASE1_TARGET: number = Math.min(
  1000,
  Math.floor(0.9 * ITEM_MEETINGS.length)
);

/** Guide minimum for 1A (30–40 h); a floor, not the driver — replaces the old 40 h proxy. */
export const HOURS_1A_TARGET = 30;

/** Phase 1 is literally "The First 100 Hours" — kept, but now necessary, not sufficient. */
export const HOURS_PHASE1_TARGET = 100;

/* --------------------------- evaluation ---------------------------- */

/** the profile signals a gate reads (Profile satisfies this; so does a
 *  LanguageJourney — the extra optional `gatesMigratedAt` is simply absent
 *  on journeys, which reads as "not yet migrated") */
export type GateSignals = Pick<
  Profile,
  "meetingProgress" | "wordsMet" | "hoursLogged" | "gatesPassed" | "gatesMigratedAt"
>;

export interface GateLeg {
  done: number;
  total: number;
}

/** single source for the gate logic AND the numbers any UI displays */
export interface GateLegs {
  meetings: GateLeg;
  words: GateLeg;
  hours: GateLeg;
  passed: boolean;
}

/** Gate 1 — 1A → 1B: 11 populated 1A meetings + 150 words + 30 h (today's derived numbers). */
export function gateLegs1b(p: GateSignals): GateLegs {
  const progress = p.meetingProgress ?? 0;
  return {
    meetings: {
      done: POPULATED_1A.filter((m) => m <= progress).length,
      total: MEETINGS_1A_TOTAL,
    },
    // wordsMet, NOT wordIds.length — placement-seeded profiles carry wordIds: []
    words: { done: Math.min(p.wordsMet, WORDS_1A_TARGET), total: WORDS_1A_TARGET },
    hours: { done: Math.min(p.hoursLogged, HOURS_1A_TARGET), total: HOURS_1A_TARGET },
    passed:
      progress >= LAST_1A_MEETING &&
      p.wordsMet >= WORDS_1A_TARGET &&
      p.hoursLogged >= HOURS_1A_TARGET,
  };
}

/** Gate 2 — 1B → Phase 2: full spine + 213 words + 100 h (today's derived numbers). */
export function gateLegsPhase2(p: GateSignals): GateLegs {
  const progress = p.meetingProgress ?? 0;
  return {
    meetings: {
      done: POPULATED_MEETINGS.filter((m) => m <= progress).length,
      total: MEETINGS_PHASE1_TOTAL,
    },
    words: { done: Math.min(p.wordsMet, WORDS_PHASE1_TARGET), total: WORDS_PHASE1_TARGET },
    hours: { done: Math.min(p.hoursLogged, HOURS_PHASE1_TARGET), total: HOURS_PHASE1_TARGET },
    passed:
      // spine complete — auto-extends to 40 when the capstone meetings are authored
      nextMeetingFor(progress) === null &&
      p.wordsMet >= WORDS_PHASE1_TARGET &&
      p.hoursLogged >= HOURS_PHASE1_TARGET,
  };
}

/* ---------------------- stamp-or-predicate ------------------------- */
/* Derived targets rise as content is authored; a purely computed gate
   would re-lock people. The store persists a `gatesPassed` stamp the
   first time each predicate is true — consumers check the STAMP first
   and must never check the predicate alone. */

/** Has this grower earned 1B (talking begins)? Stamp first, live predicate second. */
export function gate1bPassed(p: GateSignals): boolean {
  return (
    Boolean(p.gatesPassed?.["1b"]) ||
    // Pre-gates profile the one-shot migration hasn't marked yet: the first
    // render(s) can beat the store's stamp self-heal, so honor the old 40 h
    // Phase1BGuard proxy inline — speaking tools never even flash locked for
    // a grandfathered grower (§3). Once gatesMigratedAt is stamped this
    // clause is dead and 1B is earned by the real three legs only.
    (p.gatesMigratedAt === undefined && p.hoursLogged >= 40) ||
    gateLegs1b(p).passed
  );
}

/** Has this grower completed Phase 1 (may advance to Phase 2)? Stamp first, live predicate second. */
export function phase1Complete(p: GateSignals): boolean {
  return Boolean(p.gatesPassed?.phase2) || gateLegsPhase2(p).passed;
}

/* -------------------- migration grandfathers ----------------------- */

/**
 * What the pre-gate proxies had already granted — nobody regresses:
 * `phase >= 2` was earned under the old hours-only promotion (or an
 * onboarding placement), so both gates count as passed; `hoursLogged
 * >= 40` is the old Phase1BGuard proxy that already opened the speaking
 * tools, so 1B never re-locks. Used by the store's stamp self-heal and
 * by CloudProfileBridge when reconstructing legacy account rows.
 *
 * The 40 h clause is a ONE-SHOT migration grandfather, never a live rule:
 * callers pass `includeHoursProxy: false` once the profile carries
 * `gatesMigratedAt` (see the store self-heal), so a post-gates grower can
 * never stamp 1B by hour-grinding alone. The `phase >= 2` clause stays
 * continuous — phase can no longer be reached without phase1Complete.
 */
export function legacyGateStamps(
  p: { phase: number; hoursLogged: number },
  at: string = new Date().toISOString(),
  includeHoursProxy: boolean = true
): { "1b"?: string; phase2?: string } {
  if (p.phase >= 2) return { "1b": at, phase2: at };
  if (includeHoursProxy && p.hoursLogged >= 40) return { "1b": at };
  return {};
}
