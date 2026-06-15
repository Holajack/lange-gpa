"use client";

/**
 * /session — the live GPA growing-session room, rebuilt around the
 * authentic Phase-1 "Dirty Dozen" flow: the NURTURER controls everything
 * the grower sees. Card 1 is free (INTRO → ECHO); every further card is
 * earned through a review round of "Where is …?" questions, and every
 * 3rd card the round sweeps ALL introduced cards (src/lib/sessionFlow).
 *
 * Two modes:
 *  - HUMAN — a real nurturer (or two partners doing language exchange on
 *    one device) drives the deck from a nurturer-only tray.
 *  - AI — the language sibling (mascotForLang) runs the SAME paced flow
 *    automatically with speech.
 *
 * Comprehension before production. No translation, ever.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Download,
  Pause,
  PhoneOff,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { NURTURERS, nurturerById, nurturersForLang } from "@/lib/nurturers";
import { phaseById } from "@/lib/phases";
import { FULL_CONTENT_LANGS, LANGUAGES, langByCode } from "@/lib/languages";
import { speak, stopSpeaking } from "@/lib/tts";
import {
  CUES,
  JOKE_PROMPTS,
  answerReview,
  buildMeetingDeck,
  meetingForHours,
  canReveal,
  createFlow,
  currentCard,
  introducedCards,
  plannedReviewLength,
  questionFor,
  reveal,
  reviewTarget,
  startReview,
} from "@/lib/sessionFlow";
import type { DeckCard, FlowState } from "@/lib/sessionFlow";
import { mascotForLang } from "@/lib/mascots";
import type { MascotDef } from "@/lib/mascots";
import { MascotImage } from "@/components/MascotImage";
import { Avatar } from "@/components/Avatar";
import { Mascot } from "@/components/Mascot";
import { Card, Pill, Tag } from "@/components/ui";
import { useRecorder } from "./useRecorder";
import { ConsentDialog } from "./ConsentDialog";
import { CardFace } from "./CardFace";
import type { LangCode, Nurturer } from "@/lib/types";

/** MascotImage is built by the mascot agent (registry contract). The cast
 *  keeps this page strict-clean against its exact prop surface; we pass
 *  both the def and its id so either prop style resolves the portrait. */
const Portrait = MascotImage as unknown as ComponentType<{
  mascot: MascotDef;
  id: string;
  size?: number;
  className?: string;
}>;

const TOTAL_SECONDS = 30 * 60;
const DECK_SIZE = 12;
const BARS = [14, 26, 18, 32, 22, 28, 16];

/** Nuri — the AI nurturer slot. Lives in every language; never sleeps. */
const NURI: Nurturer = {
  id: "ai",
  name: "Nuri",
  langs: LANGUAGES.map((l) => l.code),
  city: "Nuri",
  bio: "Always awake, endlessly patient. Runs the same GPA games — speaks only your growing language.",
  tags: ["AI", "24/7", "picture cards"],
  sessions: 0,
  rating: 5,
  online: true,
  color: "#ff8a1e",
};

type Stage = "pre" | "live" | "end";

interface CardFeedback {
  id: string;
  kind: "correct" | "wrong";
}

const fmtClock = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

/** tiny progress ring shown on the locked "Reveal next card" button */
function ProgressRing({ value, size = 18 }: { value: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={3} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--color-lime)"
        strokeWidth={3}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

function Wavebars({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex h-8 items-center gap-1">
      {BARS.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${active ? "wavebar" : ""}`}
          style={{
            height: active ? h * 0.7 : 5,
            background: active ? color : "rgba(255,255,255,0.22)",
            animationDelay: `${i * 0.12}s`,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

function SessionRoom() {
  const { profile, t, completeActivity } = useApp();
  const params = useSearchParams();

  const targetLang: LangCode = profile?.targetLang ?? "es";
  const lang = langByCode(targetLang);
  /** language of the picture-card deck — falls back to Spanish for demo langs without decks */
  const initialContentLang: LangCode = FULL_CONTENT_LANGS.includes(targetLang) ? targetLang : "es";
  /** which authentic Rough-and-Ready-Dozen meeting the grower is on (≈2h each) */
  const meeting = meetingForHours(profile?.hoursLogged ?? 0);

  // ---- booking lookup (links from /schedule carry nurturer + activity) ----
  const nurturerParam = params.get("nurturer");
  const activityParam = params.get("activity");

  const nurturer = useMemo(() => {
    if (nurturerParam === "ai") return NURI;
    const fromParam = nurturerParam ? nurturerById(nurturerParam) : undefined;
    return (
      fromParam ??
      nurturersForLang(targetLang).find((n) => n.online) ??
      nurturersForLang(targetLang)[0] ??
      NURTURERS[0]
    );
  }, [nurturerParam, targetLang]);

  const isAI = nurturer.id === "ai";
  /** the language sibling who hosts AI sessions */
  const mascot = useMemo(() => mascotForLang(targetLang), [targetLang]);

  const activity =
    activityParam && activityParam.trim().length > 0
      ? activityParam
      : phaseById(profile?.phase ?? 1).activities[0]?.name ?? "Growing session";

  // ---- room state ----
  const [stage, setStage] = useState<Stage>("pre");
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [fast, setFast] = useState(false);
  const [halfBanner, setHalfBanner] = useState(false);

  // ---- language exchange: deck language + roles can swap mid-session ----
  const [sessionLang, setSessionLang] = useState<LangCode>(initialContentLang);
  const [swapped, setSwapped] = useState(false);
  const [switchStep, setSwitchStep] = useState<"closed" | "confirm" | "lang">("closed");

  // ---- the Dirty Dozen flow ----
  const [flow, setFlow] = useState<FlowState>(() => createFlow(buildMeetingDeck(initialContentLang, meeting, DECK_SIZE)));
  const [feedback, setFeedback] = useState<CardFeedback | null>(null);
  const [iceberg, setIceberg] = useState(false);
  /** id of the card the grower just missed — the nurturer re-says it */
  const [missId, setMissId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [jokeIdx, setJokeIdx] = useState(() => Math.floor(Math.random() * JOKE_PROMPTS.length));

  // ---- AI runner ----
  const [paused, setPaused] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const greetedRef = useRef(false);
  const celebratedRef = useRef(false);
  /** true while a tap is being resolved — pauses the gentle re-ask loop */
  const busyRef = useRef(false);

  // ---- human "speaking" shimmer ----
  const [humanSpeaking, setHumanSpeaking] = useState(true);

  const halfRef = useRef(false);
  const loggedRef = useRef(false);

  // ---- recording: the talking picture dictionary ----
  const rec = useRecorder();
  const { stop: recStop, start: recStart } = rec;
  const [camWanted, setCamWanted] = useState(false);
  /** consent is remembered for THIS session only — deliberately never persisted */
  const [recConsented, setRecConsented] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ---- derived flow facts ----
  const cues = CUES[sessionLang];
  const introduced = introducedCards(flow);
  const newest = currentCard(flow);
  const target = reviewTarget(flow);
  const reviewLen = plannedReviewLength(flow);
  const reviewAsked = flow.phase === "review" ? flow.reviewTotal - flow.reviewQueue.length : 0;
  const reviewNeeded = !flow.reviewSatisfied && flow.phase !== "review";
  const deckDone = flow.phase === "complete";
  const sessionLangInfo = langByCode(sessionLang);

  const youName = profile?.name?.trim() ? profile.name : "You";
  const nurturerName = swapped ? youName : isAI ? mascot.name : nurturer.name;
  const growerName = swapped ? nurturer.name : youName;

  // profile loads from localStorage after mount — while still on the pre-join
  // screen, rebuild the deck for the real target language
  useEffect(() => {
    if (stage !== "pre") return;
    setSessionLang(initialContentLang);
    setFlow(createFlow(buildMeetingDeck(initialContentLang, meeting, DECK_SIZE)));
  }, [stage, initialContentLang, meeting]);

  // countdown
  useEffect(() => {
    if (stage !== "live") return;
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - (fast ? 60 : 1)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage, fast]);

  // timer hits zero → end
  useEffect(() => {
    if (stage === "live" && remaining === 0) setStage("end");
  }, [stage, remaining]);

  // half-time banner — nudge toward the role switch
  useEffect(() => {
    if (stage === "live" && !halfRef.current && remaining <= TOTAL_SECONDS / 2) {
      halfRef.current = true;
      setHalfBanner(true);
      const id = window.setTimeout(() => setHalfBanner(false), 6000);
      return () => window.clearTimeout(id);
    }
  }, [stage, remaining]);

  // human nurturer "speaking" shimmer
  useEffect(() => {
    if (stage !== "live" || isAI) return;
    const id = window.setInterval(() => setHumanSpeaking(Math.random() > 0.32), 2200);
    return () => window.clearInterval(id);
  }, [stage, isAI]);

  // rotating joke prompt — GPA: laughter makes words stick
  useEffect(() => {
    if (stage !== "live" || isAI) return;
    const id = window.setInterval(() => setJokeIdx((i) => (i + 1) % JOKE_PROMPTS.length), 18000);
    return () => window.clearInterval(id);
  }, [stage, isAI]);

  // attach the camera self-view
  useEffect(() => {
    if (videoRef.current && rec.liveStream) videoRef.current.srcObject = rec.liveStream;
  }, [rec.liveStream]);

  /* ------------------------- AI session runner -------------------------
   * Mirrors what a human nurturer does with the tray: greet, reveal,
   * name the card twice (second time slowly), then ask the owed review
   * questions and wait for the grower's tap. Re-runs on every flow
   * transition; pausing cancels speech and timers. */
  useEffect(() => {
    if (stage !== "live" || !isAI || paused) return;
    let dead = false;
    const timers: number[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((res) => {
        timers.push(window.setTimeout(res, ms));
      });
    const say = async (text: string, rate?: number) => {
      if (dead) return;
      setAiSpeaking(true);
      await speak(text, sessionLang, rate);
      setAiSpeaking(false);
    };

    const run = async () => {
      // greeting on session start — contract greeting for ru/en, else the sibling's hello
      if (!greetedRef.current) {
        greetedRef.current = true;
        const greeting = CUES[targetLang]?.greeting ?? mascot.nativeHello;
        setAiSpeaking(true);
        await speak(greeting, targetLang);
        setAiSpeaking(false);
        if (dead) return;
        if (cues?.begin) {
          await say(cues.begin);
          if (dead) return;
        }
        await sleep(800);
        if (!dead) setFlow((f) => reveal(f));
        return;
      }

      switch (flow.phase) {
        case "ready": {
          await sleep(900);
          if (!dead) setFlow((f) => reveal(f));
          return;
        }
        case "intro": {
          busyRef.current = false;
          const card = currentCard(flow);
          if (!card) return;
          if (cues) {
            await say(cues.listen);
            if (dead) return;
            await sleep(350);
            if (dead) return;
          }
          await say(card.word);
          if (dead) return;
          await sleep(700);
          if (dead) return;
          if (cues) {
            await say(cues.again);
            if (dead) return;
            await sleep(300);
            if (dead) return;
          }
          await say(card.word, 0.7); // slower the second time
          if (dead) return;
          await sleep(1500); // echo space — no pressure to speak
          if (!dead) setFlow((f) => (f.phase === "intro" ? startReview(f) : f));
          return;
        }
        case "review": {
          busyRef.current = false;
          const tgt = reviewTarget(flow);
          if (!tgt) return;
          if (cues) {
            await say(cues.point);
            if (dead) return;
            await sleep(300);
            if (dead) return;
          }
          await say(questionFor(sessionLang, tgt.word));
          // gentle re-ask until the grower taps
          const id = window.setInterval(() => {
            if (!busyRef.current) void say(questionFor(sessionLang, tgt.word));
          }, 10000);
          timers.push(id);
          return;
        }
        case "review-done": {
          await sleep(1400);
          if (!dead) setFlow((f) => reveal(f));
          return;
        }
        case "complete": {
          if (!celebratedRef.current) {
            celebratedRef.current = true;
            await say(cues?.praise ?? mascot.nativeHello);
          }
          return;
        }
      }
    };

    void run();
    return () => {
      dead = true;
      timers.forEach((id) => {
        window.clearTimeout(id);
        window.clearInterval(id);
      });
      stopSpeaking();
      setAiSpeaking(false);
    };
  }, [stage, isAI, paused, flow, sessionLang, targetLang, cues, mascot]);

  // log progress exactly once on END (and stop mic + speech)
  useEffect(() => {
    if (stage !== "end" || loggedRef.current || !profile) return;
    loggedRef.current = true;
    stopSpeaking();
    recStop();
    const mins = Math.max(1, Math.round((TOTAL_SECONDS - remaining) / 60));
    completeActivity(`live-${nurturer.id}-${profile.completed.length}`, mins, points);
  }, [stage, profile, remaining, points, nurturer.id, completeActivity, recStop]);

  // stop any audio when leaving the page
  useEffect(() => () => stopSpeaking(), []);

  /* ----------------------------- handlers ----------------------------- */

  const onReveal = useCallback(() => {
    if (!canReveal(flow)) return;
    setMissId(null);
    setFeedback(null);
    setFlow((f) => reveal(f));
  }, [flow]);

  const onStartReview = useCallback(() => {
    if (flow.introduced === 0 || flow.phase === "review") return;
    setMissId(null);
    setFeedback(null);
    setFlow((f) => startReview(f));
  }, [flow]);

  /** the grower taps the card they think they heard */
  const onStageTap = (card: DeckCard) => {
    if (stage !== "live" || flow.phase !== "review" || feedback) return;
    const tgt = reviewTarget(flow);
    if (!tgt) return;
    busyRef.current = true;
    if (card.id === tgt.id) {
      setPoints((p) => p + 1);
      setFeedback({ id: card.id, kind: "correct" });
      setMissId(null);
      if (isAI) {
        // praise (CUES for ru/en, else replay the word), then advance
        void (async () => {
          setAiSpeaking(true);
          await speak(cues?.praise ?? tgt.word, sessionLang);
          setAiSpeaking(false);
          setFeedback(null);
          setFlow((f) => answerReview(f, true));
        })();
      } else {
        window.setTimeout(() => {
          setFeedback(null);
          setFlow((f) => answerReview(f, true));
        }, 850);
      }
    } else {
      // a miss isn't a failure — the word sinks into the iceberg and resurfaces
      setFeedback({ id: card.id, kind: "wrong" });
      setIceberg(true);
      setMissId(tgt.id);
      if (isAI) {
        void (async () => {
          setAiSpeaking(true);
          await speak(cues?.again ?? tgt.word, sessionLang);
          await speak(tgt.word, sessionLang, 0.7);
          setAiSpeaking(false);
          busyRef.current = false;
        })();
      } else {
        busyRef.current = false;
      }
      window.setTimeout(() => setFeedback(null), 700);
      window.setTimeout(() => setIceberg(false), 2600);
    }
  };

  /** AI mode: replay whatever is currently on the floor */
  const hearAgain = () => {
    const text =
      flow.phase === "review" && target
        ? questionFor(sessionLang, target.word)
        : newest
          ? newest.word
          : CUES[targetLang]?.greeting ?? mascot.nativeHello;
    void speak(text, sessionLang);
  };

  /** language exchange — the grower becomes the nurturer of THEIR strong language */
  const performSwitch = (code: LangCode) => {
    stopSpeaking();
    setSessionLang(code);
    // a fresh language starts at the wall of noise — Meeting 1
    setFlow(createFlow(buildMeetingDeck(code, 1, DECK_SIZE)));
    setFeedback(null);
    setIceberg(false);
    setMissId(null);
    setSwapped((s) => !s);
    setSwitchStep("closed");
    // CONVEX_SYNC: on the Convex backend this swap broadcasts to the remote
    // partner's device in real time; for now both partners share one screen.
  };

  /** consent gate — nothing records until everyone in the room has said yes */
  const requestRecording = useCallback(() => {
    if (rec.status === "recording") return;
    if (recConsented) void recStart(camWanted);
    else setConsentOpen(true);
  }, [rec.status, recConsented, recStart, camWanted]);

  const acceptConsent = useCallback(() => {
    setRecConsented(true); // this session only — never persisted
    setConsentOpen(false);
    void recStart(camWanted);
  }, [recStart, camWanted]);

  if (!profile) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const elapsedMin = Math.max(1, Math.round((TOTAL_SECONDS - remaining) / 60));
  const speaking = isAI ? aiSpeaking : humanSpeaking;

  /* ============================== PRE-JOIN ============================== */
  if (stage === "pre") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-xl"
        >
          <Card className="relative overflow-hidden p-5 text-center sm:p-8">
            <div
              className="orb left-[-80px] top-[-80px] h-[220px] w-[220px]"
              style={{ background: `${isAI ? mascot.color : nurturer.color}33` }}
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">🎥 {t("sessionRoom")}</p>

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", damping: 14 }}
              className="mt-6 flex flex-col items-center gap-2"
            >
              {isAI ? (
                <Portrait mascot={mascot} id={mascot.id} size={120} />
              ) : (
                <Avatar name={nurturer.name} color={nurturer.color} size={96} ring />
              )}
              <h1 className="headline mt-2 flex items-center justify-center gap-2.5 text-3xl">
                {isAI ? mascot.name : nurturer.name}
                {isAI && (
                  <span className="rounded-full bg-lime px-2.5 py-1 font-sans text-[11px] font-extrabold tracking-wide text-canvas">
                    AI
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted">
                {isAI ? `✨ ${mascot.nativeHello}` : `📍 ${nurturer.city}`} · {lang.flag} {lang.name}
              </p>
              <Tag className="mt-1 bg-violet/15 text-violet-soft">🌱 {activity}</Tag>
            </motion.div>

            <div className="mt-8 space-y-3 text-left">
              {(isAI
                ? [
                    ["🤖", `${mascot.name} ${t("sesIntroSpeaksOnly")} ${lang.name} — ${t("sesIntroNeverTired")}`],
                    ["🃏", t("sesIntroDeckAi")],
                    ["👉", t("sesIntroPointTap")],
                  ]
                : [
                    ["🗣️", `${nurturer.name.split(" ")[0]} ${t("sesIntroSpeaksOnly")} ${lang.name} — ${t("sesIntroWallToWindow")}`],
                    ["🃏", t("sesIntroDeckHuman")],
                    ["🎥", t("sesIntroRecordIt")],
                  ]
              ).map(([emoji, text], i) => (
                <motion.div
                  key={emoji}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.45, ease: "easeOut" }}
                  className="flex items-start gap-3 rounded-2xl bg-white/4 px-4 py-3"
                >
                  <span className="text-xl">{emoji}</span>
                  <p className="text-sm leading-relaxed text-muted">{text}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.45 }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              <Pill onClick={() => setStage("live")} className="bg-violet px-6 py-3.5 sm:px-10 sm:py-4 text-lg font-semibold text-white">
                <span style={{ textShadow: "none" }}>▶ {t("start")} · 30:00</span>
              </Pill>
              <p className="text-xs text-muted">Demo: inside the room, hit ⚡ ×60 to fast-forward the clock.</p>{/* demo toggle copy — left as-is per task */}
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ================================ END ================================ */
  if (stage === "end") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-xl"
        >
          <Card className="relative overflow-hidden p-5 text-center sm:p-8">
            <div className="orb right-[-90px] top-[-90px] h-[240px] w-[240px] bg-lime/20" />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 12 }}
              className="flex justify-center"
            >
              {isAI ? <Portrait mascot={mascot} id={mascot.id} size={150} /> : <Mascot size={150} mood="cheer" />}
            </motion.div>
            <h1 className="headline mt-4 text-4xl">{t("done")} 🎉</h1>
            <p className="mt-2 text-sm text-muted">
              {t("sesEndAnother")} {elapsedMin} {t("minutes")} {t("sesEndLivedInside")} {sessionLangInfo.flag} {sessionLangInfo.name} —{" "}
              {flow.introduced} {t("sesEndCardsMet")}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["⏱️", String(elapsedMin), t("minutes")],
                ["🃏", String(points), t("words")],
                ["🔥", String(profile.streak), t("dayStreak")],
              ].map(([emoji, num, label], i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.45, ease: "easeOut" }}
                  className="rounded-2xl bg-white/4 px-3 py-4"
                >
                  <p className="text-xl">{emoji}</p>
                  <p className="font-display text-2xl font-extrabold">{num}</p>
                  <p className="text-[11px] text-muted">{label}</p>
                </motion.div>
              ))}
            </div>

            {rec.clip && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-6 rounded-2xl bg-white/4 p-4 text-left"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  🎥 {t("sesPictureDictYours")}
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {rec.clip.hasVideo ? (
                    <video src={rec.clip.url} controls className="h-32 rounded-xl bg-black/40" />
                  ) : (
                    <audio src={rec.clip.url} controls className="w-full sm:flex-1" />
                  )}
                  <a
                    href={rec.clip.url}
                    download={rec.clip.filename}
                    className="pill shrink-0 gap-2 bg-white/8 px-4 py-2.5 text-xs font-semibold text-ink"
                  >
                    <Download size={14} /> {rec.clip.filename}
                  </a>
                </div>
                <p className="mt-3 rounded-xl bg-white/4 px-3 py-2 text-xs leading-relaxed text-muted">
                  🌀 {t("sesRelivingLoopLead")}{" "}
                  <span className="font-semibold text-ink">{t("sesRelivingLoopPoint")}</span> {t("sesRelivingLoopTail")}
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                href="/schedule"
                className="pill bg-violet px-7 py-3.5 font-semibold text-white"
                style={{ boxShadow: "var(--shadow-glow-violet)" }}
              >
                📅 {t("schedule")}
              </Link>
              <Link href="/dashboard" className="pill bg-white/8 px-7 py-3.5 font-semibold text-ink">
                {t("dashboard")} →
              </Link>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* =============================== IN-CALL ============================== */
  const accent = isAI ? mascot.color : nurturer.color;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-4">
      {/* ------------------------------ room ------------------------------ */}
      <div
        className="card relative overflow-hidden"
        style={{
          background: `radial-gradient(120% 100% at 50% 0%, ${accent}2e, transparent 60%), linear-gradient(180deg, #17171d, #121217)`,
        }}
      >
        {/* top bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (rec.status === "recording" ? rec.stop() : requestRecording())}
              title={
                rec.status === "recording"
                  ? t("sesStopRecording")
                  : recConsented
                    ? t("sesStartRecordingMic")
                    : t("sesRecordingAsksConsent")
              }
              className={`pill flex items-center gap-2 px-4 py-1.5 text-xs font-bold backdrop-blur ${
                rec.status === "recording" ? "bg-black/45 text-ink" : "bg-black/30 text-muted"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${rec.status === "recording" ? "animate-pulse bg-coral" : "bg-white/25"}`}
              />
              {t("sesRecLabel")}{rec.status === "recording" ? ` ${fmtClock(rec.elapsed)}` : ""}
            </button>
            {recConsented && (
              <span
                title={t("sesConsentGivenTip")}
                className="pill flex items-center gap-1 bg-black/30 px-2.5 py-1.5 text-[10px] font-bold text-lime backdrop-blur"
              >
                <ShieldCheck size={12} /> {t("sesConsented")}
              </span>
            )}
          </div>
          <Tag className="hidden bg-black/45 text-ink backdrop-blur sm:inline-flex">🌱 {activity}</Tag>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFast((f) => !f)}
              title="Demo speed"
              className={`pill px-3 py-1.5 text-xs font-bold ${fast ? "bg-lemon text-canvas" : "bg-black/45 text-muted backdrop-blur"}`}
            >
              ⚡ ×60
            </button>
            <div className="pill bg-black/45 px-4 py-1.5 backdrop-blur">
              <span className="font-display text-sm font-bold tabular-nums">
                {mm}:{ss}
              </span>
              <span className="text-xs text-muted">{t("timeLeft")}</span>
            </div>
          </div>
        </div>

        {/* half-time banner */}
        <AnimatePresence>
          {halfBanner && (
            <motion.div
              initial={{ y: -36, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -36, opacity: 0 }}
              transition={{ type: "spring", damping: 18 }}
              className="absolute inset-x-0 top-16 z-30 flex justify-center px-4"
            >
              <div className="pill bg-lemon px-5 py-2.5 text-sm font-bold text-canvas" style={{ boxShadow: "var(--shadow-pop)" }}>
                🔁 {t("sesHalfTime")}{isAI ? ` — ${t("sesHalfTimeAi")}` : ` — ${t("sesHalfTimeHuman")}`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* nurturer header */}
        <div className="flex flex-wrap items-center gap-4 px-4 pb-2 pt-16 sm:px-6 sm:pt-[68px]">
          <motion.div
            animate={speaking ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={speaking ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
            className="rounded-full"
            style={speaking ? { boxShadow: `0 0 56px -8px ${accent}aa` } : undefined}
          >
            {isAI ? (
              <Portrait mascot={mascot} id={mascot.id} size={76} />
            ) : swapped ? (
              <Avatar name={youName} color="#7c5cff" size={72} ring />
            ) : (
              <Avatar name={nurturer.name} color={nurturer.color} size={72} ring />
            )}
          </motion.div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="truncate">{nurturerName}</span>
              {isAI && (
                <span className="rounded-full bg-lime px-2 py-0.5 font-sans text-[10px] font-extrabold tracking-wide text-canvas">
                  AI
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              {isAI ? "✨" : "📍"} {swapped ? t("sesLanguageExchange") : isAI ? "Nuri" : nurturer.city} ·{" "}
              {sessionLangInfo.flag} {sessionLangInfo.name}
            </p>
          </div>
          <div className="hidden sm:flex">
            <Wavebars active={speaking} color={accent} />
          </div>
          <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
            <Tag className="bg-white/6">🪴 {nurturerName} {t("sesNurtures")}</Tag>
            <Tag className="bg-white/6">🌱 {growerName} {t("sesGrows")}</Tag>
            <Tag className="bg-lemon/15 text-lemon">⭐ {points}</Tag>
          </div>
        </div>

        {/* deck progress dots (AI mode has no tray, so show pace here) */}
        {isAI && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2 sm:px-6">
            {flow.deck.map((c, i) => (
              <span
                key={c.id}
                className={`h-2 rounded-full transition-all ${
                  i < flow.introduced ? "w-4 sm:w-5 bg-lime" : "w-2 bg-white/12"
                } ${target?.id === c.id ? "ring-2 ring-amber" : ""}`}
              />
            ))}
            <span className="ml-2 text-[11px] font-semibold text-muted">
              {flow.introduced}/{flow.deck.length}
            </span>
          </div>
        )}

        {/* grower stage — ONLY introduced cards live here */}
        <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            🌱 {t("sesGrowerStage")} · {t("showCards")} {flow.introduced}/{flow.deck.length}
          </p>

          {introduced.length === 0 ? (
            <div className="mt-3 grid h-40 place-items-center rounded-2xl border border-dashed border-line bg-white/3">
              <p className="text-sm text-muted">
                👂 {isAI ? `${mascot.name} ${t("sesGettingFirstCard")}` : t("sesWaitingFirstCard")}
              </p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {introduced.map((c) => {
                const fb = feedback?.id === c.id ? feedback : null;
                const isNewest = flow.phase === "intro" && newest?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onStageTap(c)}
                    disabled={flow.phase !== "review"}
                    className={`relative flex aspect-square items-center justify-center rounded-2xl border text-4xl transition sm:text-5xl ${
                      fb?.kind === "correct"
                        ? "popin border-lime bg-lime/15"
                        : fb?.kind === "wrong"
                          ? "shake border-orange bg-orange/10"
                          : flow.phase === "review"
                            ? "cursor-pointer border-line bg-white/4 hover:border-violet/50 hover:bg-white/8"
                            : isNewest
                              ? "popin border-violet/60 bg-violet/10"
                              : "border-line bg-white/4"
                    }`}
                  >
                    <CardFace itemId={c.id} emoji={c.emoji} imgClassName="h-full w-full rounded-xl p-1.5" />
                    {fb?.kind === "correct" && (
                      <>
                        <span className="popin absolute right-1.5 top-1.5 text-base">✨</span>
                        <span className="popin absolute bottom-1.5 left-1.5 text-sm">✨</span>
                      </>
                    )}
                    {isNewest && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-violet px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* status strip — never shows the written word to the grower */}
          <div className="mt-3 min-h-[40px] rounded-2xl bg-white/4 px-4 py-2.5 text-center">
            {iceberg ? (
              <p className="popin text-xs font-semibold text-orange">
                {t("prcIceberg")} 🧊 — {t("sesMeetItAgain")}{" "}
                {isAI ? `${mascot.name} ${t("sesSaysItOnceMore")}` : t("sesNurturerSaysOnceMore")}
              </p>
            ) : feedback?.kind === "correct" ? (
              <p className="popin text-xs font-semibold text-lime">{t("correct")} ✨</p>
            ) : flow.phase === "review" ? (
              <p className="text-xs text-muted">
                👂 {t("listen")}… 👉 {t("sesTapCardYouHear")} ·{" "}
                <span className="font-semibold text-ink">
                  {reviewAsked + 1}/{flow.reviewTotal}
                </span>
                {flow.fullReview && <span className="ml-1 text-lemon">{t("sesBigRoundEveryCard")}</span>}
              </p>
            ) : flow.phase === "intro" ? (
              <p className="text-xs text-muted">
                👀 {t("sesNewCardJustListen")} 🦜 {t("sesNoPressureSpeak")}
              </p>
            ) : flow.phase === "review-done" ? (
              <p className="popin text-xs font-semibold text-lime">✅ {t("sesRoundCompleteUnlocked")}</p>
            ) : deckDone ? (
              <p className="popin text-xs font-semibold text-lemon">
                🎉 {t("sesDeckCompleteGrower")} — {points} ⭐. {t("sesKeepReviewingOrEnd")}
              </p>
            ) : (
              <p className="text-xs text-muted">🔊 {t("listen")}… 👉</p>
            )}
          </div>
        </div>

        {/* bottom controls */}
        <div className="flex items-center justify-center gap-3 pb-5">
          {isAI && (
            <>
              <Pill
                onClick={() => setPaused((p) => !p)}
                className={`gap-2 px-5 py-2.5 text-sm font-semibold ${paused ? "bg-lime text-canvas" : "bg-white/10 text-ink"}`}
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
                {paused ? t("sesResume") : t("prcPause")}
              </Pill>
              <Pill onClick={hearAgain} className="gap-2 bg-white/10 px-5 py-2.5 text-sm font-semibold text-ink">
                <RotateCcw size={15} /> {t("sesHearAgain")}
              </Pill>
            </>
          )}
          <button
            type="button"
            onClick={() => setStage("end")}
            title={t("endSession")}
            className="pill h-11 gap-2 bg-coral px-5 font-semibold text-white"
          >
            <PhoneOff size={18} />
            <span className="hidden sm:inline">{t("endSession")}</span>
          </button>
        </div>
      </div>

      {/* --------------------- nurturer tray (human mode) --------------------- */}
      {!isAI && (
        <Card className="border border-amber/20 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="bg-amber/15 font-bold text-amber">🤫 {t("sesNurturerOnly")}</Tag>
            <AnimatePresence mode="wait">
              <motion.p
                key={jokeIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="ml-auto rounded-full bg-violet/12 px-3 py-1 text-[11px] font-medium text-violet-soft"
              >
                🎭 {t(`sesJoke${jokeIdx % JOKE_PROMPTS.length}`)}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* the whole deck, nurturer's-eye view */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
            {flow.deck.map((c, i) => {
              const met = i < flow.introduced;
              const isTarget = target?.id === c.id;
              const isNew = flow.phase === "intro" && newest?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 text-center transition ${
                    isTarget
                      ? "border-amber bg-amber/12"
                      : isNew
                        ? "border-violet/60 bg-violet/10"
                        : met
                          ? "border-line bg-white/6"
                          : "border-line bg-white/3 opacity-35"
                  }`}
                  title={c.word}
                >
                  <CardFace itemId={c.id} emoji={c.emoji} className="text-xl leading-none" imgClassName="h-7 w-7 rounded-lg" />
                  <span className="w-full truncate text-[11px] font-medium text-muted">{c.word}</span>
                </div>
              );
            })}
          </div>

          {/* cue box — what the nurturer SAYS ALOUD right now */}
          <div className="mt-4 rounded-2xl bg-white/4 p-4">
            {flow.phase === "intro" && newest ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                    {t("sesSayItTwice")}
                  </p>
                  <p className="headline mt-1 text-2xl">
                    {cues ? `${cues.listen} ` : ""}«{newest.word}»{cues ? ` … ${cues.again} «${newest.word}»` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {newest.emoji} {t("sesInviteEcho")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void speak(newest.word, sessionLang)}
                  title={t("listen")}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet text-white transition hover:scale-105"
                >
                  <Volume2 size={15} />
                </button>
              </div>
            ) : flow.phase === "review" && target ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                    {t("sesAskAloudQuestion")} {reviewAsked + 1}/{flow.reviewTotal}
                    {flow.fullReview ? ` · ${t("sesFullSweep")}` : ""}
                  </p>
                  <p className="headline mt-1 text-2xl">
                    {cues ? `${cues.point} ` : ""}«{questionFor(sessionLang, target.word)}»
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {t("sesAnswerLabel")}: <span className="text-base">{target.emoji}</span>{" "}
                    <span className="font-semibold text-ink">{target.word}</span> — {t("sesHighlightedInTray")}
                    {missId === target.id && (
                      <span className="ml-2 font-semibold text-orange">
                        {t("sesMissReSaySlowly")}: {cues ? `${cues.again} ` : ""}«{target.word}»
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void speak(questionFor(sessionLang, target.word), sessionLang)}
                  title={t("listen")}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet text-white transition hover:scale-105"
                >
                  <Volume2 size={15} />
                </button>
              </div>
            ) : flow.phase === "review-done" ? (
              <p className="text-sm text-lime">
                ✅ {t("sesRoundCompletePraise")}{cues ? `: «${cues.praise}»` : ""}! {t("sesNextCardUnlocked")}
              </p>
            ) : deckDone ? (
              <p className="text-sm text-lemon">
                🎉 {t("sesDeckDoneTray")}{cues ? ` — «${cues.praise}»` : ""}. {t("sesRunFreeRoundsOrEnd")}
              </p>
            ) : flow.phase === "intro" || flow.introduced > 0 ? (
              <p className="text-sm text-muted">{t("sesRevealOrReview")}</p>
            ) : (
              <p className="text-sm text-muted">
                {t("sesRevealFirstToBegin")}{cues ? ` — «${cues.begin}»` : ""}. {t("sesCardOneIsFree")}
              </p>
            )}
          </div>

          {/* tray controls */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Pill
              onClick={onReveal}
              disabled={!canReveal(flow)}
              className="gap-2 bg-violet px-5 py-2.5 text-sm font-semibold text-white"
            >
              {(reviewNeeded || flow.phase === "review") && (
                <ProgressRing value={flow.phase === "review" ? reviewAsked / Math.max(1, flow.reviewTotal) : 0} />
              )}
              🃏 {t("sesRevealNextCard")}
            </Pill>
            <Pill
              onClick={onStartReview}
              disabled={flow.phase === "review" || flow.introduced === 0}
              className="gap-2 bg-lime px-5 py-2.5 text-sm font-semibold text-canvas"
            >
              🔁 {t("sesReviewRound")}
              {reviewNeeded && (
                <span className="rounded-full bg-canvas/15 px-2 py-0.5 text-[11px] font-extrabold">
                  {reviewLen} {reviewLen === 1 ? t("sesAskSingular") : t("sesAskPlural")}
                  {flow.introduced % 3 === 0 ? ` · ${t("sesAllCards")}` : ""}
                </span>
              )}
            </Pill>
            {reviewNeeded && (
              <p className="text-xs text-muted">🔒 {t("sesReviewFirstEarned")}</p>
            )}
            <Pill
              onClick={() => setSwitchStep("confirm")}
              className="sm:ml-auto gap-2 bg-white/8 px-5 py-2.5 text-sm font-semibold text-ink"
            >
              <ArrowLeftRight size={15} /> {t("sesSwitchRoles")}
            </Pill>
          </div>
        </Card>
      )}

      {/* ------------------ recording: talking picture dictionary ------------------ */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold">🎥 {t("sesPictureDict")}</p>
            <p className="text-xs text-muted">
              {t("sesPictureDictBlurb")}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setCamWanted((v) => !v)}
              disabled={rec.status === "recording"}
              title={rec.status === "recording" ? t("sesStopToChangeCamera") : t("sesToggleCamera")}
              className={`grid h-10 w-10 place-items-center rounded-full transition hover:scale-105 disabled:opacity-40 ${
                camWanted ? "bg-violet text-white" : "bg-white/10 text-muted"
              }`}
            >
              {camWanted ? <Video size={17} /> : <VideoOff size={17} />}
            </button>
            {rec.status === "recording" ? (
              <Pill onClick={rec.stop} className="gap-2 bg-coral px-5 py-2.5 text-sm font-semibold text-white">
                <Square size={13} /> {t("sesStop")} · {fmtClock(rec.elapsed)}
              </Pill>
            ) : (
              <Pill
                onClick={requestRecording}
                className="gap-2 bg-white/10 px-5 py-2.5 text-sm font-semibold text-ink"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-coral" /> {rec.clip ? t("sesRecordAgain") : t("sesStartRecording")}
                {camWanted ? ` · ${t("sesMicCam")}` : ` · ${t("sesMic")}`}
              </Pill>
            )}
          </div>
        </div>

        {rec.status === "denied" && (
          <p className="mt-3 rounded-xl bg-orange/10 px-3 py-2 text-xs text-orange">
            🙈 {t("sesPermissionDenied")}
          </p>
        )}
        {rec.status === "unsupported" && (
          <p className="mt-3 rounded-xl bg-orange/10 px-3 py-2 text-xs text-orange">
            {t("sesBrowserCantRecord")}
          </p>
        )}

        {rec.liveStream && (
          <video ref={videoRef} muted autoPlay playsInline className="mt-3 h-28 rounded-xl bg-black/40" />
        )}

        {rec.clip && rec.status !== "recording" && (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            {rec.clip.hasVideo ? (
              <video src={rec.clip.url} controls className="h-32 rounded-xl bg-black/40" />
            ) : (
              <audio src={rec.clip.url} controls className="w-full sm:flex-1" />
            )}
            <a
              href={rec.clip.url}
              download={rec.clip.filename}
              className="pill shrink-0 gap-2 bg-white/8 px-4 py-2.5 text-xs font-semibold text-ink"
            >
              <Download size={14} /> {rec.clip.filename}
            </a>
          </div>
        )}
      </Card>

      {/* ------------------------- single-device banner ------------------------- */}
      {!isAI && (
        <p className="px-1 text-center text-xs text-muted">
          🪑 {t("sesSingleDeviceDemo")}
          {/* CONVEX_SYNC: real-time remote role/deck sync between two devices ships with the Convex backend */}{" "}
          {t("sesRealtimeSyncSoon")}
        </p>
      )}

      {/* --------------------------- consent-first gate --------------------------- */}
      <ConsentDialog
        open={consentOpen}
        human={!isAI}
        camera={camWanted}
        nurturerName={nurturerName}
        growerName={growerName}
        onAccept={acceptConsent}
        onDecline={() => setConsentOpen(false)}
      />

      {/* --------------------------- switch-roles modal --------------------------- */}
      <AnimatePresence>
        {switchStep !== "closed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSwitchStep("closed")}
          >
            <motion.div
              initial={{ scale: 0.94, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6">
                {switchStep === "confirm" ? (
                  <>
                    <h3 className="headline text-2xl">{t("sesSwitchRolesTitle")} 🔁</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {t("sesSwitchRolesLead")}{" "}
                      <span className="font-semibold text-ink">{growerName}</span> {t("sesSwitchRolesBecomesNurturer")}{" "}
                      <span className="font-semibold text-ink">{t("sesSwitchRolesStrongLang")}</span>, {t("sesSwitchRolesAnd")}{" "}
                      <span className="font-semibold text-ink">{nurturerName}</span> {t("sesSwitchRolesBecomesGrower")}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                      <Pill onClick={() => setSwitchStep("closed")} className="bg-white/8 px-5 py-2.5 text-sm font-semibold text-ink">
                        {t("cancel")}
                      </Pill>
                      <Pill onClick={() => setSwitchStep("lang")} className="bg-violet px-5 py-2.5 text-sm font-semibold text-white">
                        {t("continue")} →
                      </Pill>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="headline text-2xl">{t("sesPickNewLang")} 🌍</h3>
                    <p className="mt-2 text-sm text-muted">
                      {t("sesPickNewLangSubA")} {growerName} {t("sesPickNewLangSubB")} {nurturerName} {t("sesPickNewLangSubC")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {FULL_CONTENT_LANGS.map((code) => {
                        const info = langByCode(code);
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => performSwitch(code)}
                            className={`pill px-4 py-2 text-sm font-semibold transition hover:scale-105 ${
                              code === sessionLang ? "bg-violet/20 text-violet-soft" : "bg-white/8 text-ink"
                            }`}
                          >
                            {info.flag} {info.nativeName}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Pill onClick={() => setSwitchStep("closed")} className="bg-white/8 px-5 py-2.5 text-sm font-semibold text-ink">
                        {t("cancel")}
                      </Pill>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      }
    >
      <SessionRoom />
    </Suspense>
  );
}
