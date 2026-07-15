"use client";

/**
 * /practice — the GPA activity hub.
 * Four digitized "growing games": picture vocabulary, TPR listening,
 * power phrases, and re-living (home review of recorded words).
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Mascot } from "@/components/Mascot";

interface Launcher {
  href: string;
  emoji: string;
  nameKey: string; // t() key for the GPA game name (headline)
  labelKey: string; // t() key for the small chrome label
  blurbKey: string; // t() key for the instruction line
  accent: string; // css color
  glow: string;
  dark: boolean; // pill text dark on bright accents
  minHours?: number;
}

const GAMES: Launcher[] = [
  {
    href: "/practice/vocabulary",
    emoji: "🃏",
    nameKey: "prcVocabName",
    labelKey: "vocabulary",
    blurbKey: "prcVocabBlurb",
    accent: "var(--color-lime)",
    glow: "rgba(184,240,60,0.45)",
    dark: true,
  },
  {
    href: "/practice/listening",
    emoji: "👂",
    nameKey: "prcListenName",
    labelKey: "listening",
    blurbKey: "prcListenBlurb",
    accent: "var(--color-lemon)",
    glow: "rgba(255,210,52,0.4)",
    dark: true,
  },
  {
    href: "/practice/speaking",
    emoji: "🗣️",
    nameKey: "prcSpeakName",
    labelKey: "speaking",
    blurbKey: "prcSpeakBlurb",
    accent: "var(--color-orange)",
    glow: "rgba(255,138,30,0.45)",
    dark: true,
    minHours: 40,
  },
  {
    href: "/practice/repeat",
    emoji: "🔁",
    nameKey: "prcRepeatName",
    labelKey: "fastRepeat",
    blurbKey: "prcRepeatBlurb",
    accent: "var(--color-violet)",
    glow: "rgba(124,92,255,0.5)",
    dark: false,
    minHours: 40,
  },
];

export default function PracticeHubPage() {
  const { profile, t } = useApp();

  return (
    <div className="relative">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-6"
      >
        <div className="max-w-xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-soft">
            GPA · {t("minPractice")}
          </p>
          <h1 className="headline text-4xl lg:text-5xl">{t("trainings")}</h1>
          <p className="mt-3 text-sm text-muted lg:text-base">{t("trainingsSub")}</p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.2, 0.9, 0.3, 1.4] }}
          className="hidden sm:block"
        >
          <Mascot size={120} mood="wave" />
        </motion.div>
      </motion.div>

      {/* launcher cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {GAMES.map((g, i) => {
          const locked = Boolean(
            g.minHours &&
            (profile?.hoursLogged ?? 0) < g.minHours &&
            (profile?.phase ?? 1) === 1
          );
          const card = (
            <div className={`card relative overflow-hidden p-7 lg:p-8 ${locked ? "opacity-65" : "card-hover"}`}>
              <div
                className="orb right-[-70px] top-[-70px] h-[200px] w-[200px] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: g.glow }}
              />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="floaty flex h-20 w-20 items-center justify-center rounded-[24px] text-5xl"
                    style={{
                      background: `color-mix(in srgb, ${g.accent} 16%, var(--color-raised-2))`,
                      animationDelay: `${i * 0.45}s`,
                    }}
                  >
                    {g.emoji}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      color: g.accent,
                      background: `color-mix(in srgb, ${g.accent} 14%, transparent)`,
                    }}
                  >
                    {locked ? `🔒 ${g.minHours}h` : t(g.labelKey)}
                  </span>
                </div>

                <div>
                  <h2 className="headline text-2xl lg:text-[28px]">{t(g.nameKey)}</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                    {locked ? t("ph_1_part_1a_focus") : t(g.blurbKey)}
                  </p>
                </div>

                <div className="mt-1">
                  <span
                    className={`pill px-6 py-2.5 text-sm font-bold ${g.dark ? "text-canvas" : "text-white"}`}
                    style={{ background: locked ? "var(--color-raised-2)" : g.accent }}
                  >
                    {locked ? t("ph_1_part_1b_title") : `${t("start")} →`}
                  </span>
                </div>
              </div>
            </div>
          );
          return (
            <motion.div
              key={g.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.09, duration: 0.5, ease: [0.2, 0.9, 0.3, 1.2] }}
            >
              {locked ? (
                <div aria-disabled="true" className="group block">{card}</div>
              ) : (
                <Link href={g.href} className="group block">{card}</Link>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* GPA footnote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-8 text-center text-xs text-muted"
      >
        🌱 {t("prcFootnote")}
      </motion.p>
    </div>
  );
}
