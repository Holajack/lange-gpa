import type { Phase, PhaseActivity } from "./types";

/**
 * Internationalization for the six GPA phase guides.
 *
 * The PHASES array in `phases.ts` holds English-only display strings. The
 * courses pages call `localizedPhase(phase, t)` to swap every visible string
 * for its translation while leaving structural/visual fields (id, slug, hours,
 * color, emoji, hrefs, etc.) untouched. The Phase type is unchanged — every
 * field that was a string stays a string.
 *
 * Keys are DETERMINISTIC and STABLE: the same phase always produces the same
 * keys, so the translation table (and the returned key list) stay in sync with
 * the source data without any manual bookkeeping.
 */

/** Strip everything that isn't a letter or digit, so ids make safe key segments. */
const sanitize = (x: string): string => x.replace(/[^a-zA-Z0-9]/g, "");

/**
 * Deterministic key builder for every translatable string on a phase.
 * `id` is the numeric phase id. Activity/part keys are addressed by their
 * (sanitized) string id; principles/milestones by their array index.
 */
export const phaseKey = {
  name: (id: number) => `ph_${id}_name`,
  tagline: (id: number) => `ph_${id}_tag`,
  vocabTarget: (id: number) => `ph_${id}_vocab`,
  description: (id: number) => `ph_${id}_desc`,
  principle: (id: number, i: number) => `ph_${id}_prin${i}`,
  activity: {
    name: (id: number, actId: string) => `ph_${id}_act_${sanitize(actId)}_name`,
    description: (id: number, actId: string) => `ph_${id}_act_${sanitize(actId)}_desc`,
    how: (id: number, actId: string) => `ph_${id}_act_${sanitize(actId)}_how`,
  },
  part: {
    title: (id: number, partId: string) => `ph_${id}_part_${sanitize(partId)}_title`,
    focus: (id: number, partId: string) => `ph_${id}_part_${sanitize(partId)}_focus`,
    hours: (id: number, partId: string) => `ph_${id}_part_${sanitize(partId)}_hours`,
  },
  milestone: (id: number, i: number) => `ph_${id}_mile${i}`,
};

type T = (key: string) => string;

/**
 * Return a deep copy of `phase` with every display string replaced by its
 * translation via `t`. Non-string and structural fields are preserved exactly:
 * id, slug, hours, startHour, color, emoji, plus per-activity minutes/kind/
 * practiceHref and per-part hours/activityIds.
 */
export function localizedPhase(phase: Phase, t: T): Phase {
  const id = phase.id;

  const activities: PhaseActivity[] = phase.activities.map((a) => ({
    ...a,
    name: t(phaseKey.activity.name(id, a.id)),
    description: t(phaseKey.activity.description(id, a.id)),
    how: t(phaseKey.activity.how(id, a.id)),
  }));

  const parts = phase.parts?.map((p) => ({
    ...p,
    title: t(phaseKey.part.title(id, p.id)),
    focus: t(phaseKey.part.focus(id, p.id)),
    hours: t(phaseKey.part.hours(id, p.id)),
  }));

  return {
    ...phase,
    name: t(phaseKey.name(id)),
    tagline: t(phaseKey.tagline(id)),
    vocabTarget: t(phaseKey.vocabTarget(id)),
    description: t(phaseKey.description(id)),
    principles: phase.principles.map((_, i) => t(phaseKey.principle(id, i))),
    milestones: phase.milestones.map((_, i) => t(phaseKey.milestone(id, i))),
    activities,
    ...(parts ? { parts } : {}),
  };
}
