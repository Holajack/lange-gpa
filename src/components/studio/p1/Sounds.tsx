"use client";

import { useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { IcebergToast, ProgressDots, shuffle, type RoundResult } from "@/app/(app)/practice/shared";
import type { LangCode } from "@/lib/types";
import { RecordPanel } from "../RecordPanel";
import { Callout, RecordingList, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import { SOUND_PAIRS, cardById, isAuthored, type P1Card } from "./content";
import {
  ActionButton,
  HearButton,
  Panel,
  PictureFace,
  PictureTile,
  Segmented,
  WordsFinishBar,
  allCards,
  useCredited,
  useLater,
  useMetIds,
  usePersisted,
  useSpeaker,
  wait,
  type TileState,
} from "./shared";

/**
 * Sound Discrimination — "Hear the Difference?" (Phase 1A, listening).
 * Two cue cards whose words sound close. Either point at the one you hear,
 * or say whether two words in a row were the same. Ears first: nothing is
 * written, and nobody has to pronounce anything.
 */

const TRIALS_PER_PAIR = 3;
const PAIRS_PER_ROUND = 4;

interface SoundPair {
  key: string;
  a: P1Card;
  b: P1Card;
}

type Game = "which" | "same";
type Stage = "idle" | "intro" | "ask" | "feedback" | "done";

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? diag : 1 + Math.min(diag, up, prev[j - 1]);
      diag = up;
    }
  }
  return prev[b.length];
}

/** Hand-picked pairs where we authored them; otherwise the deck's closest-spelled early words. */
function findPairs(lang: LangCode): { pairs: SoundPair[]; auto: boolean } {
  if (isAuthored(lang)) {
    const pairs = SOUND_PAIRS[lang]
      .map(([x, y]) => ({ a: cardById(x, lang), b: cardById(y, lang) }))
      .filter((p): p is { a: P1Card; b: P1Card } => Boolean(p.a && p.b))
      .map((p) => ({ key: `${p.a.id}|${p.b.id}`, a: p.a, b: p.b }));
    return { pairs, auto: false };
  }
  const early = allCards(lang).filter((c) => c.meeting <= 20 && c.word.length >= 3);
  const found: SoundPair[] = [];
  const used = new Set<string>();
  for (let i = 0; i < early.length && found.length < 12; i++) {
    for (let j = i + 1; j < early.length; j++) {
      const a = early[i];
      const b = early[j];
      if (used.has(a.id) || used.has(b.id)) continue;
      const wa = a.word.toLocaleLowerCase();
      const wb = b.word.toLocaleLowerCase();
      if (wa === wb || Math.abs(wa.length - wb.length) > 2) continue;
      const d = editDistance(wa, wb);
      if (d === 1 || (d === 2 && Math.min(wa.length, wb.length) >= 6)) {
        found.push({ key: `${a.id}|${b.id}`, a, b });
        used.add(a.id);
        used.add(b.id);
        break;
      }
    }
  }
  return { pairs: found, auto: true };
}

export function Sounds({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const met = useMetIds();
  const { say, busy } = useSpeaker(lang);
  const later = useLater();
  const { ids: credited, credit } = useCredited();
  /** pair keys that still trip this grower — kept per account and per language */
  const [trickyKeys, setTricky] = usePersisted<string[]>(activity.id, lang, []);
  const run = useRef(0);
  const missedPairs = useRef(new Set<string>());
  const trialMissed = useRef(false);

  const { pairs, auto } = useMemo(() => findPairs(lang), [lang]);

  const [game, setGame] = useState<Game>("which");
  const [round, setRound] = useState<SoundPair[]>([]);
  const [pi, setPi] = useState(0);
  const [ti, setTi] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [said, setSaid] = useState<P1Card[]>([]);
  const [hot, setHot] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; kind: "right" | "wrong" } | null>(null);
  const [verdict, setVerdict] = useState<"right" | "wrong" | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [toast, setToast] = useState(false);

  const pair = round[pi];
  const total = round.length * TRIALS_PER_PAIR;

  const ask = (p: SoundPair, g: Game) => {
    trialMissed.current = false;
    setFlash(null);
    setVerdict(null);
    const first = Math.random() < 0.5 ? p.a : p.b;
    if (g === "which") {
      setSaid([first]);
      setStage("ask");
      void say(first.word);
    } else {
      const second = Math.random() < 0.5 ? first : first.id === p.a.id ? p.b : p.a;
      setSaid([first, second]);
      setStage("ask");
      void say([first.word, second.word], 750);
    }
  };

  /** The two cards are met (again) with their pictures before any question — never a first encounter by sound alone. */
  const introduce = async (p: SoundPair, g: Game) => {
    const mine = ++run.current;
    setStage("intro");
    setSaid([]);
    setFlash(null);
    setVerdict(null);
    for (const c of [p.a, p.b]) {
      setHot(c.id);
      const finished = await say(c.word);
      if (!finished || run.current !== mine) return;
      await wait(550);
      if (run.current !== mine) return;
    }
    setHot(null);
    credit([p.a.id, p.b.id]);
    ask(p, g);
  };

  const start = () => {
    const rank = (p: SoundPair) => (met.has(p.a.id) && met.has(p.b.id) ? 0 : 1);
    const hard = shuffle(pairs.filter((p) => trickyKeys.includes(p.key)));
    const rest = shuffle(pairs.filter((p) => !trickyKeys.includes(p.key))).sort(
      (x, y) => rank(x) - rank(y) || Math.max(x.a.meeting, x.b.meeting) - Math.max(y.a.meeting, y.b.meeting)
    );
    // a couple of tricky pairs come back first; the rest of the round is fresh ground
    const next = [...hard.slice(0, 2), ...rest, ...hard.slice(2)].slice(0, PAIRS_PER_ROUND);
    if (next.length === 0) return;
    missedPairs.current = new Set();
    setRound(next);
    setPi(0);
    setTi(0);
    setResults([]);
    void introduce(next[0], game);
  };

  const advance = () => {
    if (!pair) return;
    if (ti + 1 < TRIALS_PER_PAIR) {
      setTi(ti + 1);
      ask(pair, game);
    } else if (pi + 1 < round.length) {
      setPi(pi + 1);
      setTi(0);
      void introduce(round[pi + 1], game);
    } else {
      setStage("done");
      setSaid([]);
      const cleared = round.filter((p) => !missedPairs.current.has(p.key)).map((p) => p.key);
      const missedNow = [...missedPairs.current];
      setTricky((prev) => [...new Set([...prev.filter((k) => !cleared.includes(k)), ...missedNow])]);
    }
  };

  const miss = () => {
    if (pair) missedPairs.current.add(pair.key);
    trialMissed.current = true;
    setToast(true);
    later(() => setToast(false), 1700);
  };

  const pick = (card: P1Card) => {
    if (stage !== "ask" || game !== "which" || flash?.kind === "right") return;
    if (card.id === said[0]?.id) {
      setFlash({ id: card.id, kind: "right" });
      setResults((r) => [...r, trialMissed.current ? "missed" : "correct"]);
      later(advance, 950);
    } else {
      miss();
      setFlash({ id: card.id, kind: "wrong" });
      later(() => {
        setFlash(null);
        void say(said[0]?.word ?? "");
      }, 600);
    }
  };

  const judge = (same: boolean) => {
    if (stage !== "ask" || game !== "same" || said.length < 2) return;
    const right = (said[0].id === said[1].id) === same;
    if (!right) miss();
    setVerdict(right ? "right" : "wrong");
    setResults((r) => [...r, right ? "correct" : "missed"]);
    setStage("feedback");
    if (right) later(advance, 1300);
  };

  const replay = () => {
    if (said.length === 0) return;
    void say(said.map((c) => c.word), 750);
  };

  const switchGame = (g: Game) => {
    run.current += 1;
    setGame(g);
    setStage("idle");
    setRound([]);
    setSaid([]);
    setHot(null);
  };

  const tileState = (c: P1Card): TileState => {
    if (flash?.id === c.id) return flash.kind;
    if (hot === c.id) return "selected";
    return "idle";
  };

  /** in the same/different game: was this card said 1st, 2nd, or both? shown only after answering */
  const order = (c: P1Card): string | null => {
    if (stage !== "feedback") return null;
    const marks = said.map((s, i) => (s.id === c.id ? String(i + 1) : null)).filter(Boolean);
    return marks.length > 0 ? marks.join(" · ") : null;
  };

  const steps: GuideStep[] = [
    { title: t("st1_sndStep1T"), body: t("st1_sndStep1B"), who: "both" },
    { title: t("st1_sndStep2T"), body: t("st1_sndStep2B"), who: "nurturer" },
    { title: t("st1_sndStep3T"), body: t("st1_sndStep3B"), who: "you" },
    { title: t("st1_sndStep4T"), body: t("st1_sndStep4B"), who: "you" },
    { title: t("st1_sndStep5T"), body: t("st1_sndStep5B"), who: "both" },
  ];

  const trickyShown = pairs.filter((p) => trickyKeys.includes(p.key));
  const live = stage === "intro" || stage === "ask" || stage === "feedback";

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="👂" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      {pairs.length === 0 ? (
        <Callout icon="🤝" title={t("st1_sndNoPairsTitle")} tone="warm">
          <p>{t("st1_sndNoPairsBody")}</p>
        </Callout>
      ) : (
        <>
          <Segmented
            label={t("st1_sndGame")}
            value={game}
            onChange={switchGame}
            accent={accent}
            options={[
              { value: "which", label: t("st1_sndWhich"), icon: "👉" },
              { value: "same", label: t("st1_sndSame"), icon: "🟰" },
            ]}
          />

          {auto && (
            <Callout icon="🔎" title={t("st1_sndAutoTitle")}>
              <p>{t("st1_sndAutoBody")}</p>
            </Callout>
          )}

          <Panel title={game === "which" ? t("st1_sndWhichTitle") : t("st1_sndSameTitle")} sub={game === "which" ? t("st1_sndWhichSub") : t("st1_sndSameSub")}>
            {!live && (
              <div className="flex flex-wrap items-center gap-3">
                <ActionButton onClick={start} accent={accent}>
                  {stage === "done" ? t("st1_anotherRound") : t("start")}
                </ActionButton>
                {stage === "done" && <p className="text-sm text-muted">{t("st1_sndDone")}</p>}
              </div>
            )}

            {live && pair && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <HearButton onClick={replay} label={t("tryAgain")} accent={accent} busy={busy} disabled={stage === "intro"} />
                  <p className="min-w-0 flex-1 text-sm font-semibold text-ink" aria-live="polite">
                    {stage === "intro" && t("st1_sndMeet")}
                    {stage === "ask" && (game === "which" ? t("st1_sndPoint") : t("st1_sndSameOrNot"))}
                    {stage === "feedback" && (verdict === "right" ? `✓ ${t("correct")}` : t("st1_sndHearAgain"))}
                  </p>
                </div>

                <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
                  {[pair.a, pair.b].map((c, i) => (
                    <div key={c.id} className="relative">
                      {game === "which" ? (
                        <PictureTile
                          card={c}
                          label={t("st1_picture").replace("{n}", String(i + 1))}
                          state={tileState(c)}
                          disabled={stage !== "ask"}
                          onClick={() => pick(c)}
                          className="w-full"
                          emojiClass="text-6xl"
                        />
                      ) : (
                        <PictureFace
                          card={c}
                          className={`aspect-square w-full border-2 ${hot === c.id || order(c) ? "border-white" : "border-transparent"}`}
                          emojiClass="text-6xl"
                        />
                      )}
                      {order(c) && (
                        <span className="absolute left-2 top-2 rounded-full bg-canvas px-2 py-0.5 text-xs font-black text-ink">{order(c)}</span>
                      )}
                    </div>
                  ))}
                </div>

                {game === "same" && stage === "ask" && (
                  <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
                    <ActionButton onClick={() => judge(true)} accent={accent} quiet>
                      <span aria-hidden>🟰</span> {t("st1_sndBtnSame")}
                    </ActionButton>
                    <ActionButton onClick={() => judge(false)} accent={accent} quiet>
                      <span aria-hidden>↔️</span> {t("st1_sndBtnDifferent")}
                    </ActionButton>
                  </div>
                )}

                {stage === "feedback" && verdict === "wrong" && (
                  <div className="flex justify-center">
                    <ActionButton onClick={advance} accent={accent}>
                      {t("next")}
                    </ActionButton>
                  </div>
                )}

                <ProgressDots total={total} current={results.length} results={results} accent={accent} />
              </div>
            )}
          </Panel>

          {trickyShown.length > 0 && (
            <Panel title={t("st1_sndTrickyTitle")} sub={t("st1_sndTrickySub")}>
              <ul className="flex flex-wrap gap-2">
                {trickyShown.map((p) => (
                  <li key={p.key} className="flex items-center gap-1 rounded-2xl border border-line bg-raised-2 p-1.5">
                    <PictureFace card={p.a} className="h-12 w-12" emojiClass="text-2xl" />
                    <PictureFace card={p.b} className="h-12 w-12" emojiClass="text-2xl" />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}

      <Panel title={t("st1_sndPersonTitle")} sub={t("st1_sndPersonSub")}>
        <RecordPanel
          lang={lang}
          phase={phase.id}
          activityId={activity.id}
          kind="word"
          speaker="nurturer"
          defaultTitle={t("st1_sndRecordName")}
          accent={accent}
          showConsent
        />
        <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} allowWords={false} emptyText={t("st1_sampleEmpty")} />
      </Panel>

      <WordsFinishBar timer={timer} accent={accent} wordIds={credited} />
      <IcebergToast show={toast} />
    </div>
  );
}
