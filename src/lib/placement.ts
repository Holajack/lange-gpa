import type { LangCode, PhaseId, VocabItem } from "./types";
import { TPR_COMMANDS, VOCAB_DOMAINS } from "./vocab";
import { QUESTION_TEMPLATES, questionFor } from "./sessionFlow";
import { phaseById } from "./phases";

/**
 * placement — an honest, comprehension-only placement test.
 *
 * Everyone defaults to Phase 1. Experienced growers can EARN a higher
 * start by demonstrating comprehension — hearing the host language and
 * pointing at pictures. No reading, no translating, no typing, no
 * self-report: performance that cannot be faked.
 *
 *   Gate 1 (earns a Phase 2 start): 10 word rounds — hear a word, pick
 *   the right picture from 4 tiles whose distractors come from the SAME
 *   domain (so "яблоко" among four foods, genuinely discriminative) —
 *   plus 2 Listen & Do rounds (hear a TPR command, pick the action).
 *
 *   Gate 2 (earns a Phase 3 start): 10 question-frame rounds — hear
 *   "Where is X?" in the host language against 6 tiles — plus 3
 *   two-step TPR chains, performed in order. Text-free throughout.
 *
 * Pass mark is ≥85% per gate. Placement caps at Phase 3: the deeper
 * phases are relationships and lived stories — they must be lived,
 * not tested into. One replay per round: GPA always allows "ankò",
 * but a placement should pressure-test the iceberg.
 */

/* ------------------------------ rules ------------------------------ */

export type GateId = 1 | 2;

export const PASS_PCT = 85;
export const MAX_REPLAYS_PER_ROUND = 1;
/** Deeper phases must be lived, not tested into. */
export const PLACEMENT_CAP: PhaseId = 3;
/** Which starting phase each gate earns. */
export const GATE_EARNS: Record<GateId, PhaseId> = { 1: 2, 2: 3 };

/* ------------------------------ shapes ----------------------------- */

export interface PlacementTile {
  id: string;
  /** the picture IS the meaning — no text ever sits on a tile */
  emoji: string;
}

export type PlacementRoundKind = "word" | "question" | "tpr" | "tpr-chain";

export interface PlacementRound {
  kind: PlacementRoundKind;
  /** utterances for speak(), in order — two entries for a TPR chain */
  audio: string[];
  tiles: PlacementTile[];
  /** ordered correct tile ids — one for single rounds, two for chains */
  answer: string[];
}

export interface PlacementGate {
  gate: GateId;
  lang: LangCode;
  rounds: PlacementRound[];
  passPct: number;
  /** the starting phase a pass earns */
  earns: PhaseId;
}

export interface RoundResult {
  index: number;
  kind: PlacementRoundKind;
  correct: boolean;
  /** whether the one allowed replay was spent on this round */
  replayed: boolean;
}

export interface GateResult {
  gate: GateId;
  total: number;
  correct: number;
  pct: number;
  passed: boolean;
  perRound: RoundResult[];
}

/* ----------------------------- sampling ---------------------------- */

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Word / question rounds: round-robin over shuffled domains (so a gate
 * mixes food, animals, home… like a nurturer mixing card piles) with
 * every distractor drawn from the target's OWN domain — picking the
 * apple among four foods proves the word, not the category.
 */
function wordRounds(
  lang: LangCode,
  count: number,
  tileCount: number,
  kind: "word" | "question"
): PlacementRound[] {
  const pools = shuffle(
    VOCAB_DOMAINS.map((d) => ({
      domain: d,
      items: shuffle(d.items.filter((it) => Boolean(it.words[lang]))),
    })).filter((p) => p.items.length > 0 && p.domain.items.length >= tileCount)
  );
  const rounds: PlacementRound[] = [];
  let lap = 0;
  while (rounds.length < count) {
    let took = false;
    for (const pool of pools) {
      const target: VocabItem | undefined = pool.items[lap];
      if (!target) continue;
      const word = target.words[lang] as string;
      const distractors = shuffle(
        pool.domain.items.filter((it) => it.id !== target.id)
      ).slice(0, tileCount - 1);
      rounds.push({
        kind,
        audio: [kind === "question" ? questionFor(lang, word) : word],
        tiles: shuffle([target, ...distractors]).map((it) => ({ id: it.id, emoji: it.emoji })),
        answer: [target.id],
      });
      took = true;
      if (rounds.length >= count) break;
    }
    if (!took) break; // every pool exhausted
    lap++;
  }
  return rounds;
}

/** Listen & Do: hear command(s), pick the action(s) — in order for chains. */
function tprRound(lang: LangCode, steps: 1 | 2): PlacementRound | null {
  const cmds = shuffle(TPR_COMMANDS.filter((c) => Boolean(c.words[lang])));
  if (cmds.length < 4) return null;
  const chosen = cmds.slice(0, steps);
  return {
    kind: steps === 2 ? "tpr-chain" : "tpr",
    audio: chosen.map((c) => c.words[lang] as string),
    tiles: shuffle(cmds.slice(0, 4)).map((c) => ({ id: c.id, emoji: c.emoji })),
    answer: chosen.map((c) => c.id),
  };
}

/* ------------------------------ gates ------------------------------ */

/** Build a fresh gate — rounds are randomized, so no two sittings match. */
export function buildGate(lang: LangCode, gate: GateId): PlacementGate {
  const rounds =
    gate === 1
      ? [...wordRounds(lang, 10, 4, "word")]
      : [...wordRounds(lang, 10, 6, "question")];
  const tprCount = gate === 1 ? 2 : 3;
  for (let i = 0; i < tprCount; i++) {
    const r = tprRound(lang, gate === 1 ? 1 : 2);
    if (r) rounds.push(r);
  }
  return { gate, lang, rounds, passPct: PASS_PCT, earns: GATE_EARNS[gate] };
}

/** Correct answers required to pass: ≥85% of rounds, rounded up. */
export function neededCorrect(total: number, passPct = PASS_PCT): number {
  return Math.ceil((total * passPct) / 100);
}

/** Score a finished (or abandoned) gate from its per-round results. */
export function scoreGate(gate: PlacementGate, perRound: RoundResult[]): GateResult {
  const total = gate.rounds.length;
  const correct = perRound.filter((r) => r.correct).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = perRound.length >= total && correct >= neededCorrect(total, gate.passPct);
  return { gate: gate.gate, total, correct, pct, passed, perRound };
}

/* ---------------------------- availability ------------------------- */

/**
 * Placement needs real content to listen to: enough picture-card words
 * for ten discriminative rounds and enough TPR commands for actions.
 * (ru/en rounds play recorded voices; other content languages use the
 * browser's speech synthesis via speak()'s fallback.)
 */
export function placementAvailable(lang: LangCode): boolean {
  const words = VOCAB_DOMAINS.reduce(
    (n, d) => n + d.items.filter((it) => Boolean(it.words[lang])).length,
    0
  );
  const actions = TPR_COMMANDS.filter((c) => Boolean(c.words[lang])).length;
  return words >= 10 && actions >= 4;
}

/**
 * Gate 2 hears whole question frames — it can only be offered when the
 * language has a NATIVE "Where is …?" template. Without one, questionFor
 * would fall back to an English frame around a host word, and mixing
 * languages is exactly what GPA never does. Such growers still earn a
 * Phase 2 start through Gate 1.
 */
export function gate2Available(lang: LangCode): boolean {
  return placementAvailable(lang) && Boolean(QUESTION_TEMPLATES[lang]);
}

/* ------------------------------ seeding ---------------------------- */

/** Roughly what a grower has met by ear when they START this phase. */
const WORDS_AT_START: Partial<Record<PhaseId, number>> = { 2: 1000, 3: 2200 };

/**
 * Profile seed for an earned placement: the phase itself, hours set to
 * the phase's startHour (the journey already lived), and a words-met
 * count true to the phase guides.
 */
export function placementSeed(phase: PhaseId): {
  phase: PhaseId;
  hoursLogged: number;
  wordsMet: number;
} {
  const capped = Math.min(phase, PLACEMENT_CAP) as PhaseId;
  return {
    phase: capped,
    hoursLogged: phaseById(capped).startHour,
    wordsMet: WORDS_AT_START[capped] ?? 0,
  };
}
