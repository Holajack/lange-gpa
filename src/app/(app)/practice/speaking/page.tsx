"use client";

/**
 * /practice/speaking — "Power Phrases"
 * The grower's eight GPA survival questions — their power tools.
 * "They make every host person your nurturer": armed with these,
 * any patient stranger becomes a language session. Ears first
 * (the text appears only after the first hearing), then the mouth:
 * hold the mic, say it aloud, hear your own attempt back.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { speak, stopSpeaking } from "@/lib/tts";
import { useApp } from "@/lib/store";
import { ProgressBar } from "@/components/ui";
import {
  FallbackBanner,
  FinishScreen,
  PracticeHeader,
  ReplayButton,
  useContentLang,
  type ContentLang,
} from "../shared";

const ORANGE = "var(--color-orange)";

/* ------------------------------ power phrases ----------------------------- */

interface PowerPhrase {
  id: string;
  /** Scene emoji — the picture carries the meaning, never a translation. */
  emoji: string;
  /** ja/zh listed explicitly so this compiles whether or not ContentLang includes them yet. */
  words: Record<ContentLang | "ja" | "zh", string>;
}

/** The 8 GPA power tools — the survival kit of every Phase-1 grower. */
const POWER_PHRASES: PowerPhrase[] = [
  {
    id: "what-is-this",
    emoji: "🫳❓",
    words: {
      es: "¿Qué es esto?",
      ru: "Что это?",
      fr: "Qu'est-ce que c'est ?",
      de: "Was ist das?",
      pt: "O que é isto?",
      it: "Che cos'è questo?",
      ja: "これは何ですか？",
      zh: "这是什么？",
    },
  },
  {
    id: "what-is-that",
    emoji: "👉❓",
    words: {
      es: "¿Qué es eso?",
      ru: "А это что?",
      fr: "Et ça, qu'est-ce que c'est ?",
      de: "Was ist das da?",
      pt: "O que é isso?",
      it: "Che cos'è quello?",
      ja: "あれは何ですか？",
      zh: "那是什么？",
    },
  },
  {
    id: "what-is-he-doing",
    emoji: "🏃❓",
    words: {
      es: "¿Qué está haciendo?",
      ru: "Что он делает?",
      fr: "Qu'est-ce qu'il fait ?",
      de: "Was macht er?",
      pt: "O que ele está fazendo?",
      it: "Che cosa sta facendo?",
      ja: "何をしていますか？",
      zh: "他在做什么？",
    },
  },
  {
    id: "who-is-he",
    emoji: "🧑❓",
    words: {
      es: "¿Quién es él?",
      ru: "Кто он?",
      fr: "Qui est-ce ?",
      de: "Wer ist er?",
      pt: "Quem é ele?",
      it: "Chi è lui?",
      ja: "あの人は誰ですか？",
      zh: "他是谁？",
    },
  },
  {
    id: "i-dont-know",
    emoji: "🤷",
    words: {
      es: "No sé",
      ru: "Я не знаю",
      fr: "Je ne sais pas",
      de: "Ich weiß nicht",
      pt: "Não sei",
      it: "Non lo so",
      ja: "わかりません",
      zh: "我不知道",
    },
  },
  {
    id: "again-please",
    emoji: "🔁",
    words: {
      es: "Otra vez, por favor",
      ru: "Ещё раз, пожалуйста",
      fr: "Encore une fois, s'il vous plaît",
      de: "Noch einmal, bitte",
      pt: "Mais uma vez, por favor",
      it: "Ancora una volta, per favore",
      ja: "もう一度お願いします",
      zh: "请再说一遍",
    },
  },
  {
    id: "slowly-please",
    emoji: "🐢",
    words: {
      es: "Más despacio, por favor",
      ru: "Помедленнее, пожалуйста",
      fr: "Plus lentement, s'il vous plaît",
      de: "Langsamer, bitte",
      pt: "Mais devagar, por favor",
      it: "Più lentamente, per favore",
      ja: "ゆっくりお願いします",
      zh: "请说慢一点",
    },
  },
  {
    id: "what-does-it-mean",
    emoji: "💭",
    words: {
      es: "¿Qué significa?",
      ru: "Что это значит?",
      fr: "Qu'est-ce que ça veut dire ?",
      de: "Was bedeutet das?",
      pt: "O que significa?",
      it: "Che cosa significa?",
      ja: "どういう意味ですか？",
      zh: "是什么意思？",
    },
  },
];

const TOTAL = POWER_PHRASES.length;
const WAVE_HEIGHTS = [12, 26, 18, 34, 22, 30, 14, 24];

type RecState = "idle" | "recording" | "done";

/* ---------------------------------- page ---------------------------------- */

export default function SpeakingPage() {
  const { lang, fellBack, t } = useContentLang();
  const { completeActivity } = useApp();

  const [ix, setIx] = useState(0);
  const [heard, setHeard] = useState(false); // text reveals only after the 1st listen
  const [recState, setRecState] = useState<RecState>("idle");
  const [fallback, setFallback] = useState(false); // mic unavailable → simulated
  const [clipUrl, setClipUrl] = useState<string | null>(null);

  const holdingRef = useRef(false);
  const fallbackRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const clipUrlRef = useRef<string | null>(null);
  const loggedRef = useRef(false);

  const finished = ix >= TOTAL;
  const phrase = finished ? null : POWER_PHRASES[ix];

  /* ------------------------------- audio in ------------------------------- */

  // every phrase enters through the ear first
  useEffect(() => {
    if (!phrase) return;
    let active = true;
    void speak(phrase.words[lang], lang).then(() => {
      if (active) setHeard(true);
    });
    return () => {
      active = false;
      stopSpeaking();
    };
  }, [phrase, lang]);

  const replay = useCallback(() => {
    if (!phrase) return;
    void speak(phrase.words[lang], lang).then(() => setHeard(true));
  }, [phrase, lang]);

  /* ------------------------------- recording ------------------------------ */

  const teardownRecorder = useCallback(() => {
    const rec = recorderRef.current;
    if (rec) {
      rec.ondataavailable = null;
      rec.onstop = null;
      if (rec.state !== "inactive") rec.stop();
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  const startHold = useCallback(async () => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    setRecState("recording");
    setClipUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (fallbackRef.current) return; // simulated mode — wavebars only

    try {
      if (
        typeof MediaRecorder === "undefined" ||
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error("unsupported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!holdingRef.current) {
        // released before permission arrived — hold a touch longer next time
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        if (chunks.length > 0) {
          const url = URL.createObjectURL(
            new Blob(chunks, { type: recorder.mimeType || "audio/webm" })
          );
          setClipUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      };
      recorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
    } catch {
      // permission denied / unsupported — fall back to a simulated take
      fallbackRef.current = true;
      setFallback(true);
    }
  }, []);

  const endHold = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
    recorderRef.current = null;
    streamRef.current = null; // tracks are stopped in onstop
    setRecState("done");
  }, []);

  const playClip = useCallback(() => {
    if (!clipUrl) return;
    const a = new Audio(clipUrl);
    void a.play().catch(() => undefined);
  }, [clipUrl]);

  // keep a ref in sync so unmount cleanup can revoke without re-running
  useEffect(() => {
    clipUrlRef.current = clipUrl;
  }, [clipUrl]);

  useEffect(
    () => () => {
      teardownRecorder();
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    },
    [teardownRecorder]
  );

  /* ------------------------------- progress ------------------------------- */

  const advance = useCallback(() => {
    stopSpeaking();
    holdingRef.current = false;
    teardownRecorder();
    setClipUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRecState("idle");
    setHeard(false);
    setIx((i) => i + 1);
  }, [teardownRecorder]);

  useEffect(() => {
    if (finished && !loggedRef.current) {
      loggedRef.current = true;
      completeActivity("power-phrases", 10);
    }
  }, [finished, completeActivity]);

  /* --------------------------------- views -------------------------------- */

  if (finished) {
    return (
      <div>
        <PracticeHeader
          emoji="🗣️"
          title="Power Phrases"
          kicker="Your power tools — they make every host person your nurturer"
          accent={ORANGE}
        />
        <FinishScreen
          title={t("done")}
          sub="Eight power tools in your pocket — now every patient stranger in the host world can become your nurturer."
          accent={ORANGE}
          stats={[
            { value: `${TOTAL}/${TOTAL}`, label: t("speak") },
            { value: "🔑 ×8", label: "power tools" },
          ]}
          actions={[
            { href: "/practice/speaking", label: `🔁 ${t("repeat")}`, primary: true },
            { href: "/practice", label: t("trainings") },
            { href: "/dashboard", label: t("dashboard") },
          ]}
        />
      </div>
    );
  }

  const recording = recState === "recording";

  return (
    <div>
      <PracticeHeader
        emoji="🗣️"
        title="Power Phrases"
        kicker="Your power tools — they make every host person your nurturer"
        accent={ORANGE}
      />
      <FallbackBanner show={fellBack} />

      <div className="mx-auto max-w-2xl">
        {/* progress across the 8 power tools */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 flex items-center gap-4"
        >
          <span className="whitespace-nowrap rounded-full bg-white/6 px-3.5 py-1.5 text-xs font-bold text-muted">
            🔑 {ix + 1} / {TOTAL}
          </span>
          <ProgressBar value={(ix / TOTAL) * 100} color={ORANGE} height={8} />
        </motion.div>

        {/* the scene — meaning lives in the picture and the sound */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="card relative mb-5 overflow-hidden px-6 py-10 text-center"
        >
          <div className="orb left-[-70px] top-[-90px] h-[210px] w-[210px] bg-orange/15" />
          <div className="relative flex flex-col items-center gap-5">
            <span key={phrase?.id} className="popin text-7xl leading-none lg:text-8xl">
              {phrase?.emoji}
            </span>

            {/* the written phrase appears only AFTER the ear has met it */}
            <div className="flex min-h-[2.75rem] items-center justify-center px-2">
              {heard ? (
                <motion.p
                  key={phrase?.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  className="font-display text-2xl font-extrabold text-orange lg:text-3xl"
                >
                  {phrase ? phrase.words[lang] : ""}
                </motion.p>
              ) : (
                <p className="select-none text-lg tracking-[0.45em] text-muted/50">•••</p>
              )}
            </div>

            <ReplayButton label={t("listen")} accent={ORANGE} size={64} onClick={replay} />
          </div>
        </motion.div>

        {/* the recording booth — hold the mic, say it aloud */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="card relative mb-6 overflow-hidden px-6 py-7"
        >
          <div className="orb right-[-80px] bottom-[-90px] h-[190px] w-[190px] bg-orange/10" />
          <div className="relative flex flex-col items-center gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              🎙️ {t("speak")}
            </p>

            {/* wavebars while recording · playback once a take exists */}
            <div className="flex h-10 items-end justify-center gap-1.5">
              {recording ? (
                WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className="wavebar inline-block w-1.5 rounded-full"
                    style={{ height: h, background: ORANGE, animationDelay: `${i * 0.08}s` }}
                  />
                ))
              ) : clipUrl ? (
                <button
                  type="button"
                  onClick={playClip}
                  className="pill bg-white/8 px-5 py-2 text-sm font-semibold text-ink"
                >
                  ▶ {t("play")} 🎙️
                </button>
              ) : (
                <span className="self-center text-xs text-muted/70">
                  {recState === "done" && !fallback
                    ? "hold a little longer next time 🎙️"
                    : "hold the mic & say it aloud"}
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="hold to record"
              onPointerDown={() => void startHold()}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              onContextMenu={(e) => e.preventDefault()}
              className="pill select-none text-4xl"
              style={{
                width: 96,
                height: 96,
                touchAction: "none",
                background: recording
                  ? `color-mix(in srgb, ${ORANGE} 55%, var(--color-raised-2))`
                  : `color-mix(in srgb, ${ORANGE} 20%, var(--color-raised-2))`,
                boxShadow: recording
                  ? "0 0 70px -6px rgba(255,138,30,0.85)"
                  : "0 0 44px -12px rgba(255,138,30,0.45)",
                transform: recording ? "scale(1.1)" : undefined,
                transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
              }}
            >
              🎙️
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              ⏺ hold to record
            </p>

            {fallback && (
              <p className="rounded-full border border-line bg-white/5 px-4 py-1.5 text-xs text-muted">
                Mic unavailable — saying it out loud still counts 🌱
              </p>
            )}
          </div>
        </motion.div>

        {/* advance — only once the ear has gone first */}
        <div className="flex min-h-[56px] justify-center">
          {heard && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.2, 0.9, 0.3, 1.3] }}
              onClick={advance}
              className="pill bg-orange px-10 py-3.5 text-base font-bold text-canvas"
              style={{ boxShadow: "var(--shadow-glow-orange)" }}
            >
              ✓ {t("next")}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
