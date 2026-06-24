"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Clock, Mic, RefreshCw } from "lucide-react";

import { useApp, getImmersionStage } from "@/lib/store";
import { ACHIEVEMENTS, ACHIEVEMENT_EVENT, achievementById, useAchievements } from "@/lib/achievements";
import { immersionShare } from "@/lib/i18n";
import { langByCode } from "@/lib/languages";
import { phaseById, phaseProgress, TOTAL_HOURS } from "@/lib/phases";
import { NURTURERS, nurturersForLang } from "@/lib/nurturers";
import { mascotForLang } from "@/lib/mascots";
import { VOCAB_DOMAINS } from "@/lib/vocab";
import { speak, stopSpeaking } from "@/lib/tts";
import type { LangCode, Nurturer, PhaseActivity, Profile } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Mascot } from "@/components/Mascot";
import { MascotImage } from "@/components/MascotImage";
import { ProgressBar, SectionTitle } from "@/components/ui";

/* ---------------------------------------------------------------- *
 *  Content maps (GPA practice content — target language ONLY)
 * ---------------------------------------------------------------- */

/** Iconic opening lines of host-language literature — pure listening food. */
const OPENING_LINES: Partial<Record<LangCode, string>> = {
  es: "En un lugar de la Mancha, de cuyo nombre no quiero acordarme…",
  fr: "S'il vous plaît… dessine-moi un mouton.",
  ru: "Все счастливые семьи похожи друг на друга…",
  de: "Jemand musste Josef K. verleumdet haben…",
  pt: "Tudo vale a pena se a alma não é pequena.",
  it: "Nel mezzo del cammin di nostra vita…",
  ja: "吾輩は猫である。名前はまだ無い。",
  zh: "话说天下大势，分久必合，合久必分。",
};

/** Friendly greeting fallback for languages without a curated line. */
const GREETINGS: Partial<Record<LangCode, string>> = {
  en: "Hello, friend! How are you today?",
  ar: "مرحباً يا صديقي! كيف حالك اليوم؟",
  ko: "안녕하세요! 오늘 기분이 어때요?",
  tr: "Merhaba arkadaşım! Bugün nasılsın?",
  uk: "Привіт, друже! Як ти сьогодні?",
  hi: "नमस्ते दोस्त! आज आप कैसे हैं?",
};

const KIND_EMOJI: Record<PhaseActivity["kind"], string> = {
  listening: "👂",
  speaking: "🗣️",
  vocabulary: "🃏",
  literacy: "📖",
  culture: "🎭",
  conversation: "💬",
};

/** Waveform bar heights (px) — varied for an organic feel. */
const WAVE_HEIGHTS = [10, 22, 14, 30, 38, 26, 34, 18, 28, 40, 24, 16, 32, 20, 12];

/* ---------------------------------------------------------------- *
 *  Motion choreography
 * ---------------------------------------------------------------- */

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
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

/* ---------------------------------------------------------------- *
 *  Helpers
 * ---------------------------------------------------------------- */

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Mon..Sun index of today (store convention: week[0] = Monday). */
const todayIndex = () => (new Date().getDay() + 6) % 7;

/* ---------------------------------------------------------------- *
 *  Page
 * ---------------------------------------------------------------- */

export default function DashboardPage() {
  const { profile, uiLang, t } = useApp();
  const [speaking, setSpeaking] = useState(false);
  const { earned, award } = useAchievements();
  const [toastId, setToastId] = useState<string | null>(null);

  /** Localized 2-letter day names Mon→Sun (2024-01-01 was a Monday). */
  const dayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(uiLang, { weekday: "short", timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, i) => {
      const raw = fmt.format(new Date(Date.UTC(2024, 0, 1 + i))).replace(/\./g, "");
      return (raw.charAt(0).toUpperCase() + raw.slice(1)).slice(0, 2);
    });
  }, [uiLang]);

  /** Pressed-flower date pills, e.g. "JUN 12, 2026". */
  const badgeDate = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(uiLang, { month: "short", day: "numeric", year: "numeric" });
    return (iso: string) => fmt.format(new Date(iso)).replace(/\./g, "").toUpperCase();
  }, [uiLang]);

  /* quiet toast for new badges, from anywhere in the app */
  useEffect(() => {
    const onAchievement = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (id) setToastId(id);
    };
    window.addEventListener(ACHIEVEMENT_EVENT, onAchievement);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, onAchievement);
  }, []);

  useEffect(() => {
    if (!toastId) return;
    const timer = setTimeout(() => setToastId(null), 4200);
    return () => clearTimeout(timer);
  }, [toastId]);

  useEffect(() => () => stopSpeaking(), []);

  if (!profile) return null;

  /* A brand-new grower stands at the wall of noise: nothing logged, nothing
     booked, nothing done. Greet them with a welcome garden instead of bleak
     zeros — every other grower keeps the dashboard below, unchanged. */
  const isFresh =
    profile.hoursLogged === 0 &&
    (profile.completed?.length ?? 0) === 0 &&
    (profile.bookings?.length ?? 0) === 0;
  if (isFresh) return <FreshDashboard profile={profile} t={t} />;

  const lang = langByCode(profile.targetLang);
  const phase = phaseById(profile.phase);
  const progress = phaseProgress(phase, profile.hoursLogged);

  /* Top two nurturers for the target language (pad from the full roster). */
  const forLang = nurturersForLang(profile.targetLang);
  const nurturers: Nurturer[] = [
    ...forLang,
    ...NURTURERS.filter((n) => !forLang.includes(n)),
  ].slice(0, 2);
  const mainNurturer = nurturers[0];

  /* Week panel data */
  const today = todayIndex();
  const maxWeek = Math.max(...profile.week, 1);

  /* Practice-speaking line, first words glowing lemon */
  const line =
    OPENING_LINES[profile.targetLang] ?? GREETINGS[profile.targetLang] ?? "Hello, friend!";
  const lineWords = line.split(" ");
  const cut = lineWords.length > 4 ? 3 : 1;
  const lineHead = lineWords.slice(0, cut).join(" ");
  const lineRest = lineWords.slice(cut).join(" ");

  const sayLine = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    void speak(line, profile.targetLang).finally(() => setSpeaking(false));
  };

  /* Bottom row data */
  const iso = todayIso();
  const todaysBookings = profile.bookings
    .filter((b) => b.date === iso && !b.done)
    .sort((a, b) => a.time.localeCompare(b.time));
  const nextActivities = phase.activities
    .filter((a) => !profile.completed.includes(a.id))
    .slice(0, 2);

  /* Growth shelf data */
  const shelf = ACHIEVEMENTS.filter((a) => earned[a.id]).sort((a, b) =>
    (earned[a.id] ?? "").localeCompare(earned[b.id] ?? "")
  );
  const nextBadge = ACHIEVEMENTS.find((a) => a.kind === "hours" && !earned[a.id]);
  const RING_R = 17;
  const RING_C = 2 * Math.PI * RING_R;
  const ringFill = nextBadge?.hours
    ? Math.min(1, Math.max(0, profile.hoursLogged / nextBadge.hours))
    : 0;

  /* Immersion meter: how much of the UI now speaks the target language */
  const stage = profile.immersion && profile.role !== "nurturer" ? 4 : getImmersionStage(profile);
  const immersionPct = Math.round(immersionShare(profile.targetLang, stage) * 100);
  const appSpeaksLine = t("appSpeaks")
    .replace("{pct}", `${immersionPct}%`)
    .replace("{language}", lang.nativeName);

  const toastAch = toastId ? achievementById(toastId) : null;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* ============ Greeting ============ */}
      <motion.header variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3 pt-2">
        <div>
          <h1 className="headline text-2xl sm:text-4xl lg:text-5xl">
            {t("hello")}, {profile.name}! <span className="wavehand inline-block">👋</span>
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span className="text-lg leading-none">{lang.flag}</span>
            <span>
              {lang.nativeName} · {phase.name} — {t("phaseWord")} {profile.phase}
            </span>
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-raised-2 px-4 py-2 text-sm font-semibold sm:flex">
          🔥 {profile.streak} <span className="font-normal text-muted">{t("dayStreak")}</span>
        </div>
      </motion.header>

      {/* ============ ROW 1 ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* ---- Nurturer video card ---- */}
        <motion.div variants={fadeUp} className="lg:col-span-6">
          <div className="card card-hover h-full p-4">
            <div
              className="relative aspect-[16/10] overflow-hidden rounded-[20px]"
              style={{
                background:
                  "radial-gradient(120% 90% at 15% 10%, rgba(124,92,255,0.55), transparent 55%), radial-gradient(110% 90% at 90% 90%, rgba(255,138,30,0.45), transparent 55%), linear-gradient(150deg, #221c3a 0%, #17131f 55%, #2a1a14 100%)",
              }}
            >
              {/* subtle dot pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.13]"
                style={{
                  backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />

              {/* participant tiles */}
              <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3 pb-14 sm:gap-4 sm:p-4 sm:pb-16">
                {nurturers.map((n, i) => (
                  <div
                    key={n.id}
                    className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10"
                    style={{
                      background:
                        i === 0
                          ? "linear-gradient(160deg, rgba(124,92,255,0.28), rgba(14,14,18,0.55))"
                          : "linear-gradient(160deg, rgba(255,138,30,0.24), rgba(14,14,18,0.55))",
                    }}
                  >
                    <Avatar name={n.name} color={n.color} size={64} ring />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-canvas/75 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                      {n.name.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>

              {/* online badge */}
              <span className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-canvas/75 px-3 py-1.5 text-xs font-semibold text-mint backdrop-blur-sm sm:right-4 sm:top-4">
                <span className="pulsedot h-2 w-2 rounded-full bg-mint" />
                {t("online")}
              </span>

              {/* join pill */}
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-4">
                <Link
                  href={`/session?nurturer=${mainNurturer.id}`}
                  className="pill bg-violet px-6 py-3 text-sm text-white sm:text-base"
                  style={{ boxShadow: "var(--shadow-glow-violet)" }}
                >
                  📹 {t("joinSpeakingClub")}
                </Link>
              </div>
            </div>

            {/* caption */}
            <div className="mt-3 flex items-center gap-2 px-1 text-xs text-muted">
              <Avatar name={mainNurturer.name} color={mainNurturer.color} size={20} />
              <span>
                {t("yourNurturer")} · <span className="font-semibold text-ink">{mainNurturer.name}</span>{" "}
                — {mainNurturer.city}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ---- Phase card ---- */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Link href={`/courses/${phase.slug}`} className="block h-full">
            <div
              className="card-hover relative flex h-full flex-col gap-4 overflow-hidden rounded-[28px] p-5 text-canvas"
              style={{
                background: "linear-gradient(140deg, var(--color-orange) 0%, var(--color-amber) 100%)",
                boxShadow: "var(--shadow-glow-orange)",
              }}
            >
              <div className="orb -right-10 -top-12 h-40 w-40 bg-white/30" />

              <div className="flex items-start justify-between">
                {/* sunburst emoji */}
                <div className="relative h-20 w-20">
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 h-full w-full animate-spin"
                    style={{ animationDuration: "26s" }}
                    aria-hidden
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <line
                        key={i}
                        x1="50"
                        y1="4"
                        x2="50"
                        y2="13"
                        stroke="rgba(14,14,18,0.35)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        transform={`rotate(${i * 30} 50 50)`}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-[13px] flex items-center justify-center rounded-full bg-white/40 text-3xl">
                    {phase.emoji}
                  </div>
                </div>
                <span className="rounded-full bg-canvas/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                  {t("phaseWord")} {profile.phase}
                </span>
              </div>

              <h3 className="headline text-2xl leading-tight">{phase.name}</h3>

              <ul className="space-y-1.5 text-sm font-semibold">
                <li className="flex items-center gap-2">
                  <Clock size={15} strokeWidth={2.5} />
                  {profile.hoursLogged} {t("hoursLogged")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[15px] leading-none">💬</span>
                  {profile.wordsMet} {t("wordsMet")}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} strokeWidth={3} />
                  {profile.completed.length} {t("activitiesDone")}
                </li>
              </ul>

              <div className="mt-auto">
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span>{Math.round(progress)}%</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </div>
                <ProgressBar value={progress} color="#ffffff" height={10} />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ---- Week panel ---- */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="card card-hover flex h-full flex-col gap-4 p-5">
            <p className="text-sm font-semibold text-muted">{t("weeklyActivity")}</p>

            {/* day circles Mon..Sun */}
            <div className="flex justify-between gap-1">
              {dayNames.map((d, i) => {
                const done = (profile.week[i] ?? 0) > 0;
                const isToday = i === today;
                return (
                  <div
                    key={i}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                      done ? "bg-mint text-canvas" : "bg-raised-2 text-muted"
                    } ${isToday ? "ring-2 ring-violet ring-offset-2 ring-offset-raised" : ""}`}
                    title={d}
                  >
                    {done ? <Check size={14} strokeWidth={3.5} /> : d}
                  </div>
                );
              })}
            </div>

            {/* mini bar chart */}
            <div className="flex h-20 items-end justify-between gap-1.5 px-0.5">
              {profile.week.map((m, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full max-w-7 rounded-full ${
                      i === today ? "bg-lemon" : "bg-gradient-to-t from-violet-deep to-violet-soft"
                    }`}
                    style={{ height: `${8 + (m / maxWeek) * 56}px`, opacity: m > 0 || i === today ? 1 : 0.25 }}
                  />
                  <span className={`text-[9px] ${i === today ? "font-bold text-lemon" : "text-muted"}`}>
                    {dayNames[i]}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto self-start rounded-full bg-orange/15 px-4 py-1.5 text-sm font-bold text-orange">
              🔥 {profile.streak} {t("dayStreak")}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============ ROW 2 ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* ---- Trainings + categories ---- */}
        <motion.div variants={fadeUp} className="space-y-4 lg:col-span-7">
          <SectionTitle sub={t("trainingsSub")}>{t("trainings")}</SectionTitle>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Word world */}
            <Link href="/practice/vocabulary" className="block">
              <div className="card-hover flex h-full flex-col gap-2 rounded-[24px] bg-lime p-5 text-canvas">
                <span className="text-3xl">🃏</span>
                <h3 className="headline text-lg leading-tight">{t("vocabulary")}</h3>
                <p className="text-xs font-semibold opacity-75">
                  {profile.wordsMet} {t("words")}
                </p>
                <div className="mt-auto pt-1">
                  <ProgressBar
                    value={Math.min(100, (profile.wordsMet / 1000) * 100)}
                    color="rgba(14,14,18,0.8)"
                    height={6}
                  />
                </div>
              </div>
            </Link>

            {/* Listening */}
            <Link href="/practice/listening" className="block">
              <div className="card-hover flex h-full flex-col gap-2 rounded-[24px] bg-lemon p-5 text-canvas">
                <span className="text-3xl">👂</span>
                <h3 className="headline text-lg leading-tight">{t("listening")}</h3>
                <p className="text-xs font-semibold opacity-75">{t("dshListenSub")}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-bold">
                  {t("play")} <ArrowRight size={13} strokeWidth={3} />
                </span>
              </div>
            </Link>

            {/* Speaking */}
            <Link href="/practice/speaking" className="block">
              <div className="card-hover flex h-full flex-col gap-2 rounded-[24px] bg-orange p-5 text-canvas">
                <span className="text-3xl">🗣️</span>
                <h3 className="headline text-lg leading-tight">{t("speaking")}</h3>
                <p className="text-xs font-semibold opacity-75">{t("prcSpeakName")}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-bold">
                  {t("play")} <ArrowRight size={13} strokeWidth={3} />
                </span>
              </div>
            </Link>
          </div>

          {/* category chips */}
          <div>
            <p className="mb-3 mt-5 text-sm font-semibold text-muted">{t("chooseCategory")}</p>
            <div className="flex flex-wrap gap-2.5">
              {VOCAB_DOMAINS.map((d, i) => (
                <Link
                  key={d.id}
                  href={`/practice/vocabulary?domain=${d.id}`}
                  className={`pill px-4 py-2 text-sm font-semibold ${
                    i % 2 === 0 ? "bg-violet text-white" : "bg-orange text-canvas"
                  }`}
                >
                  <span aria-hidden>{d.emoji}</span> {d.names[uiLang] ?? d.names.en}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ---- Practice speaking + Fast repeat ---- */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 lg:col-span-5">
          {/* Practice speaking */}
          <div className="card card-hover relative overflow-hidden p-6">
            <div className="orb -right-16 -top-16 h-44 w-44 bg-violet/25" />

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted">{t("practiceSpeaking")}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-xs font-extrabold text-canvas">
                AI
              </span>
            </div>

            {/* GPA content: target language only — meaning via audio */}
            <p className="headline mt-4 text-2xl leading-snug lg:text-[27px]" lang={profile.targetLang}>
              <span className="text-lemon">{lineHead}</span>
              {lineRest ? <span> {lineRest}</span> : null}
            </p>

            <div className="mt-5 flex items-center gap-4">
              <button
                type="button"
                onClick={sayLine}
                aria-label={t("listen")}
                className={`pill flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white ${
                  speaking ? "bg-violet-deep" : "bg-violet"
                }`}
                style={{ boxShadow: speaking ? "var(--shadow-glow-violet)" : undefined }}
              >
                <Mic size={22} strokeWidth={2.25} />
              </button>

              {/* waveform */}
              <div className="flex h-12 flex-1 items-center gap-1 overflow-hidden">
                {WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full ${
                      speaking ? "wavebar bg-violet-soft" : "bg-white/12"
                    }`}
                    style={{
                      height: speaking ? h : 6,
                      animationDelay: `${i * 0.07}s`,
                      transition: "height 0.3s ease",
                    }}
                  />
                ))}
              </div>

              <Link
                href="/practice/speaking"
                aria-label={t("speak")}
                className="pill flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-raised-2 text-muted hover:text-ink"
              >
                <ArrowUpRight size={17} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Fast repeat */}
          <div className="card card-hover relative flex-1 overflow-hidden p-6">
            <div className="orb -bottom-14 -right-10 h-40 w-40 bg-orange/20" />

            <p className="text-sm font-semibold text-muted">{t("fastRepeat")}</p>
            <h3 className="headline mt-1 text-3xl text-violet-soft lg:text-4xl">{t("vocabulary")}</h3>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-ink">
              ⏱ {t("minPractice")}
            </span>

            <div className="pointer-events-none absolute -bottom-2 right-3">
              <Mascot size={120} mood="happy" />
            </div>

            <Link
              href="/practice/repeat"
              aria-label={t("repeat")}
              className="pill absolute bottom-5 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-lemon text-canvas"
            >
              <RefreshCw size={19} strokeWidth={2.5} />
            </Link>
            {/* spacer so absolute elements never collide on short screens */}
            <div className="h-16" />
          </div>
        </motion.div>
      </div>

      {/* ============ Bottom row ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* today's booking / hint */}
        <motion.div variants={fadeUp} className="lg:col-span-5">
          {todaysBookings.length > 0 ? (
            <div className="card card-hover flex h-full flex-col gap-3 p-5">
              <p className="text-sm font-semibold text-muted">
                {t("today")} · {t("upcoming")}
              </p>
              {todaysBookings.map((b) => {
                const n = NURTURERS.find((x) => x.id === b.nurturerId);
                return (
                  <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-raised-2 p-3">
                    <span className="rounded-xl bg-violet/20 px-3 py-2 font-display text-sm font-bold text-violet-soft">
                      {b.time}
                    </span>
                    {n && <Avatar name={n.name} color={n.color} size={36} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{n?.name ?? b.nurturerId}</p>
                      <p className="truncate text-xs text-muted">
                        {b.activity} · {b.minutes} {t("minutes")}
                      </p>
                    </div>
                    <Link
                      href={`/session?nurturer=${b.nurturerId}`}
                      className="pill bg-mint px-4 py-2 text-sm font-bold text-canvas"
                    >
                      📹 {t("start")}
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <Link href="/schedule" className="block h-full">
              <div className="card card-hover flex h-full items-center gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet/15 text-2xl">
                  🗓️
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold">{t("bookSession")}</p>
                  <p className="truncate text-xs text-muted">{t("noSessions")}</p>
                </div>
                <span className="pill flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet text-white">
                  <ArrowRight size={17} strokeWidth={2.5} />
                </span>
              </div>
            </Link>
          )}
        </motion.div>

        {/* phase activities teaser */}
        <motion.div variants={fadeUp} className="lg:col-span-7">
          <div className="card card-hover flex h-full flex-col gap-3 p-5">
            <p className="text-sm font-semibold text-muted">
              {phase.emoji} {t("phaseWord")} {profile.phase} · {phase.name}
            </p>

            {nextActivities.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {nextActivities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-raised-2 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/6 text-lg">
                      {KIND_EMOJI[a.kind]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                      <p className="text-xs text-muted">
                        {a.minutes} {t("minutes")}
                      </p>
                    </div>
                    <Link
                      href={a.practiceHref ?? `/courses/${phase.slug}`}
                      className="pill bg-lime px-4 py-2 text-sm font-bold text-canvas"
                    >
                      {t("start")}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-raised-2 p-4">
                <span className="text-2xl">🎉</span>
                <p className="flex-1 text-sm text-muted">
                  {phase.name} — {t("done")}!
                </p>
                <Link
                  href={`/courses/${phase.slug}`}
                  className="pill bg-violet px-4 py-2 text-sm font-bold text-white"
                >
                  {t("continue")}
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ============ Growth shelf ============ */}
      <motion.div variants={fadeUp}>
        <div className="card card-hover relative overflow-hidden p-5">
          <div className="orb -left-14 -top-16 h-40 w-40 bg-lime/15" />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-muted">🏅 {t("growthShelf")}</p>
            {/* self-reported milestone — only the grower knows when it happened */}
            {!earned["first-joke"] && (
              <button
                type="button"
                onClick={() => award("first-joke")}
                className="pill bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-ink"
              >
                😂 {t("firstJoke")}
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-stretch gap-2.5">
            {/* earned badges — dated like pressed flowers */}
            {shelf.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-2xl bg-raised-2 py-2.5 pl-3 pr-4"
                title={a.sub}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/6 text-xl">
                  {a.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{a.title}</p>
                  <span className="mt-1 inline-block rounded-full bg-violet/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-violet-soft">
                    {badgeDate(earned[a.id])}
                  </span>
                </div>
              </div>
            ))}

            {/* next hour badge — gray silhouette with a progress ring */}
            {nextBadge && (
              <div
                className="flex items-center gap-3 rounded-2xl border border-dashed border-line py-2.5 pl-3 pr-4"
                title={nextBadge.sub}
              >
                <div className="relative h-11 w-11 shrink-0">
                  <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                    <circle cx="20" cy="20" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
                    <circle
                      cx="20"
                      cy="20"
                      r={RING_R}
                      fill="none"
                      stroke="var(--color-lime)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${ringFill * RING_C} ${RING_C}`}
                      className="transition-[stroke-dasharray] duration-700 ease-out"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl opacity-40 grayscale">
                    {nextBadge.emoji}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-muted">{nextBadge.title}</p>
                  <p className="mt-0.5 text-[10px] font-bold tracking-wide text-muted">
                    {Math.min(profile.hoursLogged, nextBadge.hours ?? 0)} / {nextBadge.hours} {t("hours")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* immersion meter — the app slowly stops speaking your language */}
          <div className="mt-5 rounded-2xl bg-raised-2 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="text-sm font-semibold">🌍 {appSpeaksLine}</p>
              <span className="font-display text-sm font-bold text-lime">{immersionPct}%</span>
            </div>
            <ProgressBar value={immersionPct} color="var(--color-lime)" height={8} />
            <p className="mt-2 text-xs text-muted">{t("immersionWarm")}</p>
          </div>
        </div>
      </motion.div>

      {/* ============ Achievement toast ============ */}
      {toastAch && (
        <div
          key={toastAch.id}
          role="status"
          className="popin fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-raised-2 py-2.5 pl-3.5 pr-6 shadow-xl"
        >
          <span className="text-2xl">{toastAch.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">{toastAch.title}</p>
            <p className="text-[11px] leading-tight text-muted">{toastAch.sub}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ================================================================ *
 *  FRESH DASHBOARD — the welcome garden for a brand-new grower
 *
 *  Grounded in real onboarding-empty-state patterns: a warm hero
 *  (Aaptiv/Duolingo), a getting-started checklist with one bright
 *  next step (Future/Shopify/Origin), zero-state stat widgets with
 *  ghosted art so the dark space reads intentional (Py/Mimo/Beli/
 *  Any Distance), and a first-session featured card (Ladder).
 * ================================================================ */

/** Faint sprout/vine line-art behind empty areas — dark space, alive not dead. */
function GhostSprout({ className = "", size = 160 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden
      className={`pointer-events-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* stem */}
      <path d="M60 112 C60 88 58 70 60 54" />
      {/* left leaf */}
      <path d="M60 78 C44 76 32 66 28 50 C46 50 58 60 60 78 Z" />
      {/* right leaf */}
      <path d="M60 66 C76 62 88 50 90 34 C72 36 62 48 60 66 Z" />
      {/* bud */}
      <circle cx="60" cy="44" r="9" />
    </svg>
  );
}

/** A single checklist row — dotted circle, label, time, route. */
function ChecklistStep({
  href,
  icon,
  label,
  time,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  time: string;
  active: boolean;
}) {
  return (
    <Link href={href} className="block">
      <div
        className={`card-hover flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
          active
            ? "border-orange/60 bg-orange/10"
            : "border-dashed border-line bg-raised-2/40"
        }`}
      >
        {/* dotted-outline circle (not empty) */}
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed text-lg ${
            active ? "border-orange text-orange" : "border-line text-muted"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${active ? "text-ink" : "text-muted"}`}>
            {label}
          </p>
          <p className={`text-xs ${active ? "text-orange" : "text-muted/70"}`}>{time}</p>
        </div>
        <ArrowRight
          size={16}
          strokeWidth={2.5}
          className={active ? "text-orange" : "text-muted/50"}
        />
      </div>
    </Link>
  );
}

function FreshDashboard({ profile, t }: { profile: Profile; t: (key: string) => string }) {
  const lang = langByCode(profile.targetLang);
  const mascot = mascotForLang(profile.targetLang);
  const name = profile.name || t("hello");

  /* The first session uses the AI buddy slot (Nuri's face is the target
     language's toy sibling). Solo route opens the session with that buddy. */
  const soloHref = "/session?nurturer=ai";
  const bookHref = "/schedule";

  const fill = (key: string, vars: Record<string, string>) =>
    Object.entries(vars).reduce(
      (s, [k, v]) => s.replace(`{${k}}`, v),
      t(key)
    );

  /* Headline 0% ring geometry */
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* ============ 1 · WELCOME HERO ============ */}
      <motion.header variants={fadeUp}>
        <div className="card relative overflow-hidden p-5 sm:p-7">
          <div className="orb -right-16 -top-20 h-56 w-56 bg-violet/25" />
          <div className="orb -bottom-20 -left-16 h-48 w-48 bg-lime/12" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* mascot + speech bubble */}
            <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-center">
              <MascotImage mascot={mascot} size={104} float glow />
              <div className="relative max-w-[11rem] rounded-2xl rounded-bl-sm bg-violet/15 px-4 py-3 text-sm leading-snug text-ink ring-1 ring-violet/30 sm:max-w-[15rem] sm:rounded-bl-2xl sm:rounded-tl-sm">
                {t("dshFreshBubble")}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="headline text-3xl leading-tight sm:text-4xl lg:text-5xl">
                {fill("dshFreshWelcome", { name })}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <span className="text-lg leading-none">{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </p>

              {/* week strip — 7 empty violet outline dots */}
              <div className="mt-5 flex items-center gap-2.5">
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className="h-3.5 w-3.5 rounded-full border-2 border-violet/45"
                    aria-hidden
                  />
                ))}
              </div>

              {/* streak pill — potential, not loss */}
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime/12 px-4 py-1.5 text-sm font-semibold text-lime">
                🌱 {t("dshFreshStreak")}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ============ start at Phase 1, grow at your pace ============ */}
      <motion.div variants={fadeUp}>
        <div className="card flex items-start gap-3.5 p-5">
          <span className="text-2xl">🌱</span>
          <div className="min-w-0">
            <h2 className="headline text-lg">{t("dshFreshPhase1Title")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {fill("dshFreshPhase1Body", { language: lang.nativeName })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ============ 2 · GETTING-STARTED CHECKLIST ============ */}
      <motion.div variants={fadeUp}>
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">{t("dshFreshFirstWeek")}</p>
              <h2 className="headline mt-0.5 text-xl">{t("dshFreshChecklistTitle")}</h2>
            </div>
            {/* lime progress ring 0/4 */}
            <div className="relative h-14 w-14 shrink-0">
              <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold text-lime">
                0/4
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* the single next step is orange-highlighted */}
            <ChecklistStep
              href={soloHref}
              icon="👋"
              label={t("dshFreshStepMeet")}
              time={`2 ${t("minutes")}`}
              active
            />
            <ChecklistStep
              href={bookHref}
              icon="🌍"
              label={t("dshFreshStepBook")}
              time={`5 ${t("minutes")}`}
              active={false}
            />
            <ChecklistStep
              href="/practice/listening"
              icon="👂"
              label={t("dshFreshStepListen")}
              time={`10 ${t("minutes")}`}
              active={false}
            />
            <ChecklistStep
              href="/onboarding"
              icon="⏳"
              label={fill("dshFreshStepRhythm", { total: String(TOTAL_HOURS) })}
              time={t("dshFreshStepRhythmTime")}
              active={false}
            />
          </div>
        </div>
      </motion.div>

      {/* ============ 3 · ZERO-STATE STAT WIDGETS ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* headline 0% ring */}
        <motion.div variants={fadeUp} className="lg:col-span-5">
          <div className="card card-hover relative flex h-full flex-col items-center overflow-hidden p-6 text-center">
            <GhostSprout className="absolute -right-6 -top-4 text-violet/10" size={140} />
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="var(--color-violet)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`0 ${C}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="headline text-2xl text-violet-soft">0</span>
                <span className="text-[11px] font-semibold text-muted">
                  / {TOTAL_HOURS} {t("hours")}
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">{t("dshFreshHoursEncourage")}</p>
            <Link
              href={soloHref}
              className="pill mt-4 bg-orange px-5 py-2.5 text-sm font-bold text-canvas"
              style={{ boxShadow: "var(--shadow-glow-orange)" }}
            >
              {t("dshFreshGrowFirstMinutes")} <ArrowRight size={15} strokeWidth={2.75} className="ml-1 inline" />
            </Link>
          </div>
        </motion.div>

        {/* words met + this week */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 lg:col-span-7">
          {/* words met */}
          <div className="card card-hover relative flex flex-1 flex-col gap-4 overflow-hidden p-6 sm:flex-row sm:items-center">
            <GhostSprout className="absolute -bottom-6 -right-4 text-lime/10" size={150} />
            <div className="relative">
              <p className="headline text-4xl text-lime/70 sm:text-5xl">0</p>
              <p className="mt-1 text-sm font-semibold text-muted">{t("wordsMet")}</p>
            </div>
            <div className="relative w-full text-left sm:ml-auto sm:max-w-[14rem] sm:text-right">
              <p className="text-sm text-muted">{t("dshFreshGardenEmpty")}</p>
              <Link
                href="/practice/listening"
                className="pill mt-3 inline-flex bg-lime px-4 py-2 text-sm font-bold text-canvas"
              >
                {t("dshFreshStartListening")}
              </Link>
            </div>
          </div>

          {/* this week */}
          <div className="card card-hover relative flex flex-1 flex-col justify-center overflow-hidden p-6">
            <GhostSprout className="absolute -left-6 -top-4 text-violet/8" size={120} />
            <p className="relative text-sm font-semibold text-muted">{t("weeklyActivity")}</p>
            <div className="relative mt-4 flex items-center gap-2.5">
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  key={i}
                  className="h-4 w-4 rounded-full border-2 border-violet/35"
                  aria-hidden
                />
              ))}
            </div>
            <p className="relative mt-4 text-xs text-muted">{t("dshFreshNoGrowth")}</p>
          </div>
        </motion.div>
      </div>

      {/* ============ 4 · FIRST-SESSION FEATURED CARD ============ */}
      <motion.div variants={fadeUp}>
        <div
          className="card relative overflow-hidden p-6 sm:p-8"
          style={{
            background:
              "radial-gradient(120% 100% at 12% 0%, rgba(124,92,255,0.30), transparent 55%), radial-gradient(110% 100% at 95% 100%, rgba(255,138,30,0.24), transparent 55%)",
          }}
        >
          <div className="orb -right-14 -bottom-16 h-44 w-44 bg-orange/15" />

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:text-left">
            <div className="shrink-0">
              <MascotImage mascot={mascot} size={92} float />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-soft">
                {t("dshFreshFirstSessionTag")}
              </p>
              <h2 className="headline mt-1 text-2xl leading-tight sm:text-3xl">
                {t("dshFreshFirstSessionTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted">{t("dshFreshFirstSessionReassure")}</p>

              <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href={bookHref}
                  className="pill bg-orange px-6 py-3 text-center text-sm font-bold text-canvas"
                  style={{ boxShadow: "var(--shadow-glow-orange)" }}
                >
                  {t("dshFreshBookFirst")}
                </Link>
                <Link
                  href={soloHref}
                  className="pill border border-line bg-raised-2 px-6 py-3 text-center text-sm font-semibold text-muted hover:text-ink"
                >
                  {fill("dshFreshStartSolo", { buddy: mascot.name })}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
