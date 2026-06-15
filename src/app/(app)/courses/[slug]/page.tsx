"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Ear,
  Globe2,
  HeartHandshake,
  Images,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import { useApp } from "@/lib/store";
import { PHASES, phaseBySlug, phaseProgress } from "@/lib/phases";
import { localizedPhase } from "@/lib/phaseI18n";
import type { PhaseActivity } from "@/lib/types";
import { Mascot } from "@/components/Mascot";
import { ProgressBar, SectionTitle, Tag } from "@/components/ui";

/* ---------------------------------------------------------------- *
 *  Constants & helpers
 * ---------------------------------------------------------------- */

const KIND_ICON: Record<PhaseActivity["kind"], LucideIcon> = {
  vocabulary: Images,
  listening: Ear,
  speaking: MessageCircle,
  literacy: BookOpen,
  culture: Globe2,
  conversation: HeartHandshake,
};

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
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 0.68, 0.32, 1] },
  },
};

/* ---------------------------------------------------------------- *
 *  Page
 * ---------------------------------------------------------------- */

export default function PhasePage() {
  const { slug } = useParams<{ slug: string }>();
  const { profile, t } = useApp();
  const phase = phaseBySlug(slug ?? "");

  if (!profile) return null;

  /* ----- Unknown slug → friendly not-found ----- */
  if (!phase) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
          className="card flex max-w-md flex-col items-center gap-5 p-10 text-center"
        >
          <Mascot size={130} mood="think" />
          <h1 className="headline text-3xl">{t("crsNoPhaseTitle")}</h1>
          <p className="text-sm leading-relaxed text-muted">{t("crsNoPhaseBody")}</p>
          <Link
            href="/courses"
            className="pill bg-violet px-6 py-3 text-sm font-bold text-white"
            style={{ boxShadow: "var(--shadow-glow-violet)" }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} /> {t("back")}
          </Link>
        </motion.div>
      </div>
    );
  }

  /* Localized view of the phase — same shape, translated display strings. */
  const lp = localizedPhase(phase, t);

  const progress = phaseProgress(phase, profile.hoursLogged);
  const current = profile.phase === phase.id;
  const phasePassed = phase.id < profile.phase;
  const prevPhase = PHASES.find((p) => p.id === phase.id - 1);
  const nextPhase = PHASES.find((p) => p.id === phase.id + 1);
  const prev = prevPhase ? localizedPhase(prevPhase, t) : undefined;
  const next = nextPhase ? localizedPhase(nextPhase, t) : undefined;
  const onAccent = textOn(phase.color);

  /* ----- The sequence: ordered parts + any activities that run throughout ----- */
  const parts = lp.parts ?? [];
  const activityById = new Map(lp.activities.map((a) => [a.id, a]));
  const referenced = new Set(parts.flatMap((p) => p.activityIds));
  const throughout = lp.activities.filter((a) => !referenced.has(a.id));

  const renderActivity = (a: PhaseActivity) => {
    const Icon = KIND_ICON[a.kind];
    const done = profile.completed.includes(a.id);
    return (
      <div
        key={a.id}
        className={`card card-hover relative flex h-full flex-col gap-3 p-5 ${
          done ? "opacity-75" : ""
        }`}
      >
        {done && (
          <span
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-mint text-canvas"
            aria-label="✓"
          >
            <Check size={14} strokeWidth={3.5} />
          </span>
        )}

        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: phase.color + "22", color: phase.color }}
          aria-hidden
        >
          <Icon size={20} strokeWidth={2.25} />
        </span>

        <div>
          <h3 className="pr-8 font-semibold leading-snug">{a.name}</h3>
          <p className="mt-1.5 text-sm leading-relaxed">{a.description}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{a.how}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Tag>⏱ {a.minutes} {t("minutes")}</Tag>
          {a.practiceHref ? (
            <Link
              href={a.practiceHref}
              className={`pill ml-auto px-4 py-2 text-xs font-bold ${onAccent}`}
              style={{ background: phase.color }}
            >
              {t("start")} →
            </Link>
          ) : (
            <Link href="/schedule" className="ml-auto">
              <Tag className="transition-colors hover:bg-white/10 hover:text-ink">
                🤝 {t("crsWithNurturer")}
              </Tag>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8 pb-12">
      {/* ============ Hero band ============ */}
      <motion.section variants={fadeUp}>
        <div
          className="card relative overflow-hidden p-6 lg:p-10"
          style={{
            background: `linear-gradient(150deg, ${phase.color}33 0%, rgba(26,26,32,0) 60%), var(--color-raised)`,
          }}
        >
          <div className="orb -right-24 -top-24 h-64 w-64" style={{ background: phase.color + "30" }} />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* emoji squircle */}
            <span
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[30px] text-5xl"
              style={{ background: phase.color + "22" }}
              aria-hidden
            >
              {phase.emoji}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/8 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink">
                  {t("phaseWord")} {phase.id}
                </span>
                {current && (
                  <span
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide ${onAccent}`}
                    style={{ background: phase.color }}
                  >
                    ★ {t("currentPhase")}
                  </span>
                )}
                {phasePassed && (
                  <span className="flex items-center gap-1.5 rounded-full bg-mint px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-canvas">
                    <Check size={12} strokeWidth={3.5} /> {t("done")}
                  </span>
                )}
              </div>

              <h1 className="headline mt-3 text-3xl leading-tight sm:text-4xl lg:text-5xl">{lp.name}</h1>
              <p className="mt-2 text-base font-semibold lg:text-lg" style={{ color: phase.color }}>
                {lp.tagline}
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted lg:text-[15px]">
                {lp.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-ink">
                  ⏱ {phase.hours}h
                </span>
                <span className="rounded-full bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-ink">
                  💬 {lp.vocabTarget}
                </span>
              </div>

              <div className="mt-6 max-w-xl">
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span className="text-muted">
                    {profile.hoursLogged}h / {phase.startHour + phase.hours}h
                  </span>
                  <span style={{ color: phase.color }}>{Math.round(progress)}%</span>
                </div>
                <ProgressBar value={progress} color={phase.color} height={10} />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ============ Principles ============ */}
      <motion.section variants={fadeUp} className="space-y-4">
        <SectionTitle sub={`${t("phaseWord")} ${phase.id} · ${lp.name}`}>
          {t("crsHowGrowthWorks")}
        </SectionTitle>
        <div className="card p-6">
          <ul className="space-y-4">
            {lp.principles.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base"
                  style={{ background: phase.color + "22" }}
                  aria-hidden
                >
                  🌱
                </span>
                <span className="pt-1.5 text-sm leading-relaxed text-ink">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* ============ The sequence ============ */}
      <motion.section variants={fadeUp} className="space-y-4">
        <SectionTitle sub={`${lp.activities.length} ${t("activitiesWord")} · ${phase.emoji}`}>
          {t("crsSequence")}
        </SectionTitle>

        {parts.length > 0 ? (
          <div className="relative">
            {/* progression line: the order matters — listening before speaking */}
            <div
              className="absolute bottom-12 left-[21px] top-4 w-[2px] rounded-full"
              style={{
                background: `linear-gradient(to bottom, ${phase.color}99, ${phase.color}14)`,
              }}
              aria-hidden
            />

            <div className="space-y-12">
              {parts.map((part, i) => (
                <section key={part.id} className="relative pl-14 sm:pl-16">
                  {/* stage marker */}
                  <span
                    className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl font-display text-sm font-extrabold tracking-wide"
                    style={{
                      background: `linear-gradient(0deg, ${phase.color}26, ${phase.color}26), var(--color-canvas)`,
                      color: phase.color,
                      border: `1px solid ${phase.color}55`,
                    }}
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3 className="headline text-xl lg:text-2xl">{part.title}</h3>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold"
                      style={{ background: phase.color + "1e", color: phase.color }}
                    >
                      ⏱ {part.hours}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
                    {part.focus}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {part.activityIds
                      .map((id) => activityById.get(id))
                      .filter((a): a is PhaseActivity => Boolean(a))
                      .map(renderActivity)}
                  </div>
                </section>
              ))}

              {/* activities not tied to one stage */}
              {throughout.length > 0 && (
                <section className="relative pl-14 sm:pl-16">
                  <span
                    className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl text-base"
                    style={{
                      background: `linear-gradient(0deg, ${phase.color}26, ${phase.color}26), var(--color-canvas)`,
                      color: phase.color,
                      border: `1px solid ${phase.color}55`,
                    }}
                    aria-hidden
                  >
                    ✦
                  </span>

                  <div className="flex min-h-11 items-center">
                    <h3 className="headline text-xl lg:text-2xl">{t("crsThroughout")}</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {throughout.map(renderActivity)}
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lp.activities.map(renderActivity)}
          </div>
        )}
      </motion.section>

      {/* ============ Milestones ============ */}
      <motion.section variants={fadeUp} className="space-y-4">
        <SectionTitle sub={phase.id < 6 ? t("crsHostExperience") : t("crsCircleCloses")}>
          {t("milestonesWord")}
        </SectionTitle>

        <div className="card relative overflow-hidden p-6">
          <div className="orb -bottom-16 -right-16 h-48 w-48" style={{ background: phase.color + "22" }} />
          <ul className="relative space-y-4">
            {lp.milestones.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    phasePassed
                      ? "border-mint bg-mint text-canvas"
                      : "border-white/15 bg-raised-2 text-transparent"
                  }`}
                  aria-hidden
                >
                  <Check size={13} strokeWidth={3.5} />
                </span>
                <span className={`text-sm leading-relaxed ${phasePassed ? "text-ink" : "text-muted"}`}>
                  {m}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* ============ Footer: prev / back / next ============ */}
      <motion.footer
        variants={fadeUp}
        className="flex flex-col items-stretch gap-3 border-t border-line pt-6 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 justify-start">
          {prev && (
            <Link
              href={`/courses/${prev.slug}`}
              className="pill border border-line bg-raised-2 px-5 py-2.5 text-sm font-semibold text-muted hover:text-ink"
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              <span aria-hidden>{prev.emoji}</span> {prev.name}
            </Link>
          )}
        </div>

        <Link
          href="/courses"
          className="self-center text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          ↩ {t("back")} · {t("coursesTitle")}
        </Link>

        <div className="flex flex-1 justify-end">
          {next && (
            <Link
              href={`/courses/${next.slug}`}
              className={`pill px-5 py-2.5 text-sm font-bold ${textOn(next.color)}`}
              style={{ background: next.color, boxShadow: `0 0 40px -10px ${next.color}` }}
            >
              <span aria-hidden>{next.emoji}</span> {next.name}
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          )}
        </div>
      </motion.footer>
    </motion.div>
  );
}
