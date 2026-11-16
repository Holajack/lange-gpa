import type { LangCode } from "@/lib/types";

/**
 * Media the grower watches OUTSIDE the app. Only their own notes live here:
 * a title, timecodes typed by hand, what they saw, what it turned out to be.
 * No film, episode, subtitle or artwork is fetched, stored or shown.
 */

/** Why a moment was logged. */
export const MOMENT_KINDS = ["heard", "seen", "life"] as const;
export type MomentKind = (typeof MOMENT_KINDS)[number];

export interface Moment {
  id: string;
  /** seconds into the film or episode */
  at: number;
  kind: MomentKind;
  /** a few words to find the scene again */
  scene: string;
  /** what the grower saw, or thought they heard */
  mine: string;
  /** what it turned out to be, once a person explained it */
  told: string;
  understood: boolean;
  /** words taken to the Word Log from this moment */
  words: string[];
  createdAt: string;
}

export interface MediaTitle {
  id: string;
  lang: LangCode;
  title: string;
  episode: string;
  /** made by host people for host people (not dubbed) */
  hostMade: boolean;
  createdAt: string;
  moments: Moment[];
  /** yyyy-mm-dd it was watched again after clarifying */
  rewatchedOn?: string;
}

export interface MediaStore {
  titles: MediaTitle[];
  activeId: string | null;
}

export const EMPTY_MEDIA_STORE: MediaStore = { titles: [], activeId: null };
