"use client";

/**
 * /session — the live GPA growing-session room.
 * PRE-JOIN → IN-CALL (30-minute countdown, picture-card game, half-time
 * lead switch) → END (progress logged via completeActivity).
 * All practice content stays 100% in the target language: meaning is
 * carried by emoji picture cards + speak() audio, never by translation.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { NURTURERS, nurturerById, nurturersForLang } from "@/lib/nurturers";
import { phaseById } from "@/lib/phases";
import { FULL_CONTENT_LANGS, LANGUAGES, langByCode } from "@/lib/languages";
import { VOCAB_DOMAINS } from "@/lib/vocab";
import { speak, stopSpeaking } from "@/lib/tts";
import { Avatar } from "@/components/Avatar";
import { Mascot } from "@/components/Mascot";
import { Card, Pill, Tag } from "@/components/ui";
import type { LangCode, Nurturer, VocabItem } from "@/lib/types";

const TOTAL_SECONDS = 30 * 60;
const BARS = [14, 26, 18, 32, 22, 28, 16];

/** Nuri — the AI nurturer. Lives in every language; never sleeps. */
const NURI: Nurturer = {
  id: "ai",
  name: "Nuri",
  langs: LANGUAGES.map((l) => l.code),
  city: "LANGE",
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

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function SessionRoom() {
  const { profile, t, completeActivity } = useApp();
  const params = useSearchParams();

  const targetLang: LangCode = profile?.targetLang ?? "es";
  const lang = langByCode(targetLang);
  /** language of the picture-card deck — falls back to Spanish for demo langs without decks */
  const contentLang: LangCode = FULL_CONTENT_LANGS.includes(targetLang) ? targetLang : "es";

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

  /** Nuri, the AI nurturer — same session, tireless host */
  const isAI = nurturer.id === "ai";

  const activity =
    activityParam && activityParam.trim().length > 0
      ? activityParam
      : phaseById(profile?.phase ?? 1).activities[0]?.name ?? "Growing session";

  // ---- room state ----
  const [stage, setStage] = useState<Stage>("pre");
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [fast, setFast] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [nurturerSpeaking, setNurturerSpeaking] = useState(true);
  const [halfBanner, setHalfBanner] = useState(false);

  // ---- picture-card game ----
  const [domain] = useState(() => VOCAB_DOMAINS[Math.floor(Math.random() * VOCAB_DOMAINS.length)]);
  const [deck] = useState<VocabItem[]>(() => shuffle(domain.items.filter((it) => it.words[contentLang])).slice(0, 6));
  const [cardsOpen, setCardsOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<CardFeedback | null>(null);
  const [iceberg, setIceberg] = useState(false);
  const [points, setPoints] = useState(0);

  const halfRef = useRef(false);
  const loggedRef = useRef(false);
  const autoOpenedRef = useRef(false);

  const pickWord = useCallback(() => {
    setTargetId((prev) => {
      const options = deck.filter((c) => c.id !== prev);
      const next = options[Math.floor(Math.random() * options.length)] ?? deck[0];
      return next ? next.id : prev;
    });
  }, [deck]);

  const targetWord = useMemo(
    () => deck.find((c) => c.id === targetId)?.words[contentLang] ?? "",
    [deck, targetId, contentLang]
  );

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

  // half-time lead switch banner
  useEffect(() => {
    if (stage === "live" && !halfRef.current && remaining <= TOTAL_SECONDS / 2) {
      halfRef.current = true;
      setHalfBanner(true);
      const id = window.setTimeout(() => setHalfBanner(false), 6000);
      return () => window.clearTimeout(id);
    }
  }, [stage, remaining]);

  // nurturer "speaking" shimmer
  useEffect(() => {
    if (stage !== "live") return;
    const id = window.setInterval(() => setNurturerSpeaking(Math.random() > 0.32), 2200);
    return () => window.clearInterval(id);
  }, [stage]);

  // with Nuri the card game IS the session — auto-open the panel on start
  useEffect(() => {
    if (stage !== "live" || !isAI || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    pickWord();
    setCardsOpen(true);
  }, [stage, isAI, pickWord]);

  // speak the current card word (on change + every few seconds)
  useEffect(() => {
    if (stage !== "live" || !cardsOpen || !targetWord) return;
    void speak(targetWord, contentLang);
    const id = window.setInterval(() => {
      void speak(targetWord, contentLang);
    }, 8000);
    return () => window.clearInterval(id);
  }, [stage, cardsOpen, targetWord, contentLang]);

  // log progress exactly once on END
  useEffect(() => {
    if (stage !== "end" || loggedRef.current || !profile) return;
    loggedRef.current = true;
    stopSpeaking();
    const mins = Math.max(1, Math.round((TOTAL_SECONDS - remaining) / 60));
    completeActivity(`live-${nurturer.id}-${profile.completed.length}`, mins, points);
  }, [stage, profile, remaining, points, nurturer.id, completeActivity]);

  // stop any audio when leaving the page
  useEffect(() => () => stopSpeaking(), []);

  if (!profile) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const elapsedMin = Math.max(1, Math.round((TOTAL_SECONDS - remaining) / 60));

  const toggleCards = () => {
    if (!cardsOpen && !targetId) pickWord();
    setCardsOpen((o) => !o);
  };

  const onCardClick = (c: VocabItem) => {
    if (!targetId || feedback) return;
    if (c.id === targetId) {
      setPoints((p) => p + 1);
      setFeedback({ id: c.id, kind: "correct" });
      window.setTimeout(() => {
        setFeedback(null);
        pickWord();
      }, 750);
    } else {
      setFeedback({ id: c.id, kind: "wrong" });
      setIceberg(true);
      window.setTimeout(() => setFeedback(null), 650);
      window.setTimeout(() => setIceberg(false), 2400);
    }
  };

  const ctl = "grid h-12 w-12 place-items-center rounded-full transition hover:scale-105 active:scale-95";

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
          <Card className="relative overflow-hidden p-8 text-center sm:p-10">
            <div className="orb left-[-80px] top-[-80px] h-[220px] w-[220px]" style={{ background: `${nurturer.color}33` }} />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">🎥 {t("sessionRoom")}</p>

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", damping: 14 }}
              className="mt-6 flex flex-col items-center gap-2"
            >
              {isAI ? (
                <Mascot size={110} mood="happy" />
              ) : (
                <Avatar name={nurturer.name} color={nurturer.color} size={96} ring />
              )}
              <h1 className="headline mt-2 flex items-center justify-center gap-2.5 text-3xl">
                {nurturer.name}
                {isAI && (
                  <span className="rounded-full bg-lime px-2.5 py-1 font-sans text-[11px] font-extrabold tracking-wide text-canvas">
                    AI
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted">
                {isAI ? "✨" : "📍"} {nurturer.city} · {lang.flag} {lang.name}
              </p>
              <Tag className="mt-1 bg-violet/15 text-violet-soft">🌱 {activity}</Tag>
            </motion.div>

            <div className="mt-8 space-y-3 text-left">
              {(isAI
                ? [
                    ["🤖", `Nuri speaks only ${lang.name} — and never gets tired of repeating.`],
                    ["👉", "You point, act and play. Understanding comes first — no pressure to speak."],
                    ["🃏", "The picture cards open by themselves — with Nuri, the card game IS the session."],
                  ]
                : [
                    ["🗣️", `${nurturer.name.split(" ")[0]} speaks only ${lang.name} — a wall of noise becoming a window.`],
                    ["👉", "You point, act and play. Understanding comes first — no pressure to speak."],
                    ["🎥", "The whole session is recorded so you can re-live it afterwards."],
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
              <Pill
                onClick={() => setStage("live")}
                className="bg-violet px-10 py-4 text-lg font-semibold text-white"
              >
                <span style={{ textShadow: "none" }}>▶ {t("start")} · 30:00</span>
              </Pill>
              <p className="text-xs text-muted">Demo: inside the room, hit ⚡ ×60 to fast-forward the clock.</p>
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
          <Card className="relative overflow-hidden p-8 text-center sm:p-10">
            <div className="orb right-[-90px] top-[-90px] h-[240px] w-[240px] bg-lime/20" />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 12 }}
              className="flex justify-center"
            >
              <Mascot size={150} mood="cheer" />
            </motion.div>
            <h1 className="headline mt-4 text-4xl">{t("done")} 🎉</h1>
            <p className="mt-2 text-sm text-muted">
              Another {elapsedMin} {t("minutes")} lived inside {lang.flag} {lang.name} — recorded for re-living.
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
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-4">
      <div
        className="card relative h-[62vh] min-h-[480px] overflow-hidden"
        style={{
          background: `radial-gradient(120% 100% at 50% 0%, ${nurturer.color}2e, transparent 60%), linear-gradient(180deg, #17171d, #121217)`,
        }}
      >
        {/* top bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-4">
          <div className="pill flex items-center gap-2 bg-black/45 px-4 py-1.5 text-xs font-bold backdrop-blur">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-coral" />
            REC
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
                🔁 Half-time — switch: now YOU lead.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* nurturer tile */}
        <div className="flex h-full flex-col items-center justify-center gap-4 pb-20">
          <motion.div
            animate={nurturerSpeaking ? { scale: [1, 1.025, 1] } : { scale: 1 }}
            transition={nurturerSpeaking ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
            className="rounded-full"
            style={nurturerSpeaking ? { boxShadow: `0 0 70px -10px ${nurturer.color}aa` } : undefined}
          >
            {isAI ? (
              <Mascot size={132} mood="happy" />
            ) : (
              <Avatar name={nurturer.name} color={nurturer.color} size={132} ring />
            )}
          </motion.div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-2 font-display text-xl font-bold">
              {nurturer.name}
              {isAI && (
                <span className="rounded-full bg-lime px-2 py-0.5 font-sans text-[10px] font-extrabold tracking-wide text-canvas">
                  AI
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              {isAI ? "✨" : "📍"} {nurturer.city} · {lang.flag} {lang.name}
            </p>
          </div>
          {/* wavebars */}
          <div className="flex h-10 items-center gap-1.5">
            {BARS.map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full ${nurturerSpeaking ? "wavebar" : ""}`}
                style={{
                  height: nurturerSpeaking ? h : 6,
                  background: nurturerSpeaking ? nurturer.color : "rgba(255,255,255,0.22)",
                  animationDelay: `${i * 0.12}s`,
                  transition: "height 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* self tile */}
        <div
          className={`absolute bottom-24 z-10 w-32 transition-all duration-300 sm:bottom-6 sm:w-36 ${
            cardsOpen ? "right-3 lg:right-[368px]" : "right-3 sm:right-6"
          }`}
        >
          <div className="card flex h-20 flex-col items-center justify-center gap-1 bg-raised-2/90 backdrop-blur sm:h-24">
            {camOn ? (
              <Avatar name={profile.name || "You"} size={34} />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-muted">
                <VideoOff size={16} />
              </span>
            )}
            <p className="text-[11px] font-semibold text-muted">You{!micOn ? " · 🔇" : ""}</p>
          </div>
        </div>

        {/* controls */}
        <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setMicOn((v) => !v)}
            title="Mic"
            className={`${ctl} ${micOn ? "bg-white/12 text-ink backdrop-blur" : "bg-coral text-white"}`}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            type="button"
            onClick={() => setCamOn((v) => !v)}
            title="Camera"
            className={`${ctl} ${camOn ? "bg-white/12 text-ink backdrop-blur" : "bg-coral text-white"}`}
          >
            {camOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <button
            type="button"
            onClick={toggleCards}
            title={t("showCards")}
            className={`${ctl} text-xl ${cardsOpen ? "bg-violet text-white" : "bg-white/12 backdrop-blur"}`}
            style={cardsOpen ? { boxShadow: "var(--shadow-glow-violet)" } : undefined}
          >
            🃏
          </button>
          <button
            type="button"
            onClick={() => setStage("end")}
            title={t("endSession")}
            className="pill h-12 gap-2 bg-coral px-5 font-semibold text-white"
          >
            <PhoneOff size={20} />
            <span className="hidden sm:inline">{t("endSession")}</span>
          </button>
        </div>

        {/* picture-card panel */}
        <AnimatePresence>
          {cardsOpen && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="absolute inset-y-3 right-3 z-30 w-[calc(100%-24px)] max-w-[340px]"
            >
              <div className="card flex h-full flex-col gap-3 overflow-y-auto bg-raised/95 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <p className="font-display text-sm font-bold">
                    {domain.emoji} {t("showCards")}
                  </p>
                  <span className="ml-auto rounded-full bg-lemon/15 px-2.5 py-1 text-xs font-bold text-lemon">⭐ {points}</span>
                  <button
                    type="button"
                    onClick={() => targetWord && void speak(targetWord, contentLang)}
                    title={t("listen")}
                    className="grid h-8 w-8 place-items-center rounded-full bg-violet text-white transition hover:scale-105"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>

                <div className="grid flex-1 grid-cols-2 content-start gap-2.5">
                  {deck.map((c) => {
                    const fb = feedback?.id === c.id ? feedback : null;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onCardClick(c)}
                        className={`relative flex aspect-square items-center justify-center rounded-2xl border text-5xl transition ${
                          fb?.kind === "correct"
                            ? "popin border-lime bg-lime/15"
                            : fb?.kind === "wrong"
                              ? "shake border-coral bg-coral/10"
                              : "border-line bg-white/4 hover:border-violet/50 hover:bg-white/8"
                        }`}
                      >
                        <span aria-hidden>{c.emoji}</span>
                        {fb?.kind === "correct" && (
                          <span className="popin absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-lime text-sm font-bold text-canvas">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-[40px] rounded-2xl bg-white/4 px-3 py-2 text-center">
                  {iceberg ? (
                    <p className="popin text-xs font-semibold text-coral">It&apos;s in your iceberg 🧊 — you&apos;ll meet it again.</p>
                  ) : feedback?.kind === "correct" ? (
                    <p className="popin text-xs font-semibold text-lime">{t("correct")}</p>
                  ) : (
                    <p className="text-xs text-muted">🔊 {t("listen")}… 👉</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
