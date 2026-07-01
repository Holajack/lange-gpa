"use client";

/**
 * /admin/nurturers — owner-only roster of nurturer training attempts.
 *
 * The training quiz auto-grades and unlocks the Nurturer Studio immediately
 * on a pass (see /nurture/training) — it doesn't block on manual review,
 * that wouldn't scale past a handful of sign-ups. This page is the
 * after-the-fact spot-check: who passed, with what score, what they missed,
 * so the site owner can catch anything the quiz alone wouldn't.
 *
 * Gated client-side by OWNER_EMAILS below AND server-side by the same
 * allowlist in convex/profiles.ts (listNurturerCertifications) — the
 * server check is the one that actually matters, this one just avoids
 * flashing the table before the query 401s.
 */

import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { CONVEX_ON } from "@/lib/convexClient";
import { usePolledQuery } from "@/lib/convexPoll";
import { Card, Pill, Tag } from "@/components/ui";

const OWNER_EMAILS = ["jacken.holland@gmail.com"];

type CertRow = {
  id: string;
  name: string;
  role: string;
  nurtureLangs: string[];
  certStatus: string;
  certScore?: number;
  certAttempts: number;
  certPassedAt?: string;
  certMissed: string[];
};

const EMPTY: CertRow[] = [];

const STATUS_STYLE: Record<string, string> = {
  passed: "bg-mint/15 text-mint",
  failed: "bg-orange/15 text-orange",
  not_started: "bg-white/8 text-muted",
};

function useCertifications(enabled: boolean) {
  const convex = useConvex();
  return usePolledQuery<CertRow[]>(
    async () => {
      if (!enabled) return EMPTY;
      return (await convex.query("profiles:listNurturerCertifications" as never, {} as never)) as CertRow[];
    },
    EMPTY,
    { deps: [enabled] }
  );
}

export default function AdminNurturersPage() {
  const { isLoaded, user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const authorized = Boolean(email && OWNER_EMAILS.includes(email));
  const { data: rows, refresh } = useCertifications(CONVEX_ON && authorized);

  if (!isLoaded) return null;

  if (!authorized) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Card className="p-8">
          <h1 className="headline text-2xl">Not authorized</h1>
          <p className="mt-2 text-sm text-muted">This page is restricted to the site owner.</p>
        </Card>
      </div>
    );
  }

  const passed = rows.filter((r) => r.certStatus === "passed").length;
  const failed = rows.filter((r) => r.certStatus === "failed").length;
  const notStarted = rows.filter((r) => r.certStatus === "not_started").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline text-3xl">Nurturer training review</h1>
          <p className="mt-1 text-sm text-muted">
            {passed} passed · {failed} failed · {notStarted} not started · {rows.length} nurturer accounts total
          </p>
        </div>
        <Pill className="bg-white/8 px-5 py-2.5 font-semibold text-ink" onClick={refresh}>
          Refresh
        </Pill>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Nurture langs</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Attempts</th>
              <th className="px-5 py-3">Passed on</th>
              <th className="px-5 py-3">Missed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 font-semibold text-ink">{r.name || "—"}</td>
                <td className="px-5 py-3 text-muted">{r.role}</td>
                <td className="px-5 py-3 text-muted">{r.nurtureLangs.join(", ") || "—"}</td>
                <td className="px-5 py-3">
                  <Tag className={STATUS_STYLE[r.certStatus] ?? "bg-white/8 text-muted"}>{r.certStatus}</Tag>
                </td>
                <td className="px-5 py-3 text-muted">{r.certScore != null ? `${r.certScore}%` : "—"}</td>
                <td className="px-5 py-3 text-muted">{r.certAttempts}</td>
                <td className="px-5 py-3 text-muted">
                  {r.certPassedAt ? new Date(r.certPassedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3 text-muted">{r.certMissed.length ? r.certMissed.join(", ") : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-muted">
                  No nurturer accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
