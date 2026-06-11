"use client";

/**
 * /practice/listening — "Listen & Do" (Total Physical Response)
 * Pure Phase-1 GPA: the nurturer gives a command, the grower ACTS.
 * No speaking, no reading — the body proves the ear understood.
 * After 5 correct answers the nurturer starts chaining two commands.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TPR_COMMANDS } from "@/lib/vocab";
import { speak, stopSpeaking } from "@/lib/tts";
import { useApp } from "@/lib/store";
import { Mascot } from "@/components/Mascot";
import {
  FallbackBanner,
  FinishScreen,
  IcebergToast,
  PracticeHeader,
  ProgressDots,
  ReplayButton,
  shuffle,
  useContentLang,
  type ContentLang,
  type RoundResult,
} from "../shared";

const TOTAL_ROUNDS = 10;
const LEMON = "var(--color-lemon)";

type TprCommand = (typeof TPR_COMMANDS)[number];

interface Round {
  targets: TprCommand[]; // 1 in single mode, 2 in sequence mode
  cards: TprCommand[]; // always 4 action cards
}

function makeRound(sequence: boolean): Round {
  const deck = shuffle(TPR_COMMANDS);
  const targets = deck.slice(0, sequence ? 2 : 1);
  const cards = shuffle(deck.slice(0, 4));
  return { targets, cards };
}

function cmdWord(c: TprCommand, lang: ContentLang): string {
  return c.words[lang] ?? "";
}

export default function ListeningPage() {
  const { lang, fellBack, t } = useContentLang();
  const { completeActivity } = useApp();

  const [roundIx, setRoundIx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [step, setStep] = useState(0); // which target in the sequence we're on
  const [roundDone, setRoundDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [doneIds, setDoneIds] = useState<string[]>([]); // sequence cards already acted

  const advanceTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);
  const loggedRef = useRef(false);

  const finished = roundIx >= TOTAL_ROUNDS;
  const correctCount = results.filter((r) => r === "correct").length;
  // the nurturer chains commands once the grower has proven 5 single ones
  const sequenceMode = correctCount >= 5;

  const round = useMemo(
    () => (finished ? null : makeRound(sequenceMode)),
    [roundIx, sequenceMode, finished] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // speak the command(s) — chained in order for sequence rounds
  const sayRound = useCallback(
    async (r: Round) => {
      for (const c of r.targets) {
        await speak(cmdWord(c, lang), lang);
      }
    },
    [lang]
  );

  useEffect(() => {
    if (round) void sayRound(round);
    return () => stopSpeaking();
  }, [round, sayRound]);

  useEffect(() => {
    if (finished && !loggedRef.current) {
      loggedRef.current = true;
      completeActivity("tpr-listen-do", 10);
    }
  }, [finished, completeActivity]);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    []
  );

  const flagWrong = useCallback(
    (id: string, r: Round) => {
      setMissed(true);
      setWrongId(id);
      setToast(true);
      setStep(0);
      setDoneIds([]);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(false), 1700);
      window.setTimeout(() => setWrongId(null), 650);
      void sayRound(r); // hear the whole chain again
    },
    [sayRound]
  );

  const finishRound = useCallback(() => {
    setRoundDone(true);
    advanceTimer.current = window.setTimeout(() => {
      setResults((prev) => [...prev, missed ? "missed" : "correct"]);
      setRoundIx((i) => i + 1);
      setStep(0);
      setDoneIds([]);
      setRoundDone(false);
      setMissed(false);
    }, 1400);
  }, [missed]);

  const handleAct = useCallback(
    (card: TprCommand) => {
      if (!round || roundDone) return;
      const expected = round.targets[step];
      if (card.id === expected.id) {
        if (step + 1 >= round.targets.length) {
          setDoneIds((prev) => [...prev, card.id]);
          finishRound();
        } else {
          setDoneIds((prev) => [...prev, card.id]);
          setStep((s) => s + 1);
        }
      } else {
        flagWrong(card.id, round);
      }
    },
    [round, roundDone, step, finishRound, flagWrong]
  );

  if (finished) {
    return (
      <div>
        <PracticeHeader emoji="👂" title="Listen & Do" kicker="Total Physical Response" accent={LEMON} />
        <FinishScreen
          title={t("correct")}
          sub="Your body answered before your mouth had to — that's exactly how Phase 1 grows."
          accent={LEMON}
          stats={[
            { value: `${correctCount}/${TOTAL_ROUNDS}`, label: t("correct") },
            { value: "TPR", label: t("listening") },
          ]}
          actions={[
            { href: "/practice/listening", label: `🔁 ${t("repeat")}`, primary: true },
            { href: "/dashboard", label: t("dashboard") },
          ]}
        />
      </div>
    );
  }

  return (
    <div>
      <PracticeHeader emoji="👂" title="Listen & Do" kicker="Total Physical Response" accent={LEMON} />
      <FallbackBanner show={fellBack} />

      <div className="mx-auto max-w-3xl">
        {/* Nuri gives the command */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="card relative mb-6 overflow-hidden px-6 py-5"
        >
          <div className="orb right-[-70px] top-[-90px] h-[200px] w-[200px] bg-lemon/15" />
          <div className="relative flex flex-wrap items-center gap-5">
            <motion.div
              key={roundDone ? "cheer" : "think"}
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: [0.2, 0.9, 0.3, 1.4] }}
            >
              <Mascot size={96} mood={roundDone ? "cheer" : "think"} float={false} />
            </motion.div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">
                {roundDone ? t("correct") : `${t("listen")} → 🫵`}
              </p>
              {round && round.targets.length > 1 && (
                <div className="mt-2 flex items-center gap-2">
                  {round.targets.map((tg, i) => (
                    <span
                      key={tg.id + i}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        doneIds.includes(tg.id) && doneIds.indexOf(tg.id) <= i
                          ? "bg-lime text-canvas"
                          : i === step
                            ? "bg-lemon text-canvas"
                            : "bg-white/10 text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                  ))}
                  <span className="text-xs text-muted">1 → 2</span>
                </div>
              )}
              <p className="mt-2 text-xs text-muted/80">
                {roundIx + 1} / {TOTAL_ROUNDS} {sequenceMode ? "· ⛓️" : ""}
              </p>
            </div>

            <ReplayButton
              label={t("tryAgain")}
              accent={LEMON}
              size={68}
              onClick={() => round && void sayRound(round)}
            />
          </div>
        </motion.div>

        {/* the four actions the grower can DO */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" key={roundIx}>
          {round?.cards.map((card, i) => {
            const acted = doneIds.includes(card.id);
            const celebrated = roundDone && round.targets.some((tg) => tg.id === card.id);
            return (
              <motion.button
                key={card.id}
                type="button"
                initial={{ opacity: 0, y: 18, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.07, duration: 0.38, ease: [0.2, 0.9, 0.3, 1.3] }}
                onClick={() => handleAct(card)}
                disabled={roundDone}
                className={[
                  "card card-hover relative flex flex-col items-center justify-center gap-2 px-3 py-9 outline-none",
                  wrongId === card.id ? "shake border-coral/60" : "",
                  celebrated || acted ? "popin border-lime ring-2 ring-lime" : "",
                ].join(" ")}
                style={
                  celebrated || acted
                    ? { boxShadow: "0 0 46px -12px rgba(184,240,60,0.7)" }
                    : undefined
                }
              >
                <span className="text-6xl leading-none">{card.emoji}</span>
                {(celebrated || acted) && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-lime text-xs font-black text-canvas">
                    ✓
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        <ProgressDots
          total={TOTAL_ROUNDS}
          current={roundIx}
          results={results}
          accent={LEMON}
        />
      </div>

      <IcebergToast show={toast} />
    </div>
  );
}
