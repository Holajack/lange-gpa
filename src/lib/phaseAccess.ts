import type { Profile } from "./types";

/**
 * Phase access — GPA phases are LIVED in order, so a phase's tools open only
 * once the grower has actually arrived there (profile.phase is raised by the
 * store's gate-aware self-heal, never by a toggle).
 *
 * NEXT_PUBLIC_UNLOCK_ALL_PHASES=true is an owner/dev preview switch: it opens
 * every phase's studio tools for review without faking a grower's progress.
 * It must stay unset in production.
 */
export const UNLOCK_ALL_PHASES = process.env.NEXT_PUBLIC_UNLOCK_ALL_PHASES === "true";

export function phaseUnlocked(
  profile: Pick<Profile, "phase"> | null | undefined,
  phaseId: number
): boolean {
  if (UNLOCK_ALL_PHASES) return true;
  return Boolean(profile) && (profile as Pick<Profile, "phase">).phase >= phaseId;
}
