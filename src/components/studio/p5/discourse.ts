"use client";

import type { LangCode } from "@/lib/types";
import type { LibraryItem } from "@/lib/library";
import { clearedSec, isComplete, totalWorkSec, type ClarifyFlow, type Stretch } from "./clarifyFlow";
import { localDay, usePersisted } from "./storage";

/**
 * What the Phase 5 tools know about each other.
 *
 * The recordings and their flagged moments live in the Listening Library.
 * The ten-step progress (which stretches are clear, when) lives in the
 * ten-step tool's own store. The other tools read both, and derive the rest:
 * what is due for retelling, what is waiting to be clarified, what is clear.
 * Nothing is written across tools.
 */

/** Activity whose store holds the ten-step progress. */
export const TENSTEPS_ID = "p5-tensteps";
/** Activity whose store holds retellings given aloud. */
export const RETELL_ID = "p5-retell";

export interface TenStepsStore {
  /** progress per recording id */
  flows: Record<string, ClarifyFlow>;
  /** the recording on the table */
  activeId: string | null;
}

export const EMPTY_TENSTEPS: TenStepsStore = { flows: {}, activeId: null };

/** Tags this phase puts on recordings. */
export const TAG = {
  /** attested: recorded with the grower absent, speakers consenting */
  attested: "n2n",
  media: "media",
  wordRec: "wordrec",
  readAloud: "read-aloud",
  mentorReply: "mentor-reply",
  mentorTelling: "mentor-telling",
  insider: "insider-view",
  rehearsal: "rehearsal",
} as const;

export const tagValue = (item: LibraryItem, prefix: string): string | undefined =>
  item.tags?.find((tag) => tag.startsWith(`${prefix}:`))?.slice(prefix.length + 1);

/** Read-only live view of the ten-step progress for this account and language. */
export function useFlows(lang: LangCode) {
  const [store, , ready] = usePersisted<TenStepsStore>(TENSTEPS_ID, lang, EMPTY_TENSTEPS);
  return { flows: store.flows, ready };
}

/**
 * Native-to-native material in this language: audio brought in from outside,
 * or a host text read aloud by the mentor (the guide treats both the same way:
 * something to clarify stretch by stretch).
 */
export const isDiscourse = (item: LibraryItem, lang: LangCode) =>
  item.lang === lang && (item.kind === "imported" || Boolean(item.tags?.includes(TAG.readAloud)));

export const discoursesOf = (items: LibraryItem[], lang: LangCode) => items.filter((it) => isDiscourse(it, lang));

/* ------------------------------ retelling ------------------------------ */

export interface RetellStore {
  /** recording id → when it was last retold aloud to a person, with no recording made */
  toldLive: Record<string, string>;
}

export const EMPTY_RETELL: RetellStore = { toldLive: {} };

export function useRetellStore(lang: LangCode) {
  return usePersisted<RetellStore>(RETELL_ID, lang, EMPTY_RETELL);
}

export interface RetellEntry {
  item: LibraryItem;
  flow: ClarifyFlow;
  /** the stretches cleared since the last retelling */
  stretches: Stretch[];
  start: number;
  end: number;
  /** local day the oldest of them was cleared */
  clarifiedOn: string;
  /** every stretch is clear: this is the end-to-end retelling */
  whole: boolean;
  /** clarified yesterday or earlier */
  due: boolean;
}

/** Everything clarified but not yet retold, oldest first. */
export function retellQueue(
  items: LibraryItem[],
  flows: Record<string, ClarifyFlow>,
  lang: LangCode,
  today: string,
  /** retellings given aloud without a recording (recording id → ISO time) */
  toldLive: Record<string, string> = {}
): RetellEntry[] {
  const out: RetellEntry[] = [];
  for (const item of discoursesOf(items, lang)) {
    const flow = flows[item.id];
    if (!flow) continue;
    const lastRetell = items
      .filter((it) => it.kind === "retell" && it.parentId === item.id)
      .reduce((max, it) => (it.createdAt > max ? it.createdAt : max), toldLive[item.id] ?? "");
    const pending = flow.stretches.filter((s) => s.clearedAt !== undefined && s.clearedAt > lastRetell);
    if (pending.length === 0) continue;
    const oldest = pending.reduce((min, s) => (s.clearedAt && s.clearedAt < min ? s.clearedAt : min), "9999");
    const clarifiedOn = localDay(oldest);
    const whole = isComplete(flow);
    out.push({
      item,
      flow,
      stretches: pending,
      start: whole ? 0 : Math.min(...pending.map((s) => s.start)),
      end: whole ? flow.durationSec : Math.max(...pending.map((s) => s.end)),
      clarifiedOn,
      whole,
      due: clarifiedOn < today,
    });
  }
  return out.sort((a, b) => a.clarifiedOn.localeCompare(b.clarifiedOn));
}

/* -------------------------------- pacing ------------------------------- */

export interface Pacing {
  /** seconds of native-to-native recording in the library */
  bankedSec: number;
  /** seconds of it that are now clear */
  clearedSec: number;
  /** seconds still waiting for a mentor */
  waitingSec: number;
  /** seconds spent in the clarifying room */
  workSec: number;
  /** recordings fully clear */
  finished: number;
  recordings: number;
}

export function pacingOf(items: LibraryItem[], flows: Record<string, ClarifyFlow>, lang: LangCode): Pacing {
  const discourses = discoursesOf(items, lang);
  let cleared = 0;
  let work = 0;
  let finished = 0;
  for (const item of discourses) {
    const flow = flows[item.id];
    if (!flow) continue;
    cleared += clearedSec(flow);
    work += totalWorkSec(flow);
    if (isComplete(flow)) finished += 1;
  }
  const banked = discourses.reduce((sum, it) => sum + it.durationSec, 0);
  return {
    bankedSec: banked,
    clearedSec: Math.min(cleared, banked),
    waitingSec: Math.max(0, banked - cleared),
    workSec: work,
    finished,
    recordings: discourses.length,
  };
}
