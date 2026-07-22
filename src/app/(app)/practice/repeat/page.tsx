"use client";

/**
 * /practice/repeat — "Re-live Your Words" (fast repeat)
 * GPA home review: re-live yesterday's meeting — eyes on the pictures,
 * ears in the host world. An auto-advancing slideshow of ten picture
 * cards sampled across all domains: hear the word, see the picture,
 * say it aloud in the ring-countdown beat, hear it once more, move on.
 * The written word fades in only after the first hearing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { VOCAB_DOMAINS } from "@/lib/vocab";
import { speak, stopSpeaking } from "@/lib/tts";
import { useApp } from "@/lib/store";
import type { VocabDomain, VocabItem } from "@/lib/types";
import {
  FallbackBanner,
  FinishScreen,
  Phase1BGuard,
  PracticeHeader,
  ProgressDots,
  pickN,
  useContentLang,
  type ContentLang,
  type RoundResult,
} from "../shared";

const VIOLET = "var(--color-violet)";
const TOTAL = 10;
const RING_MS = 2500; // "your turn" beat at 1× speed
const RING_R = 52;
const RING_CIRC = 2 * Math.PI * RING_R;

/* --------------------------------- slides --------------------------------- */

interface Slide {
  item: VocabItem;
  domain: VocabDomain;
}

/** Ten random word-meetings sampled across every picture domain. */
function sampleSlides(): Slide[] {
  const all: Slide[] = VOCAB_DOMAINS.flatMap((d) =>
    d.items.map((item) => ({ item, domain: d }))
  );
  return pickN(all, TOTAL);
}

function wordOf(slide: Slide, lang: ContentLang): string {
  return slide.item.words[lang] ?? "";
}

type Beat = "listen" | "your-turn" | "listen-again";
type Speed = 0.6 | 1 | 1.5;

const SPEEDS: { value: Speed; label: string }[] = [
  { value: 0.6, label: "🐢 0.6×" },
  { value: 1, label: "▶ 1×" },
  { value: 1.5, label: "🐇 1.5×" },
];

/** TTS rate follows the slideshow tempo. */
function rateFor(speed: Speed): number {
  return speed === 0.6 ? 0.7 : speed === 1.5 ? 1.05 : 0.85;
}

function resumeSynth() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.resume();
  }
}

/* ---------------------------------- page ---------------------------------- */

function RepeatExperience() {
  const { lang, fellBack, t } = useContentLang();
  const { completeActivity, profile } = useApp();

  // sampled on the client only → no hydration mismatch from Math.random
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [ix, setIx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [beat, setBeat] = useState<Beat>("listen");
  const [revealed, setRevealed] = useState(false); // word fades in after 1st hearing
  const [ring, setRing] = useState(0); // 0..1 countdown progress
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);

  const pausedRef = useRef(false);
  const speedRef = useRef<Speed>(1);
  const rafRef = useRef<number | null>(null);
  const loggedRef = useRef(false);

  useEffect(() => {
    setSlides(sampleSlides());
  }, []);

  const finished = slides !== null && ix >= TOTAL;
  const slide = slides && !finished ? slides[ix] : null;

  /* ------------------------------ the sequencer ----------------------------- */

  useEffect(() => {
    if (!slides || ix >= TOTAL) return;
    const current = slides[ix];
    if (!current) return;
    let cancelled = false;

    // pausable, speed-aware clock — one beat of `baseMs` at 1× tempo
    const tick = (baseMs: number, onTick?: (p: number) => void) =>
      new Promise<void>((resolve) => {
        let last = performance.now();
        let elapsed = 0;
        const step = (now: number) => {
          if (cancelled) return resolve();
          const dt = now - last;
          last = now;
          if (!pausedRef.current) elapsed += dt * speedRef.current;
          const p = Math.min(1, elapsed / baseMs);
          onTick?.(p);
          if (p >= 1) return resolve();
          rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
      });

    const word = wordOf(current, lang);

    const run = async () => {
      setBeat("listen");
      setRevealed(false);
      setRing(0);
      await tick(450); // let the card pop in
      if (cancelled) return;
      await speak(word, lang, rateFor(speedRef.current)); // ears first
      if (cancelled) return;
      setRevealed(true); // only NOW the written word may fade in
      await tick(400);
      if (cancelled) return;
      setBeat("your-turn"); // say it aloud — ring counts down
      await tick(RING_MS, (p) =>
        setRing((prev) => (p >= 1 || Math.abs(p - prev) >= 0.01 ? p : prev))
      );
      if (cancelled) return;
      setBeat("listen-again"); // once more into the ear
      await speak(word, lang, rateFor(speedRef.current));
      if (cancelled) return;
      await tick(650);
      if (cancelled) return;
      setResults((prev) => [...prev, "correct"]);
      setIx((i) => i + 1);
    };

    void run();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopSpeaking();
    };
  }, [slides, ix, lang]);

  useEffect(() => {
    if (finished && !loggedRef.current) {
      loggedRef.current = true;
      completeActivity(profile?.phase === 1 ? "p1-dictionary" : "maintenance-repeat", 5);
    }
  }, [finished, completeActivity, profile?.phase]);

  /* -------------------------------- controls -------------------------------- */

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (next) window.speechSynthesis.pause();
        else window.speechSynthesis.resume();
      }
      return next;
    });
  }, []);

  const changeSpeed = useCallback((s: Speed) => {
    speedRef.current = s;
    setSpeed(s);
  }, []);

  const restart = useCallback(() => {
    resumeSynth(); // clear any paused utterance before cancelling
    stopSpeaking();
    loggedRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    setResults([]);
    setRing(0);
    setBeat("listen");
    setRevealed(false);
    setSlides(sampleSlides());
    setIx(0);
  }, []);

  /* --------------------------------- views ---------------------------------- */

  const header = (
    <PracticeHeader
      emoji="🔁"
      title={t("prcRepeatName")}
      kicker={t("prcRepeatKicker")}
      accent={VIOLET}
    />
  );

  if (!slides) {
    return (
      <div>
        {header}
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div>
        {header}
        <FinishScreen
          title={t("done")}
          sub={t("prcRepeatFinish")}
          accent={VIOLET}
          stats={[
            { value: `${TOTAL}`, label: t("words") },
            { value: "+5", label: t("minutes") },
          ]}
          actions={[
            { href: "/practice", label: `🎮 ${t("trainings")}`, primary: true },
            { href: "/dashboard", label: t("dashboard") },
          ]}
        />
      </div>
    );
  }

  return (
    <div>
      {header}
      <FallbackBanner show={fellBack} />

      <div className="mx-auto max-w-2xl">
        {/* the slide */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="card relative mb-6 overflow-hidden px-6 py-10 text-center"
        >
          <div
            className="orb right-[-80px] top-[-90px] h-[220px] w-[220px]"
            style={{
              background: `color-mix(in srgb, var(--color-${slide?.domain.color ?? "violet"}) 28%, transparent)`,
            }}
          />

          {/* paused veil */}
          {paused && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px] bg-canvas/55 text-5xl backdrop-blur-[2px]">
              ⏸️
            </div>
          )}

          <div className="relative flex flex-col items-center gap-5">
            <span className="rounded-full bg-white/6 px-3.5 py-1 text-xs font-bold text-muted">
              {slide?.domain.emoji} · {ix + 1} / {TOTAL}
            </span>

            <span key={slide?.item.id} className="popin text-7xl leading-none lg:text-8xl">
              {slide?.item.emoji}
            </span>

            {/* the written word — only after the first hearing */}
            <div className="flex min-h-[2.75rem] items-center justify-center px-2">
              {revealed && slide ? (
                <motion.p
                  key={slide.item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="font-display text-2xl font-extrabold text-violet-soft lg:text-3xl"
                >
                  {wordOf(slide, lang)}
                </motion.p>
              ) : (
                <p className="select-none text-lg tracking-[0.45em] text-muted/50">•••</p>
              )}
            </div>

            {/* the beat: listen → your turn (ring) → listen again */}
            <div className="flex h-36 items-center justify-center">
              {beat === "your-turn" ? (
                <div className="relative h-32 w-32">
                  <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
                    <circle
                      cx={60}
                      cy={60}
                      r={RING_R}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={8}
                    />
                    <circle
                      cx={60}
                      cy={60}
                      r={RING_R}
                      fill="none"
                      stroke={VIOLET}
                      strokeWidth={8}
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRC}
                      strokeDashoffset={RING_CIRC * ring}
                      style={{ transition: "stroke-dashoffset 90ms linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <span className="text-3xl">🗣️</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      {t("speak")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <span className={`text-3xl ${paused ? "" : "floaty"}`}>👂</span>
                  <div className="flex h-7 items-end gap-1">
                    {[10, 20, 26, 16, 24, 12].map((h, i) => (
                      <span
                        key={i}
                        className={`inline-block w-1.5 rounded-full ${paused ? "" : "wavebar"}`}
                        style={{
                          height: h,
                          background: "color-mix(in srgb, var(--color-violet) 70%, white)",
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {beat === "listen-again" ? `${t("listen")} · 🔁` : t("listen")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* transport controls */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="card mb-6 flex flex-wrap items-center justify-center gap-3 px-5 py-4"
        >
          <button
            type="button"
            onClick={togglePause}
            className="pill bg-white/8 px-5 py-2.5 text-sm font-semibold text-ink"
          >
            {paused ? `▶ ${t("play")}` : `⏸ ${t("prcPause")}`}
          </button>

          <div className="flex items-center gap-1 rounded-full bg-white/6 p-1">
            {SPEEDS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => changeSpeed(s.value)}
                className={`pill px-3.5 py-1.5 text-xs font-bold ${
                  speed === s.value ? "bg-violet text-white" : "bg-transparent text-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={restart}
            className="pill bg-white/8 px-5 py-2.5 text-sm font-semibold text-ink"
          >
            🔄 {t("tryAgain")}
          </button>
        </motion.div>

        <ProgressDots total={TOTAL} current={ix} results={results} accent={VIOLET} />
      </div>
    </div>
  );
}

export default function RepeatPage() {
  return (
    <Phase1BGuard>
      <RepeatExperience />
    </Phase1BGuard>
  );
}
