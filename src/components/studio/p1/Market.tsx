"use client";

import { useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { Phase1BGuard } from "@/app/(app)/practice/shared";
import { RecordPanel } from "../RecordPanel";
import { Callout, NeedsPersonCallout, RecordingList, RehearsalCallout, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import { MARKET_STALLS, TENS_VOCAB, isAuthored, marketTurns, pictureCard, type MarketGood, type MarketStall } from "./content";
import { ActionButton, Panel, PictureFace, Segmented, WordsFinishBar, useCredited, useSpeaker, wait } from "./shared";

/**
 * Marketplace Role-Play (late Phase 1B). Stalls with pictured goods and
 * prices, and one whole deal to hear and then take over: greeting, "do you
 * have…?", "how much?", a price, a counter-offer, agreement, paying, thanks.
 *
 * With Nuri it is a rehearsal — Nuri plays the other side from a script and
 * cannot hear what the grower says. The real thing is two people haggling.
 * Turn cues are pictures, never written words.
 */

type Role = "buyer" | "seller";
type Stage = "browse" | "listen" | "role" | "done";

interface Choice {
  stall: MarketStall;
  good: MarketGood;
}

const BUYER = "🧺";

export function Market(props: StudioToolProps) {
  const { t } = useApp();
  const steps: GuideStep[] = [
    { title: t("st1_mkStep1T"), body: t("st1_mkStep1B"), who: "both" },
    { title: t("st1_mkStep2T"), body: t("st1_mkStep2B"), who: "nurturer" },
    { title: t("st1_mkStep3T"), body: t("st1_mkStep3B"), who: "you" },
    { title: t("st1_mkStep4T"), body: t("st1_mkStep4B"), who: "both" },
    { title: t("st1_mkStep5T"), body: t("st1_mkStep5B"), who: "you" },
    { title: t("st1_mkStep6T"), body: t("st1_mkStep6B"), who: "nurturer" },
  ];
  return (
    <div className="space-y-6">
      <StudioHeader phase={props.phase} activity={props.activity} emoji="🛒" mode="either" />
      <StepGuide steps={steps} accent={props.phase.color} />
      {/* a talking game from first turn to last: it opens with 1B */}
      <Phase1BGuard>
        <MarketBench {...props} />
      </Phase1BGuard>
    </div>
  );
}

function MarketBench({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { say, hush, busy } = useSpeaker(lang);
  const { ids: credited, credit } = useCredited();
  const scripted = isAuthored(lang);
  const run = useRef(0);

  const [who, setWho] = useState<"nuri" | "person">(scripted ? "nuri" : "person");
  const [pick, setPick] = useState<Choice | null>(null);
  const [stage, setStage] = useState<Stage>("browse");
  const [role, setRole] = useState<Role>("buyer");
  const [cursor, setCursor] = useState<number | null>(null);

  const goodEmoji = pick ? pictureCard(pick.good.id, lang)?.emoji ?? "🛍️" : "";
  const turns = useMemo(() => (pick ? marketTurns(lang, pick.good, goodEmoji) : []), [pick, lang, goodEmoji]);
  const myTurn = stage === "role" && cursor !== null && turns[cursor]?.who === role;

  const stop = () => {
    run.current += 1;
    hush();
    setCursor(null);
  };

  /** Nuri speaks every turn that is not the grower's, then waits at the grower's. */
  const playFrom = async (from: number, mine: Role | null) => {
    const token = ++run.current;
    for (let i = from; i < turns.length; i++) {
      setCursor(i);
      if (mine && turns[i].who === mine) return;
      const finished = await say(turns[i].line);
      if (!finished || run.current !== token) return;
      await wait(500);
      if (run.current !== token) return;
    }
    setCursor(null);
    setStage("done");
    if (pick) {
      credit([pick.good.id, TENS_VOCAB[pick.good.price], TENS_VOCAB[pick.good.price - 10], "q-how-much"]);
    }
  };

  const choose = (stall: MarketStall, good: MarketGood) => {
    stop();
    setPick({ stall, good });
    setStage("browse");
  };

  const listen = () => {
    setStage("listen");
    void playFrom(0, null);
  };

  const take = (r: Role) => {
    setRole(r);
    setStage("role");
    void playFrom(0, r);
  };

  const switchWho = (w: "nuri" | "person") => {
    stop();
    setWho(w);
    setStage("browse");
  };

  const roleName = (r: Role) => (r === "buyer" ? t("st1_mkBuyer") : t("st1_mkSeller"));

  return (
    <div className="space-y-6">
      {scripted ? (
        <Segmented
          label={t("st1_whoWith")}
          value={who}
          onChange={switchWho}
          accent={accent}
          options={[
            { value: "nuri", label: t("st1_withNuri"), icon: "🌱" },
            { value: "person", label: t("st1_withPerson"), icon: "🤝" },
          ]}
        />
      ) : (
        <Callout icon="🤝" title={t("st1_noVoiceTitle")} tone="warm">
          <p>{t("st1_noVoiceBody")}</p>
        </Callout>
      )}
      {who === "nuri" ? (
        <RehearsalCallout>{t("st1_mkRehearsal")}</RehearsalCallout>
      ) : (
        <NeedsPersonCallout>{t("st1_mkPerson")}</NeedsPersonCallout>
      )}

      <Panel title={t("st1_mkStallsTitle")} sub={t("st1_mkStallsSub")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {MARKET_STALLS.map((stall, s) => (
            <div key={stall.id} className="overflow-hidden rounded-3xl border border-line bg-raised-2/60">
              <div
                className="flex h-9 items-center justify-center text-xl"
                style={{ background: `repeating-linear-gradient(90deg, ${accent} 0 14px, color-mix(in srgb, ${accent} 35%, transparent) 14px 28px)` }}
                aria-hidden
              >
                <span className="rounded-full bg-canvas px-2">{stall.seller}</span>
              </div>
              <ul className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-2">
                {stall.goods.map((good, g) => {
                  const card = pictureCard(good.id, lang);
                  const on = pick?.good.id === good.id;
                  return (
                    <li key={good.id}>
                      <button
                        type="button"
                        onClick={() => choose(stall, good)}
                        aria-pressed={on}
                        aria-label={t("st1_mkGoodAria").replace("{s}", String(s + 1)).replace("{n}", String(g + 1)).replace("{price}", String(good.price))}
                        className={`flex w-full flex-col items-center gap-1 rounded-2xl border-2 p-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-white ${
                          on ? "border-white bg-raised-2" : "border-transparent hover:border-white/20"
                        }`}
                      >
                        {card && <PictureFace card={card} className="aspect-square w-full" emojiClass="text-4xl" />}
                        <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-bold tabular-nums text-ink">
                          <span aria-hidden>🏷️</span> {good.price}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      {pick && (
        <Panel title={t("st1_mkDealTitle")} sub={who === "nuri" ? t("st1_mkDealSubNuri") : t("st1_mkDealSubPerson")}>
          {who === "nuri" && (
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton onClick={listen} accent={accent} disabled={stage === "listen"}>
                <span aria-hidden>👂</span> {t("st1_mkListenAll")}
              </ActionButton>
              <ActionButton onClick={() => take("buyer")} accent={accent} quiet>
                <span aria-hidden>{BUYER}</span> {t("st1_mkBeBuyer")}
              </ActionButton>
              <ActionButton onClick={() => take("seller")} accent={accent} quiet>
                <span aria-hidden>{pick.stall.seller}</span> {t("st1_mkBeSeller")}
              </ActionButton>
            </div>
          )}

          <ol className="space-y-2">
            {turns.map((turn, i) => {
              const here = cursor === i;
              const mine = stage === "role" && turn.who === role;
              const label = `${roleName(turn.who)}: ${t(`st1_mkMove_${turn.move}`)}`;
              return (
                <li
                  key={turn.move}
                  aria-current={here ? "step" : undefined}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${turn.who === "seller" ? "flex-row-reverse" : ""} ${
                    here ? "border-white bg-raised-2" : "border-line"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/6 text-xl" aria-hidden>
                    {turn.who === "buyer" ? BUYER : pick.stall.seller}
                  </span>
                  <span className="rounded-2xl bg-white/6 px-3 py-1.5 text-lg font-bold tabular-nums text-ink" aria-hidden>
                    {turn.cue}
                  </span>
                  <span className="sr-only">{label}</span>
                  {mine && here && <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{t("st1_mkYourTurn")}</span>}
                  <span className="flex-1" />
                  {turn.line && (
                    <button
                      type="button"
                      onClick={() => void say(turn.line)}
                      aria-label={`${t("tryAgain")} · ${label}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/6 text-muted hover:text-ink"
                    >
                      <Volume2 size={16} strokeWidth={2.5} aria-hidden />
                    </button>
                  )}
                </li>
              );
            })}
          </ol>

          {who === "nuri" && myTurn && cursor !== null && (
            <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-line bg-raised-2 p-3" role="status">
              <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{t("st1_mkSayIt")}</p>
              <ActionButton onClick={() => void say(turns[cursor].line)} accent={accent} quiet disabled={busy}>
                <span aria-hidden>🔊</span> {t("st1_mkHelp")}
              </ActionButton>
              <ActionButton onClick={() => void playFrom(cursor + 1, role)} accent={accent}>
                {t("st1_mkSaid")}
              </ActionButton>
            </div>
          )}
          {who === "nuri" && stage === "done" && <p className="text-sm text-muted">{t("st1_mkDone")}</p>}

          <RecordPanel
            key={`${pick.good.id}-${who}`}
            lang={lang}
            phase={phase.id}
            activityId={activity.id}
            kind="feedback"
            speaker={who === "nuri" ? "me" : "both"}
            defaultTitle={`${goodEmoji} ${t("st1_mkTakeName")}`}
            accent={accent}
            label={t("st1_mkRecord")}
            showConsent={who === "person"}
          />
        </Panel>
      )}

      <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} allowWords={false} emptyText={t("st1_mkNoRecordings")} />

      <WordsFinishBar timer={timer} accent={accent} wordIds={credited} />
    </div>
  );
}
