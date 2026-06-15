import type { Nurturer } from "./types";

/**
 * Localize a nurturer's DATA-layer English (region, bio, tags) for full
 * immersion. The roster (./nurturers) holds source English; these helpers
 * swap each field for its i18n key so the active `t` renders the right
 * language.
 *
 * Key shape — must stay in lockstep with the keys authored in i18n.ts:
 *   region → nur_{id}_region   (tier 3)
 *   bio    → nur_{id}_bio       (tier 4)
 *   tag    → tag_{sanitize(tag)} (tier 2)  where sanitize strips non-alnum
 *
 * The synthetic AI nurturer "Nuri" (id "ai") is left untouched: its bio is
 * already a key (schNuriBio) and its tags are literal/keyed by the schedule
 * page, so we guard against double-keying it here.
 */

/** sanitize(x) = x.replace(/[^a-zA-Z0-9]/g, "") — used for the tag key. */
export const sanitizeTag = (tag: string): string => tag.replace(/[^a-zA-Z0-9]/g, "");

/** i18n key for a single nurturer tag value. */
export const tagKey = (tag: string): string => `tag_${sanitizeTag(tag)}`;

/**
 * Returns a copy of the nurturer with region/bio/tags replaced by their
 * localized strings via `t`. The AI nurturer "Nuri" is returned unchanged so
 * its already-keyed bio/tags are not double-resolved.
 */
export function localizedNurturer(n: Nurturer, t: (key: string) => string): Nurturer {
  if (n.id === "ai") return n;
  return {
    ...n,
    region: n.region !== undefined ? t(`nur_${n.id}_region`) : n.region,
    bio: t(`nur_${n.id}_bio`),
    tags: n.tags.map((tag) => t(tagKey(tag))),
  };
}
