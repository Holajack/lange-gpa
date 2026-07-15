"use client";

/**
 * /nurture — the Nurturer Studio.
 * GPA's hard part is knowing what to DO in a session: this page is the
 * meeting-plan book an untrained native speaker never has to read.
 * Golden rules → a deterministic session planner → a projector-style
 * picture-card table → a segmented meeting timer.
 *
 * GPA discipline: card words are HOST language only (image + audio carry
 * meaning, "show word" is off by default — ears before eyes). Curriculum
 * text stays plain English, like the printed phase guides.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Volume2,
} from "lucide-react";

import { useApp } from "@/lib/store";
import { PHASES, phaseById } from "@/lib/phases";
import { VOCAB_DOMAINS } from "@/lib/vocab";
import { FULL_CONTENT_LANGS, langByCode } from "@/lib/languages";
import { speak, stopSpeaking } from "@/lib/tts";
import { Mascot } from "@/components/Mascot";
import { Card, Pill, Tag } from "@/components/ui";
import type { LangCode, Phase, PhaseActivity, VocabItem } from "@/lib/types";

const DEMO_FAST_FORWARD =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
  process.env.NEXT_PUBLIC_ENABLE_DEMO_SPEED === "true";

/* ---------------------------------------------------------------- *
 *  Motion choreography (matches the rest of the app)
 * ---------------------------------------------------------------- */

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 0.68, 0.32, 1] } },
};

/* ---------------------------------------------------------------- *
 *  The nurturer's craft — golden rules (from the GPA meeting plans)
 * ---------------------------------------------------------------- */

const GOLDEN_RULES: { emoji: string; titleKey: string; bodyKey: string }[] = [
  { emoji: "✌️", titleKey: "nurGoldenRule1Title", bodyKey: "nurGoldenRule1Body" },
  { emoji: "🎯", titleKey: "nurGoldenRule2Title", bodyKey: "nurGoldenRule2Body" },
  { emoji: "🔁", titleKey: "nurGoldenRule3Title", bodyKey: "nurGoldenRule3Body" },
  { emoji: "👉", titleKey: "nurGoldenRule4Title", bodyKey: "nurGoldenRule4Body" },
  { emoji: "🧸", titleKey: "nurGoldenRule5Title", bodyKey: "nurGoldenRule5Body" },
  { emoji: "🎙️", titleKey: "nurGoldenRule6Title", bodyKey: "nurGoldenRule6Body" },
];

/* ---------------------------------------------------------------- *
 *  Session planner — deterministic plan composition
 * ---------------------------------------------------------------- */

const LENGTHS = [30, 45, 60] as const;
type MeetingLength = (typeof LENGTHS)[number];

const WARMUP_MIN = 5;
const CLOSING_MIN = 3;

const KIND_EMOJI: Record<PhaseActivity["kind"], string> = {
  listening: "👂",
  speaking: "🗣️",
  vocabulary: "🃏",
  literacy: "📖",
  culture: "🌍",
  conversation: "💬",
};

interface PlanBlock {
  id: string;
  emoji: string;
  /** activity blocks carry literal (dynamic) text; fixed blocks carry i18n keys */
  title?: string;
  titleKey?: string;
  minutes: number;
  how?: string;
  howKey?: string;
  tag?: string;
  tagKey?: string;
  practiceHref?: string;
}

/** Tiny seeded PRNG so each shuffle roll is deterministic. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Compose an ordered meeting plan whose minutes add up exactly to `length`. */
function buildPlan(phase: Phase, length: MeetingLength, roll: number): PlanBlock[] {
  const rng = mulberry32(phase.id * 99991 + length * 271 + roll * 7919 + 13);
  const wish = length === 30 ? 2 : length === 45 ? 3 : 4;
  const picks = seededShuffle(phase.activities, rng).slice(0, Math.min(wish, phase.activities.length));

  // Distribute the middle budget proportionally to each activity's own minutes.
  const budget = length - WARMUP_MIN - CLOSING_MIN;
  const weight = picks.reduce((s, a) => s + a.minutes, 0) || 1;
  const minutes = picks.map((a) => Math.max(4, Math.floor((budget * a.minutes) / weight)));
  let diff = budget - minutes.reduce((s, n) => s + n, 0);
  for (let i = 0; diff !== 0 && i < 400; i++) {
    const idx = i % minutes.length;
    if (diff > 0) {
      minutes[idx] += 1;
      diff -= 1;
    } else if (minutes[idx] > 4) {
      minutes[idx] -= 1;
      diff += 1;
    }
  }

  return [
    {
      id: "warmup",
      emoji: "🔁",
      titleKey: "nurWarmupReview",
      minutes: WARMUP_MIN,
      howKey: "nurWarmupHow",
      tagKey: "nurEveryMeeting",
    },
    ...picks.map((a, i) => ({
      id: a.id,
      emoji: KIND_EMOJI[a.kind],
      title: a.name,
      minutes: minutes[i],
      how: a.how,
      tag: a.kind,
      practiceHref: a.practiceHref,
    })),
    {
      id: "closing",
      emoji: "🎙️",
      titleKey: "nurClosingRecording",
      minutes: CLOSING_MIN,
      howKey: "nurClosingHow",
      tagKey: "nurEveryMeeting",
    },
  ];
}

function SessionPlanner() {
  const { t } = useApp();
  const [phaseId, setPhaseId] = useState<number>(1);
  const [length, setLength] = useState<MeetingLength>(30);
  const [roll, setRoll] = useState(0);

  const phase = phaseById(phaseId);
  const plan = useMemo(() => buildPlan(phase, length, roll), [phase, length, roll]);
  const total = plan.reduce((s, b) => s + b.minutes, 0);

  return (
    <Card className="relative overflow-hidden p-6 lg:p-8">
      <div className="orb -right-24 -top-24 h-56 w-56 bg-orange/15" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="headline text-2xl lg:text-3xl">🗺️ {t("nurSessionPlanner")}</h2>
          <p className="mt-1 text-sm text-muted">{t("nurSessionPlannerSub")}</p>
        </div>
        <Pill
          onClick={() => setRoll((r) => r + 1)}
          className="gap-2 bg-orange px-5 py-2.5 text-sm font-semibold text-canvas"
        >
          <Shuffle size={15} /> {t("nurShuffleActivities")}
        </Pill>
      </div>

      {/* phase + length pickers */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {PHASES.map((p) => {
            const active = p.id === phaseId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPhaseId(p.id);
                  setRoll(0);
                }}
                title={p.name}
                className="pill px-3.5 py-2 text-sm font-bold transition"
                style={
                  active
                    ? { background: p.color, color: "#0e0e12", boxShadow: `0 0 26px -6px ${p.color}` }
                    : { background: "rgba(255,255,255,0.06)", color: "var(--color-muted, #9b9ba6)" }
                }
              >
                {p.emoji} {p.id}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          {LENGTHS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setLength(m)}
              className={`pill px-4 py-2 text-sm font-bold ${
                length === m ? "bg-white/14 text-ink" : "bg-white/5 text-muted hover:text-ink"
              }`}
            >
              {m} {t("minutes")}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold" style={{ color: phase.color }}>
        {phase.emoji} {t("phaseWord")} {phase.id} · {phase.name} — {phase.tagline}
      </p>

      {/* the plan */}
      <div className="mt-4 space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {plan.map((block, i) => {
            const fixed = block.id === "warmup" || block.id === "closing";
            return (
              <motion.div
                key={`${block.id}-${roll}-${length}`}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                className={`flex items-start gap-4 rounded-2xl px-4 py-3.5 ${
                  fixed ? "bg-white/3 border border-dashed border-line" : "bg-white/5"
                }`}
              >
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: fixed ? "rgba(255,255,255,0.06)" : phase.color + "22" }}
                  aria-hidden
                >
                  {block.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-display text-[15px] font-bold">
                      {i + 1}. {block.titleKey ? t(block.titleKey) : block.title}
                    </span>
                    {(block.tagKey || block.tag) && (
                      <Tag className="text-[10px] uppercase tracking-wide">
                        {block.tagKey ? t(block.tagKey) : block.tag}
                      </Tag>
                    )}
                    {block.practiceHref && (
                      <Link
                        href={block.practiceHref}
                        className="text-xs font-semibold text-orange hover:underline"
                      >
                        {t("nurOpenInApp")} →
                      </Link>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {block.howKey ? t(block.howKey) : block.how}
                  </p>
                </div>
                <span className="pill shrink-0 bg-white/8 px-3 py-1.5 font-display text-sm font-bold tabular-nums">
                  {block.minutes}′
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* minute math */}
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-orange/10 px-4 py-3">
        <p className="text-xs font-semibold text-muted">
          {WARMUP_MIN}′ {t("nurMathReview")} + {total - WARMUP_MIN - CLOSING_MIN}′ {t("nurMathPlay")} + {CLOSING_MIN}′{" "}
          {t("nurMathRecording")}
        </p>
        <p className="font-display text-sm font-extrabold text-orange tabular-nums">
          = {total} / {length} {t("minutes")} ✓
        </p>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- *
 *  Card Table — projector-style big-card kit
 * ---------------------------------------------------------------- */

/** The "Where is…?" power question, per content language. */
const WHERE_IS: Partial<Record<LangCode, string>> = {
  es: "¿Dónde está…?",
  ru: "Где…?",
  fr: "Où est… ?",
  de: "Wo ist…?",
  pt: "Onde está…?",
  it: "Dov'è…?",
  ht: "Kote…?",
};

function CardTable({ contentLang }: { contentLang: LangCode }) {
  const { t } = useApp();
  const [domainId, setDomainId] = useState(VOCAB_DOMAINS[0].id);
  const [index, setIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [dir, setDir] = useState(1);
  const [deckRoll, setDeckRoll] = useState(0);

  const domain = VOCAB_DOMAINS.find((d) => d.id === domainId) ?? VOCAB_DOMAINS[0];

  const deck: VocabItem[] = useMemo(() => {
    const items = domain.items.filter((it) => it.words[contentLang]);
    if (deckRoll === 0) return items;
    const rng = mulberry32(deckRoll * 6151 + domain.id.length);
    return seededShuffle(items, rng);
  }, [domain, contentLang, deckRoll]);

  // keep index valid when deck changes
  useEffect(() => setIndex(0), [domainId, contentLang, deckRoll]);

  const card = deck[Math.min(index, deck.length - 1)];
  const word = card?.words[contentLang] ?? "";
  const whereIs = WHERE_IS[contentLang] ?? t("nur2WhereIs");

  const step = (d: number) => {
    setDir(d);
    setIndex((i) => (i + d + deck.length) % deck.length);
  };

  return (
    <Card className="relative flex flex-col overflow-hidden p-6 lg:p-8">
      <div className="orb -left-24 -bottom-24 h-56 w-56 bg-violet/15" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="headline text-2xl lg:text-3xl">🃏 {t("nurCardTable")}</h2>
          <p className="mt-1 text-sm text-muted">{t("nurCardTableSub")}</p>
        </div>
        <Pill
          onClick={() => setDeckRoll((r) => r + 1)}
          className="gap-2 bg-white/8 px-4 py-2 text-xs font-semibold text-ink"
        >
          <Shuffle size={13} /> {t("nurShuffleDeck")}
        </Pill>
      </div>

      {/* domain picker */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {VOCAB_DOMAINS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDomainId(d.id)}
            className={`pill px-3 py-1.5 text-xs font-semibold ${
              d.id === domainId ? "bg-orange text-canvas" : "bg-white/5 text-muted hover:text-ink"
            }`}
          >
            {d.emoji} {d.names.en}
          </button>
        ))}
      </div>

      {/* the big card */}
      <div className="relative mt-5 flex-1">
        <div className="relative mx-auto flex min-h-[290px] max-w-[420px] items-center justify-center overflow-hidden rounded-[28px] border border-line bg-white/4">
          <AnimatePresence mode="wait" initial={false}>
            {card && (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 64 * dir, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -64 * dir, scale: 0.92 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="flex flex-col items-center gap-3 px-6 py-10 text-center"
              >
                <span className="text-[110px] leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]" aria-hidden>
                  {card.emoji}
                </span>
                {/* ears before eyes: the host-language word is hidden by default */}
                {showWord ? (
                  <p className="font-display text-2xl font-extrabold tracking-tight">{word}</p>
                ) : (
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">👂 {t("nurEarsBeforeEyes")}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* card count */}
          <span className="absolute right-4 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-muted backdrop-blur">
            {deck.length ? index + 1 : 0} / {deck.length}
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => step(-1)}
          title={t("nur2PreviousCard")}
          className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-ink transition hover:scale-105 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => word && void speak(word, contentLang)}
          title={t("nur2SayTheWord")}
          className="grid h-14 w-14 place-items-center rounded-full bg-orange text-canvas transition hover:scale-105 active:scale-95"
          style={{ boxShadow: "var(--shadow-glow-orange)" }}
        >
          <Volume2 size={22} />
        </button>
        <button
          type="button"
          onClick={() => word && void speak(`${whereIs.replace("…?", "")} ${word}?`, contentLang)}
          title={t("nur2AskTheQuestion")}
          className="pill min-w-0 bg-violet px-4 py-3 text-sm font-bold text-white transition hover:scale-105 active:scale-95"
        >
          {whereIs}
        </button>
        <button
          type="button"
          onClick={() => setShowWord((s) => !s)}
          title={showWord ? t("nurHideWord") : t("nurShowWord")}
          className={`grid h-12 w-12 place-items-center rounded-full transition hover:scale-105 active:scale-95 ${
            showWord ? "bg-lemon text-canvas" : "bg-white/8 text-muted"
          }`}
        >
          {showWord ? <Eye size={19} /> : <EyeOff size={19} />}
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          title={t("nur2NextCard")}
          className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-ink transition hover:scale-105 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="mt-4 rounded-2xl bg-white/4 px-4 py-3 text-center text-xs leading-relaxed text-muted">
        {t("nurCardTableTipBefore")} <span className="font-bold text-ink">&ldquo;{whereIs}&rdquo;</span>.{" "}
        {t("nurCardTableTipAfter")}
      </p>
    </Card>
  );
}

/* ---------------------------------------------------------------- *
 *  Meeting Timer — 5 review / 20 play / 5 record
 * ---------------------------------------------------------------- */

const SEGMENTS = [
  { id: "review", labelKey: "nurSegReview", emoji: "🔁", minutes: 5, color: "#ffd234" },
  { id: "play", labelKey: "nurSegPlay", emoji: "🃏", minutes: 20, color: "#ff8a1e" },
  { id: "record", labelKey: "nurSegRecord", emoji: "🎙️", minutes: 5, color: "#7c5cff" },
] as const;

const TIMER_TOTAL = SEGMENTS.reduce((s, x) => s + x.minutes, 0) * 60; // 1800s

/** Short spoken cues, in the nurture language, at segment boundaries. */
const TIMER_CUES: Partial<Record<LangCode, { play: string; record: string; done: string }>> = {
  es: { play: "¡A jugar!", record: "¡A grabar!", done: "¡Listo!" },
  ru: { play: "Играем!", record: "Записываем!", done: "Готово!" },
  fr: { play: "On joue !", record: "On enregistre !", done: "C'est fini !" },
  de: { play: "Jetzt spielen!", record: "Jetzt aufnehmen!", done: "Fertig!" },
  pt: { play: "Vamos brincar!", record: "Vamos gravar!", done: "Pronto!" },
  it: { play: "Si gioca!", record: "Si registra!", done: "Fatto!" },
  ja: { play: "あそぼう！", record: "ろくおんしよう！", done: "おしまい！" },
  zh: { play: "开始玩吧！", record: "开始录音！", done: "完成了！" },
  ht: { play: "Ann jwe!", record: "Ann anrejistre!", done: "Nou fini!" },
};

function MeetingTimer({ contentLang }: { contentLang: LangCode }) {
  const { t } = useApp();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [fast, setFast] = useState(false);
  const prevRef = useRef(0);

  const cues = TIMER_CUES[contentLang] ?? TIMER_CUES.es!;

  // tick
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed((e) => Math.min(TIMER_TOTAL, e + (fast ? 60 : 1)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, fast]);

  // segment-boundary chimes (spoken cue in the nurture language)
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = elapsed;
    if (elapsed <= prev) return;
    const b1 = SEGMENTS[0].minutes * 60;
    const b2 = (SEGMENTS[0].minutes + SEGMENTS[1].minutes) * 60;
    if (prev < b1 && elapsed >= b1) void speak(cues.play, contentLang);
    else if (prev < b2 && elapsed >= b2) void speak(cues.record, contentLang);
    if (elapsed >= TIMER_TOTAL) {
      void speak(cues.done, contentLang);
      setRunning(false);
    }
  }, [elapsed, contentLang, cues]);

  // stop audio when leaving the page
  useEffect(() => () => stopSpeaking(), []);

  const remaining = TIMER_TOTAL - elapsed;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // which segment are we in?
  let acc = 0;
  let currentIdx = SEGMENTS.length - 1;
  for (let i = 0; i < SEGMENTS.length; i++) {
    acc += SEGMENTS[i].minutes * 60;
    if (elapsed < acc) {
      currentIdx = i;
      break;
    }
  }
  const current = SEGMENTS[currentIdx];
  const done = elapsed >= TIMER_TOTAL;

  const reset = useCallback(() => {
    setRunning(false);
    setElapsed(0);
    prevRef.current = 0;
    stopSpeaking();
  }, []);

  return (
    <Card className="relative overflow-hidden p-6 lg:p-8">
      <div className="orb -right-20 -bottom-20 h-52 w-52 bg-lemon/12" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="headline text-2xl lg:text-3xl">⏱️ {t("nurMeetingTimer")}</h2>
          <p className="mt-1 text-sm text-muted">{t("nurMeetingTimerSub")}</p>
        </div>
        {DEMO_FAST_FORWARD && (
          <button
            type="button"
            onClick={() => setFast((f) => !f)}
            title={t("nur2DemoSpeed")}
            className={`pill px-3 py-1.5 text-xs font-bold ${fast ? "bg-lemon text-canvas" : "bg-white/6 text-muted"}`}
          >
            ⚡ ×60
          </button>
        )}
      </div>

      {/* big clock */}
      <div className="mt-6 flex flex-col items-center gap-1">
        <p className="font-display text-5xl font-extrabold tabular-nums tracking-tight sm:text-6xl lg:text-7xl">
          {mm}:{ss}
        </p>
        <p className="text-sm font-bold" style={{ color: current.color }}>
          {done ? `🎉 ${t("nurMeetingComplete")}` : `${current.emoji} ${t(current.labelKey)} ${t("nurTimeSuffix")}`}
        </p>
      </div>

      {/* segmented bar */}
      <div className="mt-6 flex h-5 w-full gap-1">
        {SEGMENTS.map((seg, i) => {
          const segStart = SEGMENTS.slice(0, i).reduce((s, x) => s + x.minutes * 60, 0);
          const segLen = seg.minutes * 60;
          const fill = Math.min(100, Math.max(0, ((elapsed - segStart) / segLen) * 100));
          return (
            <div
              key={seg.id}
              className="relative h-full overflow-hidden rounded-full"
              style={{ width: `${(seg.minutes / 30) * 100}%`, background: seg.color + "22" }}
              title={`${t(seg.labelKey)} · ${seg.minutes} ${t("minutes")}`}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-linear"
                style={{ width: `${fill}%`, background: seg.color }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 text-[11px] font-semibold text-muted">
        {SEGMENTS.map((seg) => (
          <span key={seg.id} className="min-w-0 truncate text-center" style={{ width: `${(seg.minutes / 30) * 100}%` }}>
            {seg.emoji} <span className="hidden sm:inline">{t(seg.labelKey)} · </span>{seg.minutes}′
          </span>
        ))}
      </div>

      {/* controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Pill
          onClick={() => (done ? reset() : setRunning((r) => !r))}
          className={`gap-2 px-7 py-3.5 font-semibold ${
            running ? "bg-white/10 text-ink" : "bg-orange text-canvas"
          }`}
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? t("nurPause") : done ? t("nurAgain") : elapsed > 0 ? t("nurResume") : t("nurStartMeeting")}
        </Pill>
        <button
          type="button"
          onClick={reset}
          title={t("nur2Reset")}
          className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-muted transition hover:scale-105 hover:text-ink active:scale-95"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted">{t("nurTimerFootnote")}</p>
    </Card>
  );
}

/* ---------------------------------------------------------------- *
 *  Grower gate
 * ---------------------------------------------------------------- */

function GrowerGate() {
  const { t } = useApp();
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <Card className="relative overflow-hidden p-8 text-center sm:p-10">
          <div className="orb -left-20 -top-20 h-56 w-56 bg-orange/20" />
          <div className="flex justify-center">
            <Mascot size={150} mood="think" />
          </div>
          <h1 className="headline mt-4 text-3xl lg:text-4xl">{t("nurBenchTitle")} 🪑</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{t("nurBenchBody")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/courses/ever-growing"
              className="pill bg-orange px-7 py-3.5 font-semibold text-canvas"
              style={{ boxShadow: "var(--shadow-glow-orange)" }}
            >
              🌍 {t("nurSeePhase6")}
            </Link>
            <Link href="/onboarding" className="pill bg-white/8 px-7 py-3.5 font-semibold text-ink">
              {t("nurFlipMyRole")} →
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 *  Training gate — a nurturer must pass the golden-rules check once
 *  before the bench unlocks. See /nurture/training.
 * ---------------------------------------------------------------- */

function TrainingGate() {
  const { t, profile } = useApp();
  const failedBefore = profile?.nurturerCertStatus === "failed";
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <Card className="relative overflow-hidden p-8 text-center sm:p-10">
          <div className="orb -left-20 -top-20 h-56 w-56 bg-orange/20" />
          <div className="flex justify-center">
            <Mascot size={150} mood="cheer" />
          </div>
          <h1 className="headline mt-4 text-3xl lg:text-4xl">{t("nurTrainGateTitle")}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{t("nurTrainGateBody")}</p>
          {failedBefore && (
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-orange">{t("nurTrainGateRetryNote")}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/nurture/training"
              className="pill bg-orange px-7 py-3.5 font-semibold text-canvas"
              style={{ boxShadow: "var(--shadow-glow-orange)" }}
            >
              {t("nurTrainGateCta")} →
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 *  Page
 * ---------------------------------------------------------------- */

export default function NurturePage() {
  const { profile, t } = useApp();

  // nurture language: first nurtureLang, falling back to the target language
  const [lang, setLang] = useState<LangCode | null>(null);
  const langChoices = useMemo(() => {
    if (!profile) return [] as LangCode[];
    const nurtureLangs = profile.nurtureLangs ?? [];
    const all = nurtureLangs.length > 0 ? nurtureLangs : [profile.targetLang];
    return [...new Set(all)];
  }, [profile]);

  if (!profile) return null;
  if (profile.role === "grower") return <GrowerGate />;
  if (profile.nurturerCertStatus !== "passed") return <TrainingGate />;

  const activeLang: LangCode = lang ?? langChoices[0] ?? profile.targetLang;
  /** card decks + cues exist for the eight core languages; demo langs borrow Spanish */
  const contentLang: LangCode = FULL_CONTENT_LANGS.includes(activeLang) ? activeLang : "es";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8 pb-12">
      {/* ============ header ============ */}
      <motion.header variants={fadeUp} className="relative pt-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange">🍊 {t("nurForNurturers")}</p>
            <h1 className="headline mt-1 text-4xl lg:text-5xl">{t("nurStudioTitle")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted lg:text-base">{t("nurStudioSub")}</p>
          </div>

          {/* nurture language picker */}
          {langChoices.length > 0 && (
            <div className="flex items-center gap-1.5">
              {langChoices.map((code) => {
                const l = langByCode(code);
                const active = code === activeLang;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    title={l.nativeName}
                    className={`pill px-3.5 py-2 text-sm font-bold ${
                      active ? "bg-orange text-canvas shadow-glow-orange" : "bg-white/6 text-muted hover:text-ink"
                    }`}
                  >
                    {l.flag} <span className="hidden sm:inline">{l.nativeName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.header>

      {/* ============ a) golden rules ============ */}
      <motion.section variants={fadeUp}>
        {/* rule zero — the big one */}
        <div
          className="card relative overflow-hidden p-6 lg:p-8"
          style={{ boxShadow: "0 0 0 2px rgba(255,138,30,0.45), var(--shadow-glow-orange)" }}
        >
          <div className="orb -right-16 -top-16 h-48 w-48 bg-orange/25" />
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-orange/20 text-3xl" aria-hidden>
              🗣️
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="headline text-2xl lg:text-3xl">{t("nurRuleZeroTitle")}</h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">{t("nurRuleZeroBody")}</p>
            </div>
            <Tag className="bg-orange/15 text-orange">{t("nurRuleZeroTag")}</Tag>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GOLDEN_RULES.map((rule, i) => (
            <motion.div
              key={rule.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: "easeOut" }}
            >
              <Card hover className="h-full p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange/15 text-xl" aria-hidden>
                  {rule.emoji}
                </span>
                <h3 className="font-display mt-3 text-lg font-extrabold leading-snug">{t(rule.titleKey)}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t(rule.bodyKey)}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ============ b) session planner ============ */}
      <motion.section variants={fadeUp}>
        <SessionPlanner />
      </motion.section>

      {/* ============ c + d) card table & timer ============ */}
      <motion.section variants={fadeUp} className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <CardTable contentLang={contentLang} />
        <MeetingTimer contentLang={contentLang} />
      </motion.section>
    </motion.div>
  );
}
