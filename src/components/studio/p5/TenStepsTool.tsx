"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import { Check, Play } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDuration, useLibrary, type LibraryItem } from "@/lib/library";
import { FinishBar, RecordingList, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import {
  clarifyReducer,
  clearedSec,
  clearedStretches,
  createFlow,
  isComplete,
  openSitting,
  STRETCH_CHOICES,
  WORK_PER_RECORDED,
  remainingSec,
  type ClarifyAction,
  type ClarifyFlow,
} from "./clarifyFlow";
import {
  discoursesOf,
  EMPTY_TENSTEPS,
  retellQueue,
  TENSTEPS_ID,
  useRetellStore,
  type TenStepsStore,
} from "./discourse";
import { useGapTypes } from "./MarkList";
import { localDay, todayIso, usePersisted } from "./storage";
import { accentBtn, BTN_GHOST, ChoiceChips, MentorCallout, Panel, useDurationWords } from "./ui";
import { LifeQuestions } from "./community/LifeQuestions";
import { ClarifyRoom } from "./tensteps/ClarifyRoom";
import { ContextCard } from "./tensteps/ContextCard";
import { ArrivePanel, CleanPanel, ClockStrip, ListenPanel, SummaryPanel, WrapPanel } from "./tensteps/StagePanels";

/** Who carries each of the ten steps: you alone, or you and your mentor together. */
const TEN_STEP_WHO: GuideStep["who"][] = ["you", "you", "you", "both", "both", "both", "you", "both", "you", "both"];

/**
 * p5-tensteps — The Ten-Step Discourse Session.
 *
 * One imported recording on the table, a mentor across it, and the guide's
 * ten steps as a session that can be closed and picked up again: arrive →
 * first listen → summary → clarify stretch by stretch → clean listen → wrap
 * up with tomorrow's retelling. clarifyFlow.ts decides what happens next;
 * this file only draws the room.
 */
export function TenStepsTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const gapTypes = useGapTypes();
  const words = useDurationWords();
  const { items, ready } = useLibrary({ lang });
  const [store, setStore, storeReady] = usePersisted<TenStepsStore>(TENSTEPS_ID, lang, EMPTY_TENSTEPS);

  const discourses = discoursesOf(items, lang);
  const active = discourses.find((it) => it.id === store.activeId) ?? null;
  const flow: ClarifyFlow | undefined = active ? store.flows[active.id] : undefined;
  const activeId = active?.id ?? null;
  const sitting = flow ? openSitting(flow) : null;
  const [retellStore] = useRetellStore(lang);
  const queue = retellQueue(items, store.flows, lang, todayIso(), retellStore.toldLive);
  const retell = active ? queue.find((entry) => entry.item.id === active.id) : undefined;

  const dispatch = useCallback(
    (action: ClarifyAction) => {
      setStore((prev) => {
        const id = prev.activeId;
        const cur = id ? prev.flows[id] : undefined;
        if (!id || !cur) return prev;
        const next = clarifyReducer(cur, action);
        return next === cur ? prev : { ...prev, flows: { ...prev.flows, [id]: next } };
      });
    },
    [setStore]
  );

  // The session clock: resume on entering the room, bank every few seconds, pause on leaving.
  useEffect(() => {
    if (!storeReady || !activeId) return;
    setStore((prev) => {
      const cur = prev.flows[activeId];
      const open = cur ? openSitting(cur) : null;
      if (!cur || !open) return prev;
      // a sitting left open on an earlier day is over: close it where the clock last counted
      const stale = localDay(open.startedAt) !== todayIso();
      const next = clarifyReducer(cur, stale ? { type: "closeStale" } : { type: "resume", now: Date.now() });
      return { ...prev, flows: { ...prev.flows, [activeId]: next } };
    });
    const tick = window.setInterval(() => dispatch({ type: "tick", now: Date.now() }), 5000);
    const leave = () => dispatch({ type: "pause", now: Date.now() });
    window.addEventListener("pagehide", leave);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [storeReady, activeId, dispatch, setStore]);

  const pick = (item: LibraryItem) =>
    setStore((prev) => ({
      activeId: item.id,
      flows: prev.flows[item.id]
        ? prev.flows
        : { ...prev.flows, [item.id]: createFlow(item.id, item.durationSec) },
    }));

  const steps: GuideStep[] = TEN_STEP_WHO.map((who, i) => ({
    title: t(`st5_tenS${i + 1}`),
    body: t(`st5_tenS${i + 1}b`),
    who,
  }));

  const openMarks = active ? active.marks.filter((m) => !m.resolved).length : 0;

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="🎧" mode="nurturer" />
      <MentorCallout>{t("st5_tenMentor")}</MentorCallout>

      {storeReady && (
        <StepGuide
          steps={steps}
          accent={phase.color}
          title={t("st5_tenGuideTitle")}
          defaultOpen={Object.keys(store.flows).length === 0}
        />
      )}

      {/* step 1: the recording on the table */}
      <Panel title={t("st5_pickTitle")} sub={t("st5_pickSub")}>
        {ready && discourses.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted">{t("st5_pickEmpty")}</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/studio/p5-record" className={BTN_GHOST}>
                {t("st5_pickGoRecord")} →
              </Link>
              <Link href="/studio/p5-media" className={BTN_GHOST}>
                {t("st5_pickGoMedia")} →
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {discourses.map((it) => {
              const f = store.flows[it.id];
              const on = it.id === activeId;
              const flags = it.marks.filter((m) => !m.resolved).length;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => pick(it)}
                    aria-pressed={on}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                      on ? "border-white/50 bg-white/10" : "border-line bg-raised-2 hover:bg-white/5"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{it.title}</span>
                      <span className="block text-xs tabular-nums text-muted">
                        {f ? `${fmtDuration(clearedSec(f))} / ` : ""}
                        {fmtDuration(it.durationSec)}
                        {f && isComplete(f) ? ` · ${t("st5_pickClear")}` : ""}
                        {flags > 0 ? ` · 🚩 ${flags}` : ""}
                      </span>
                    </span>
                    {on && <Check size={16} strokeWidth={3} className="shrink-0 text-mint" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {active && flow && (
        <>
          <ContextCard item={active} flow={flow} lang={lang} accent={phase.color} retell={retell} />
          <LifeQuestions lang={lang} />

          {!sitting ? (
            <Panel
              title={flow.sittings.length === 0 ? t("st5_sitFirst") : t("st5_sitNext")}
              sub={t("st5_sitSub").replace("{n}", words(remainingSec(flow) * WORK_PER_RECORDED))}
            >
              {clearedStretches(flow).length === 0 && flow.durationSec > 0 && (
                <ChoiceChips
                  label={t("st5_sitStretchLen")}
                  value={String(flow.stretchLen)}
                  onChange={(id) => dispatch({ type: "resize", now: Date.now(), stretchLen: Number(id) })}
                  options={STRETCH_CHOICES.map((sec) => ({
                    id: String(sec),
                    label: `${Math.round(sec / 60)} ${t("st5_unitMin")}`,
                  }))}
                />
              )}
              <button type="button" onClick={() => dispatch({ type: "sit", now: Date.now() })} {...accentBtn(phase.color)}>
                <Play size={15} strokeWidth={3} aria-hidden /> {t("st5_sitStart")}
              </button>
            </Panel>
          ) : (
            <section className="space-y-4" aria-label={t("st5_roomLabel")}>
              <ClockStrip flow={flow} dispatch={dispatch} accent={phase.color} />
              {flow.stage === "arrive" && (
                <ArrivePanel lang={lang} accent={phase.color} dispatch={dispatch} retellDue={Boolean(retell?.due)} />
              )}
              {flow.stage === "listen" && (
                <ListenPanel item={active} flow={flow} accent={phase.color} dispatch={dispatch} />
              )}
              {flow.stage === "summary" && (
                <SummaryPanel
                  item={active}
                  flow={flow}
                  lang={lang}
                  accent={phase.color}
                  activityId={activity.id}
                  dispatch={dispatch}
                />
              )}
              {flow.stage === "clarify" && (
                <ClarifyRoom
                  item={active}
                  flow={flow}
                  dispatch={dispatch}
                  accent={phase.color}
                  lang={lang}
                  activityId={activity.id}
                />
              )}
              {flow.stage === "clean" && (
                <CleanPanel item={active} flow={flow} accent={phase.color} dispatch={dispatch} />
              )}
              {flow.stage === "wrap" && (
                <WrapPanel flow={flow} accent={phase.color} openMarks={openMarks} dispatch={dispatch} />
              )}
            </section>
          )}
        </>
      )}

      <Panel title={t("st5_tenRecsTitle")} sub={t("st5_tenRecsSub")}>
        <RecordingList
          filter={{ activityId: activity.id, lang }}
          accent={phase.color}
          gapTypes={gapTypes}
          emptyText={t("st5_tenRecsEmpty")}
        />
      </Panel>

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
