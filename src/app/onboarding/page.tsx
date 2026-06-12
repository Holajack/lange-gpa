"use client";

/**
 * Onboarding — a warm conversation with Nuri.
 *
 * 0  Welcome + role choice (grower / nurturer / both, ?role= preselects)
 * 1  Known languages (multi-select, English preselected)
 * 2  Target world (grower/both) — or nurture languages (nurturer-only)
 *    ↳ optional placement: "Grown in {language} before?" opens a
 *      comprehension-only listening test (src/lib/placement.ts) that can
 *      earn a Phase 2 or Phase 3 start. Skippable; default stays Phase 1.
 * 3  Where you're growing from (city + country, optional, city-level privacy)
 * 4  Why this language (single-select motivation, optional)
 * 5  What you love (multi-select interests, optional)
 * 6  Daily watering rhythm + language-exchange toggle (optional, pledge CTA)
 * 7  Name + live preview
 * 8  Immersion moment (growers) / nurturer toolkit — then plant the profile
 *
 * Steps 3–6 are invitations, never gates: they can be skipped without
 * blocking completion (GPA is invitation, not interrogation).
 */

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, MapPin, Sparkles, Volume2 } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { Logo } from "@/components/Logo";
import { blankProfile, useApp } from "@/lib/store";
import { FULL_CONTENT_LANGS, LANGUAGES, langByCode } from "@/lib/languages";
import { speak, stopSpeaking } from "@/lib/tts";
import { phaseById } from "@/lib/phases";
import {
  MAX_REPLAYS_PER_ROUND,
  buildGate,
  gate2Available,
  placementAvailable,
  placementSeed,
  scoreGate,
  type GateId,
  type GateResult,
  type PlacementGate,
  type PlacementRound,
  type RoundResult,
} from "@/lib/placement";
import type { LangCode, Language, PhaseId, Profile, Role } from "@/lib/types";

const STEP_COUNT = 9;

/** Why this language — single-select; stored as a readable phrase.
 *  `labelKey` resolves through the immersion translator at render time. */
const MOTIVATIONS = [
  { id: "family roots", emoji: "🌳", labelKey: "dshMotFamilyRoots" },
  { id: "travel", emoji: "🧳", labelKey: "dshMotTravel" },
  { id: "someone I love", emoji: "💛", labelKey: "dshMotSomeoneILove" },
  { id: "work", emoji: "💼", labelKey: "dshMotWork" },
  { id: "faith", emoji: "🕊️", labelKey: "dshMotFaith" },
  { id: "the joy of it", emoji: "✨", labelKey: "dshMotJoy" },
] as const;

/** What you love — multi-select picture-card worlds. */
const INTERESTS = [
  { id: "food", emoji: "🍲", labelKey: "dshIntFood" },
  { id: "music", emoji: "🎶", labelKey: "dshIntMusic" },
  { id: "sport", emoji: "⚽", labelKey: "dshIntSport" },
  { id: "nature", emoji: "🌿", labelKey: "dshIntNature" },
  { id: "family", emoji: "👨‍👩‍👧", labelKey: "dshIntFamily" },
  { id: "craft", emoji: "🧵", labelKey: "dshIntCraft" },
  { id: "games", emoji: "🎲", labelKey: "dshIntGames" },
  { id: "stories", emoji: "📚", labelKey: "dshIntStories" },
  { id: "travel", emoji: "🗺️", labelKey: "dshIntTravel" },
  { id: "faith", emoji: "🙏", labelKey: "dshIntFaith" },
] as const;

/** Daily watering rhythms — minutes → growing identity. */
const PACES = [
  { minutes: 10, emoji: "🌱", identityKey: "dshPaceSeedling" },
  { minutes: 20, emoji: "🌿", identityKey: "dshPaceSprout" },
  { minutes: 40, emoji: "🌳", identityKey: "dshPaceGrove" },
] as const;

/** First word a grower meets — pure target language, meaning carried by voice. */
const HELLO: Record<LangCode, string> = {
  en: "Hello!",
  es: "¡Hola!",
  ru: "Привет!",
  fr: "Salut !",
  de: "Hallo!",
  pt: "Olá!",
  it: "Ciao!",
  ja: "こんにちは",
  zh: "你好",
  ar: "مرحبا",
  ko: "안녕하세요",
  tr: "Merhaba!",
  uk: "Привіт!",
  hi: "नमस्ते",
  ht: "Bonjou!",
};

/* ------------------------------------------------------------------ */
/* Motion vocabulary                                                    */
/* ------------------------------------------------------------------ */

const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 64 * dir, scale: 0.99 }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.34,
      ease: [0.2, 0.9, 0.3, 1],
      when: "beforeChildren",
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
  exit: (dir: number) => ({ opacity: 0, x: -64 * dir, transition: { duration: 0.2, ease: "easeIn" } }),
};

const item: Variants = {
  enter: { opacity: 0, y: 24, scale: 0.98 },
  center: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 26 } },
};

/** Fast inner stagger for chip/card grids. */
const grid: Variants = {
  enter: {},
  center: { transition: { staggerChildren: 0.035 } },
};

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */

function NuriSays({
  mood,
  children,
}: {
  mood: "wave" | "happy" | "think" | "cheer";
  children: ReactNode;
}) {
  return (
    <motion.div variants={item} className="mb-6 flex items-end gap-3">
      <Mascot size={56} mood={mood} float={false} className="shrink-0" />
      <div className="rounded-2xl rounded-bl-md border border-line bg-raised px-4 py-2.5 text-sm text-muted">
        {children}
      </div>
    </motion.div>
  );
}

function CheckBadge({ on, color = "var(--color-violet)" }: { on: boolean; color?: string }) {
  return (
    <AnimatePresence>
      {on && (
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 480, damping: 22 }}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-white"
          style={{ background: color }}
        >
          <Check size={14} strokeWidth={3.2} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function Dots({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Step ${i + 1}`}
          disabled={i >= step}
          onClick={() => onJump(i)}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            i === step
              ? "w-8 bg-violet"
              : i < step
                ? "w-2.5 bg-lime hover:scale-125"
                : "w-2.5 bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

function RoleCard({
  emoji,
  title,
  desc,
  selected,
  accent,
  glow,
  onClick,
}: {
  emoji: string;
  title: string;
  desc: string;
  selected: boolean;
  accent: string;
  glow: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={item}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="card relative flex h-full flex-col items-start gap-3 p-6 text-left transition-[border-color,box-shadow] duration-200"
      style={selected ? { borderColor: accent, boxShadow: glow } : undefined}
    >
      <span className="text-4xl">{emoji}</span>
      <span className="headline text-xl leading-tight">{title}</span>
      <span className="text-sm leading-relaxed text-muted">{desc}</span>
      <CheckBadge on={selected} color={accent} />
    </motion.button>
  );
}

function LangChip({
  lang,
  selected,
  accent = "violet",
  onClick,
}: {
  lang: Language;
  selected: boolean;
  accent?: "violet" | "orange";
  onClick: () => void;
}) {
  const on =
    accent === "orange"
      ? "border-transparent bg-orange text-canvas"
      : "border-transparent bg-violet text-white";
  return (
    <motion.button
      type="button"
      variants={item}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`pill border px-4 py-2.5 text-sm font-semibold ${
        selected ? on : "border-line bg-white/5 text-ink hover:bg-white/10"
      }`}
      style={
        selected
          ? { boxShadow: accent === "orange" ? "var(--shadow-glow-orange)" : "var(--shadow-glow-violet)" }
          : undefined
      }
    >
      <span className="text-lg leading-none">{lang.flag}</span>
      {lang.nativeName}
      {selected && <Check size={14} strokeWidth={3} />}
    </motion.button>
  );
}

function TargetCard({
  lang,
  selected,
  full,
  fullLabel,
  onClick,
}: {
  lang: Language;
  selected: boolean;
  full: boolean;
  fullLabel: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={item}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="card relative flex flex-col items-center gap-1.5 px-3 py-5 transition-[border-color,box-shadow] duration-200"
      style={selected ? { borderColor: "var(--color-violet)", boxShadow: "var(--shadow-glow-violet)" } : undefined}
    >
      <span className="text-4xl">{lang.flag}</span>
      <span className="headline text-lg leading-none">{lang.nativeName}</span>
      <span className="text-xs text-muted">{lang.name}</span>
      {full && (
        <span className="mt-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-lime">
          {fullLabel}
        </span>
      )}
      <CheckBadge on={selected} />
    </motion.button>
  );
}

function Toggle({
  on,
  onClick,
  label = "Immersion mode",
  knob = "🌱",
}: {
  on: boolean;
  onClick: () => void;
  label?: string;
  knob?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-9 w-[60px] shrink-0 rounded-full transition-colors duration-300 ${
        on ? "bg-lime" : "bg-white/12"
      }`}
      style={on ? { boxShadow: "0 0 28px -6px rgba(184,240,60,0.7)" } : undefined}
    >
      <span
        className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-xs transition-transform duration-300 ${
          on ? "translate-x-[24px]" : ""
        }`}
      >
        {on ? knob : ""}
      </span>
    </button>
  );
}

function MotivationCard({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={item}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="card relative flex flex-col items-start gap-2 p-5 text-left transition-[border-color,box-shadow] duration-200"
      style={
        selected
          ? { borderColor: "var(--color-violet)", boxShadow: "var(--shadow-glow-violet)" }
          : undefined
      }
    >
      <span className="text-3xl">{emoji}</span>
      <span className="headline text-lg leading-tight">{label}</span>
      <CheckBadge on={selected} />
    </motion.button>
  );
}

function InterestChip({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={item}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`pill border px-4 py-2.5 text-sm font-semibold ${
        selected
          ? "border-transparent bg-lime text-canvas"
          : "border-line bg-white/5 text-ink hover:bg-white/10"
      }`}
      style={selected ? { boxShadow: "0 0 28px -8px rgba(184,240,60,0.6)" } : undefined}
    >
      <span className="text-lg leading-none">{emoji}</span>
      {label}
      {selected && <Check size={14} strokeWidth={3} />}
    </motion.button>
  );
}

function PaceRow({
  minutes,
  emoji,
  identity,
  minLabel,
  perDay,
  selected,
  onClick,
}: {
  minutes: number;
  emoji: string;
  identity: string;
  minLabel: string;
  perDay: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={item}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="card flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-[border-color,box-shadow] duration-200"
      style={
        selected
          ? { borderColor: "var(--color-lime)", boxShadow: "0 0 40px -10px rgba(184,240,60,0.5)" }
          : undefined
      }
    >
      <span className="flex items-center gap-3.5">
        <span className="text-2xl">{emoji}</span>
        <span className="font-semibold">
          {minutes} {minLabel} <span className="font-normal text-muted">{perDay}</span>
        </span>
      </span>
      <span className="headline text-xl text-lime">{identity}</span>
    </motion.button>
  );
}

function PlaceInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-widest text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={40}
        className="mt-2 w-full rounded-xl border border-line bg-white/5 px-4 py-3 text-ink caret-violet outline-none transition-colors placeholder:text-white/20 focus:border-violet"
      />
    </label>
  );
}

function ToolkitCard({ visual, title, desc }: { visual: ReactNode; title: string; desc: string }) {
  return (
    <motion.div variants={item} className="card flex items-center gap-5 p-5">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center">{visual}</div>
      <div>
        <p className="headline text-lg">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{desc}</p>
      </div>
    </motion.div>
  );
}

/** Tiny stacked picture-card fan for the toolkit preview. */
function DeckVisual() {
  return (
    <div className="relative h-14 w-14">
      <span className="absolute inset-0 flex -rotate-12 items-center justify-center rounded-xl border border-line bg-violet/25 text-xl">
        🍎
      </span>
      <span className="absolute inset-0 flex rotate-2 translate-x-1 items-center justify-center rounded-xl border border-line bg-lime/20 text-xl">
        🐈
      </span>
      <span className="absolute inset-0 flex rotate-12 translate-x-2 items-center justify-center rounded-xl border border-line bg-orange/25 text-xl">
        🏠
      </span>
    </div>
  );
}

/** 30-minute meeting-timer ring. */
function TimerVisual() {
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14">
      <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
      <circle
        cx="40"
        cy="40"
        r="33"
        fill="none"
        stroke="var(--color-orange)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="156 52"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="46" textAnchor="middle" fill="var(--color-ink)" fontSize="17" fontWeight="800">
        30′
      </text>
    </svg>
  );
}

/** Mini session-plan sheet. */
function PlanVisual() {
  return (
    <div className="flex h-14 w-12 flex-col justify-center gap-1.5 rounded-xl border border-line bg-raised-2 px-2">
      <span className="h-1.5 w-7 rounded-full bg-violet" />
      <span className="h-1.5 w-8 rounded-full bg-white/20" />
      <span className="h-1.5 w-5 rounded-full bg-white/20" />
      <span className="h-1.5 w-7 rounded-full bg-lime/60" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Placement — "show us your roots"                                     */
/* ------------------------------------------------------------------ */

/**
 * An honest, comprehension-only placement: hear the host language, point
 * at pictures. No reading, no translating, no typing — it cannot be
 * faked. Gate 1 earns a Phase 2 start; Gate 2 a Phase 3 start (the cap —
 * deeper phases must be lived, not tested into). One replay per round:
 * GPA always allows "again", but a placement pressure-tests the iceberg.
 * Skippable at every point; the default is always Phase 1.
 */
function PlacementPanel({
  lang,
  t,
  onDone,
}: {
  lang: LangCode;
  t: (key: string) => string;
  /** earned phase + whether this sitting counts as a real attempt */
  onDone: (earned: PhaseId, attempted: boolean) => void;
}) {
  const target = langByCode(lang);

  const [stage, setStage] = useState<"intro" | "playing" | "bridge" | "result">("intro");
  const [gate, setGate] = useState<PlacementGate | null>(null);
  const [roundIx, setRoundIx] = useState(0);
  const [perRound, setPerRound] = useState<RoundResult[]>([]);
  const [replays, setReplays] = useState(0);
  const [heard, setHeard] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [firstPick, setFirstPick] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [earned, setEarned] = useState<PhaseId>(1);
  const [results, setResults] = useState<GateResult[]>([]);

  const round = gate?.rounds[roundIx] ?? null;
  const isChain = round !== null && round.answer.length === 2;
  const answered = perRound.length;

  /** Voice the round — one utterance, or a two-step TPR chain in order. */
  const say = useCallback(
    async (r: PlacementRound) => {
      setSpeaking(true);
      for (const part of r.audio) {
        await speak(part, lang, 0.9);
      }
      setSpeaking(false);
      setHeard(true);
    },
    [lang]
  );

  // each round introduces itself by ear — meaning lives in sound, never text
  useEffect(() => {
    if (stage !== "playing" || !gate) return;
    const r = gate.rounds[roundIx];
    if (r) void say(r);
    return stopSpeaking;
  }, [stage, gate, roundIx, say]);

  const startGate = (g: GateId) => {
    setGate(buildGate(lang, g));
    setRoundIx(0);
    setPerRound([]);
    setReplays(0);
    setHeard(false);
    setFirstPick(null);
    setChosen([]);
    setStage("playing");
  };

  const replay = () => {
    if (!round || speaking || replays >= MAX_REPLAYS_PER_ROUND) return;
    setReplays((r) => r + 1);
    void say(round);
  };

  const finishGate = (g: PlacementGate, all: RoundResult[]) => {
    const res = scoreGate(g, all);
    setResults((rs) => [...rs, res]);
    if (res.passed && g.gate === 1) {
      setEarned(2);
      // offer Gate 2 only where native question frames exist —
      // an English frame around a host word would break GPA purity
      setStage(gate2Available(lang) ? "bridge" : "result");
    } else {
      if (res.passed && g.gate === 2) setEarned(3);
      setStage("result");
    }
  };

  const tap = (tileId: string) => {
    if (!gate || !round || !heard || chosen.length > 0) return;
    if (isChain && firstPick === null) {
      setFirstPick(tileId); // step one of a chain — wait for step two
      return;
    }
    const picks = isChain ? [firstPick as string, tileId] : [tileId];
    setChosen(picks);
    const correct =
      picks.length === round.answer.length && picks.every((id, i) => id === round.answer[i]);
    const all: RoundResult[] = [
      ...perRound,
      { index: roundIx, kind: round.kind, correct, replayed: replays > 0 },
    ];
    setPerRound(all);
    // neutral acknowledgement, then onward — never a mid-test verdict
    window.setTimeout(() => {
      setChosen([]);
      setFirstPick(null);
      setReplays(0);
      setHeard(false);
      if (roundIx + 1 < gate.rounds.length) setRoundIx((i) => i + 1);
      else finishGate(gate, all);
    }, 520);
  };

  return (
    <AnimatePresence mode="wait">
      {/* ---------- intro: warm invitation ---------- */}
      {stage === "intro" && (
        <motion.section key="pl-intro" custom={1} variants={stepVariants} initial="enter" animate="center" exit="exit">
          <NuriSays mood="think">{t("dshPlRootsNuri")}</NuriSays>
          <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
            {t("dshPlGrownInPre")}<span className="text-violet-soft">{target.nativeName}</span>{t("dshPlGrownInPost")}
          </motion.h1>
          <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
            {t("dshPlIntroBody").replace("{language}", target.name)}
          </motion.p>
          <motion.p variants={item} className="mt-3 max-w-xl text-sm text-muted">
            {t("dshPlOneReplay")}
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => startGate(1)}
              className="pill bg-violet px-7 py-3 font-semibold text-white"
              style={{ boxShadow: "var(--shadow-glow-violet)" }}
            >
              👂 {t("dshPlReadyListen")}
            </button>
            <button
              type="button"
              onClick={() => onDone(1, false)}
              className="pill bg-white/6 px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
            >
              {t("dshPlSkipFresh")}
            </button>
          </motion.div>
        </motion.section>
      )}

      {/* ---------- playing: one round on the floor ---------- */}
      {stage === "playing" && gate && round && (
        <motion.section
          key={`pl-g${gate.gate}-r${roundIx}`}
          custom={1}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <motion.div variants={item} className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              {t("dshPlGate")} {gate.gate} · {gate.gate === 1 ? t("dshPlWordsByEar") : t("dshPlQuestionsByEar")}
            </p>
            <div className="flex items-center gap-1.5">
              {gate.rounds.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i < answered ? "w-2 bg-lime" : i === roundIx ? "w-5 bg-violet" : "w-2 bg-white/15"
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* the voice — replayable once */}
          <motion.div variants={item} className="card mt-6 flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <motion.button
                type="button"
                aria-label="Hear it again"
                whileTap={{ scale: 0.92 }}
                disabled={speaking || replays >= MAX_REPLAYS_PER_ROUND}
                onClick={replay}
                className="pill h-14 w-14 shrink-0 bg-violet text-white disabled:opacity-40"
                style={{ boxShadow: "var(--shadow-glow-violet)" }}
              >
                <Volume2 size={22} />
              </motion.button>
              <div>
                <p className="font-semibold">
                  {round.kind === "tpr-chain"
                    ? t("dshPlTwoSteps")
                    : round.kind === "tpr"
                      ? t("dshPlTapAction")
                      : t("dshPlTapPicture")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {speaking
                    ? t("dshPlListening")
                    : replays >= MAX_REPLAYS_PER_ROUND
                      ? t("dshPlNoMoreReplays")
                      : t("dshPlOneReplayIfNeed")}
                </p>
              </div>
            </div>
            <span className="text-3xl">{target.flag}</span>
          </motion.div>

          {/* picture tiles — the image is the meaning */}
          <motion.div
            variants={grid}
            className={`mt-6 grid gap-3 ${round.tiles.length > 4 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}
          >
            {round.tiles.map((tile) => {
              const order =
                firstPick === tile.id || chosen[0] === tile.id ? 1 : chosen[1] === tile.id ? 2 : null;
              return (
                <motion.button
                  key={tile.id}
                  type="button"
                  variants={item}
                  whileHover={heard ? { y: -4 } : undefined}
                  whileTap={heard ? { scale: 0.95 } : undefined}
                  disabled={!heard || chosen.length > 0}
                  onClick={() => tap(tile.id)}
                  className={`card relative flex items-center justify-center py-8 text-5xl transition-[border-color,box-shadow,opacity] duration-200 ${
                    heard ? "" : "opacity-60"
                  }`}
                  style={
                    order !== null
                      ? { borderColor: "var(--color-violet)", boxShadow: "var(--shadow-glow-violet)" }
                      : undefined
                  }
                >
                  {tile.emoji}
                  {isChain && order !== null && (
                    <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-violet text-xs font-bold text-white">
                      {order}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          <motion.div variants={item} className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={() => onDone(earned, earned > 1)}
              className="text-xs font-semibold text-muted transition-colors hover:text-ink"
            >
              {earned > 1
                ? t("dshPlStopKeep").replace("{phase}", String(earned))
                : t("dshPlStopPhase1")}
            </button>
          </motion.div>
        </motion.section>
      )}

      {/* ---------- bridge: Phase 2 earned, Gate 2 offered ---------- */}
      {stage === "bridge" && (
        <motion.section key="pl-bridge" custom={1} variants={stepVariants} initial="enter" animate="center" exit="exit">
          <NuriSays mood="cheer">{t("dshPlBridgeNuri")}</NuriSays>
          <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
            {t("dshPlBridgeHeadPre")}<span className="text-orange">{t("dshPlBridgeHeadPhase")}</span>
          </motion.h1>
          <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
            {t("dshPlBridgeBody")
              .replace("{correct}", String(results[0]?.correct ?? 0))
              .replace("{total}", String(results[0]?.total ?? 0))}
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => startGate(2)}
              className="pill bg-violet px-7 py-3 font-semibold text-white"
              style={{ boxShadow: "var(--shadow-glow-violet)" }}
            >
              🪴 {t("dshPlTryGate2")}
            </button>
            <button
              type="button"
              onClick={() => onDone(2, true)}
              className="pill bg-lime px-6 py-3 text-sm font-bold text-canvas"
            >
              {t("dshPlStartPhase2")} 🌿
            </button>
          </motion.div>
        </motion.section>
      )}

      {/* ---------- result: honest, never shaming ---------- */}
      {stage === "result" && (
        <motion.section key="pl-result" custom={1} variants={stepVariants} initial="enter" animate="center" exit="exit">
          {earned > 1 ? (
            <>
              <NuriSays mood="cheer">{t("dshPlResultProven")}</NuriSays>
              <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                {t("dshPlIcebergStartsAt")}{" "}
                <span className="text-lime">
                  {t("phaseWord")} {earned} {phaseById(earned).emoji}
                </span>
              </motion.h1>
              <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
                {phaseById(earned).name} — {phaseById(earned).tagline.toLowerCase()}.{" "}
                {t("dshPlGardenOpens").replace("{hour}", String(phaseById(earned).startHour))}
              </motion.p>
            </>
          ) : (
            <>
              <NuriSays mood="happy">{t("dshPlPhase1Deepest")}</NuriSays>
              <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                {t("dshPlGrowFromHello")} 🌱
              </motion.h1>
              <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
                {t("dshPlWordsWashed")}
              </motion.p>
            </>
          )}

          {/* honest readout — performance, not self-report */}
          <motion.div variants={item} className="mt-6 grid gap-2">
            {results.map((r) => (
              <div key={r.gate} className="card flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                <span className="font-semibold">
                  {t("dshPlGate")} {r.gate} · {r.gate === 1 ? t("dshPlWordsByEar") : t("dshPlQuestionsByEar")}
                </span>
                <span className={r.passed ? "font-bold text-lime" : "text-muted"}>
                  {r.correct} / {r.total} · {r.pct}%{r.passed ? ` · ${t("dshPlPassed")}` : ""}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-8">
            <button
              type="button"
              onClick={() => onDone(earned, true)}
              className="pill bg-lime px-8 py-3 font-bold text-canvas"
              style={{ boxShadow: "0 0 50px -12px rgba(184,240,60,0.55)" }}
            >
              {earned > 1
                ? `${t("dshPlContinueAs").replace("{phase}", String(earned))} ${phaseById(earned).emoji}`
                : `${t("dshPlContinueDeepest")} 🌱`}
            </button>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* The flow                                                             */
/* ------------------------------------------------------------------ */

function OnboardingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile, ready, t, saveProfile, resetAll } = useApp();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [role, setRole] = useState<Role | null>(() => {
    const r = params.get("role");
    return r === "grower" || r === "nurturer" || r === "both" ? r : null;
  });
  const [knownLangs, setKnownLangs] = useState<LangCode[]>(["en"]);
  const [targetLang, setTargetLang] = useState<LangCode | null>(null);
  const [nurtureLangs, setNurtureLangs] = useState<LangCode[]>([]);
  const [name, setName] = useState("");
  const [immersion, setImmersion] = useState(true);

  // placement — an earned start, never a claimed one (default Phase 1)
  const [placementOpen, setPlacementOpen] = useState(false);
  const [placedPhase, setPlacedPhase] = useState<PhaseId>(1);
  const [placementTried, setPlacementTried] = useState(false);

  // the invitation steps — every one of these may stay empty
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [motivation, setMotivation] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);
  const [exchange, setExchange] = useState(false);

  const nurturerOnly = role === "nurturer";
  const trimmed = name.trim();
  const target = targetLang ? langByCode(targetLang) : null;

  /** Current invitation step left blank — the CTA turns into an honest "Skip for now". */
  const inviteStepEmpty =
    (step === 3 && city.trim() === "" && country.trim() === "") ||
    (step === 4 && motivation === null) ||
    (step === 5 && interests.length === 0) ||
    (step === 6 && dailyMinutes === null);

  const valid = useMemo(() => {
    switch (step) {
      case 0:
        return role !== null;
      case 1:
        return knownLangs.length > 0;
      case 2:
        return nurturerOnly ? nurtureLangs.length > 0 : targetLang !== null;
      case 7:
        return trimmed.length > 0;
      default:
        // steps 3–6 are invitations — always passable, never blocking
        return true;
    }
  }, [step, role, knownLangs, nurturerOnly, nurtureLangs, targetLang, trimmed]);

  const next = () => {
    if (!valid || step >= STEP_COUNT - 1) return;
    setDir(1);
    setStep((s) => s + 1);
  };
  const back = () => {
    if (step === 0) return;
    setDir(-1);
    setStep((s) => s - 1);
  };
  const jump = (i: number) => {
    if (i >= step) return;
    setDir(-1);
    setStep(i);
  };

  /** A placement belongs to one language — changing worlds clears it. */
  const clearPlacement = () => {
    setPlacedPhase(1);
    setPlacementTried(false);
  };

  const toggleKnown = (code: LangCode) => {
    const nextKnown = knownLangs.includes(code)
      ? knownLangs.filter((c) => c !== code)
      : [...knownLangs, code];
    setKnownLangs(nextKnown);
    // keep dependent picks consistent
    setNurtureLangs((nl) => nl.filter((c) => nextKnown.includes(c)));
    if (targetLang !== null && nextKnown.includes(targetLang)) {
      setTargetLang(null);
      clearPlacement();
    }
  };

  const pickTarget = (code: LangCode) => {
    if (code !== targetLang) clearPlacement();
    setTargetLang(code);
  };

  const toggleNurture = (code: LangCode) =>
    setNurtureLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const toggleInterest = (id: string) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const finish = () => {
    if (!role || trimmed.length === 0) return;
    const nurture = nurturerOnly ? nurtureLangs : role === "both" ? knownLangs : [];
    const finalTarget: LangCode = nurturerOnly
      ? (nurture[0] ?? knownLangs[0] ?? "en")
      : (targetLang ?? "es");
    const out: Profile = {
      ...blankProfile(), // keeps phase 1 + demo defaults (12 h, 138 words, 5-day streak)
      name: trimmed,
      role,
      knownLangs: knownLangs.length > 0 ? knownLangs : ["en"],
      targetLang: finalTarget,
      nurtureLangs: nurture,
      immersion: nurturerOnly ? false : immersion,
      // invitation answers — saved only when given
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      motivation: motivation ?? undefined,
      interests,
      dailyMinutes: dailyMinutes ?? undefined,
      exchange,
      // an earned placement seeds phase, hours and words honestly;
      // without one, the Phase 1 defaults above stand untouched
      ...(!nurturerOnly && placedPhase > 1 ? placementSeed(placedPhase) : null),
    };
    saveProfile(out);
    router.replace("/dashboard");
  };

  /* ---------- name preview line ---------- */
  const preview: ReactNode =
    trimmed.length === 0 ? null : nurturerOnly ? (
      <>
        <span className="font-semibold text-ink">{trimmed}</span> — {t("dshOnbPreviewNurturing")}{" "}
        <span className="font-semibold text-orange">
          {nurtureLangs.map((c) => langByCode(c).nativeName).join(" · ") || "…"}
        </span>{" "}
        🤝
      </>
    ) : (
      <>
        <span className="font-semibold text-ink">{trimmed}</span> — {t("dshOnbPreviewGrowingInto")}{" "}
        <span className="font-semibold text-violet-soft">{target?.nativeName ?? "…"}</span>{" "}
        {target?.flag}
        {role === "both" && <> · {t("dshOnbPreviewBothSide")} 🤝</>} 🌱
      </>
    );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ambient orbs */}
      <div className="orb h-[420px] w-[420px] bg-violet/20" style={{ top: -140, left: -140 }} />
      <div className="orb h-[360px] w-[360px] bg-orange/12" style={{ bottom: -110, right: -90 }} />
      <div className="orb h-[260px] w-[260px] bg-lime/8" style={{ top: "42%", right: -100 }} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-7 sm:px-6">
        {/* header: logo · dots · counter */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-4"
        >
          <Logo size="sm" />
          <Dots step={step} onJump={jump} />
          <span className="w-[72px] text-right text-xs font-medium text-muted">
            {step + 1} / {STEP_COUNT}
          </span>
        </motion.header>

        {/* returning-user banner */}
        {ready && profile && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          >
            <p className="text-sm font-medium">{t("dshOnbGardenGrowing")} 🌱</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="pill bg-lime px-4 py-2 text-xs font-bold text-canvas"
              >
                {t("continue")} →
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="pill bg-white/8 px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
              >
                {t("dshOnbStartOver")}
              </button>
            </div>
          </motion.div>
        )}

        <main className="flex flex-1 flex-col justify-center py-10">
          {/* placement replaces the steps while it runs — never a gate, always escapable */}
          {placementOpen && target ? (
            <PlacementPanel
              lang={target.code}
              t={t}
              onDone={(earnedPhase, attempted) => {
                setPlacementOpen(false);
                if (attempted) {
                  setPlacedPhase(earnedPhase);
                  setPlacementTried(true);
                }
              }}
            />
          ) : (
            <>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.section
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* ============ 0 · welcome + role ============ */}
              {step === 0 && (
                <>
                  <motion.div variants={item} className="flex justify-center">
                    <Mascot size={148} mood="wave" />
                  </motion.div>
                  <motion.h1
                    variants={item}
                    className="headline mt-2 text-center text-4xl sm:text-5xl"
                  >
                    {t("dshOnbImNuri")} 👋
                  </motion.h1>
                  <motion.p
                    variants={item}
                    className="mx-auto mt-4 max-w-md text-center leading-relaxed text-muted"
                  >
                    {t("dshOnbTaglinePre")}{" "}
                    <span className="font-semibold text-lime">{t("dshOnbZeroTranslation")}</span>{t("dshOnbTaglinePost")}
                  </motion.p>

                  <div className="mt-9 grid gap-3 sm:grid-cols-2">
                    <RoleCard
                      emoji="🌱"
                      title={t("dshOnbRoleGrowerTitle")}
                      desc={t("dshOnbRoleGrowerDesc")}
                      selected={role === "grower"}
                      accent="var(--color-violet)"
                      glow="var(--shadow-glow-violet)"
                      onClick={() => setRole("grower")}
                    />
                    <RoleCard
                      emoji="🤝"
                      title={t("dshOnbRoleNurturerTitle")}
                      desc={t("dshOnbRoleNurturerDesc")}
                      selected={role === "nurturer"}
                      accent="var(--color-orange)"
                      glow="var(--shadow-glow-orange)"
                      onClick={() => setRole("nurturer")}
                    />
                  </div>

                  <motion.div variants={item} className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setRole("both")}
                      className={`pill border px-5 py-2.5 text-sm font-semibold transition-colors ${
                        role === "both"
                          ? "border-lime bg-lime/15 text-lime"
                          : "border-line bg-white/4 text-muted hover:text-ink"
                      }`}
                    >
                      🌱🤝 {t("dshOnbBothPlease")}
                      {role === "both" && <Check size={14} strokeWidth={3} />}
                    </button>
                  </motion.div>
                </>
              )}

              {/* ============ 1 · known languages ============ */}
              {step === 1 && (
                <>
                  <NuriSays mood="happy">{t("dshOnbRootsFeed")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbKnownHead")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {t("dshOnbKnownSub")}
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 flex flex-wrap gap-2.5">
                    {LANGUAGES.map((l) => (
                      <LangChip
                        key={l.code}
                        lang={l}
                        selected={knownLangs.includes(l.code)}
                        onClick={() => toggleKnown(l.code)}
                      />
                    ))}
                  </motion.div>
                </>
              )}

              {/* ============ 2 · target world / nurture langs ============ */}
              {step === 2 && !nurturerOnly && (
                <>
                  <NuriSays mood="think">{t("dshOnbPickWorldNuri")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbTargetHead")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {t("dshOnbTargetSub")}
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {LANGUAGES.filter((l) => !knownLangs.includes(l.code)).map((l) => (
                      <TargetCard
                        key={l.code}
                        lang={l}
                        selected={targetLang === l.code}
                        full={FULL_CONTENT_LANGS.includes(l.code)}
                        fullLabel={t("dshOnbFullImmersion")}
                        onClick={() => pickTarget(l.code)}
                      />
                    ))}
                  </motion.div>

                  {/* low-key placement invitation — earned starts, never claimed */}
                  <AnimatePresence>
                    {target && placementAvailable(target.code) && (
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className="card mt-6 flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                      >
                        {placementTried ? (
                          <p className="text-sm font-medium">
                            {placedPhase > 1 ? (
                              <>
                                🧊 {t("dshPlIcebergStartsAt")}{" "}
                                <span className="font-bold text-lime">
                                  {t("phaseWord")} {placedPhase} {phaseById(placedPhase).emoji}
                                </span>
                              </>
                            ) : (
                              <>🌱 {t("dshOnbPhase1Deepest")}</>
                            )}
                          </p>
                        ) : (
                          <>
                            <div>
                              <p className="font-semibold">
                                🌳 {t("dshPlGrownInPre")}{target.nativeName}{t("dshPlGrownInPost")}
                              </p>
                              <p className="mt-1 text-sm text-muted">
                                {t("dshOnbShowRootsHint")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPlacementOpen(true)}
                              className="pill border border-line bg-white/5 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/10"
                            >
                              👂 {t("dshOnbShowMyRoots")}
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {step === 2 && nurturerOnly && (
                <>
                  <NuriSays mood="happy">{t("dshOnbNurtureTreasure")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbNurtureHead")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {t("dshOnbNurtureSub")}
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 flex flex-wrap gap-2.5">
                    {knownLangs.map((code) => {
                      const l = langByCode(code);
                      return (
                        <LangChip
                          key={l.code}
                          lang={l}
                          accent="orange"
                          selected={nurtureLangs.includes(l.code)}
                          onClick={() => toggleNurture(l.code)}
                        />
                      );
                    })}
                  </motion.div>
                </>
              )}

              {/* ============ 3 · place (optional) ============ */}
              {step === 3 && (
                <>
                  <NuriSays mood="happy">{t("dshOnbGardenSomewhere")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {nurturerOnly ? t("dshOnbPlaceHeadNurture") : t("dshOnbPlaceHeadGrow")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {nurturerOnly ? t("dshOnbPlaceSubNurture") : t("dshOnbPlaceSubGrow")}
                  </motion.p>
                  <motion.div variants={item} className="card mt-8 grid gap-5 p-6 sm:grid-cols-2">
                    <PlaceInput label={t("dshOnbCityLabel")} value={city} placeholder={t("dshOnbCityPlaceholder")} onChange={setCity} />
                    <PlaceInput
                      label={t("dshOnbCountryLabel")}
                      value={country}
                      placeholder={t("dshOnbCountryPlaceholder")}
                      onChange={setCountry}
                    />
                  </motion.div>
                  <motion.p
                    variants={item}
                    className="mt-4 flex items-center gap-2 text-xs text-muted"
                  >
                    <MapPin size={14} className="shrink-0 text-lime" />
                    {t("dshOnbCityLevelNote")}
                  </motion.p>
                </>
              )}

              {/* ============ 4 · why this language (optional) ============ */}
              {step === 4 && (
                <>
                  <NuriSays mood="think">{t("dshOnbNoWrongReason")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {nurturerOnly || !target ? (
                      <>{t("dshOnbWhyNurture")}</>
                    ) : (
                      <>
                        {t("dshOnbWhyPre")}<span className="text-violet-soft">{target.nativeName}</span>{t("dshOnbWhyPost")}
                      </>
                    )}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {nurturerOnly ? t("dshOnbMotSubNurture") : t("dshOnbMotSubGrow")}
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {MOTIVATIONS.map((m) => (
                      <MotivationCard
                        key={m.id}
                        emoji={m.emoji}
                        label={t(m.labelKey)}
                        selected={motivation === m.id}
                        onClick={() => setMotivation((cur) => (cur === m.id ? null : m.id))}
                      />
                    ))}
                  </motion.div>
                </>
              )}

              {/* ============ 5 · what you love (optional) ============ */}
              {step === 5 && (
                <>
                  <NuriSays mood="happy">{t("dshOnbLoveLives")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbWhatLoveHead")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {t("dshOnbWhatLoveSub")}
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 flex flex-wrap gap-2.5">
                    {INTERESTS.map((i) => (
                      <InterestChip
                        key={i.id}
                        emoji={i.emoji}
                        label={t(i.labelKey)}
                        selected={interests.includes(i.id)}
                        onClick={() => toggleInterest(i.id)}
                      />
                    ))}
                  </motion.div>
                </>
              )}

              {/* ============ 6 · watering rhythm + exchange (optional) ============ */}
              {step === 6 && (
                <>
                  <NuriSays mood="cheer">{t("dshOnbLittleOften")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbWaterHead")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {t("dshOnbWaterSub")}
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 grid gap-3">
                    {PACES.map((p) => (
                      <PaceRow
                        key={p.minutes}
                        minutes={p.minutes}
                        emoji={p.emoji}
                        identity={t(p.identityKey)}
                        minLabel={t("minutes")}
                        perDay={t("dshOnbPerDay")}
                        selected={dailyMinutes === p.minutes}
                        onClick={() =>
                          setDailyMinutes((cur) => (cur === p.minutes ? null : p.minutes))
                        }
                      />
                    ))}
                  </motion.div>
                  <motion.div
                    variants={item}
                    className="card mt-6 flex items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <p className="font-semibold">🤝 {t("wldOpenToExchange")}</p>
                      <p className="mt-1 text-sm text-muted">
                        {t("dshOnbExchangeSub")}
                      </p>
                    </div>
                    <Toggle
                      on={exchange}
                      onClick={() => setExchange((v) => !v)}
                      label={t("wldOpenToExchange")}
                      knob="🤝"
                    />
                  </motion.div>
                </>
              )}

              {/* ============ 7 · name ============ */}
              {step === 7 && (
                <>
                  <NuriSays mood="happy">{t("dshOnbAlmostThere")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbNameHead")}
                  </motion.h1>
                  <motion.div variants={item} className="card mt-8 px-6 py-10">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") next();
                      }}
                      placeholder={t("dshOnbNamePlaceholder")}
                      maxLength={24}
                      autoFocus
                      className="headline w-full bg-transparent text-center text-4xl text-ink caret-violet outline-none placeholder:text-white/15 sm:text-5xl"
                    />
                  </motion.div>
                  <div className="mt-5 min-h-[28px] text-center">
                    <AnimatePresence>
                      {preview && (
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-sm text-muted"
                        >
                          {preview}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* ============ 8 · immersion moment (growers) ============ */}
              {step === 8 && !nurturerOnly && target && (
                <>
                  <NuriSays mood="cheer">{t("dshOnbPicturesExplain")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbLangeSpeaksPre")}{" "}
                    <span className="text-violet-soft">{target.nativeName}</span>{t("dshOnbLangeSpeaksPost")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
                    {t("dshOnbImmersionBody").replace("{flag}", target.flag)}
                  </motion.p>

                  {/* first word — audio only, no translation */}
                  <motion.div
                    variants={item}
                    className="card mt-8 flex items-center justify-between gap-4 p-6"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{target.flag}</span>
                      <div>
                        <p className="headline text-3xl sm:text-4xl">{HELLO[target.code]}</p>
                        <p className="mt-1 text-xs text-muted">{t("dshOnbFirstWordTap")}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Listen"
                      onClick={() => void speak(HELLO[target.code], target.code, 0.9)}
                      className="pill h-12 w-12 bg-violet text-white"
                      style={{ boxShadow: "var(--shadow-glow-violet)" }}
                    >
                      <Volume2 size={20} />
                    </button>
                  </motion.div>

                  {/* immersion toggle */}
                  <motion.div
                    variants={item}
                    className="card mt-3 flex items-center justify-between gap-4 p-6"
                  >
                    <div>
                      <p className="flex items-center gap-2 font-semibold">
                        <Sparkles size={16} className="text-lime" /> {t("dshOnbImmersionMode")}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {immersion
                          ? t("dshOnbImmersionOnLine").replace("{language}", target.nativeName)
                          : t("dshOnbImmersionOffLine")}
                      </p>
                    </div>
                    <Toggle on={immersion} onClick={() => setImmersion((v) => !v)} />
                  </motion.div>

                  {role === "both" && (
                    <motion.p variants={item} className="mt-4 text-center text-xs text-muted">
                      {t("dshOnbToolkitWaiting")} 🤝
                    </motion.p>
                  )}
                </>
              )}

              {/* ============ 8 · nurturer toolkit ============ */}
              {step === 8 && nurturerOnly && (
                <>
                  <NuriSays mood="cheer">{t("dshOnbInYourPocket")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbToolkitHead")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
                    {t("dshOnbToolkitBody")}
                  </motion.p>
                  <div className="mt-8 grid gap-3">
                    <ToolkitCard
                      visual={<DeckVisual />}
                      title={t("dshOnbToolDecksTitle")}
                      desc={t("dshOnbToolDecksDesc")}
                    />
                    <ToolkitCard
                      visual={<PlanVisual />}
                      title={t("dshOnbToolPlansTitle")}
                      desc={t("dshOnbToolPlansDesc")}
                    />
                    <ToolkitCard
                      visual={<TimerVisual />}
                      title={t("dshOnbToolTimerTitle")}
                      desc={t("dshOnbToolTimerDesc")}
                    />
                  </div>
                </>
              )}
            </motion.section>
          </AnimatePresence>

          {/* footer controls */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-12 flex items-center justify-between gap-4"
          >
            <button
              type="button"
              onClick={back}
              className={`pill bg-white/6 px-6 py-3 text-sm font-semibold text-muted hover:text-ink ${
                step === 0 ? "invisible" : ""
              }`}
            >
              <ArrowLeft size={16} /> {t("back")}
            </button>

            {step < STEP_COUNT - 1 ? (
              <button
                type="button"
                disabled={!valid}
                onClick={next}
                className="pill bg-violet px-8 py-3 font-semibold text-white disabled:pointer-events-none disabled:opacity-35"
                style={valid ? { boxShadow: "var(--shadow-glow-violet)" } : undefined}
              >
                {step === 6 && dailyMinutes !== null ? (
                  <>{nurturerOnly ? `${t("dshOnbImNurturing")} 🤝` : `${t("dshOnbImGrowing")} 🌱`}</>
                ) : inviteStepEmpty ? (
                  <>{t("dshOnbSkipForNow")}</>
                ) : (
                  <>{t("continue")}</>
                )}{" "}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!valid}
                onClick={finish}
                className="pill bg-lime px-8 py-3 font-bold text-canvas disabled:pointer-events-none disabled:opacity-35"
                style={{ boxShadow: "0 0 50px -12px rgba(184,240,60,0.55)" }}
              >
                {nurturerOnly ? `${t("dshOnbOpenToolkit")} 🤝` : `${t("dshOnbStartGrowing")} 🌱`}
              </button>
            )}
          </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page — useSearchParams requires a Suspense boundary                  */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      }
    >
      <OnboardingFlow />
    </Suspense>
  );
}
