import type { LangCode } from "@/lib/types";

/** The recording pipeline's own data: who was asked for what, and where it stands. */

/** The guide's kinds of native-to-native recording. */
export const DISCOURSE_TYPES = ["life", "hot", "everyday", "public"] as const;
export type DiscourseType = (typeof DISCOURSE_TYPES)[number];

/** How well the speakers know each other: strangers spell things out, close friends leave most unsaid. */
export const CLOSENESS = ["strangers", "acquainted", "close"] as const;
export type Closeness = (typeof CLOSENESS)[number];

export const STATUSES = ["asked", "recorded", "received", "clarified"] as const;
export type RequestStatus = (typeof STATUSES)[number];

export interface RecRequest {
  id: string;
  lang: LangCode;
  /** who will make the recording */
  recorder: string;
  /** who they will talk with */
  withWhom: string;
  type: DiscourseType;
  closeness: Closeness;
  topic: string;
  /** yyyy-mm-dd, or "" */
  due: string;
  /** only "asked" and "recorded" are stored; the rest is read from the library */
  status: "asked" | "recorded";
  createdAt: string;
  recordingId?: string;
  /** when the absence + consent attestation was given */
  attestedAt?: string;
}

export interface RecordStore {
  requests: RecRequest[];
  /** hours a week the grower plans to spend with a mentor */
  weeklyMentorHours: number;
}

export const EMPTY_RECORD_STORE: RecordStore = { requests: [], weeklyMentorHours: 6 };

/** Minutes of fresh recording one mentor hour uses up. */
export const RECORDING_MIN_PER_MENTOR_HOUR = 20;
/** The least worth clarifying, and the length to hope for (minutes). */
export const MIN_RECORDING_MIN = 20;
export const GOOD_RECORDING_MIN = 60;
/** Hours of recording the guide suggests clarifying across the phase. */
export const PHASE_TARGET_HOURS: [number, number] = [100, 125];
