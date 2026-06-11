"use client";

/**
 * Shared local helpers for the /practice suite (GPA activity games).
 * Not a route — just utilities + small presentational pieces used by
 * the four practice pages. Never imported outside /practice.
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { FULL_CONTENT_LANGS } from "@/lib/languages";
import { Mascot } from "@/components/Mascot";
import type { LangCode, Profile } from "@/lib/types";

/* ---------------------------------- lang --------------------------------- */

/** The six languages with full picture decks. */
export type ContentLang = "es" | "ru" | "fr" | "de" | "pt" | "it";

/**
 * Resolve the practice-content language once per page.
 * If the grower's target language has no deck yet we fall back to the
 * Spanish demo deck and let the page show a soft banner.
 */
export function useContentLang(): {
  lang: ContentLang;
  fellBack: boolean;
  uiLang: LangCode;
  t: (key: string) => string;
  profile: Profile | null;
} {
  const { profile, uiLang, t } = useApp();
  const target: LangCode = profile?.targetLang ?? "es";
  const supported = FULL_CONTENT_LANGS.includes(target);
  return {
    lang: (supported ? target : "es") as ContentLang,
    fellBack: !supported,
    uiLang,
    t,
    profile,
  };
}

/* --------------------------------- random -------------------------------- */

/** Fisher–Yates, returns a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sample n distinct elements (or as many as exist). */
export function pickN<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

/* -------------------------------- banners -------------------------------- */

/** Soft notice when the target language fell back to the Spanish demo deck. */
export function FallbackBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-5 flex items-center gap-3 rounded-2xl border border-mint/25 bg-mint/10 px-4 py-3 text-sm text-ink"
    >
      <span className="text-xl">🌱</span>
      <span>
        Full picture decks for this language are growing — here&rsquo;s the Spanish demo deck 🌱
      </span>
    </motion.div>
  );
}

/* -------------------------------- header --------------------------------- */

/** Back-to-hub header used at the top of every practice game. */
export function PracticeHeader({
  emoji,
  title,
  kicker,
  accent,
}: {
  emoji: string;
  title: string;
  kicker?: string;
  accent: string; // css color
}) {
  const { t } = useApp();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mb-6 flex flex-wrap items-center gap-4"
    >
      <Link
        href="/practice"
        className="pill bg-white/6 px-4 py-2 text-sm text-muted hover:text-ink"
      >
        ← {t("back")}
      </Link>
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
          style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)` }}
        >
          {emoji}
        </span>
        <div>
          <h1 className="headline text-2xl leading-tight lg:text-3xl">{title}</h1>
          {kicker && <p className="text-xs text-muted">{kicker}</p>}
        </div>
      </div>
    </motion.div>
  );
}

/* ----------------------------- progress dots ------------------------------ */

export type RoundResult = "correct" | "missed";

export function ProgressDots({
  total,
  current,
  results = [],
  accent = "var(--color-violet)",
}: {
  total: number;
  current: number;
  results?: RoundResult[];
  accent?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        const isCurrent = i === current;
        const bg = r === "correct"
          ? "var(--color-lime)"
          : r === "missed"
            ? "var(--color-coral)"
            : isCurrent
              ? accent
              : "rgba(255,255,255,0.14)";
        return (
          <span
            key={i}
            className={`rounded-full transition-all duration-300 ${isCurrent ? "h-2.5 w-6" : "h-2.5 w-2.5"}`}
            style={{ background: bg }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------ replay button ----------------------------- */

/** Big 🔊 button — the grower can always ask to hear it again. */
export function ReplayButton({
  onClick,
  label,
  accent = "var(--color-violet)",
  size = 76,
}: {
  onClick: () => void;
  label?: string;
  accent?: string;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={label ?? "replay"}
        className="pill text-3xl"
        style={{
          width: size,
          height: size,
          background: `color-mix(in srgb, ${accent} 22%, var(--color-raised-2))`,
          boxShadow: `0 0 44px -10px ${accent}`,
        }}
      >
        🔊
      </button>
      {label && <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>}
    </div>
  );
}

/* --------------------------------- toast ---------------------------------- */

/** Muted GPA toast — a wrong answer just sinks into the iceberg for later. */
export function IcebergToast({ show, text = "It's in your iceberg 🧊" }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      <div className="popin rounded-full border border-line bg-raised-2/95 px-5 py-2.5 text-sm font-medium text-muted shadow-[var(--shadow-pop)]">
        {text}
      </div>
    </div>
  );
}

/* ------------------------------ finish screen ----------------------------- */

const CONFETTI = ["🎉", "✨", "🌱", "⭐", "💚", "🎊"];

/** Shared celebration screen for the end of every practice game. */
export function FinishScreen({
  title,
  sub,
  stats,
  actions,
  accent = "var(--color-lime)",
}: {
  title: string;
  sub?: string;
  stats: { value: string; label: string }[];
  actions: { href: string; label: string; primary?: boolean }[];
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.9, 0.3, 1.2] }}
      className="card relative mx-auto mt-4 max-w-xl overflow-hidden px-6 py-12 text-center"
    >
      <div
        className="orb left-1/2 top-[-120px] h-[280px] w-[280px] -translate-x-1/2"
        style={{ background: `color-mix(in srgb, ${accent} 30%, transparent)` }}
      />
      {/* confetti burst */}
      {CONFETTI.map((c, i) => (
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
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="headline text-3xl lg:text-4xl"
        >
          {title}
        </motion.h2>
        {sub && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="max-w-md text-sm text-muted"
          >
            {sub}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-1 flex flex-wrap items-center justify-center gap-3"
        >
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/6 px-5 py-3">
              <div className="font-display text-2xl font-extrabold" style={{ color: accent }}>
                {s.value}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted">{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="mt-2 flex flex-wrap items-center justify-center gap-3"
        >
          {actions.map((a) =>
            a.primary ? (
              <Link
                key={a.href + a.label}
                href={a.href}
                className="pill px-6 py-3 text-sm font-bold text-canvas"
                style={{ background: accent }}
              >
                {a.label}
              </Link>
            ) : (
              <Link key={a.href + a.label} href={a.href} className="pill bg-white/8 px-6 py-3 text-sm text-ink">
                {a.label}
              </Link>
            )
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
