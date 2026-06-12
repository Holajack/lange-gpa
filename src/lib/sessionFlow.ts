import type { LangCode } from "./types";
import { VOCAB_DOMAINS } from "./vocab";

/**
 * sessionFlow — the authentic GPA Phase-1 "Dirty Dozen" pacing engine.
 *
 * A nurturer introduces ~12 picture cards per session, but never in a
 * dump: card 1 is free (INTRO → ECHO), and every further card must be
 * EARNED through a review round of "Where is …?" questions over the
 * cards already met. Every 3rd card the round sweeps ALL introduced
 * cards. Pure data + pure transitions, so the session room (human or
 * AI nurturer) can drive the exact same flow.
 */

/* ------------------------------ deck ------------------------------ */

export interface DeckCard {
  id: string;
  emoji: string;
  /** the word in the growing language — never translated */
  word: string;
  domainId: string;
  domainEmoji: string;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build a Dirty Dozen deck: sample across vocab domains (round-robin
 * over shuffled domains) so a session mixes food, animals, home…
 * exactly like a nurturer mixing photo cards from different piles.
 */
export function buildDeck(lang: LangCode, count = 12): DeckCard[] {
  const pools = shuffle(
    VOCAB_DOMAINS.map((d) => ({
      domain: d,
      items: shuffle(d.items.filter((it) => Boolean(it.words[lang]))),
    })).filter((p) => p.items.length > 0)
  );
  const deck: DeckCard[] = [];
  let round = 0;
  while (deck.length < count) {
    let took = false;
    for (const pool of pools) {
      const item = pool.items[round];
      if (!item) continue;
      deck.push({
        id: item.id,
        emoji: item.emoji,
        word: item.words[lang] as string,
        domainId: pool.domain.id,
        domainEmoji: pool.domain.emoji,
      });
      took = true;
      if (deck.length >= count) break;
    }
    if (!took) break; // every pool exhausted
    round++;
  }
  return deck;
}

/* --------------------------- audio cues --------------------------- */
/* AUDIO CUE CONTRACT — exact strings shared with audio generation.   */

export interface CueSet {
  greeting: string;
  listen: string;
  again: string;
  point: string;
  praise: string;
  begin: string;
}

export const CUES: Partial<Record<LangCode, CueSet>> = {
  ru: {
    greeting: "Привет! Я Листик.",
    listen: "Слушай.",
    again: "Ещё раз.",
    point: "Покажи.",
    praise: "Молодец!",
    begin: "Начнём!",
  },
  en: {
    greeting: "Hi! I'm Nuri.",
    listen: "Listen.",
    again: "One more time.",
    point: "Point to it.",
    praise: "Well done!",
    begin: "Let's begin!",
  },
};

/** "Where is …?" — the one question that powers all of Phase 1. */
export const QUESTION_TEMPLATES: Partial<Record<LangCode, (word: string) => string>> = {
  en: (word) => `Where is the ${word}?`,
  es: (word) => `¿Dónde está ${word}?`,
  fr: (word) => `Où est ${word} ?`,
  de: (word) => `Wo ist ${word}?`,
  pt: (word) => `Onde está ${word}?`,
  it: (word) => `Dov'è ${word}?`,
  ru: (word) => `Где ${word}?`,
  ja: (word) => `${word}はどこ？`,
  zh: (word) => `${word}在哪里？`,
};

export function questionFor(lang: LangCode, word: string): string {
  const template = QUESTION_TEMPLATES[lang] ?? QUESTION_TEMPLATES.en;
  return template ? template(word) : word;
}

/* ------------------------- review picking ------------------------- */

/**
 * Pick a review target weighted toward the NEWEST cards — fresh words
 * need the most encounters (cards keep order oldest → newest).
 */
export function pickReviewTarget(introduced: DeckCard[]): DeckCard {
  const total = introduced.reduce((sum, _, i) => sum + (i + 1) ** 2, 0);
  let roll = Math.random() * total;
  for (let i = introduced.length - 1; i >= 0; i--) {
    roll -= (i + 1) ** 2;
    if (roll <= 0) return introduced[i];
  }
  return introduced[introduced.length - 1];
}

/* ------------------------- state machine -------------------------- */

export type FlowPhase =
  | "ready" // nothing on the table yet
  | "intro" // a new card was just revealed — say it twice, let the grower echo
  | "review" // a "Where is …?" question is on the floor
  | "review-done" // round complete — the next card is unlocked
  | "complete"; // all cards introduced and the final sweep is done

export interface FlowState {
  deck: DeckCard[];
  /** how many cards from the deck have been introduced (deck[0..n-1]) */
  introduced: number;
  phase: FlowPhase;
  /** card ids still to ask this round — current question first */
  reviewQueue: string[];
  /** questions in the current/last round */
  reviewTotal: number;
  /** this round sweeps ALL introduced cards (every 3rd card) */
  fullReview: boolean;
  /** has the required review before the next intro been completed? */
  reviewSatisfied: boolean;
}

export function createFlow(deck: DeckCard[]): FlowState {
  return {
    deck,
    introduced: 0,
    phase: "ready",
    reviewQueue: [],
    reviewTotal: 0,
    fullReview: false,
    reviewSatisfied: true, // card 1 is free
  };
}

export const introducedCards = (s: FlowState): DeckCard[] => s.deck.slice(0, s.introduced);

export const currentCard = (s: FlowState): DeckCard | null =>
  s.introduced > 0 ? s.deck[s.introduced - 1] : null;

export const reviewTarget = (s: FlowState): DeckCard | null =>
  s.phase === "review" && s.reviewQueue.length > 0
    ? s.deck.find((c) => c.id === s.reviewQueue[0]) ?? null
    : null;

/** size of the review round owed after the latest intro */
export function plannedReviewLength(s: FlowState): number {
  if (s.introduced === 0) return 0;
  return s.introduced % 3 === 0 ? s.introduced : Math.min(s.introduced, 4);
}

export function canReveal(s: FlowState): boolean {
  if (s.introduced >= s.deck.length) return false;
  if (s.phase === "review") return false;
  return s.introduced === 0 || s.reviewSatisfied;
}

/** Reveal the next card (INTRO). Only legal when the owed review is done. */
export function reveal(s: FlowState): FlowState {
  if (!canReveal(s)) return s;
  return {
    ...s,
    introduced: s.introduced + 1,
    phase: "intro",
    reviewQueue: [],
    reviewTotal: 0,
    fullReview: false,
    reviewSatisfied: false, // every further card must be earned
  };
}

/** Start a review round: k = min(introduced, 4), or ALL on every 3rd card. */
export function startReview(s: FlowState): FlowState {
  if (s.introduced === 0 || s.phase === "review") return s;
  const cards = introducedCards(s);
  const full = s.introduced % 3 === 0;
  let queue: string[];
  if (full) {
    queue = shuffle(cards).map((c) => c.id);
  } else {
    const k = Math.min(s.introduced, 4);
    const remaining = [...cards];
    queue = [];
    while (queue.length < k && remaining.length > 0) {
      const pick = pickReviewTarget(remaining);
      queue.push(pick.id);
      remaining.splice(remaining.findIndex((c) => c.id === pick.id), 1);
    }
  }
  return { ...s, phase: "review", reviewQueue: queue, reviewTotal: queue.length, fullReview: full };
}

/**
 * Resolve the current question. A miss keeps the question on the floor
 * (the nurturer re-says the word — it lives in the grower's iceberg);
 * a hit advances the queue, and an empty queue unlocks the next card.
 */
export function answerReview(s: FlowState, correct: boolean): FlowState {
  if (s.phase !== "review" || s.reviewQueue.length === 0) return s;
  if (!correct) return s;
  const queue = s.reviewQueue.slice(1);
  if (queue.length > 0) return { ...s, reviewQueue: queue };
  const allDone = s.introduced >= s.deck.length;
  return {
    ...s,
    reviewQueue: [],
    phase: allDone ? "complete" : "review-done",
    reviewSatisfied: true,
  };
}

/* --------------------------- joke prompts -------------------------- */
/* GPA: laughter makes words stick. Rotating mischief for the nurturer. */

export const JOKE_PROMPTS: string[] = [
  "Hide a card behind your back — ask where it went",
  "Give the animal a silly voice",
  "Stack two cards and ask which is under",
  "Put a card on your head and ask for it with a straight face",
  "Point at the wrong card yourself, look very confused",
  "Whisper the word… then say it like an opera singer",
  "Make a card slowly \"walk\" across the table while naming it",
  "Ask for a card, then snatch it back — \"mine!\"",
];
