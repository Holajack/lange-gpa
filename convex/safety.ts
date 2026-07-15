import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { displayName, requireIdentity, resolveTarget } from "./util";

const reportCategory = v.union(
  v.literal("harassment"),
  v.literal("hate"),
  v.literal("sexual_content"),
  v.literal("spam"),
  v.literal("impersonation"),
  v.literal("dangerous_behavior"),
  v.literal("privacy"),
  v.literal("underage_safety"),
  v.literal("other")
);

const reportStatus = v.union(v.literal("open"), v.literal("reviewing"), v.literal("closed"));

const OWNER_EMAILS = (process.env.NURILANG_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type SafetyCtx = QueryCtx | MutationCtx;

/** All accounts hidden from `clerkId`, regardless of who created the block. */
export async function blockedClerkIdsFor(ctx: SafetyCtx, clerkId: string): Promise<Set<string>> {
  const [outgoing, incoming] = await Promise.all([
    ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerClerkId", clerkId))
      .collect(),
    ctx.db
      .query("blocks")
      .withIndex("by_blocked", (q) => q.eq("blockedClerkId", clerkId))
      .collect(),
  ]);
  return new Set([
    ...outgoing.map((row) => row.blockedClerkId),
    ...incoming.map((row) => row.blockerClerkId),
  ]);
}

/** Reusable server-side guard for future requests, messages, and calls. */
export async function isBlockedEitherWay(ctx: SafetyCtx, first: string, second: string) {
  const hidden = await blockedClerkIdsFor(ctx, first);
  return hidden.has(second);
}

async function requireModerator(ctx: Parameters<typeof requireIdentity>[0]) {
  await requireIdentity(ctx);
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email ? String(identity.email).toLowerCase() : undefined;
  if (!email || !OWNER_EMAILS.includes(email)) throw new Error("Not authorized");
}

/**
 * Block a person addressed by an opaque profile id. The relationship is
 * private, idempotent, and never returns either party's Clerk id.
 */
export const blockPerson = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const me = await requireIdentity(ctx);
    const target = await resolveTarget(ctx, profileId, me, "block");
    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_pair", (q) =>
        q.eq("blockerClerkId", me).eq("blockedClerkId", target.clerkId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("blocks", {
        blockerClerkId: me,
        blockedClerkId: target.clerkId,
        createdAt: Date.now(),
      });
    }

    // Close active contact surfaces immediately. Historical messages/reports
    // remain for audit purposes but are suppressed by their read queries.
    const [sentRequests, receivedRequests, placedCalls, receivedCalls] = await Promise.all([
      ctx.db
        .query("requests")
        .withIndex("by_pair", (q) =>
          q.eq("fromClerkId", me).eq("toClerkId", target.clerkId)
        )
        .collect(),
      ctx.db
        .query("requests")
        .withIndex("by_pair", (q) =>
          q.eq("fromClerkId", target.clerkId).eq("toClerkId", me)
        )
        .collect(),
      ctx.db
        .query("calls")
        .withIndex("by_caller", (q) => q.eq("callerClerkId", me))
        .collect(),
      ctx.db
        .query("calls")
        .withIndex("by_callee", (q) => q.eq("calleeClerkId", me))
        .collect(),
    ]);
    for (const request of [...sentRequests, ...receivedRequests]) {
      if (request.status === "pending") await ctx.db.patch(request._id, { status: "declined" });
    }
    for (const call of [...placedCalls, ...receivedCalls]) {
      const isPair =
        (call.callerClerkId === me && call.calleeClerkId === target.clerkId) ||
        (call.callerClerkId === target.clerkId && call.calleeClerkId === me);
      if (isPair && (call.status === "ringing" || call.status === "active")) {
        await ctx.db.patch(call._id, { status: "ended" });
      }
    }
    return { blocked: true };
  },
});

/** Unblock a person without disclosing server-side account identifiers. */
export const unblockPerson = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const me = await requireIdentity(ctx);
    const target = await resolveTarget(ctx, profileId, me, "unblock");
    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_pair", (q) =>
        q.eq("blockerClerkId", me).eq("blockedClerkId", target.clerkId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    return { blocked: false };
  },
});

/** The signed-in person's block list, using opaque profile ids only. */
export const myBlockedPeople = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireIdentity(ctx);
    const rows = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerClerkId", me))
      .collect();
    const people = await Promise.all(
      rows.map(async (row) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", row.blockedClerkId))
          .unique();
        return profile ? { id: profile._id, name: profile.name, blockedAt: row.createdAt } : null;
      })
    );
    return people.filter((person) => person !== null);
  },
});

/**
 * Submit a private report. Repeated open reports for the same person/category
 * are idempotent, and a small daily cap limits report-spam during closed beta.
 */
export const reportPerson = mutation({
  args: {
    profileId: v.id("profiles"),
    category: reportCategory,
    details: v.optional(v.string()),
  },
  handler: async (ctx, { profileId, category, details: rawDetails }) => {
    const me = await requireIdentity(ctx);
    const target = await resolveTarget(ctx, profileId, me, "report");
    const details = rawDetails?.trim();
    if (details && details.length > 500) throw new Error("Report details must be 500 characters or fewer");
    if (category === "other" && !details) throw new Error("Please describe what happened");

    const now = Date.now();
    const pairReports = await ctx.db
      .query("safetyReports")
      .withIndex("by_pair", (q) =>
        q.eq("reporterClerkId", me).eq("reportedClerkId", target.clerkId)
      )
      .collect();
    const duplicate = pairReports.find(
      (report) => report.category === category && report.status !== "closed"
    );
    if (duplicate) return { accepted: true, duplicate: true };

    const myReports = await ctx.db
      .query("safetyReports")
      .withIndex("by_reporter", (q) => q.eq("reporterClerkId", me))
      .collect();
    const reportsToday = myReports.filter((report) => report.createdAt >= now - 86_400_000);
    if (reportsToday.length >= 10) throw new Error("Daily report limit reached");

    await ctx.db.insert("safetyReports", {
      reporterClerkId: me,
      reportedClerkId: target.clerkId,
      category,
      details: details || undefined,
      surface: "world",
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
    return { accepted: true, duplicate: false };
  },
});

/** Fail-closed moderator inbox. No Clerk ids are included in the response. */
export const listReportsForReview = query({
  args: { status: v.optional(reportStatus) },
  handler: async (ctx, { status }) => {
    await requireModerator(ctx);
    const rows = status
      ? await ctx.db.query("safetyReports").withIndex("by_status", (q) => q.eq("status", status)).collect()
      : await ctx.db.query("safetyReports").collect();
    return await Promise.all(
      rows.map(async (report) => ({
        id: report._id,
        reporterName: await displayName(ctx, report.reporterClerkId),
        reportedName: await displayName(ctx, report.reportedClerkId),
        category: report.category,
        details: report.details,
        surface: report.surface,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      }))
    );
  },
});

/** Mark a report as being reviewed or closed; owner allowlist only. */
export const updateReportStatus = mutation({
  args: { reportId: v.id("safetyReports"), status: reportStatus },
  handler: async (ctx, { reportId, status }) => {
    await requireModerator(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Report not found");
    await ctx.db.patch(reportId, { status, updatedAt: Date.now() });
    return { updated: true };
  },
});
