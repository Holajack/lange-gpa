"use client";

/**
 * CheckpointCard — the always-visible "next advancement gate" card
 * (SPEC-advancement-gates §6) plus the full-screen gate ceremony.
 *
 * Always renders only the NEXT gate: Gate 1 (1A → 1B "talking begins") →
 * Gate 2 (1B → Phase 2) → a "Phase 2 is being built — you're ready" state
 * while /courses still locks Phase 2 behind betaPreview. Every number is
 * the real derived target from gates.ts (11/150/30 today — never the
 * guide's aspirational 300/1000), each row deep-links the one behavior
 * that advances that leg, and the single primary CTA targets the WEAKEST
 * leg so the three behaviors stay balanced.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import {
  gate1bPassed,
  gateLegs1b,
  gateLegsPhase2,
  phase1Complete,
} from "@/lib/gates";
import type { GateLeg, GateLegs } from "@/lib/gates";
import { nextMeetingFor } from "@/lib/sessionFlow";
import { ACHIEVEMENT_EVENT } from "@/lib/achievements";
import { Mascot } from "@/components/Mascot";

/* ------------------------------ helpers ------------------------------ */

export type GateLegKey = "meetings" | "words" | "hours";

const legFraction = (leg: GateLeg): number =>
  leg.total <= 0 ? 1 : Math.min(1, leg.done / leg.total);

/** The leg furthest from done — the primary CTA always targets it. */
export function weakestLeg(legs: GateLegs): GateLegKey {
  const order: GateLegKey[] = ["meetings", "words", "hours"];
  return order.reduce(
    (worst, key) => (legFraction(legs[key]) < legFraction(legs[worst]) ? key : worst),
    "meetings" as GateLegKey
  );
}

const LEG_LABEL_KEY: Record<GateLegKey, string> = {
  meetings: "gateMeetingsLabel",
  words: "gateWordsLabel",
  hours: "gateHoursLabel",
};

/** "8/11 Live meetings" — the weakest remaining leg, for lock chips. */
export function weakestLegChip(legs: GateLegs, t: (key: string) => string): string {
  const key = weakestLeg(legs);
  return `${legs[key].done}/${legs[key].total} ${t(LEG_LABEL_KEY[key])}`;
}

/* ------------------------------- card -------------------------------- */

const RING_R = 15.5;
const RING_C = 2 * Math.PI * RING_R;

export function CheckpointCard({ className = "" }: { className?: string }) {
  const { profile, t } = useApp();
  const [contentGrew, setContentGrew] = useState(false);

  const passed1b = profile ? gate1bPassed(profile) : false;
  const allDone = profile ? phase1Complete(profile) : false;
  const gate: "1b" | "phase2" | "ready" = !passed1b ? "1b" : !allDone ? "phase2" : "ready";
  const legs =
    profile && gate !== "ready"
      ? gate === "1b"
        ? gateLegs1b(profile)
        : gateLegsPhase2(profile)
      : null;

  /* derived targets RISE as meetings are authored — remember the last seen
     totals so users mid-leg get the one-line "more game, not moved
     goalposts" note instead of silently growing bars */
  const meetingsTotal = legs?.meetings.total;
  const wordsTotal = legs?.words.total;
  const targetLang = profile?.targetLang;
  useEffect(() => {
    if (!targetLang || meetingsTotal === undefined || wordsTotal === undefined) return;
    try {
      const key = `lange.gateTargets.${targetLang}.${gate}`;
      const seen = JSON.parse(localStorage.getItem(key) ?? "null") as {
        m: number;
        w: number;
      } | null;
      if (seen && (meetingsTotal > seen.m || wordsTotal > seen.w)) setContentGrew(true);
      localStorage.setItem(key, JSON.stringify({ m: meetingsTotal, w: wordsTotal }));
    } catch {}
  }, [targetLang, gate, meetingsTotal, wordsTotal]);

  if (!profile) return null;
  /* The card is the GROWER's next gate: a nurturer-only account isn't
     growing its targetLang, and anyone already past Phase 2 (placement or
     grandfathered) must never see "Next: Phase 2" as their future. */
  if (profile.role === "nurturer" || profile.phase > 2) return null;

  /* Both gates earned but /courses still betaPreview-locks Phase 2 (risk
     R5): honest "you're ready — it opens soon" state instead of a bar. */
  if (!legs) {
    return (
      <div className={`card relative overflow-hidden p-6 ${className}`}>
        <div className="orb -right-16 -top-16 h-44 w-44 bg-lime/20" />
        <div className="relative flex items-center gap-4">
          <Mascot size={72} mood="cheer" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">
              {t("gateNextP2")}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              🌱 {t("gateReadyWaitingP2")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const overall =
    (legFraction(legs.meetings) + legFraction(legs.words) + legFraction(legs.hours)) / 3;
  const nextMeeting = nextMeetingFor(profile.meetingProgress ?? 0);

  const rows: {
    key: GateLegKey;
    emoji: string;
    leg: GateLeg;
    href: string;
    accent: string;
    sub?: string;
  }[] = [
    {
      key: "meetings",
      emoji: "🤝",
      leg: legs.meetings,
      href: "/schedule",
      accent: "var(--color-violet)",
      // spine microcopy: the 40-meeting curriculum stays visible without
      // lying about what's populated ("Meeting 12/40 · 8/11")
      sub: nextMeeting !== null ? `${t("meetingWord")} ${nextMeeting}/40` : undefined,
    },
    {
      key: "words",
      emoji: "🃏",
      leg: legs.words,
      href: "/practice/vocabulary",
      accent: "var(--color-lime)",
    },
    {
      key: "hours",
      emoji: "⏱",
      leg: legs.hours,
      href: "/practice/listening",
      accent: "var(--color-lemon)",
    },
  ];

  const weakest = weakestLeg(legs);
  const cta =
    weakest === "meetings"
      ? {
          href: "/session?nurturer=ai",
          label: `▶ ${t("schStartNow")}${nextMeeting !== null ? ` · ${t("meetingWord")} ${nextMeeting}` : ""}`,
        }
      : weakest === "words"
        ? { href: "/practice/vocabulary", label: `🃏 ${t("vocabulary")}` }
        : { href: "/practice/listening", label: `👂 ${t("listening")}` };

  return (
    <div className={`card relative overflow-hidden p-5 sm:p-6 ${className}`}>
      <div className="orb -right-16 -top-16 h-44 w-44 bg-violet/15" />

      {/* header: next gate + combined progress ring */}
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-soft">
          🌱 {t(gate === "1b" ? "gateNext1b" : "gateNextP2")}
        </p>
        <div className="relative h-10 w-10 shrink-0" aria-hidden>
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r={RING_R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
            <circle
              cx="18"
              cy="18"
              r={RING_R}
              fill="none"
              stroke="var(--color-lime)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - overall)}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[9px] font-extrabold">
            {Math.round(overall * 100)}%
          </span>
        </div>
      </div>

      {/* the three legs — each row deep-links the one action that advances it */}
      <div className="relative mt-4 space-y-2.5">
        {rows.map((row) => (
          <Link
            key={row.key}
            href={row.href}
            className="block rounded-2xl bg-white/4 px-3.5 py-2.5 transition-colors hover:bg-white/8"
          >
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-semibold">
                <span aria-hidden>{row.emoji}</span>
                <span className="truncate">{t(LEG_LABEL_KEY[row.key])}</span>
              </span>
              <span className="shrink-0 font-display text-sm font-extrabold tabular-nums">
                {/* count-up pop when the number moves — words slide into the iceberg */}
                <motion.span
                  key={row.leg.done}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block"
                >
                  {row.leg.done}
                </motion.span>
                <span className="text-muted"> / {row.leg.total}</span>
              </span>
            </div>
            {row.sub && <p className="mt-0.5 pl-6 text-[11px] text-muted">{row.sub}</p>}
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${legFraction(row.leg) * 100}%`, background: row.accent }}
              />
            </div>
          </Link>
        ))}
      </div>

      {contentGrew && (
        <p className="relative mt-3 text-[11px] leading-relaxed text-muted">
          🌿 {t("gateNewContentNote")}
        </p>
      )}

      {/* single thumb-reach primary CTA = the weakest leg */}
      <div className="relative mt-4">
        <Link
          href={cta.href}
          className="pill flex w-full justify-center bg-violet px-6 py-3 text-sm font-bold text-white sm:inline-flex sm:w-auto"
          style={{ boxShadow: "var(--shadow-glow-violet)" }}
        >
          {cta.label}
        </Link>
      </div>
    </div>
  );
}

/* ----------------------------- ceremony ------------------------------ */

/**
 * Full-screen gate ceremony — "a ceremony, not a toast". Listens for the
 * `gate-1b` / `gate-phase2` badges landing on the existing achievement
 * event bridge (the store awards each exactly once, off the persisted
 * gatesPassed stamp), so the ceremony fires once per gate, ever.
 * Mounted app-wide in AppShell.
 */
export function GateCeremony() {
  const { t } = useApp();
  const [gate, setGate] = useState<"1b" | "phase2" | null>(null);

  useEffect(() => {
    const onAchievement = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      // phase2 outranks 1b when both land in the same beat (migration stamps)
      if (id === "gate-phase2") setGate("phase2");
      else if (id === "gate-1b") setGate((g) => (g === "phase2" ? g : "1b"));
    };
    window.addEventListener(ACHIEVEMENT_EVENT, onAchievement);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, onAchievement);
  }, []);

  const confetti = ["🎉", "✨", "🌱", "⭐", "💚", "🎊"];

  return (
    <AnimatePresence>
      {gate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.5, ease: [0.2, 0.9, 0.3, 1.2] }}
            className="card relative w-full max-w-md overflow-hidden px-6 py-12 text-center"
          >
            <div className="orb left-1/2 top-[-120px] h-[280px] w-[280px] -translate-x-1/2 bg-lime/25" />
            {confetti.map((c, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 16, scale: 0.4 }}
                animate={{ opacity: [0, 1, 1, 0.7], y: -10 - (i % 3) * 14, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.09, duration: 0.9 }}
                className="absolute text-2xl"
                style={{ left: `${8 + i * 15}%`, top: `${12 + (i % 2) * 8}%` }}
              >
                {c}
              </motion.span>
            ))}

            <div className="relative flex flex-col items-center gap-4">
              <Mascot size={150} mood="cheer" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime">
                {gate === "1b" ? "1A ✓" : `${t("phaseWord")} 1 ✓`}
              </p>
              <h2 className="headline text-3xl leading-tight">
                {t(gate === "1b" ? "gateCeremony1b" : "gateCeremonyP2")}
              </h2>
              <button
                type="button"
                onClick={() => setGate(null)}
                className="pill mt-2 bg-lime px-8 py-3 text-sm font-bold text-canvas"
              >
                {t("continue")} →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
