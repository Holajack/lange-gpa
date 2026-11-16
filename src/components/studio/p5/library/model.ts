import type { LangCode } from "@/lib/types";
import { tonightsQueue, type LibraryItem } from "@/lib/library";
import type { ClarifyFlow } from "../clarifyFlow";
import { isDiscourse } from "../discourse";
import { daysBetween, localDay } from "../storage";

/**
 * The shrinking copy.
 *
 * The guide's review trick: keep a copy of what you re-listen to, and take
 * out whatever has become easy, so each pass is shorter and spends itself on
 * what still resists. Here nothing is ever removed from the library. A unit
 * is only "set aside", and can be brought back.
 *
 * A unit is something you can hear through in one go: a clarified stretch of
 * a native-to-native recording, or a whole shorter recording (a mentor's
 * reply, a retelling, a read-aloud).
 */

export interface ReadEntry {
  id: string;
  lang: LangCode;
  what: string;
  /** yyyy-mm-dd */
  day: string;
  pages: number;
  minutes: number;
  /** words taken to the Word Log to ask about */
  words: string[];
}

export interface ShrinkSnapshot {
  /** yyyy-mm-dd */
  day: string;
  lang: LangCode;
  /** seconds still in the copy that day */
  activeSec: number;
  /** seconds in the whole library that day */
  totalSec: number;
}

export interface LibStore {
  /** stretch key → ISO time it was set aside as known cold */
  cold: Record<string, string>;
  /** stretch key → ISO times it was heard through */
  heard: Record<string, string[]>;
  shrink: ShrinkSnapshot[];
  reading: ReadEntry[];
}

export const EMPTY_LIB_STORE: LibStore = { cold: {}, heard: {}, shrink: [], reading: [] };

export interface Unit {
  key: string;
  item: LibraryItem;
  start: number;
  /** ≤ start means "to the end" */
  end: number;
  /** the unit is a whole recording, not a stretch of one */
  whole: boolean;
  /** stretch number (1-based) when it is a stretch */
  stretchNo?: number;
  seconds: number;
  cold: boolean;
  /** ISO times heard through */
  heard: string[];
  /** when it entered the review: cleared (stretch) or recorded (whole) */
  bornAt: string;
}

export const stretchKey = (recordingId: string, index: number) => `str:${recordingId}:${index}`;

/** Every reviewable unit for this language, in library order (recording, then position). */
export function buildUnits(
  items: LibraryItem[],
  flows: Record<string, ClarifyFlow>,
  store: LibStore,
  lang: LangCode
): { units: Unit[]; waiting: LibraryItem[] } {
  const units: Unit[] = [];
  const waiting: LibraryItem[] = [];
  const mine = items
    // word recordings have their own tab; the grower's own voice is for feedback, not for the listening copy
    .filter((it) => it.lang === lang && it.kind !== "word" && it.speaker !== "me")
    .filter((it) => it.phase === 5 || Boolean(flows[it.id]))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const item of mine) {
    if (isDiscourse(item, lang)) {
      const cleared = (flows[item.id]?.stretches ?? []).filter((s) => s.clearedAt);
      if (cleared.length === 0) {
        // native-to-native speech nobody has gone through with you yet is not review material
        waiting.push(item);
        continue;
      }
      for (const s of cleared) {
        const key = stretchKey(item.id, s.index);
        units.push({
          key,
          item,
          start: s.start,
          end: s.end,
          whole: false,
          stretchNo: s.index + 1,
          seconds: Math.max(0, s.end - s.start) || item.durationSec,
          cold: Boolean(item.familiar) || Boolean(store.cold[key]),
          heard: store.heard[key] ?? [],
          bornAt: s.clearedAt as string,
        });
      }
      continue;
    }
    units.push({
      key: `rec:${item.id}`,
      item,
      start: 0,
      end: item.durationSec,
      whole: true,
      seconds: item.durationSec,
      cold: Boolean(item.familiar),
      heard: item.relistens,
      bornAt: item.createdAt,
    });
  }
  return { units, waiting };
}

const lastHeard = (u: Unit) => u.heard[u.heard.length - 1] ?? "";

/** Days to wait before a unit comes round again, by how often it has been heard. */
export const SPACING_DAYS = [0, 1, 3, 7, 14, 30, 60];

export function comesRound(u: Unit, today: string): boolean {
  const last = lastHeard(u);
  if (!last) return true;
  const wait = SPACING_DAYS[Math.min(u.heard.length, SPACING_DAYS.length - 1)];
  return daysBetween(localDay(last), today) >= wait;
}

export interface Tonight {
  /** cleared or recorded today: the same-evening listen */
  fresh: Unit[];
  /** older units whose turn has come round */
  round: Unit[];
  /** one piece set aside long ago, to check it is still easy */
  shelf: Unit[];
}

/**
 * Tonight's queue. Today's work first (the guide's same-evening rule), then
 * older units on a widening rotation. Whole recordings are chosen by the
 * library's own tonightsQueue; stretches follow the same least-recently-heard
 * rule from this tool's listening log.
 */
export function tonight(units: Unit[], today: string, roundLimit = 4): Tonight {
  const active = units.filter((u) => !u.cold);
  const fresh = active.filter((u) => localDay(u.bornAt) === today && u.heard.length === 0);
  const freshKeys = new Set(fresh.map((u) => u.key));
  const older = active.filter((u) => !freshKeys.has(u.key));

  const wholes = older.filter((u) => u.whole && comesRound(u, today));
  const pickedIds = new Set(tonightsQueue(wholes.map((u) => u.item), 2).map((it) => it.id));
  const pickedWholes = wholes.filter((u) => pickedIds.has(u.item.id));

  const stretches = older
    .filter((u) => !u.whole && comesRound(u, today))
    .sort((a, b) => lastHeard(a).localeCompare(lastHeard(b)) || a.bornAt.localeCompare(b.bornAt))
    .slice(0, Math.max(0, roundLimit - pickedWholes.length));

  const shelf = units
    .filter((u) => u.cold && daysBetween(localDay(lastHeard(u) || u.bornAt), today) >= 30)
    .sort((a, b) => (lastHeard(a) || a.bornAt).localeCompare(lastHeard(b) || b.bornAt))
    .slice(0, 1);

  return { fresh, round: [...stretches, ...pickedWholes], shelf };
}

export const sumSeconds = (units: Unit[]) => units.reduce((sum, u) => sum + u.seconds, 0);

/** Record today's size of the copy (one snapshot per day and language, latest wins). */
export function withSnapshot(store: LibStore, units: Unit[], lang: LangCode, today: string): LibStore {
  if (units.length === 0) return store;
  const snap: ShrinkSnapshot = {
    day: today,
    lang,
    activeSec: sumSeconds(units.filter((u) => !u.cold)),
    totalSec: sumSeconds(units),
  };
  const same = store.shrink.find((s) => s.day === today && s.lang === lang);
  if (same && same.activeSec === snap.activeSec && same.totalSec === snap.totalSec) return store;
  const rest = store.shrink.filter((s) => !(s.day === today && s.lang === lang));
  return { ...store, shrink: [...rest, snap].sort((a, b) => a.day.localeCompare(b.day)).slice(-120) };
}
