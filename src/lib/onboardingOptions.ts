/**
 * Shared onboarding option sets — the single source of truth for the
 * "why this language", "what you love", and "daily rhythm" pickers.
 *
 * Both the onboarding wizard (src/app/onboarding/page.tsx) and the
 * profile/account page (src/app/(app)/profile/page.tsx) import these so a
 * saved id ("family roots", "food", 120…) always renders with the same
 * emoji and translated label. `labelKey`/`identityKey` resolve through the
 * immersion translator (t) at render time.
 */

/** Why this language — multi-select; stored as readable ids. */
export const MOTIVATIONS = [
  { id: "family roots", emoji: "🌳", labelKey: "dshMotFamilyRoots" },
  { id: "travel", emoji: "🧳", labelKey: "dshMotTravel" },
  { id: "someone I love", emoji: "💛", labelKey: "dshMotSomeoneILove" },
  { id: "work", emoji: "💼", labelKey: "dshMotWork" },
  { id: "faith", emoji: "🕊️", labelKey: "dshMotFaith" },
  { id: "the joy of it", emoji: "✨", labelKey: "dshMotJoy" },
] as const;

/** What you love — multi-select picture-card worlds. */
export const INTERESTS = [
  { id: "food", emoji: "🍲", labelKey: "dshIntFood" },
  { id: "music", emoji: "🎶", labelKey: "dshIntMusic" },
  { id: "sport", emoji: "⚽", labelKey: "dshIntSport" },
  { id: "nature", emoji: "🌿", labelKey: "dshIntNature" },
  { id: "family", emoji: "👨‍👩‍👧", labelKey: "dshIntFamily" },
  { id: "craft", emoji: "🧵", labelKey: "dshIntCraft" },
  { id: "games", emoji: "🎲", labelKey: "dshIntGames" },
  { id: "stories", emoji: "📚", labelKey: "dshIntStories" },
  { id: "travel", emoji: "🗺️", labelKey: "dshIntTravel" },
  { id: "faith", emoji: "🙏", labelKey: "dshIntFaith" },
] as const;

/** Daily watering rhythms — minutes → growing identity. The more you water,
 *  the faster you grow; the all-in 2h can be split into chunks across the day. */
export const PACES = [
  { minutes: 20, emoji: "🌱", identityKey: "dshPaceSeedling" },
  { minutes: 40, emoji: "🌿", identityKey: "dshPaceSprout" },
  { minutes: 60, emoji: "🌳", identityKey: "dshPaceGrove" },
  { minutes: 120, emoji: "🌴", identityKey: "dshPaceJungle", allIn: true },
] as const;

export const motivationById = (id: string) => MOTIVATIONS.find((m) => m.id === id);
export const interestById = (id: string) => INTERESTS.find((i) => i.id === id);
export const paceByMinutes = (min: number) => PACES.find((p) => p.minutes === min);
