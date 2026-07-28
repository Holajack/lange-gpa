import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { profileByClerkId, requireIdentity } from "./util";

/**
 * The 18+ gate on community exchange.
 *
 * Adulthood is never stored as a flag and never accepted from the client. The
 * only thing kept is a self-attested date of birth; every gate re-derives the
 * age from it at call time. That costs one lookup per guarded call and buys two
 * things: a client cannot hand us `adult: true`, and an account whose stored
 * date crosses eighteen becomes eligible by itself on the day — no re-attest,
 * no backfill job, no cached boolean to drift out of step with the calendar.
 *
 * `profiles:upsertProfile` deliberately cannot write these columns. That
 * mutation carries a free-form `data` blob, so anything reachable through it is
 * client-controlled and therefore useless as a safety boundary.
 */
type AnyCtx = QueryCtx | MutationCtx;

/** Community exchange is adults-only. */
export const ADULT_AGE = 18;

/** Past this, a date of birth is a typo or an attack, not a person. */
const MAX_HUMAN_AGE = 120;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * One wording for every adults-only refusal, so a caller can never tell the
 * difference between "you never told us" and "you told us and you're 17".
 */
const ADULTS_ONLY =
  "Adults only — confirm your date of birth to use community features";

/**
 * Full years old on `nowMs`, or null when the date is not a real, plausible,
 * already-happened birthday. Null is the fail-closed answer: every caller
 * treats it as "not an adult", so a malformed date can never open a door.
 *
 * Both sides of the comparison are read in UTC. The server has no idea what
 * timezone the person is in, and picking one deterministically means someone
 * far enough east may wait a few hours past local midnight on their birthday —
 * late by a few hours is the harmless direction for this check to be wrong.
 */
export function ageOn(birthDate: string, nowMs: number): number | null {
  if (typeof birthDate !== "string" || !Number.isFinite(nowMs)) return null;
  const match = ISO_DATE.exec(birthDate.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Round-tripping through UTC rejects calendar-impossible days (Feb 30, Apr
  // 31, Feb 29 in a common year) that a plain 1–31 range check waves through.
  const born = new Date(Date.UTC(year, month - 1, day));
  if (
    born.getUTCFullYear() !== year ||
    born.getUTCMonth() !== month - 1 ||
    born.getUTCDate() !== day
  ) {
    return null;
  }

  const now = new Date(nowMs);
  if (Number.isNaN(now.getTime())) return null;
  let age = now.getUTCFullYear() - year;
  const monthDiff = now.getUTCMonth() + 1 - month;
  // this year's birthday hasn't come round yet
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < day)) age -= 1;

  if (age < 0 || age > MAX_HUMAN_AGE) return null;
  return age;
}

/**
 * Is this profile an adult right now? Derived from `birthDate` and nothing
 * else — not from the `data` blob, not from any flag the client can set.
 */
export function isAdultProfile(
  doc: { birthDate?: string } | null | undefined,
  nowMs: number
): boolean {
  const birthDate = doc?.birthDate;
  if (typeof birthDate !== "string") return false;
  const age = ageOn(birthDate, nowMs);
  return age !== null && age >= ADULT_AGE;
}

/** Throw unless the caller has attested to being 18 or older. */
export async function requireAdult(ctx: AnyCtx, clerkId: string): Promise<void> {
  const profile = await profileByClerkId(ctx, clerkId);
  if (!isAdultProfile(profile, Date.now())) throw new Error(ADULTS_ONLY);
}

/**
 * Adulthood of the OTHER side of an interaction. Kept boolean rather than
 * throwing so each call site can refuse in its own already-vague wording —
 * a stranger's date of birth is not ours to disclose, even by implication.
 */
export async function isAdultClerkId(ctx: AnyCtx, clerkId: string): Promise<boolean> {
  return isAdultProfile(await profileByClerkId(ctx, clerkId), Date.now());
}

/**
 * Record a self-attested date of birth. The only writer of `birthDate` /
 * `ageAttestedAt` anywhere in the backend.
 *
 * An under-18 date is refused outright and nothing is written, so there is no
 * such thing as a stored minor attestation to mistakenly trust later. That
 * costs us the ability to hold a minor to their first honest answer — they can
 * come back and type a different date — but self-attestation was never proof,
 * and storing a date we have just called disqualifying is the worse trade.
 */
export const attestAge = mutation({
  args: { birthDate: v.string() },
  handler: async (ctx, { birthDate }) => {
    const clerkId = await requireIdentity(ctx);
    const iso = birthDate.trim();
    const now = Date.now();

    const age = ageOn(iso, now);
    if (age === null) throw new Error("Enter your date of birth as YYYY-MM-DD");
    if (age < ADULT_AGE) {
      throw new Error(
        `You must be ${ADULT_AGE} or older to use community features. Everything else in Nurilang stays open to you.`
      );
    }

    const profile = await profileByClerkId(ctx, clerkId);
    if (!profile) throw new Error("Finish setting up your profile first");
    await ctx.db.patch(profile._id, { birthDate: iso, ageAttestedAt: now });

    return { attested: true, adult: true };
  },
});

/**
 * My gate status, for deciding what to render. `attested` and `adult` are
 * separate because they mean different things to the UI: nothing given yet
 * (ask), versus given and under age (explain, and don't ask again).
 */
export const myAgeStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { attested: false, adult: false };
    const profile = await profileByClerkId(ctx, identity.subject);
    return {
      attested: typeof profile?.birthDate === "string" && profile.birthDate.length > 0,
      adult: isAdultProfile(profile, Date.now()),
    };
  },
});
