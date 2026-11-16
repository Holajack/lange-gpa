"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowUp, Check, Shuffle } from "lucide-react";
import { useApp } from "@/lib/store";
import { IcebergToast, Phase1BGuard, shuffle } from "@/app/(app)/practice/shared";
import { RecordPanel } from "../RecordPanel";
import { Callout, RecordingList, RehearsalCallout, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import { ladderFrame, ladderPool, type P1Card } from "./content";
import {
  ActionButton,
  HearButton,
  Panel,
  PictureFace,
  PictureTile,
  Segmented,
  WordsFinishBar,
  pickKnown,
  pickOne,
  useCredited,
  useLater,
  useMetIds,
  usePersisted,
  useSpeaker,
} from "./shared";

/**
 * Ladder of Success (Phase 1B — talking begins). Words the grower already
 * understands climb from the ear to the mouth, one rung at a time:
 * understand it → point to it → say it with help → say it alone → say it in a
 * short sentence. The ladder is kept between visits, so the climb is visible.
 *
 * Nuri plays the model and holds the ladder. It cannot hear the grower, so on
 * the speaking rungs the grower records, listens back beside the model, and
 * judges "close enough" — or a nurturer does, the way the real game works.
 */

const RUNGS = [
  { n: 1, icon: "👂", key: "st1_ldR1" },
  { n: 2, icon: "👉", key: "st1_ldR2" },
  { n: 3, icon: "🔊", key: "st1_ldR3" },
  { n: 4, icon: "🗣️", key: "st1_ldR4" },
  { n: 5, icon: "💬", key: "st1_ldR5" },
] as const;

const TOP = RUNGS.length;
const SESSION = 6;
const MAX_TRIES = 3;

/** card id → rung reached (0 = not climbing yet) */
type LadderStore = Record<string, number>;

export function Ladder(props: StudioToolProps) {
  const { t } = useApp();
  const steps: GuideStep[] = [
    { title: t("st1_ldStep1T"), body: t("st1_ldStep1B"), who: "both" },
    { title: t("st1_ldStep2T"), body: t("st1_ldStep2B"), who: "you" },
    { title: t("st1_ldStep3T"), body: t("st1_ldStep3B"), who: "nurturer" },
    { title: t("st1_ldStep4T"), body: t("st1_ldStep4B"), who: "both" },
    { title: t("st1_ldStep5T"), body: t("st1_ldStep5B"), who: "nurturer" },
    { title: t("st1_ldStep6T"), body: t("st1_ldStep6B"), who: "you" },
  ];
  return (
    <div className="space-y-6">
      <StudioHeader phase={props.phase} activity={props.activity} emoji="🪜" mode="either" />
      <StepGuide steps={steps} accent={props.phase.color} />
      {/* talking begins at 1B — the whole ladder waits behind the 1A → 1B gate */}
      <Phase1BGuard>
        <LadderBench {...props} />
      </Phase1BGuard>
    </div>
  );
}

function LadderBench({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const met = useMetIds();
  const { say, busy } = useSpeaker(lang);
  const later = useLater();
  const { ids: credited, credit } = useCredited();
  const [rungs, setStore, loaded] = usePersisted<LadderStore>(activity.id, lang, {});
  const pool = useMemo(() => ladderPool(lang), [lang]);

  const [words, setWords] = useState<P1Card[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [judge, setJudge] = useState<"self" | "nurturer">("self");
  const [heard, setHeard] = useState<P1Card | null>(null);
  const [tries, setTries] = useState(0);
  const [rested, setRested] = useState<string[]>([]);
  const [flash, setFlash] = useState<{ id: string; kind: "right" | "wrong" } | null>(null);
  const [toast, setToast] = useState(false);

  const rungOf = (id: string) => rungs[id] ?? 0;
  const active = words.find((w) => w.id === activeId) ?? null;
  const r = active ? rungOf(active.id) : 0;

  /** Six words for today: the ones already climbing first, then words the grower has met. */
  const deal = (now: Record<string, number>) => {
    const open = pool.filter((c) => (now[c.id] ?? 0) < TOP);
    const going = shuffle(open.filter((c) => (now[c.id] ?? 0) > 0)).slice(0, 4);
    const fresh = pickKnown(open.filter((c) => !going.some((g) => g.id === c.id)), met, SESSION - going.length);
    setWords([...going, ...fresh]);
    setActiveId(null);
    setRested([]);
    setTries(0);
    setHeard(null);
  };

  useEffect(() => {
    if (loaded && words.length === 0) deal(rungs);
    // deal once, when the saved ladder has been read
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  /** Rung 1: is the word you hear the picture you see? */
  const askYesNo = (card: P1Card, truth: boolean) => {
    const others = words.filter((w) => w.id !== card.id);
    const said = truth || others.length === 0 || Math.random() < 0.5 ? card : pickOne(others);
    setHeard(said);
    void say(said.word);
  };

  const begin = (card: P1Card, rung: number, who: "self" | "nurturer") => {
    setTries(0);
    setFlash(null);
    setHeard(null);
    if (who === "nurturer") return; // the person is the voice
    if (rung === 0) askYesNo(card, false);
    else if (rung === 1 || rung === 2) void say(card.word);
    else if (rung === 4) void say(ladderFrame(lang, card.word) ?? card.word);
  };

  const select = (card: P1Card) => {
    setActiveId(card.id);
    begin(card, rungOf(card.id), judge);
  };

  const miss = () => {
    setToast(true);
    later(() => setToast(false), 1700);
  };

  const climb = (card: P1Card) => {
    if (flash) return; // already on its way up
    const next = { ...rungs, [card.id]: Math.min(TOP, rungOf(card.id) + 1) };
    setStore((prev) => ({ ...prev, [card.id]: next[card.id] }));
    credit([card.id]);
    setFlash({ id: card.id, kind: "right" });
    if (judge === "nurturer") {
      later(() => setFlash(null), 900);
      setTries(0);
      return;
    }
    // next turn goes to the weakest word still climbing — not the safest one
    later(() => {
      setFlash(null);
      const open = words.filter((w) => (next[w.id] ?? 0) < TOP && !rested.includes(w.id));
      const others = open.filter((w) => w.id !== card.id);
      const from = others.length > 0 ? others : open;
      if (from.length === 0) {
        setActiveId(null);
        return;
      }
      const lowest = Math.min(...from.map((w) => next[w.id] ?? 0));
      const turn = pickOne(from.filter((w) => (next[w.id] ?? 0) === lowest));
      setActiveId(turn.id);
      begin(turn, next[turn.id] ?? 0, "self");
    }, 1000);
  };

  const answerYesNo = (yes: boolean) => {
    if (!active || !heard || flash) return;
    const isIt = heard.id === active.id;
    if (yes === isIt) {
      if (isIt) climb(active);
      else {
        setHeard(null); // no second answer until the next word is said
        later(() => askYesNo(active, true), 500); // right to say no — now here is the real one
      }
    } else {
      miss();
      setHeard(null);
      later(() => askYesNo(active, true), 800);
    }
  };

  const point = (card: P1Card) => {
    if (!active || flash) return;
    if (card.id === active.id) climb(active);
    else {
      miss();
      setFlash({ id: card.id, kind: "wrong" });
      later(() => {
        setFlash(null);
        void say(active.word);
      }, 650);
    }
  };

  const notYet = () => {
    if (!active) return;
    const n = tries + 1;
    setTries(n);
    if (n >= MAX_TRIES) {
      // three tries is plenty: the word rests, nobody drills it
      setRested((prev) => [...prev, active.id]);
      setActiveId(null);
    }
  };

  const switchJudge = (who: "self" | "nurturer") => {
    setJudge(who);
    if (active) begin(active, rungOf(active.id), who);
  };

  const frame = active ? ladderFrame(lang, active.word) : undefined;
  const speakingRung = r >= 2 && r < TOP;

  return (
    <div className="space-y-6">
      <Segmented
        label={t("st1_ldJudge")}
        value={judge}
        onChange={switchJudge}
        accent={accent}
        options={[
          { value: "self", label: t("st1_withNuri"), icon: "🌱" },
          { value: "nurturer", label: t("st1_withPerson"), icon: "🤝" },
        ]}
      />
      {judge === "self" ? (
        <RehearsalCallout>{t("st1_ldRehearsal")}</RehearsalCallout>
      ) : (
        <Callout icon="🤝" title={t("st1_ldPersonTitle")} tone="warm">
          <p>{t("st1_ldPersonBody")}</p>
        </Callout>
      )}

      <Panel
        title={t("st1_ldBoard")}
        sub={t("st1_ldBoardSub")}
        right={
          <button
            type="button"
            onClick={() => deal(rungs)}
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <Shuffle size={14} strokeWidth={2.5} aria-hidden /> {t("st1_ldDeal")}
          </button>
        }
      >
        <ol className="overflow-hidden rounded-3xl border border-line" reversed>
          {[...RUNGS].reverse().map((rung) => (
            <RungRow
              key={rung.n}
              head={
                <>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold" style={{ background: `color-mix(in srgb, ${accent} 20%, transparent)`, color: accent }}>
                    {rung.n}
                  </span>
                  <span className="min-w-0 text-xs font-semibold leading-tight text-ink">
                    <span aria-hidden>{rung.icon}</span> {t(rung.key)}
                  </span>
                </>
              }
              cards={words.filter((w) => rungOf(w.id) === rung.n)}
              activeId={activeId}
              flashId={flash?.kind === "right" ? flash.id : null}
              rested={rested}
              top={rung.n === TOP}
              onPick={select}
              label={(i) => t("st1_ldCardOnRung").replace("{n}", String(i + 1)).replace("{r}", String(rung.n))}
            />
          ))}
          <RungRow
            head={<span className="text-xs font-semibold text-muted">{t("st1_ldGround")}</span>}
            cards={words.filter((w) => rungOf(w.id) === 0)}
            activeId={activeId}
            flashId={null}
            rested={rested}
            top={false}
            onPick={select}
            label={(i) => t("st1_ldCardOnRung").replace("{n}", String(i + 1)).replace("{r}", "0")}
          />
        </ol>
        {words.length === 0 && loaded && <p className="text-sm text-muted">{t("st1_ldAllTop")}</p>}
      </Panel>

      {active && (
        <Panel
          title={r >= TOP ? t("st1_ldAtTop") : `${t("st1_ldNext")} ${r + 1}. ${t(RUNGS[r].key)}`}
          sub={r >= TOP ? undefined : judge === "nurturer" ? t("st1_ldPersonTurn") : t(`st1_ldTask${r + 1}`)}
        >
          {r < TOP && judge === "self" && r === 0 && (
            <div className="flex flex-col items-center gap-4">
              <PictureFace card={active} className="h-36 w-36" emojiClass="text-7xl" />
              <HearButton onClick={() => heard && void say(heard.word)} label={t("tryAgain")} accent={accent} busy={busy} />
              <div className="grid w-full max-w-xs grid-cols-2 gap-3">
                <ActionButton onClick={() => answerYesNo(true)} accent={accent} quiet>
                  <span aria-hidden>👍</span> {t("st1_ldYes")}
                </ActionButton>
                <ActionButton onClick={() => answerYesNo(false)} accent={accent} quiet>
                  <span aria-hidden>👎</span> {t("st1_ldNo")}
                </ActionButton>
              </div>
            </div>
          )}

          {r < TOP && judge === "self" && r === 1 && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <HearButton onClick={() => void say(active.word)} label={t("tryAgain")} accent={accent} busy={busy} />
              </div>
              <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
                {words.map((w, i) => (
                  <PictureTile
                    key={w.id}
                    card={w}
                    label={t("st1_picture").replace("{n}", String(i + 1))}
                    state={flash?.id === w.id ? flash.kind : "idle"}
                    onClick={() => point(w)}
                  />
                ))}
              </div>
            </div>
          )}

          {r < TOP && (judge === "nurturer" || speakingRung) && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <PictureFace card={active} className="h-28 w-28" emojiClass="text-6xl" />
                {judge === "self" && r === 2 && (
                  <HearButton onClick={() => void say(active.word)} label={t("st1_ldHearModel")} accent={accent} busy={busy} />
                )}
                {judge === "self" && r === 4 && frame && (
                  <HearButton onClick={() => void say(frame)} label={t("st1_ldHearSentence")} accent={accent} busy={busy} />
                )}
              </div>
              {judge === "self" && r === 4 && !frame && (
                <Callout icon="🤝" title={t("st1_ldNoFrameTitle")}>
                  <p>{t("st1_ldNoFrameBody")}</p>
                </Callout>
              )}

              {speakingRung && (
                <RecordPanel
                  key={`${active.id}-${r}-${judge}`}
                  lang={lang}
                  phase={phase.id}
                  activityId={activity.id}
                  kind="word"
                  speaker={judge === "self" ? "me" : "both"}
                  defaultTitle={`${active.emoji} ${t("st1_ldTakeName").replace("{n}", String(r + 1))}`}
                  accent={accent}
                  label={t("st1_ldRecordMe")}
                  showConsent={judge === "nurturer"}
                />
              )}

              {judge === "self" && r >= 3 && (
                <button
                  type="button"
                  onClick={() => void say(r === 4 ? (frame ?? active.word) : active.word)}
                  className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-ink"
                >
                  <span aria-hidden>🔊</span> {t("st1_ldCheckModel")}
                </button>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <ActionButton onClick={() => climb(active)} accent={accent}>
                  {judge === "self" ? <Check size={15} strokeWidth={3} aria-hidden /> : <ArrowUp size={15} strokeWidth={3} aria-hidden />}
                  {judge === "self" ? t("st1_ldCloseEnough") : t("st1_ldMovesUp")}
                </ActionButton>
                <ActionButton onClick={notYet} accent={accent} quiet>
                  {t("st1_ldNotYet")} ({tries}/{MAX_TRIES})
                </ActionButton>
              </div>
            </div>
          )}

          {r >= TOP && <p className="text-sm leading-relaxed text-muted">{t("st1_ldAtTopBody")}</p>}
        </Panel>
      )}

      {!active && rested.length > 0 && (
        <Callout icon="💤" title={t("st1_ldRestTitle")}>
          <p>{t("st1_ldRestBody")}</p>
        </Callout>
      )}

      <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} allowWords={false} title={t("st1_ldTakes")} emptyText={t("st1_ldNoTakes")} />

      <WordsFinishBar timer={timer} accent={accent} wordIds={credited} />
      <IcebergToast show={toast} />
    </div>
  );
}

function RungRow({
  head,
  cards,
  activeId,
  flashId,
  rested,
  top,
  onPick,
  label,
}: {
  head: ReactNode;
  cards: P1Card[];
  activeId: string | null;
  flashId: string | null;
  rested: string[];
  top: boolean;
  onPick: (card: P1Card) => void;
  label: (index: number) => string;
}) {
  return (
    <li className="flex flex-col gap-2 border-b border-line bg-raised-2/60 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex items-center gap-2 sm:w-48 sm:shrink-0">{head}</div>
      <div className={`min-w-0 flex-1 flex-wrap gap-1.5 sm:flex sm:min-h-12 ${cards.length > 0 ? "flex" : "hidden"}`}>
        {cards.map((c, i) => (
          <PictureTile
            key={c.id}
            card={c}
            label={label(i)}
            pressed={activeId === c.id}
            state={flashId === c.id || top ? "right" : activeId === c.id ? "selected" : rested.includes(c.id) ? "dim" : "idle"}
            onClick={() => onPick(c)}
            className="h-12 w-12"
            emojiClass="text-2xl"
          />
        ))}
      </div>
    </li>
  );
}
