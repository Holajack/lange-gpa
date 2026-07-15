"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";

import { useApp } from "@/lib/store";
import { PHASES, TOTAL_HOURS, phaseProgress } from "@/lib/phases";
import { localizedPhase } from "@/lib/phaseI18n";
import type { Phase } from "@/lib/types";
import { Mascot } from "@/components/Mascot";
import { ProgressBar, Tag } from "@/components/ui";

/* ---------------------------------------------------------------- *
 *  Constants & helpers
 * ---------------------------------------------------------------- */

/** Hour markers under the journey bar — the phase boundaries of the 1,500h road. */
const HOUR_MARKS = [0, 100, 250, 500, 1000, 1500];

/** Readable text color on top of a phase accent. */
function textOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "text-canvas" : "text-white";
}

/* ---------------------------------------------------------------- *
 *  Motion choreography
 * ---------------------------------------------------------------- */

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 0.68, 0.32, 1] },
  },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 48, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 0.68, 0.32, 1] },
  },
};

/* ---------------------------------------------------------------- *
 *  Journey card
 * ---------------------------------------------------------------- */

function JourneyCard({
  phase,
  hours,
  currentPhaseId,
  phaseWord,
  currentLabel,
  openLabel,
  previewLabel,
}: {
  phase: Phase;
  hours: number;
  currentPhaseId: number;
  phaseWord: string;
  currentLabel: string;
  openLabel: string;
  previewLabel: string;
}) {
  const betaPreview = phase.id > 1;
  const completed = !betaPreview && !phase.ongoing && hours >= phase.startHour + phase.hours;
  const current = !betaPreview && currentPhaseId === phase.id;
  const future = betaPreview || (!current && phase.id > currentPhaseId);
  const progress = betaPreview ? 0 : phaseProgress(phase, hours);

  return (
    <Link href={`/courses/${phase.slug}`} className="group block">
      <div
        className={`card card-hover relative p-6 lg:p-7 ${future ? "opacity-70" : ""}`}
        style={
          current
            ? { boxShadow: `0 0 0 2px ${phase.color}88, 0 0 70px -12px ${phase.color}` }
            : undefined
        }
      >
        {/* Nuri peeks over the corner of the current phase */}
        {current && (
          <div className="pointer-events-none absolute -top-[56px] right-7 z-10 rotate-6">
            <Mascot size={70} mood="cheer" float={false} />
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* emoji squircle */}
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] text-3xl"
            style={{ background: phase.color + "22" }}
            aria-hidden
          >
            {phase.emoji}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                {phaseWord} {phase.id}
              </span>
              {current && (
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${textOn(phase.color)}`}
                  style={{ background: phase.color }}
                >
                  ★ {currentLabel}
                </span>
              )}
              {completed && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-canvas"
                  aria-label="✓"
                >
                  <Check size={13} strokeWidth={3.5} />
                </span>
              )}
              {betaPreview && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                  <LockKeyhole size={11} strokeWidth={2.5} aria-hidden />
                  {previewLabel}
                </span>
              )}
            </div>

            <h3 className="headline mt-2 text-2xl leading-tight lg:text-[27px]">{phase.name}</h3>
            <p className="mt-1 text-sm font-semibold" style={{ color: phase.color }}>
              {phase.tagline}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Tag>⏱ {phase.ongoing ? "∞" : `${phase.hours}h`}</Tag>
          <Tag>💬 {phase.vocabTarget}</Tag>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{phase.description}</p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
            <span className="text-muted">{phase.ongoing ? "∞" : `${Math.round(progress)}%`}</span>
            <span
              className="inline-flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ color: phase.color }}
            >
              {betaPreview ? previewLabel : openLabel} <ArrowRight size={13} strokeWidth={2.5} />
            </span>
          </div>
          {!phase.ongoing && <ProgressBar value={progress} color={phase.color} />}
        </div>
      </div>
    </Link>
  );
}

/* ---------------------------------------------------------------- *
 *  Page
 * ---------------------------------------------------------------- */

export default function CoursesPage() {
  const { profile, t } = useApp();
  if (!profile) return null;

  const hours = profile.hoursLogged;
  const journeyPct = Math.min(100, Math.max(0, (hours / TOTAL_HOURS) * 100));
  /* Phases 1–5 fill the 1,500h bar; Phase 6 lives beyond it, ever-growing. */
  const barPhases = PHASES.filter((p) => p.startHour < TOTAL_HOURS);

  return (
    <div className="space-y-10 pb-12">
      {/* ============ Hero + journey bar ============ */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.header variants={fadeUp} className="pt-2">
          <h1 className="headline text-4xl lg:text-5xl">{t("coursesTitle")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted lg:text-base">{t("coursesSub")}</p>
        </motion.header>

        <motion.section variants={fadeUp}>
          <div className="card relative overflow-hidden p-6">
            <div className="orb -right-20 -top-20 h-52 w-52 bg-violet/20" />

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-muted">⏱ {t("hoursLogged")}</p>
              <p className="font-display text-sm font-bold">
                <span className="text-lemon">{hours}h</span>{" "}
                <span className="font-normal text-muted">/ {TOTAL_HOURS}h</span>
              </p>
            </div>

            {/* segmented journey bar */}
            <div className="relative mt-5">
              <div className="flex h-5 w-full gap-1">
                {barPhases.map((phase) => {
                  const p = localizedPhase(phase, t);
                  return (
                    <div
                      key={p.id}
                      className="relative h-full overflow-hidden rounded-full"
                      style={{
                        width: `${(p.hours / TOTAL_HOURS) * 100}%`,
                        background: p.color + "22",
                      }}
                      title={`${p.name} · ${p.hours}h`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                        style={{ width: `${phaseProgress(p, hours)}%`, background: p.color }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* you-are-here tick */}
              {hours > 0 && hours < TOTAL_HOURS && (
                <span
                  className="absolute -top-1.5 h-8 w-[3px] -translate-x-1/2 rounded-full bg-white/85"
                  style={{ left: `${journeyPct}%`, boxShadow: "0 0 14px rgba(255,255,255,0.55)" }}
                  aria-hidden
                />
              )}
            </div>

            {/* hour markers */}
            <div className="relative mt-2.5 h-4 text-[10px] font-semibold text-muted">
              {HOUR_MARKS.map((m) => (
                <span
                  key={m}
                  className={`absolute top-0${
                    m === 100 || m === 250 || m === 1000 ? " hidden sm:inline" : ""
                  }`}
                  style={{
                    left: `${(m / TOTAL_HOURS) * 100}%`,
                    transform:
                      m === 0 ? "none" : m === TOTAL_HOURS ? "translateX(-100%)" : "translateX(-50%)",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* ============ Vertical journey ============ */}
      <section className="relative">
        {/* dotted spine down the middle (desktop) */}
        <div
          className="absolute inset-y-6 left-1/2 hidden w-0 -translate-x-1/2 border-l-2 border-dotted border-white/15 lg:block"
          aria-hidden
        />

        <div className="space-y-12 lg:space-y-16">
          {PHASES.map((phase, i) => {
            const left = i % 2 === 0;
            const lp = localizedPhase(phase, t);
            return (
              <motion.div
                key={phase.id}
                variants={cardReveal}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="relative lg:grid lg:grid-cols-2 lg:gap-20"
              >
                {/* node on the spine */}
                <span
                  className="absolute left-1/2 top-1/2 z-10 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-canvas lg:block"
                  style={{ background: phase.color, boxShadow: `0 0 18px ${phase.color}99` }}
                  aria-hidden
                />

                <div className={left ? "lg:col-start-1" : "lg:col-start-2"}>
                  <JourneyCard
                    phase={lp}
                    hours={hours}
                    currentPhaseId={profile.phase}
                    phaseWord={t("phaseWord")}
                    currentLabel={t("currentPhase")}
                    openLabel={t("openPhase")}
                    previewLabel={t("crsMethodPreview")}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
