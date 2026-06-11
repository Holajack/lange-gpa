"use client";

/**
 * Onboarding — a warm five-step conversation with Nuri.
 *
 * 0  Welcome + role choice (grower / nurturer / both, ?role= preselects)
 * 1  Known languages (multi-select, English preselected)
 * 2  Target world (grower/both) — or nurture languages (nurturer-only)
 * 3  Name + live preview
 * 4  Immersion moment (growers) / nurturer toolkit — then plant the profile
 */

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, Volume2 } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { Logo } from "@/components/Logo";
import { blankProfile, useApp } from "@/lib/store";
import { FULL_CONTENT_LANGS, LANGUAGES, langByCode } from "@/lib/languages";
import { speak } from "@/lib/tts";
import type { LangCode, Language, Profile, Role } from "@/lib/types";

const STEP_COUNT = 5;

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
  onClick,
}: {
  lang: Language;
  selected: boolean;
  full: boolean;
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
          full immersion
        </span>
      )}
      <CheckBadge on={selected} />
    </motion.button>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Immersion mode"
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
        {on ? "🌱" : ""}
      </span>
    </button>
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

  const nurturerOnly = role === "nurturer";
  const trimmed = name.trim();
  const target = targetLang ? langByCode(targetLang) : null;

  const valid = useMemo(() => {
    switch (step) {
      case 0:
        return role !== null;
      case 1:
        return knownLangs.length > 0;
      case 2:
        return nurturerOnly ? nurtureLangs.length > 0 : targetLang !== null;
      case 3:
        return trimmed.length > 0;
      default:
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
    if (targetLang !== null && nextKnown.includes(targetLang)) setTargetLang(null);
  };

  const toggleNurture = (code: LangCode) =>
    setNurtureLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

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
    };
    saveProfile(out);
    router.replace("/dashboard");
  };

  /* ---------- name preview line ---------- */
  const preview: ReactNode =
    trimmed.length === 0 ? null : nurturerOnly ? (
      <>
        <span className="font-semibold text-ink">{trimmed}</span> — nurturing{" "}
        <span className="font-semibold text-orange">
          {nurtureLangs.map((c) => langByCode(c).nativeName).join(" · ") || "…"}
        </span>{" "}
        🤝
      </>
    ) : (
      <>
        <span className="font-semibold text-ink">{trimmed}</span> — growing into{" "}
        <span className="font-semibold text-violet-soft">{target?.nativeName ?? "…"}</span>{" "}
        {target?.flag}
        {role === "both" && <> · nurturing on the side 🤝</>} 🌱
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
            <p className="text-sm font-medium">Your garden is already growing 🌱</p>
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
                Start over
              </button>
            </div>
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
                    I’m Nuri. 👋
                  </motion.h1>
                  <motion.p
                    variants={item}
                    className="mx-auto mt-4 max-w-md text-center leading-relaxed text-muted"
                  >
                    LANGE grows you into a language the way children grow into their first —
                    with a real person, picture cards, and{" "}
                    <span className="font-semibold text-lime">zero translation</span>.
                  </motion.p>

                  <div className="mt-9 grid gap-3 sm:grid-cols-2">
                    <RoleCard
                      emoji="🌱"
                      title="I want to grow into a language"
                      desc="Step into a new world — real voices and pictures carry you from first words to belonging."
                      selected={role === "grower"}
                      accent="var(--color-violet)"
                      glow="var(--shadow-glow-violet)"
                      onClick={() => setRole("grower")}
                    />
                    <RoleCard
                      emoji="🤝"
                      title="I want to nurture growers"
                      desc="Share the language you live in. No teaching degree — just you and thirty friendly minutes."
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
                      🌱🤝 A bit of both, please
                      {role === "both" && <Check size={14} strokeWidth={3} />}
                    </button>
                  </motion.div>
                </>
              )}

              {/* ============ 1 · known languages ============ */}
              {step === 1 && (
                <>
                  <NuriSays mood="happy">Your roots feed everything you’ll grow.</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    Which languages do you already live in?
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    Pick every language that feels like home — choose as many as you like.
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
                  <NuriSays mood="think">Pick a world — I’ll come with you.</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    Which world will you grow into?
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    One to start. Pictures and voices will carry the meaning — never translation.
                  </motion.p>
                  <motion.div variants={grid} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {LANGUAGES.filter((l) => !knownLangs.includes(l.code)).map((l) => (
                      <TargetCard
                        key={l.code}
                        lang={l}
                        selected={targetLang === l.code}
                        full={FULL_CONTENT_LANGS.includes(l.code)}
                        onClick={() => setTargetLang(l.code)}
                      />
                    ))}
                  </motion.div>
                </>
              )}

              {step === 2 && nurturerOnly && (
                <>
                  <NuriSays mood="happy">Your everyday words are a grower’s treasure.</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    Which of your languages can you nurture?
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 text-muted">
                    Growers will meet these worlds through your voice. Pick all that apply.
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

              {/* ============ 3 · name ============ */}
              {step === 3 && (
                <>
                  <NuriSays mood="happy">Almost there — what may I call you?</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    What should we call you?
                  </motion.h1>
                  <motion.div variants={item} className="card mt-8 px-6 py-10">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") next();
                      }}
                      placeholder="Your name"
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

              {/* ============ 4 · immersion moment (growers) ============ */}
              {step === 4 && !nurturerOnly && target && (
                <>
                  <NuriSays mood="cheer">From here, the pictures do the explaining.</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    From now on, LANGE speaks{" "}
                    <span className="text-violet-soft">{target.nativeName}</span>.
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
                    Menus, buttons, practice — the app itself becomes part of your new world.
                    Pictures carry the meaning, and the {target.flag} flag button in the top bar
                    flips immersion on and off anytime.
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
                        <p className="mt-1 text-xs text-muted">your first word — tap to hear it</p>
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
                        <Sparkles size={16} className="text-lime" /> Immersion mode
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {immersion
                          ? `Brave choice — LANGE will greet you in ${target.nativeName} from your very first day.`
                          : "Off for now — you can dive in later with the flag button."}
                      </p>
                    </div>
                    <Toggle on={immersion} onClick={() => setImmersion((v) => !v)} />
                  </motion.div>

                  {role === "both" && (
                    <motion.p variants={item} className="mt-4 text-center text-xs text-muted">
                      Your nurturer toolkit will be waiting on the dashboard too 🤝
                    </motion.p>
                  )}
                </>
              )}

              {/* ============ 4 · nurturer toolkit ============ */}
              {step === 4 && nurturerOnly && (
                <>
                  <NuriSays mood="cheer">Here’s what’s in your pocket.</NuriSays>
                  <motion.h1 variants={item} className="headline text-3xl sm:text-4xl lg:text-[44px]">
                    Your nurturer toolkit
                  </motion.h1>
                  <motion.p variants={item} className="mt-3 max-w-xl leading-relaxed text-muted">
                    Everything for a friendly thirty-minute growing session — you’re a host, not a
                    teacher. The grower listens, points, and plays; you speak and smile.
                  </motion.p>
                  <div className="mt-8 grid gap-3">
                    <ToolkitCard
                      visual={<DeckVisual />}
                      title="Picture card decks"
                      desc="Wordless decks for the Dirty Dozen and beyond — meaning travels by image and your voice, never by translation."
                    />
                    <ToolkitCard
                      visual={<PlanVisual />}
                      title="Session plans"
                      desc="Ready-made plans for all six GPA phases, so every meeting knows exactly where it’s going."
                    />
                    <ToolkitCard
                      visual={<TimerVisual />}
                      title="30-minute meeting timer"
                      desc="A gentle timer that paces listen → point → play, and reminds you to record for re-living at home."
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
                {t("continue")} <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!valid}
                onClick={finish}
                className="pill bg-lime px-8 py-3 font-bold text-canvas disabled:pointer-events-none disabled:opacity-35"
                style={{ boxShadow: "0 0 50px -12px rgba(184,240,60,0.55)" }}
              >
                {nurturerOnly ? "Open my toolkit 🤝" : "Start growing 🌱"}
              </button>
            )}
          </motion.div>
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
