"use client";

/**
 * PlacementCheck — the optional "show us your roots" listening check,
 * offered right after a grower picks a target world in onboarding.
 *
 * A full-screen overlay running placement.ts's gates, comprehension-only:
 * hear the host language, tap the picture. Gate 1 earns a Phase 2 start;
 * passing it offers Gate 2 (where a native question frame exists) for a
 * Phase 3 start. Failing or leaving is never a dead end — the grower simply
 * keeps the Phase 1 start, exactly as if they had skipped.
 *
 * Pure UI state machine over buildGate/scoreGate; the engine is untouched.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, X } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useApp } from "@/lib/store";
import { langByCode } from "@/lib/languages";
import { speak, stopSpeaking } from "@/lib/tts";
import {
  MAX_REPLAYS_PER_ROUND,
  buildGate,
  gate2Available,
  placementSeed,
  scoreGate,
  type GateId,
  type GateResult,
  type PlacementGate,
  type RoundResult,
} from "@/lib/placement";
import type { LangCode, PhaseId } from "@/lib/types";

type Stage = "intro" | "round" | "bridge" | "result";

export function PlacementCheck({
  lang,
  onDone,
}: {
  lang: LangCode;
  /** null = skipped or failed Gate 1 — the grower keeps the Phase 1 start */
  onDone: (phase: PhaseId | null) => void;
}) {
  const { t } = useApp();
  const native = langByCode(lang).nativeName;

  const [stage, setStage] = useState<Stage>("intro");
  const [gate, setGate] = useState<PlacementGate | null>(null);
  const [roundIx, setRoundIx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [picks, setPicks] = useState<string[]>([]);
  const [replays, setReplays] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  /** highest start already earned this sitting (2 after a Gate 1 pass) */
  const [earned, setEarned] = useState<PhaseId | null>(null);
  const [bridgeScore, setBridgeScore] = useState<GateResult | null>(null);
  const [resultPhase, setResultPhase] = useState<PhaseId | null>(null);

  const advanceTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    []
  );

  // each round speaks itself on arrival — chains play their steps in order
  useEffect(() => {
    if (stage !== "round" || !gate) return;
    const r = gate.rounds[roundIx];
    if (!r) return;
    let cancelled = false;
    void (async () => {
      setPlaying(true);
      for (const u of r.audio) {
        if (cancelled) return;
        await speak(u, lang, 0.9);
      }
      if (!cancelled) setPlaying(false);
    })();
    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [stage, gate, roundIx, lang]);

  const startGate = (id: GateId) => {
    setGate(buildGate(lang, id));
    setRoundIx(0);
    setResults([]);
    setPicks([]);
    setReplays(0);
    setRoundDone(false);
    setWrongId(null);
    setStage("round");
  };

  const replayed = replays >= MAX_REPLAYS_PER_ROUND;

  const replay = () => {
    if (!gate || replayed || playing || roundDone) return;
    setReplays((n) => n + 1);
    const r = gate.rounds[roundIx];
    void (async () => {
      setPlaying(true);
      for (const u of r.audio) await speak(u, lang, 0.9);
      setPlaying(false);
    })();
  };

  const finishGate = (g: PlacementGate, all: RoundResult[]) => {
    const score = scoreGate(g, all);
    if (g.gate === 1) {
      if (score.passed) {
        setEarned(2);
        if (gate2Available(lang)) {
          setBridgeScore(score);
          setStage("bridge");
        } else {
          setResultPhase(2);
          setStage("result");
        }
      } else {
        setResultPhase(null);
        setStage("result");
      }
    } else {
      // a Gate 2 miss keeps the Phase 2 start Gate 1 already earned
      setResultPhase(score.passed ? 3 : 2);
      if (score.passed) setEarned(3);
      setStage("result");
    }
  };

  const record = (g: PlacementGate, correct: boolean) => {
    const round = g.rounds[roundIx];
    const rec: RoundResult = { index: roundIx, kind: round.kind, correct, replayed: replays > 0 };
    const all = [...results, rec];
    setResults(all);
    setRoundDone(true);
    advanceTimer.current = window.setTimeout(() => {
      setRoundDone(false);
      setWrongId(null);
      setPicks([]);
      setReplays(0);
      if (roundIx + 1 < g.rounds.length) setRoundIx((i) => i + 1);
      else finishGate(g, all);
    }, 950);
  };

  const handleTap = (id: string) => {
    if (!gate || roundDone) return;
    const round = gate.rounds[roundIx];
    if (id === round.answer[picks.length]) {
      const nextPicks = [...picks, id];
      setPicks(nextPicks);
      if (nextPicks.length >= round.answer.length) record(gate, true);
    } else {
      setWrongId(id);
      record(gate, false);
    }
  };

  const round = stage === "round" && gate ? gate.rounds[roundIx] : null;
  const instruction =
    round?.kind === "tpr-chain"
      ? t("dshPlTwoSteps")
      : round?.kind === "tpr"
        ? t("dshPlTapAction")
        : t("dshPlTapPicture");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-canvas"
    >
      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-7 sm:px-6">
        {/* leaving keeps whatever start is already earned — never a dead end */}
        <button
          type="button"
          aria-label={t("cancel")}
          onClick={() => onDone(earned)}
          className="pill absolute right-4 top-5 h-10 w-10 bg-white/6 text-muted hover:text-ink"
        >
          <X size={18} />
        </button>

        {/* ============ intro ============ */}
        {stage === "intro" && (
          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="mb-6 flex items-end gap-3">
              <Mascot size={56} mood="think" float={false} className="shrink-0" />
              <div className="rounded-2xl rounded-bl-md border border-line bg-raised px-4 py-2.5 text-sm text-muted">
                {t("dshPlRootsNuri")}
              </div>
            </div>
            <h1 className="headline text-3xl sm:text-4xl">
              {t("dshPlGrownInPre")}
              <span className="text-violet-soft">{native}</span>
              {t("dshPlGrownInPost")}
            </h1>
            <p className="mt-4 leading-relaxed text-muted">
              {t("dshPlIntroBody").replace("{language}", native)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t("dshPlOneReplay")}</p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => startGate(1)}
                className="pill justify-center bg-violet px-8 py-3 font-semibold text-white"
                style={{ boxShadow: "var(--shadow-glow-violet)" }}
              >
                👂 {t("dshPlReadyListen")}
              </button>
              <button
                type="button"
                onClick={() => onDone(null)}
                className="pill justify-center bg-white/6 px-8 py-3 text-sm font-semibold text-muted hover:text-ink"
              >
                {t("dshPlSkipFresh")}
              </button>
            </div>
          </div>
        )}

        {/* ============ one round at a time ============ */}
        {stage === "round" && gate && round && (
          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="mb-5 flex items-center justify-between gap-3 pr-12">
              <p className="headline text-lg">
                {t("dshPlGate")} {gate.gate}{" "}
                <span className="text-sm font-normal text-muted">
                  · {gate.gate === 1 ? t("dshPlWordsByEar") : t("dshPlQuestionsByEar")}
                </span>
              </p>
              <span className="text-xs font-medium text-muted">
                {roundIx + 1} / {gate.rounds.length}
              </span>
            </div>

            <div className="card mb-6 flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{playing ? t("dshPlListening") : instruction}</p>
                <p className="mt-1 text-xs text-muted">
                  {replayed ? t("dshPlNoMoreReplays") : t("dshPlOneReplayIfNeed")}
                </p>
                {round.answer.length > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    {round.answer.map((_, i) => (
                      <span
                        key={i}
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          i < picks.length ? "bg-lime text-canvas" : "bg-white/10 text-muted"
                        }`}
                      >
                        {i + 1}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label={t("tryAgain")}
                onClick={replay}
                disabled={replayed || playing || roundDone}
                className="pill h-12 w-12 shrink-0 bg-violet text-white disabled:pointer-events-none disabled:opacity-35"
                style={!replayed ? { boxShadow: "var(--shadow-glow-violet)" } : undefined}
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div
              className={`grid gap-3 ${round.tiles.length > 4 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}
              key={`${gate.gate}-${roundIx}`}
            >
              {round.tiles.map((tile, i) => {
                const pickedAt = picks.indexOf(tile.id);
                const celebrated = roundDone && pickedAt >= 0;
                return (
                  <motion.button
                    key={tile.id}
                    type="button"
                    initial={{ opacity: 0, y: 18, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.34, ease: [0.2, 0.9, 0.3, 1.3] }}
                    onClick={() => handleTap(tile.id)}
                    disabled={roundDone}
                    className={[
                      "card card-hover relative flex items-center justify-center px-3 py-8 outline-none",
                      wrongId === tile.id ? "shake border-coral/60" : "",
                      pickedAt >= 0 || celebrated ? "border-lime ring-2 ring-lime" : "",
                    ].join(" ")}
                    style={
                      pickedAt >= 0 || celebrated
                        ? { boxShadow: "0 0 46px -12px rgba(184,240,60,0.7)" }
                        : undefined
                    }
                  >
                    <span className="text-6xl leading-none">{tile.emoji}</span>
                    {pickedAt >= 0 && round.answer.length > 1 && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-lime text-xs font-black text-canvas">
                        {pickedAt + 1}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onDone(earned)}
              className="mx-auto mt-8 text-xs font-semibold text-muted hover:text-ink"
            >
              {gate.gate === 2 ? t("dshPlStopKeep").replace("{phase}", "2") : t("dshPlStopPhase1")}
            </button>
          </div>
        )}

        {/* ============ Gate 1 passed — offer Gate 2 ============ */}
        {stage === "bridge" && (
          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="mb-6 flex items-end gap-3">
              <Mascot size={56} mood="cheer" float={false} className="shrink-0" />
              <div className="rounded-2xl rounded-bl-md border border-line bg-raised px-4 py-2.5 text-sm text-muted">
                {t("dshPlBridgeNuri")}
              </div>
            </div>
            <h1 className="headline text-3xl sm:text-4xl">
              {t("dshPlBridgeHeadPre")}
              <span className="text-lime">{t("dshPlBridgeHeadPhase")}</span>
            </h1>
            <p className="mt-4 leading-relaxed text-muted">
              {t("dshPlBridgeBody")
                .replace("{correct}", String(bridgeScore?.correct ?? 0))
                .replace("{total}", String(bridgeScore?.total ?? 0))}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => startGate(2)}
                className="pill justify-center bg-violet px-8 py-3 font-semibold text-white"
                style={{ boxShadow: "var(--shadow-glow-violet)" }}
              >
                👂 {t("dshPlTryGate2")}
              </button>
              <button
                type="button"
                onClick={() => onDone(2)}
                className="pill justify-center bg-lime px-8 py-3 font-bold text-canvas"
              >
                {t("dshPlStartPhase2")} 🌿
              </button>
            </div>
          </div>
        )}

        {/* ============ result ============ */}
        {stage === "result" && (
          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="flex justify-center">
              <Mascot size={120} mood={resultPhase ? "cheer" : "happy"} />
            </div>
            {resultPhase ? (
              <>
                <p className="mt-4 text-center text-sm text-muted">{t("dshPlResultProven")}</p>
                <h1 className="headline mt-2 text-center text-3xl sm:text-4xl">
                  {t("dshPlIcebergStartsAt")}{" "}
                  <span className="text-lime">
                    {t("phaseWord")} {resultPhase}
                  </span>
                </h1>
                <p className="mx-auto mt-4 max-w-md text-center leading-relaxed text-muted">
                  {t("dshPlGardenOpens").replace(
                    "{hour}",
                    String(placementSeed(resultPhase).hoursLogged)
                  )}
                </p>
                {/* honest about today: Phase 2/3 course content is preview-only */}
                <p className="card mx-auto mt-5 max-w-md px-5 py-4 text-center text-sm leading-relaxed text-muted">
                  🌿 {t("dshPlPlacedToday").replace("{phase}", String(resultPhase))}
                </p>
                <button
                  type="button"
                  onClick={() => onDone(resultPhase)}
                  className="pill mx-auto mt-8 justify-center bg-lime px-8 py-3 font-bold text-canvas"
                  style={{ boxShadow: "0 0 50px -12px rgba(184,240,60,0.55)" }}
                >
                  {t("dshPlContinueAs").replace("{phase}", String(resultPhase))} 🌱
                </button>
              </>
            ) : (
              <>
                <p className="mx-auto mt-4 max-w-md text-center leading-relaxed text-muted">
                  {t("dshPlWordsWashed")}
                </p>
                <p className="mt-3 text-center text-sm font-semibold">{t("dshPlPhase1Deepest")}</p>
                <button
                  type="button"
                  onClick={() => onDone(null)}
                  className="pill mx-auto mt-8 justify-center bg-lime px-8 py-3 font-bold text-canvas"
                  style={{ boxShadow: "0 0 50px -12px rgba(184,240,60,0.55)" }}
                >
                  {t("dshPlGrowFromHello")} 🌱
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
