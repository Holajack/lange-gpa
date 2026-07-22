"use client";

/**
 * Onboarding — a warm conversation with Nuri.
 *
 * 0  Welcome + role choice (grower / nurturer / both, ?role= preselects)
 * 1  Known languages (multi-select, English preselected)
 * 2  Target world (grower/both) — or nurture languages (nurturer-only)
 * 3  Where you're growing from (city + country, optional, city-level privacy)
 * 4  Why this language (multi-select motivation, optional)
 * 5  What you love (multi-select interests, optional)
 * 6  Daily watering rhythm + language-exchange toggle (optional, pledge CTA)
 * 7  Name + live preview
 * 8  Immersion moment (growers) / nurturer toolkit — then plant the profile
 *
 * Steps 3–6 are invitations, never gates: they can be skipped without
 * blocking completion (GPA is invitation, not interrogation).
 */

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, MapPin, Sparkles, Volume2 } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { Logo } from "@/components/Logo";
import { PlacementCheck } from "@/components/PlacementCheck";
import { CONVEX_ON } from "@/lib/convexClient";
import { COMMUNITY_EXCHANGE_ON, NURTURER_STUDIO_ON } from "@/lib/featureFlags";
import { blankProfile, switchLanguageJourney, useApp } from "@/lib/store";
import { FULL_CONTENT_LANGS, LANGUAGES, langByCode } from "@/lib/languages";
import { placementAvailable, placementSeed } from "@/lib/placement";
import { POPULATED_MEETINGS } from "@/lib/sessionFlow";
import { speak } from "@/lib/tts";
import type { LangCode, Language, PhaseId, Profile, Role } from "@/lib/types";
import { INTERESTS, MOTIVATIONS, PACES } from "@/lib/onboardingOptions";

const STEP_COUNT = 9;

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
  vi: "Xin chào!",
  id: "Halo!",
  pl: "Cześć!",
  th: "สวัสดี",
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
  const { t } = useApp();
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={t("onb2StepN").replace("{n}", String(i + 1))}
          disabled={i >= step}
          onClick={() => onJump(i)}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            i === step
              ? "w-6 bg-violet sm:w-8"
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
      aria-pressed={selected}
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
      aria-pressed={selected}
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
      aria-pressed={selected}
      className="card relative flex flex-col items-center gap-1.5 px-3 py-5 text-center transition-[border-color,box-shadow] duration-200"
      style={selected ? { borderColor: "var(--color-violet)", boxShadow: "var(--shadow-glow-violet)" } : undefined}
    >
      <span className="text-4xl">{lang.flag}</span>
      <span className="headline break-words text-lg leading-none">{lang.nativeName}</span>
      <span className="text-xs text-muted">{lang.name}</span>
      {full && (
        <span className="mt-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-normal text-lime">
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
  label,
  knob = "🌱",
}: {
  on: boolean;
  onClick: () => void;
  label?: string;
  knob?: string;
}) {
  const { t } = useApp();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ?? t("onb2ImmersionMode")}
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
      aria-pressed={selected}
      className="card relative flex flex-col items-start gap-2 p-4 text-left transition-[border-color,box-shadow] duration-200 sm:p-5"
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
      aria-pressed={selected}
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
  mainLabel,
  emoji,
  identity,
  perDay,
  badge,
  selected,
  onClick,
}: {
  mainLabel: string;
  emoji: string;
  identity: string;
  perDay: string;
  /** small flourish, e.g. "Go all in" on the 2-hour rhythm */
  badge?: string;
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
      aria-pressed={selected}
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
          {mainLabel} <span className="font-normal text-muted">{perDay}</span>
          {badge && (
            <span className="ml-2 inline-block rounded-full bg-lime/15 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-lime">
              {badge}
            </span>
          )}
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
/* The flow                                                             */
/* ------------------------------------------------------------------ */

function OnboardingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const addingLanguage = params.get("addLanguage") === "1";
  const { profile, ready, cloudState, t, saveProfile } = useApp();
  const accountReady = ready && (!CONVEX_ON || cloudState === "ready");

  const [step, setStep] = useState(() => (addingLanguage ? 2 : 0));
  const [dir, setDir] = useState(1);

  const [role, setRole] = useState<Role | null>(() => {
    const r = params.get("role");
    if (r === "grower") return r;
    return NURTURER_STUDIO_ON && (r === "nurturer" || r === "both") ? r : null;
  });
  const [knownLangs, setKnownLangs] = useState<LangCode[]>(["en"]);
  const [targetLang, setTargetLang] = useState<LangCode | null>(null);

  // optional placement check — an EARNED Phase 2/3 start held in local state
  // (like every other onboarding answer) until finish() applies the seed
  const [placedPhase, setPlacedPhase] = useState<PhaseId | null>(null);
  const [placementOpen, setPlacementOpen] = useState(false);

  // Welcome the world in its own language: preselect the visitor's known
  // language from the browser so a non-English speaker starts at home.
  const browserDetected = useRef(false);
  useEffect(() => {
    if (browserDetected.current) return;
    browserDetected.current = true;
    const codes = (typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : []) as string[];
    const known = new Set(LANGUAGES.map((l) => l.code));
    const hit = codes
      .map((c) => c.slice(0, 2).toLowerCase() as LangCode)
      .find((c) => known.has(c) && c !== "en");
    if (hit) setKnownLangs([hit]);
  }, []);
  const [nurtureLangs, setNurtureLangs] = useState<LangCode[]>([]);
  const [name, setName] = useState("");
  const [immersion, setImmersion] = useState(false);

  // the invitation steps — every one of these may stay empty
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [motivation, setMotivation] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);
  const [exchange, setExchange] = useState(false);

  // Editing an existing account? Pre-fill the wizard from the profile so the
  // avatar → onboarding is a real edit, not a blank restart. Fires once when
  // the profile first loads; never runs for brand-new growers (no profile).
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !accountReady || !profile) return;
    prefilled.current = true;
    setRole(profile.role);
    if (profile.knownLangs?.length) setKnownLangs(profile.knownLangs);
    // Adding a language must be an explicit new enrollment, never an
    // accidental re-save of the currently active journey.
    setTargetLang(addingLanguage ? null : profile.targetLang ?? null);
    setNurtureLangs(profile.nurtureLangs ?? []);
    setName(profile.name ?? "");
    setImmersion(profile.immersion ?? false);
    setCity(profile.city ?? "");
    setCountry(profile.country ?? "");
    // back-compat: older accounts stored a single motivation string
    const savedMot = profile.motivation as unknown;
    setMotivation(
      Array.isArray(savedMot) ? (savedMot as string[]) : typeof savedMot === "string" && savedMot ? [savedMot] : []
    );
    setInterests(profile.interests ?? []);
    setDailyMinutes(profile.dailyMinutes ?? null);
    setExchange(profile.exchange ?? false);
  }, [accountReady, addingLanguage, profile]);

  const nurturerOnly = role === "nurturer";
  const trimmed = name.trim();
  const target = targetLang ? langByCode(targetLang) : null;

  // Placement is for FRESH journeys only — a test-out must never overwrite
  // real logged progress on a language this account is already growing.
  const placementOffered =
    targetLang !== null &&
    placementAvailable(targetLang) &&
    !(
      profile &&
      (profile.journeys?.some(
        (journey) => journey.lang === targetLang && (journey.hoursLogged > 0 || journey.phase > 1)
      ) ||
        (profile.targetLang === targetLang && (profile.hoursLogged > 0 || profile.phase > 1)))
    );

  /** Current invitation step left blank — the CTA turns into an honest "Skip for now". */
  const inviteStepEmpty =
    (step === 3 && city.trim() === "" && country.trim() === "") ||
    (step === 4 && motivation.length === 0) ||
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

  const toggleKnown = (code: LangCode) => {
    const nextKnown = knownLangs.includes(code)
      ? knownLangs.filter((c) => c !== code)
      : [...knownLangs, code];
    setKnownLangs(nextKnown);
    // keep dependent picks consistent
    setNurtureLangs((nl) => nl.filter((c) => nextKnown.includes(c)));
    if (targetLang !== null && nextKnown.includes(targetLang)) {
      setTargetLang(null);
    }
  };

  const pickTarget = (code: LangCode) => {
    // a different world means any earned placement no longer applies
    if (code !== targetLang) setPlacedPhase(null);
    setTargetLang(code);
  };

  const toggleNurture = (code: LangCode) =>
    setNurtureLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const toggleInterest = (id: string) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleMotivation = (id: string) =>
    setMotivation((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const finish = () => {
    if (!role || trimmed.length === 0) return;
    const nurture = nurturerOnly ? nurtureLangs : role === "both" ? knownLangs : [];
    const finalTarget: LangCode = nurturerOnly
      ? (nurture[0] ?? knownLangs[0] ?? "en")
      : (targetLang ?? "es");
    const progressBase = profile ? switchLanguageJourney(profile, finalTarget) : blankProfile();
    // An earned placement seeds phase/hours/words for this journey, and parks
    // meetingProgress at the last populated Phase-1 meeting so the session
    // room doesn't drag a placed-ahead grower back to meeting 1 — it serves
    // them review sessions until new meetings are populated. Skipping or
    // failing leaves everything exactly as today (Phase 1, meeting 1).
    const seeded =
      placedPhase !== null && !nurturerOnly
        ? {
            ...progressBase,
            ...placementSeed(placedPhase),
            meetingProgress: POPULATED_MEETINGS[POPULATED_MEETINGS.length - 1],
          }
        : progressBase;
    const out: Profile = {
      // Editing an existing account keeps all progress (hours, words,
      // completed, bookings, week, createdAt); a brand-new grower starts fresh.
      ...seeded,
      name: trimmed,
      role,
      knownLangs: knownLangs.length > 0 ? knownLangs : ["en"],
      targetLang: finalTarget,
      nurtureLangs: nurture,
      immersion: nurturerOnly ? false : immersion,
      // invitation answers — saved only when given
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      motivation: motivation.length ? motivation : undefined,
      interests,
      dailyMinutes: dailyMinutes ?? undefined,
      exchange: COMMUNITY_EXCHANGE_ON ? exchange : false,
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

  if (!accountReady) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading your profile">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      </div>
    );
  }

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
          {addingLanguage ? (
            <span className="headline text-sm">{t("prfAddLanguage")}</span>
          ) : (
            <Dots step={step} onJump={jump} />
          )}
          <span className="hidden w-[72px] text-right text-xs font-medium text-muted sm:block">
            {addingLanguage ? "" : `${step + 1} / ${STEP_COUNT}`}
          </span>
        </motion.header>

        {/* returning-user banner */}
        {accountReady && profile && !addingLanguage && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          >
            <p className="text-sm font-medium">{t("dshOnbGardenGrowing")} 🌱</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="pill bg-lime px-4 py-2 text-xs font-bold text-canvas"
            >
              {t("continue")} →
            </button>
          </motion.div>
        )}

        <main className="flex flex-1 flex-col justify-center py-10">
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

                  <div className={`mt-9 grid gap-3 ${NURTURER_STUDIO_ON ? "sm:grid-cols-2" : "mx-auto max-w-md"}`}>
                    <RoleCard
                      emoji="🌱"
                      title={t("dshOnbRoleGrowerTitle")}
                      desc={t("dshOnbRoleGrowerDesc")}
                      selected={role === "grower"}
                      accent="var(--color-violet)"
                      glow="var(--shadow-glow-violet)"
                      onClick={() => setRole("grower")}
                    />
                    {NURTURER_STUDIO_ON && (
                      <RoleCard
                        emoji="🤝"
                        title={t("dshOnbRoleNurturerTitle")}
                        desc={t("dshOnbRoleNurturerDesc")}
                        selected={role === "nurturer"}
                        accent="var(--color-orange)"
                        glow="var(--shadow-glow-orange)"
                        onClick={() => setRole("nurturer")}
                      />
                    )}
                  </div>

                  {NURTURER_STUDIO_ON ? (
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
                  ) : (
                    <motion.div variants={item} className="mt-4 text-center">
                      <Link href="/early" className="text-sm font-semibold text-orange hover:text-orange-soft">
                        🤝 {t("dshOnbRoleNurturerTitle")} →
                      </Link>
                    </motion.div>
                  )}
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
                    {LANGUAGES.filter(
                      (l) =>
                        !knownLangs.includes(l.code) &&
                        FULL_CONTENT_LANGS.includes(l.code) &&
                        (!addingLanguage || !profile?.journeys?.some((journey) => journey.lang === l.code))
                    ).map((l) => (
                      <TargetCard
                        key={l.code}
                        lang={l}
                        selected={targetLang === l.code}
                        full
                        fullLabel={t("dshOnbFullImmersion")}
                        onClick={() => pickTarget(l.code)}
                      />
                    ))}
                  </motion.div>
                  {/* optional test-out branch — skipping (just Continue) is the default path */}
                  {placementOffered && target && (
                    <motion.div
                      variants={item}
                      className="card mt-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      {placedPhase ? (
                        <p className="text-sm font-medium">
                          ✅ {t("dshPlGate")} {placedPhase >= 3 ? 2 : 1} {t("dshPlPassed")} —{" "}
                          {t("dshPlIcebergStartsAt")}{" "}
                          <span className="font-semibold text-lime">
                            {t("phaseWord")} {placedPhase}
                          </span>
                        </p>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <p className="font-semibold">
                              👂 {t("dshPlGrownInPre")}
                              {target.nativeName}
                              {t("dshPlGrownInPost")}
                            </p>
                            <p className="mt-1 text-sm text-muted">{t("dshPlRootsNuri")}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPlacementOpen(true)}
                            className="pill bg-violet px-4 py-2 text-xs font-bold text-white"
                            style={{ boxShadow: "var(--shadow-glow-violet)" }}
                          >
                            {t("dshPlReadyListen")} →
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
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
                  <motion.div variants={item} className="card mt-8 grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
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
                        selected={motivation.includes(m.id)}
                        onClick={() => toggleMotivation(m.id)}
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
                    {PACES.map((p) => {
                      const allIn = (p as { allIn?: boolean }).allIn ?? false;
                      const mainLabel = allIn
                        ? `${p.minutes / 60} ${t("hours")}`
                        : `${p.minutes} ${t("minutes")}`;
                      return (
                        <PaceRow
                          key={p.minutes}
                          mainLabel={mainLabel}
                          emoji={p.emoji}
                          identity={t(p.identityKey)}
                          perDay={t("dshOnbPerDay")}
                          badge={allIn ? t("dshOnbGoAllIn") : undefined}
                          selected={dailyMinutes === p.minutes}
                          onClick={() =>
                            setDailyMinutes((cur) => (cur === p.minutes ? null : p.minutes))
                          }
                        />
                      );
                    })}
                  </motion.div>
                  <motion.p
                    variants={item}
                    className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-muted"
                  >
                    🍂 {t("dshOnbWaterSplit")}
                  </motion.p>
                  {COMMUNITY_EXCHANGE_ON && (
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
                  )}
                </>
              )}

              {/* ============ 7 · name ============ */}
              {step === 7 && (
                <>
                  <NuriSays mood="happy">{t("dshOnbAlmostThere")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbNameHead")}
                  </motion.h1>
                  <motion.div variants={item} className="card mt-8 px-4 py-8 sm:px-6 sm:py-10">
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
                    <span className="text-violet-soft">{target.nativeName}</span>
                    <span aria-hidden="true"> · </span>
                    {t("dshOnbImmersionMode")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
                    {t("dshOnbImmersionBody").replace("{flag}", target.flag)}
                  </motion.p>

                  {/* first word — audio only, no translation */}
                  <motion.div
                    variants={item}
                    className="card mt-8 flex items-center justify-between gap-4 p-4 sm:p-6"
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
                      aria-label={t("onb2Listen")}
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
                    className="card mt-3 flex items-center justify-between gap-4 p-4 sm:p-6"
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
              onClick={() => (addingLanguage ? router.push("/profile") : back())}
              className={`pill bg-white/6 px-6 py-3 text-sm font-semibold text-muted hover:text-ink ${
                step === 0 ? "invisible" : ""
              }`}
            >
              <ArrowLeft size={16} /> {t("back")}
            </button>

            {step < STEP_COUNT - 1 && !(addingLanguage && step === 2) ? (
              <button
                type="button"
                disabled={!valid || (addingLanguage && (!profile || !role || !trimmed))}
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
                {addingLanguage
                  ? `${t("prfAddLanguage")} 🌱`
                  : nurturerOnly
                    ? `${t("dshOnbOpenToolkit")} 🤝`
                    : `${t("dshOnbStartGrowing")} 🌱`}
              </button>
            )}
          </motion.div>
        </main>
      </div>

      {/* full-screen placement overlay — a branch off step 2, not a new step */}
      <AnimatePresence>
        {placementOpen && targetLang && (
          <PlacementCheck
            lang={targetLang}
            onDone={(phase) => {
              setPlacedPhase(phase);
              setPlacementOpen(false);
            }}
          />
        )}
      </AnimatePresence>
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
