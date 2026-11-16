import type { PhaseActivity } from "./types";

/**
 * Curriculum activities that have their own studio workbench at
 * /studio/{activityId}. Everything else keeps its `practiceHref`
 * (the four Phase-1 practice games) or falls back to "with your nurturer".
 */
export const STUDIO_ACTIVITY_IDS: ReadonlySet<string> = new Set([
  // Phase 1 — the activities the four practice games never really covered
  "p1-make-true", "p1-photos", "p1-lexicarry", "p1-sounds", "p1-ladder", "p1-infogap", "p1-market",
  // Phase 2 — story-building
  "p2-describe", "p2-storybuild", "p2-clarify", "p2-wsw", "p2-busy", "p2-process", "p2-smalltalk", "p2-lifestory",
  // Phase 3 — shared stories
  "p3-bridge", "p3-script", "p3-cartoon", "p3-massage", "p3-shared", "p3-prop", "p3-flood", "p3-host",
  "p3-expository", "p3-talkmore", "p3-sample", "p3-reading",
  // Phase 4 — deep life sharing
  "p4-lifestory", "p4-vocab", "p4-walkoflife", "p4-observe", "p4-feedback", "p4-holes", "p4-tworecorder",
  // Phase 5 — native-to-native discourse
  "p5-record", "p5-tensteps", "p5-retell", "p5-library", "p5-media", "p5-epic", "p5-community",
  // Phase 6 — self-sustaining growth
  "p6-hours", "p6-cop", "p6-read", "p6-needs", "p6-rare", "p6-expert", "p6-remedial",
]);

/** Where an activity's Start button goes, or undefined when it has no in-app version. */
export function activityHref(activity: Pick<PhaseActivity, "id" | "practiceHref">): string | undefined {
  return STUDIO_ACTIVITY_IDS.has(activity.id) ? `/studio/${activity.id}` : activity.practiceHref;
}
