"use client";

import type { LangCode } from "@/lib/types";
import { usePersisted } from "../storage";

/**
 * Communities of practice are lived outside the app. This is only the
 * grower's own notebook about them: where they go, what they do there, how
 * many hours, what went over their head, who they now know.
 */

export const COMMUNITY_KINDS = ["work", "faith", "choir", "team", "club", "class", "regulars", "other"] as const;
export type CommunityKind = (typeof COMMUNITY_KINDS)[number];

/** From outside guest to someone the group counts on. A self-placement, not a score. */
export const BELONGING = ["guest", "face", "part", "counted", "belong"] as const;
export type Belonging = (typeof BELONGING)[number];

export interface Person {
  id: string;
  name: string;
  note: string;
}

/** Something that went past the grower in the group: a question for a person, later. */
export interface Missed {
  id: string;
  /** Monday (yyyy-mm-dd) of the week it happened */
  week: string;
  text: string;
  /** it has been asked about */
  asked: boolean;
  /** what it turned out to be */
  answer: string;
  words: string[];
}

export interface Community {
  id: string;
  lang: LangCode;
  name: string;
  kind: CommunityKind;
  role: string;
  /** yyyy-mm-dd the grower started going */
  since: string;
  /** host people run it, their way */
  hostRun: boolean;
  belonging: Belonging;
  /** Monday (yyyy-mm-dd) → hours of host-language participation that week */
  hours: Record<string, number>;
  missed: Missed[];
  people: Person[];
}

export interface CommunityStore {
  communities: Community[];
  activeId: string | null;
}

export const EMPTY_COMMUNITY_STORE: CommunityStore = { communities: [], activeId: null };

export const COMMUNITY_ID = "p5-community";

export function useCommunityStore(lang: LangCode) {
  return usePersisted<CommunityStore>(COMMUNITY_ID, lang, EMPTY_COMMUNITY_STORE);
}

export const totalHours = (c: Community) => Object.values(c.hours).reduce((sum, h) => sum + (Number(h) || 0), 0);

/** The guide's ceiling on ordinary time with people that may be counted toward this phase (hours). */
export const SOCIAL_CAP: [number, number] = [100, 200];

export interface OpenQuestion {
  community: Community;
  missed: Missed;
}

/** Everything not yet asked about, newest week first. */
export function openQuestions(communities: Community[], lang: LangCode): OpenQuestion[] {
  return communities
    .filter((c) => c.lang === lang)
    .flatMap((community) => community.missed.filter((m) => !m.asked).map((missed) => ({ community, missed })))
    .sort((a, b) => b.missed.week.localeCompare(a.missed.week));
}
