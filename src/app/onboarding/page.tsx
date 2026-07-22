"use client";

/**
 * Onboarding — a warm conversation with Nuri.
 *
 * Six screens, target language first (it is the question the user arrived
 * with — asking known languages first made the flag grid absorb "what do I
 * want to learn?" and mis-filled knownLangs):
 *
 * 0  Welcome — role auto-selected as grower unless the nurturer studio flag
 *    is on (?role= preselects), "takes about 2 minutes" promise
 * 1  Target language (single-select, unfiltered) + optional placement branch
 *    — or nurture-language pick for nurturer-only accounts
 * 2  Why this language (multi-select motivation, optional)
 * 3  UI-language confirm — "Nuri will speak to you in {X} — correct?"
 *    prefilled from the browser locale; [Change] opens a single-select that
 *    EXCLUDES the target; "I also speak…" is a collapsed multi-select
 *    expander. The confirmed language is always knownLangs[0] (it IS the UI
 *    language — store.tsx), never an accident of tap order.
 * 4  Daily watering rhythm (20 min preselected — confirm, not choose)
 * 5  Name confirm (prefilled from Clerk) + first-word audio + immersion
 *    toggle (growers) / nurturer toolkit — then plant the profile
 *
 * City/country, interests and the exchange toggle are deferred to in-context
 * asks outside onboarding; their profile fields stay optional in finish().
 * Steps 2 and 4 are invitations, never gates (GPA is invitation, not
 * interrogation). The progress bar is endowed HONESTLY: "account created"
 * and "language detected" are pre-checked only because both really happened
 * before step 0 rendered.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Sparkles, Volume2 } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { Logo } from "@/components/Logo";
import { PlacementCheck } from "@/components/PlacementCheck";
import { CONVEX_ON } from "@/lib/convexClient";
import { COMMUNITY_EXCHANGE_ON, NURTURER_STUDIO_ON } from "@/lib/featureFlags";
import { blankProfile, switchLanguageJourney, useApp } from "@/lib/store";
import { FULL_CONTENT_LANGS, LANGUAGES, langByCode } from "@/lib/languages";
import { placementAvailable, placementSeed } from "@/lib/placement";
import { legacyGateStamps } from "@/lib/gates";
import { POPULATED_MEETINGS } from "@/lib/sessionFlow";
import { speak } from "@/lib/tts";
import type { LangCode, Language, PhaseId, Profile, Role } from "@/lib/types";
import { MOTIVATIONS, PACES } from "@/lib/onboardingOptions";

const CLERK_ON = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type ScreenId = "welcome" | "target" | "nurture" | "why" | "known" | "pace" | "name";

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

/** One honest segment of the endowed progress bar. */
type Segment = {
  id: string;
  done: boolean;
  current: boolean;
  /** wizard step index this segment maps to — completed ones are tappable to go back */
  jumpTo?: number;
};

function SegmentBar({ segments, onJump }: { segments: Segment[]; onJump: (i: number) => void }) {
  const { t } = useApp();
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={segments.length}
      aria-valuenow={segments.filter((s) => s.done).length}
    >
      {segments.map((s, i) =>
        s.jumpTo !== undefined && s.done ? (
          <button
            key={s.id}
            type="button"
            aria-label={t("onb2StepN").replace("{n}", String(i + 1))}
            onClick={() => onJump(s.jumpTo!)}
            className="h-1.5 flex-1 rounded-full bg-lime transition-all duration-300 hover:bg-lime/70"
          />
        ) : (
          <span
            key={s.id}
            className={`flex-1 rounded-full transition-all duration-300 ${
              s.current ? "h-2 bg-violet" : s.done ? "h-1.5 bg-lime" : "h-1.5 bg-white/15"
            }`}
          />
        )
      )}
    </div>
  );
}

/**
 * Reads the signed-up user's first name once Clerk has it. Mounted only when
 * CLERK_ON, so the ClerkProvider is guaranteed to be in the tree (same
 * pattern as the profile page's AccountPanel).
 */
function ClerkNamePrefill({ onName }: { onName: (firstName: string) => void }) {
  const { isLoaded, user } = useUser();
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !isLoaded) return;
    sent.current = true;
    const first = user?.firstName?.trim();
    if (first) onName(first.slice(0, 24));
  }, [isLoaded, user, onName]);
  return null;
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

  // ?lang= deep link (marketing "Learn Spanish" pages): a valid full-content
  // code arrives with the target already chosen and skips straight to "why".
  const deepLang: LangCode | null = (() => {
    const l = params.get("lang") as LangCode | null;
    return l && FULL_CONTENT_LANGS.includes(l) ? l : null;
  })();

  const [role, setRole] = useState<Role>(() => {
    // grower is the default identity; ?role= can deep-link the studio roles
    const r = params.get("role");
    return NURTURER_STUDIO_ON && (r === "nurturer" || r === "both") ? r : "grower";
  });
  const nurturerDeepLink = NURTURER_STUDIO_ON && params.get("role") === "nurturer";

  const [step, setStep] = useState(() =>
    addingLanguage ? 1 : deepLang && !nurturerDeepLink ? 2 : 0
  );
  const [dir, setDir] = useState(1);

  const [targetLang, setTargetLang] = useState<LangCode | null>(deepLang);

  // optional placement check — an EARNED Phase 2/3 start held in local state
  // (like every other onboarding answer) until finish() applies the seed
  const [placedPhase, setPlacedPhase] = useState<PhaseId | null>(null);
  const [placementOpen, setPlacementOpen] = useState(false);

  // The UI language is a CONFIRM, not an open question: uiPick is always
  // knownLangs[0] (the app speaks it — store.tsx), alsoSpeak trails behind.
  const [uiPick, setUiPick] = useState<LangCode>("en");
  const [alsoSpeak, setAlsoSpeak] = useState<LangCode[]>([]);
  const [changingUi, setChangingUi] = useState(false);
  const [alsoOpen, setAlsoOpen] = useState(false);
  const [langDetected, setLangDetected] = useState(false);
  const detectedCodes = useRef<LangCode[]>([]);

  // Welcome the world in its own language: prefill the visitor's best
  // language from the browser so the confirm screen is one honest tap.
  const browserDetected = useRef(false);
  useEffect(() => {
    if (browserDetected.current) return;
    browserDetected.current = true;
    const codes = (typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : []) as string[];
    const known = new Set(LANGUAGES.map((l) => l.code));
    const hits = codes.map((c) => c.slice(0, 2).toLowerCase() as LangCode).filter((c) => known.has(c));
    detectedCodes.current = hits;
    if (hits.length > 0) setLangDetected(true);
    // keep the long-standing rule: replace the "en" default only on a non-English hit
    const hit = hits.find((c) => c !== "en");
    if (hit) setUiPick(hit);
  }, []);

  const [nurtureLangs, setNurtureLangs] = useState<LangCode[]>([]);
  const [name, setName] = useState("");
  const [immersion, setImmersion] = useState(false);

  // the invitation steps — every one of these may stay empty. City/country,
  // interests and exchange no longer have onboarding screens (they moved to
  // in-context asks), but the state survives so a profile edit re-entry
  // never wipes previously given answers.
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [motivation, setMotivation] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(20);
  const [exchange, setExchange] = useState(false);

  // honest labor-illusion beat before the finale — first run only
  const [building, setBuilding] = useState(false);
  const builtOnce = useRef(false);
  const buildTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (buildTimer.current) clearTimeout(buildTimer.current);
    },
    []
  );

  // Editing an existing account? Pre-fill the wizard from the profile so the
  // avatar → onboarding is a real edit, not a blank restart. Fires once when
  // the profile first loads; never runs for brand-new growers (no profile).
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !accountReady || !profile) return;
    prefilled.current = true;
    setRole(profile.role);
    if (profile.knownLangs?.length) {
      setUiPick(profile.knownLangs[0]);
      setAlsoSpeak(profile.knownLangs.slice(1));
    }
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
    setDailyMinutes(profile.dailyMinutes ?? 20);
    setExchange(profile.exchange ?? false);
  }, [accountReady, addingLanguage, profile]);

  // Clerk already knows the user's first name from sign-up — confirm, don't
  // retype. Only fills an empty field, so a profile edit keeps its name.
  const onClerkName = useCallback((first: string) => {
    setName((current) => (current.trim() ? current : first));
  }, []);

  const nurturerOnly = role === "nurturer";
  const trimmed = name.trim();
  const target = targetLang ? langByCode(targetLang) : null;

  const screens: ScreenId[] = nurturerOnly
    ? ["welcome", "known", "nurture", "why", "pace", "name"]
    : ["welcome", "target", "why", "known", "pace", "name"];
  const screen = screens[Math.min(step, screens.length - 1)];

  const knownList = useMemo(
    () => [uiPick, ...alsoSpeak.filter((c) => c !== uiPick)],
    [uiPick, alsoSpeak]
  );
  const nurturePicked = useMemo(
    () => nurtureLangs.filter((c) => knownList.includes(c)),
    [nurtureLangs, knownList]
  );

  // The confirmed UI language can never be the language being learned — if
  // the target lands on it (deep link, or an es-browser user picking Español)
  // fall back to another detected language, then to the grid default.
  useEffect(() => {
    if (!targetLang) return;
    setAlsoSpeak((prev) => (prev.includes(targetLang) ? prev.filter((c) => c !== targetLang) : prev));
    setUiPick((current) => {
      if (current !== targetLang) return current;
      return (
        detectedCodes.current.find((c) => c !== targetLang) ??
        LANGUAGES.find((l) => l.code !== targetLang)!.code
      );
    });
  }, [targetLang]);

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
    (screen === "why" && motivation.length === 0) ||
    (screen === "pace" && dailyMinutes === null);

  const valid = useMemo(() => {
    switch (screen) {
      case "target":
        return targetLang !== null;
      case "nurture":
        return nurturePicked.length > 0;
      case "name":
        return trimmed.length > 0;
      default:
        // welcome has a default role; why + pace are invitations — never blocking
        return true;
    }
  }, [screen, targetLang, nurturePicked, trimmed]);

  const advance = useCallback(() => {
    setDir(1);
    setStep((s) => Math.min(s + 1, screens.length - 1));
  }, [screens.length]);

  const next = () => {
    if (!valid || building || step >= screens.length - 1) return;
    // Brief, TRUE "building your plan" beat before the finale: the next
    // screen really does hold the first word, and finish() really does plant
    // the Phase 1A journey from these answers. First run only — a profile
    // edit or add-language re-entry skips straight through.
    if (screen === "pace" && !nurturerOnly && !profile && !addingLanguage && !builtOnce.current) {
      builtOnce.current = true;
      setBuilding(true);
      buildTimer.current = setTimeout(() => {
        setBuilding(false);
        advance();
      }, 2600);
      return;
    }
    advance();
  };
  const skipBuilding = () => {
    if (buildTimer.current) clearTimeout(buildTimer.current);
    setBuilding(false);
    advance();
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

  const pickTarget = (code: LangCode) => {
    // a different world means any earned placement no longer applies
    if (code !== targetLang) setPlacedPhase(null);
    setTargetLang(code);
  };

  const chooseUiLang = (code: LangCode) => {
    setUiPick(code);
    setAlsoSpeak((prev) => prev.filter((c) => c !== code));
    setChangingUi(false);
  };

  const toggleAlsoSpeak = (code: LangCode) =>
    setAlsoSpeak((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const toggleNurture = (code: LangCode) =>
    setNurtureLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const toggleMotivation = (id: string) =>
    setMotivation((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const finish = () => {
    if (!role || trimmed.length === 0) return;
    const nurture = nurturerOnly ? nurturePicked : role === "both" ? knownList : [];
    const finalTarget: LangCode | null = nurturerOnly
      ? (nurture[0] ?? knownList[0] ?? "en")
      : targetLang;
    if (finalTarget === null) {
      // Target is the FIRST required question — reaching finish() without
      // one is a wiring bug, never a reason to silently enroll in Spanish.
      throw new Error("onboarding: finish() reached without a target language");
    }
    const progressBase = profile ? switchLanguageJourney(profile, finalTarget) : blankProfile();
    // An earned placement seeds phase/hours/words for this journey, and parks
    // meetingProgress at the last populated meeting so the session
    // room doesn't drag a placed-ahead grower back to meeting 1 — it serves
    // them review sessions until new meetings are populated. Skipping or
    // failing leaves everything exactly as today (Phase 1, meeting 1).
    const seeded =
      placedPhase !== null && !nurturerOnly
        ? {
            ...progressBase,
            ...placementSeed(placedPhase),
            meetingProgress: POPULATED_MEETINGS[POPULATED_MEETINGS.length - 1],
            // a placement lands at Phase 2+ — stamp both advancement gates in
            // the SAME write as the seed (never a later self-heal race) so a
            // placed grower is a gate-passer by construction, not an anomaly
            gatesPassed: legacyGateStamps(placementSeed(placedPhase)),
          }
        : progressBase;
    const out: Profile = {
      // Editing an existing account keeps all progress (hours, words,
      // completed, bookings, week, createdAt); a brand-new grower starts fresh.
      ...seeded,
      name: trimmed,
      role,
      // the confirmed UI language is always index 0 — it IS the app language
      knownLangs: knownList,
      targetLang: finalTarget,
      nurtureLangs: nurture,
      immersion: nurturerOnly ? false : immersion,
      // invitation answers — saved only when given (city, interests and
      // exchange are now asked in-context after onboarding; re-entries keep
      // whatever was answered before)
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

  /* ---------- endowed progress bar (honest segments only) ---------- */
  const segments: Segment[] = [
    // TRUE: middleware forces sign-up before /onboarding renders, and the
    // wizard waits for the cloud profile — the account really exists. In a
    // keyless build no account was created, so the segment is omitted (a
    // pre-checked segment must always have a real completed referent).
    ...(CLERK_ON ? [{ id: "account", done: true, current: false }] : []),
    // TRUE only when the browser locale matched a supported language.
    { id: "detect", done: langDetected, current: false },
  ];
  screens.forEach((scr, i) => {
    if (i === 0) return; // welcome is covered by the endowed segments
    segments.push({ id: scr, done: step > i, current: step === i, jumpTo: i });
    if (scr === "target" && placedPhase !== null && !nurturerOnly) {
      segments.push({ id: "placement", done: true, current: false });
    }
  });

  const labelParts: string[] = [];
  if (step === 0) {
    if (CLERK_ON) labelParts.push(`✓ ${t("obAccountDone")}`);
    if (langDetected) labelParts.push(`✓ ${t("obLangDetected")}`);
  }
  if (placedPhase !== null && !nurturerOnly) {
    labelParts.push(`✓ ${t("phaseWord")} ${placedPhase}`);
  }
  if (step >= 3) {
    labelParts.push(t("obStepsLeft").replace("{n}", String(screens.length - step)));
  }
  const labelLine = labelParts.join(" · ");

  /* ---------- name preview line ---------- */
  const preview: ReactNode =
    trimmed.length === 0 ? null : nurturerOnly ? (
      <>
        <span className="font-semibold text-ink">{trimmed}</span> — {t("dshOnbPreviewNurturing")}{" "}
        <span className="font-semibold text-orange">
          {nurturePicked.map((c) => langByCode(c).nativeName).join(" · ") || "…"}
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

  const confirmH1 = t("obUiConfirmH1").split("{lang}");
  const uiLangObj = langByCode(uiPick);

  if (!accountReady) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading your profile">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {CLERK_ON && <ClerkNamePrefill onName={onClerkName} />}

      {/* ambient orbs */}
      <div className="orb h-[420px] w-[420px] bg-violet/20" style={{ top: -140, left: -140 }} />
      <div className="orb h-[360px] w-[360px] bg-orange/12" style={{ bottom: -110, right: -90 }} />
      <div className="orb h-[260px] w-[260px] bg-lime/8" style={{ top: "42%", right: -100 }} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-7 sm:px-6">
        {/* header: logo · endowed progress bar */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            {addingLanguage ? (
              <span className="headline ml-auto text-sm">{t("prfAddLanguage")}</span>
            ) : (
              <SegmentBar segments={segments} onJump={jump} />
            )}
          </div>
          {!addingLanguage && labelLine && (
            <p className="mt-2 text-right text-xs font-medium text-muted">{labelLine}</p>
          )}
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
              {/* ============ welcome (+ role when the studio is on) ============ */}
              {screen === "welcome" && (
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
                  <motion.p variants={item} className="mt-3 text-center text-sm text-muted">
                    {t("obTimePromise")}
                  </motion.p>

                  {NURTURER_STUDIO_ON ? (
                    <>
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
                  ) : (
                    <motion.div variants={item} className="mt-6 text-center">
                      <Link href="/early" className="text-sm font-semibold text-orange hover:text-orange-soft">
                        🤝 {t("dshOnbRoleNurturerTitle")} →
                      </Link>
                    </motion.div>
                  )}
                </>
              )}

              {/* ============ target world — the question the user came with ============ */}
              {screen === "target" && (
                <>
                  <NuriSays mood="think">{t("dshOnbPickWorldNuri")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("obTargetFirstH1")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {t("dshOnbTargetSub")}
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {LANGUAGES.filter(
                      (l) =>
                        FULL_CONTENT_LANGS.includes(l.code) &&
                        // Adding a language finishes straight from this grid (no
                        // UI-language confirm screen), so a language the user
                        // already lives in must not be offered: picking their
                        // own knownLangs[0] would silently reassign uiPick and
                        // drop their primary language from knownLangs.
                        (!addingLanguage ||
                          (!profile?.journeys?.some((journey) => journey.lang === l.code) &&
                            !profile?.knownLangs?.includes(l.code)))
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

              {/* ============ nurture languages (nurturer-only) ============ */}
              {screen === "nurture" && (
                <>
                  <NuriSays mood="happy">{t("dshOnbNurtureTreasure")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbNurtureHead")}
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    {t("dshOnbNurtureSub")}
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 flex flex-wrap gap-2.5">
                    {knownList.map((code) => {
                      const l = langByCode(code);
                      return (
                        <LangChip
                          key={l.code}
                          lang={l}
                          accent="orange"
                          selected={nurturePicked.includes(l.code)}
                          onClick={() => toggleNurture(l.code)}
                        />
                      );
                    })}
                  </motion.div>
                </>
              )}

              {/* ============ why this language (optional) ============ */}
              {screen === "why" && (
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

              {/* ============ UI-language confirm — one tap, not a quiz ============ */}
              {screen === "known" && (
                <>
                  <NuriSays mood="happy">{t("dshOnbRootsFeed")}</NuriSays>
                  {changingUi ? (
                    <>
                      <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                        {t("obSpeakBestH1")}
                      </motion.h1>
                      {/* single-select — the just-picked target is excluded, so
                          "the language I came to learn" can't be chosen here */}
                      <motion.div variants={grid} className="mt-8 flex flex-wrap gap-2.5">
                        {LANGUAGES.filter((l) => l.code !== targetLang).map((l) => (
                          <LangChip
                            key={l.code}
                            lang={l}
                            selected={uiPick === l.code}
                            onClick={() => chooseUiLang(l.code)}
                          />
                        ))}
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                        {confirmH1[0]}
                        <span className="text-violet-soft">
                          {uiLangObj.flag} {uiLangObj.nativeName}
                        </span>
                        {confirmH1[1]}
                      </motion.h1>
                      <motion.div variants={item} className="mt-8 grid gap-3">
                        <button
                          type="button"
                          onClick={next}
                          className="pill w-full justify-center bg-violet px-8 py-4 font-semibold text-white"
                          style={{ boxShadow: "var(--shadow-glow-violet)" }}
                        >
                          {t("obUiConfirmYes")} <Check size={16} strokeWidth={3} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setChangingUi(true)}
                          className="mx-auto pill bg-white/6 px-6 py-2.5 text-sm font-semibold text-muted hover:text-ink"
                        >
                          {t("obUiConfirmChange")}
                        </button>
                      </motion.div>
                      {/* optional expander for genuinely multilingual users */}
                      <motion.div variants={item} className="mt-9">
                        <button
                          type="button"
                          onClick={() => setAlsoOpen((v) => !v)}
                          aria-expanded={alsoOpen}
                          className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${alsoOpen ? "rotate-180" : ""}`}
                          />
                          {t("obAlsoSpeak")}
                          {alsoSpeak.length > 0 && (
                            <span className="font-bold text-lime">· {alsoSpeak.length}</span>
                          )}
                        </button>
                        {alsoOpen && (
                          <div className="mt-4 flex flex-wrap gap-2.5">
                            {LANGUAGES.filter((l) => l.code !== targetLang && l.code !== uiPick).map((l) => (
                              <LangChip
                                key={l.code}
                                lang={l}
                                selected={alsoSpeak.includes(l.code)}
                                onClick={() => toggleAlsoSpeak(l.code)}
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </>
              )}

              {/* ============ watering rhythm (20 min preselected) ============ */}
              {screen === "pace" && (
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
                </>
              )}

              {/* ============ finale — name confirm + first word / toolkit ============ */}
              {screen === "name" && (
                <>
                  <NuriSays mood="happy">{t("dshOnbAlmostThere")}</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    {t("dshOnbNameHead")}
                  </motion.h1>
                  <motion.div variants={item} className="card mt-8 px-4 py-6 sm:px-6 sm:py-8">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && valid) finish();
                      }}
                      placeholder={t("dshOnbNamePlaceholder")}
                      maxLength={24}
                      autoFocus
                      className="headline w-full bg-transparent text-center text-4xl text-ink caret-violet outline-none placeholder:text-white/15 sm:text-5xl"
                    />
                  </motion.div>
                  <div className="mt-4 min-h-[28px] text-center">
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

                  {!nurturerOnly && target && (
                    <>
                      {/* first word — audio only, no translation */}
                      <motion.div
                        variants={item}
                        className="card mt-4 flex items-center justify-between gap-4 p-4 sm:p-6"
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

                  {nurturerOnly && (
                    <div className="mt-4 grid gap-3">
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
                  )}
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

            {screen !== "name" && !(addingLanguage && screen === "target") ? (
              <button
                type="button"
                disabled={!valid}
                onClick={next}
                className="pill bg-violet px-8 py-3 font-semibold text-white disabled:pointer-events-none disabled:opacity-35"
                style={valid ? { boxShadow: "var(--shadow-glow-violet)" } : undefined}
              >
                {screen === "welcome" ? (
                  <>{t("start")}</>
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
                disabled={!valid || (addingLanguage && (!profile || trimmed.length === 0))}
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

      {/* honest labor-illusion beat: every line names work finish() really
          does with the answers just given — max ~2.6 s, tap to skip */}
      <AnimatePresence>
        {building && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={skipBuilding}
            role="status"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-canvas/95 px-6 backdrop-blur-sm"
          >
            <Mascot size={110} mood="think" />
            <div className="space-y-3 text-center">
              {[t("obBuildingPlan1"), t("obBuildingPlan2"), t("obBuildingPlan3")].map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.65 }}
                  className="text-sm font-medium text-muted"
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* full-screen placement overlay — a branch off the target step, not a new step */}
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
