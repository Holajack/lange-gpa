"use client";

import type { Profile } from "./types";
import { PHASES } from "./phases";

/**
 * The Growth Shelf — Nuri's anti-Duolingo achievement system.
 *
 * No streaks. No XP. No leagues. Nothing here decays, nags or guilt-trips.
 * Every badge marks a REAL comprehension or relationship milestone on the
 * Growing Participator path, dated like a pressed flower — a thing that
 * happened once and is kept, never a debt to be serviced. Missing a day
 * costs nothing; the only way to "earn" is to genuinely grow.
 */

/** Fired on `window` whenever a new badge lands — any page can toast it. */
export const ACHIEVEMENT_EVENT = "lange:achievement";
/**
 * Self-report bridge: any page may dispatch
 * `new CustomEvent("lange:award", { detail: { id } })` to award a manual
 * badge (e.g. saving a first recording) without importing this module.
 * The store listens and records it in the signed-in profile.
 */
export const AWARD_REQUEST_EVENT = "lange:award";

export interface GrowthStats {
  hoursLogged: number;
  activitiesDone: number;
  bookingsMade: number;
  completed: string[];
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  kind: "hours" | "first" | "phase";
  /** hour threshold (kind "hours" only) — used for the next-goal progress ring */
  hours?: number;
  check: (profile: Profile, stats: GrowthStats) => boolean;
}

/** id → earnedAt ISO date — the pressed-flower record */
export type EarnedMap = Record<string, string>;

/* ---------------------------------------------------------------- *
 *  The shelf
 * ---------------------------------------------------------------- */

const HOUR_MILESTONES: { hours: number; emoji: string; title: string; sub: string }[] = [
  { hours: 1, emoji: "🌧️", title: "First rain", sub: "One hour of listening — the soil is wet." },
  { hours: 5, emoji: "🌱", title: "Sprout", sub: "Five hours in. Something broke the surface." },
  { hours: 10, emoji: "🌿", title: "First leaves", sub: "Ten hours of meaning without translation." },
  { hours: 25, emoji: "🪴", title: "Taking root", sub: "Twenty-five hours — words are starting to stick." },
  { hours: 50, emoji: "☀️", title: "Reaching for light", sub: "Fifty hours logged inside the language." },
  { hours: 100, emoji: "🌳", title: "Deep roots", sub: "One hundred hours — a whole season of growth." },
  { hours: 250, emoji: "🌸", title: "First blossom", sub: "Two hundred fifty hours inside the host world." },
  { hours: 500, emoji: "🍎", title: "Bearing fruit", sub: "Five hundred hours — conversations carry themselves." },
  { hours: 1000, emoji: "🌲", title: "Old growth", sub: "A thousand hours of belonging." },
  { hours: 1500, emoji: "🌍", title: "Part of the forest", sub: "The full journey — and growth never stops." },
];

export const ACHIEVEMENTS: Achievement[] = [
  // ---- hour milestones: time genuinely spent inside the language ----
  ...HOUR_MILESTONES.map(
    (m): Achievement => ({
      id: `hours-${m.hours}`,
      emoji: m.emoji,
      title: m.title,
      sub: m.sub,
      kind: "hours",
      hours: m.hours,
      check: (_profile, stats) => stats.hoursLogged >= m.hours,
    })
  ),

  // ---- firsts: each one a door that only opens once ----
  {
    id: "first-session",
    emoji: "👋",
    title: "First practice",
    sub: "You finished your first guided activity.",
    kind: "first",
    check: (_profile, stats) => stats.activitiesDone > 0,
  },
  {
    id: "first-dozen",
    emoji: "🃏",
    title: "The first dozen",
    sub: "Twelve picture cards you can point to by ear.",
    kind: "first",
    check: (_profile, stats) => stats.completed.includes("p1-dozen"),
  },
  {
    id: "first-recording",
    emoji: "🎙️",
    title: "Your voice, kept",
    sub: "You saved your first recording.",
    kind: "first",
    // awarded by the page that saves the recording (award() or "lange:award")
    check: () => false,
  },
  {
    id: "first-booking",
    emoji: "🗓️",
    title: "A real person",
    sub: "You booked time with a nurturer.",
    kind: "first",
    check: (_profile, stats) => stats.bookingsMade > 0,
  },
  {
    id: "first-role-switch",
    emoji: "🔄",
    title: "Both sides of the door",
    sub: "You tried the nurturer's chair.",
    kind: "first",
    // awarded by the store when profile.role actually changes
    check: () => false,
  },
  {
    id: "first-joke",
    emoji: "😂",
    title: "First joke understood",
    sub: "You laughed because you understood — self-reported, proudly.",
    kind: "first",
    // self-reported: only the grower knows when this happened
    check: () => false,
  },

  // ---- advancement gates: the moments the guide itself celebrates ----
  // Checked against the persisted gatesPassed STAMP (never the live
  // predicate) so the badge lands exactly once, in the same beat the store
  // stamps the gate — and the ACHIEVEMENT_EVENT it fires is what triggers
  // the full-screen gate ceremony (see components/CheckpointCard.tsx).
  {
    id: "gate-1b",
    emoji: "🗣️",
    title: "Talking begins",
    sub: "Phase 1A complete — time to speak your first words, gently.",
    kind: "phase",
    check: (profile) => Boolean(profile.gatesPassed?.["1b"]),
  },
  {
    id: "gate-phase2",
    emoji: "🎓",
    title: "Phase 1 complete",
    sub: "The first hundred hours are yours. Congratulations — celebrate!",
    kind: "phase",
    check: (profile) => Boolean(profile.gatesPassed?.phase2),
  },

  // ---- phase completions: the six doors of the GPA journey ----
  ...PHASES.filter((phase) => !phase.ongoing).map(
    (p): Achievement => ({
      id: `phase-${p.id}`,
      emoji: p.emoji,
      title: `${p.name}, complete`,
      sub: p.tagline,
      kind: "phase",
      check: (profile) =>
        profile.phase > p.id || profile.hoursLogged >= p.startHour + p.hours,
    })
  ),
];

export const achievementById = (id: string): Achievement | undefined =>
  ACHIEVEMENTS.find((a) => a.id === id);

/* ---------------------------------------------------------------- *
 *  Evaluation (persistence belongs to the account profile in store.tsx)
 * ---------------------------------------------------------------- */

export function statsFor(profile: Profile): GrowthStats {
  return {
    hoursLogged: profile.hoursLogged,
    activitiesDone: profile.activityLog?.length ?? profile.completed.length,
    bookingsMade: profile.bookings.length,
    completed: profile.completed,
  };
}

/** Return every currently deserved achievement that is not already recorded. */
export function eligibleAchievementIds(profile: Profile): string[] {
  const stats = statsFor(profile);
  const earned = profile.achievements ?? {};
  return ACHIEVEMENTS.filter((achievement) => !earned[achievement.id] && achievement.check(profile, stats)).map(
    (achievement) => achievement.id
  );
}
