import type { LangCode } from "@/lib/types";

/**
 * Epic storytelling: one long story, grown a part at a time, each part told
 * to more than one listener so it improves with the retelling.
 * Titles and notes are the grower's own; no story text ships with the app.
 */

export interface Telling {
  id: string;
  /** who listened */
  to: string;
  /** yyyy-mm-dd */
  day: string;
  recordingId?: string;
}

export interface Episode {
  id: string;
  title: string;
  /** the grower's own plan for this part */
  plan: string;
  tellings: Telling[];
  /** what the listeners reacted to and helped fix */
  reactions: string;
  /** words the grower needed and got from a listener (also in the Word Log) */
  words: string[];
  /** the first recorded telling: later takes thread under it */
  firstRecordingId?: string;
}

export interface Epic {
  id: string;
  lang: LangCode;
  title: string;
  about: string;
  createdAt: string;
  episodes: Episode[];
}

export interface EpicStore {
  epics: Epic[];
  activeId: string | null;
}

export const EMPTY_EPIC_STORE: EpicStore = { epics: [], activeId: null };

export const listenersOf = (episode: Episode) =>
  new Set(episode.tellings.map((x) => x.to.trim().toLocaleLowerCase()).filter(Boolean)).size;

export type EpisodeState = "planned" | "told" | "retold";

/** planned → told once → told to more than one listener (the guide's point). */
export function episodeState(episode: Episode): EpisodeState {
  if (episode.tellings.length === 0) return "planned";
  return episode.tellings.length >= 2 && listenersOf(episode) >= 2 ? "retold" : "told";
}
