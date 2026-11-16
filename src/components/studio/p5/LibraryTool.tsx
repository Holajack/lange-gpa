"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { fmtDuration, logRelisten, updateRecording, useLibrary } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import { FinishBar, RecordingList, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import { useFlows } from "./discourse";
import { addMark, useGapTypes } from "./MarkList";
import { showDay, todayIso, usePersisted } from "./storage";
import { BTN_GHOST, ChoiceChips, Meter, Panel, SegTabs, Stat, useDurationWords } from "./ui";
import { QueuePlayer } from "./library/QueuePlayer";
import { ReadingTab } from "./library/ReadingTab";
import { WordsTab } from "./library/WordsTab";
import {
  buildUnits,
  EMPTY_LIB_STORE,
  sumSeconds,
  tonight,
  withSnapshot,
  type LibStore,
  type Unit,
} from "./library/model";

type Tab = "recordings" | "words" | "reading";
type Scope = "tonight" | "all";

/**
 * p5-library — Listening-Library Review.
 *
 * The phase's honest solo mode: re-listening to what has already been
 * clarified with a person. Tonight's queue, a copy that shrinks as pieces
 * become easy, a word tab that shrinks the same way, and the reading log.
 */
export function LibraryTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const gapTypes = useGapTypes();
  const words = useDurationWords();
  const { items, ready } = useLibrary({ lang });
  const { flows, ready: flowsReady } = useFlows(lang);
  const wordLog = useWordLog(lang);
  const [store, setStore, storeReady] = usePersisted<LibStore>(activity.id, lang, EMPTY_LIB_STORE);
  const [tab, setTab] = useState<Tab>("recordings");
  const [scope, setScope] = useState<Scope>("tonight");
  const [showShelf, setShowShelf] = useState(false);
  const today = todayIso();

  const { units, waiting } = useMemo(() => buildUnits(items, flows, store, lang), [items, flows, store, lang]);
  const lookup = useMemo(() => new Map(units.map((u) => [u.key, u])), [units]);
  const active = units.filter((u) => !u.cold);
  const shelf = units.filter((u) => u.cold);
  const plan = useMemo(() => tonight(units, today), [units, today]);
  const queue = scope === "tonight" ? [...plan.fresh, ...plan.round, ...plan.shelf] : active;
  const activeSec = sumSeconds(active);
  const totalSec = sumSeconds(units);
  const allReady = ready && flowsReady && storeReady;

  // one line a day in the history of the copy
  useEffect(() => {
    if (!allReady) return;
    setStore((prev) => withSnapshot(prev, units, lang, today));
    // the two sums say everything that matters about `units` here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReady, activeSec, totalSec, lang, today, setStore]);

  const onHeard = (unit: Unit) => {
    if (unit.whole) {
      void logRelisten(unit.item.id);
      return;
    }
    setStore((prev) => ({
      ...prev,
      heard: { ...prev.heard, [unit.key]: [...(prev.heard[unit.key] ?? []), new Date().toISOString()] },
    }));
  };

  const onCold = (unit: Unit, cold: boolean) => {
    if (unit.whole) {
      void updateRecording(unit.item.id, { familiar: cold });
      return;
    }
    // a stretch can also be cold because its whole recording was marked familiar elsewhere
    if (!cold && unit.item.familiar) void updateRecording(unit.item.id, { familiar: false });
    setStore((prev) => {
      const next = { ...prev.cold };
      if (cold) next[unit.key] = new Date().toISOString();
      else delete next[unit.key];
      return { ...prev, cold: next };
    });
  };

  const steps: GuideStep[] = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    title: t(`st5_libS${n}`),
    body: t(`st5_libS${n}b`),
    who: "you",
  }));

  const history = store.shrink.filter((s) => s.lang === lang).slice(-8);
  const activeWords = wordLog.words.filter((w) => !w.strong).length;

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="🌙" mode="solo" />
      {storeReady && (
        <StepGuide steps={steps} accent={phase.color} defaultOpen={store.shrink.length === 0} />
      )}

      <SegTabs<Tab>
        label={t("st5_libTabs")}
        accent={phase.color}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "recordings", label: t("stc_tabRecordings"), count: active.length },
          { id: "words", label: t("st5_libTabWords"), count: activeWords },
          { id: "reading", label: t("st5_libTabReading") },
        ]}
      />

      {tab === "recordings" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat value={words(activeSec)} label={t("st5_libCopy")} sub={t("st5_libPieces").replace("{n}", String(active.length))} />
            <Stat value={words(totalSec - activeSec)} label={t("st5_libAside")} sub={t("st5_libPieces").replace("{n}", String(shelf.length))} />
            <div className="col-span-2 sm:col-span-1">
              <Stat value={words(totalSec)} label={t("st5_libWhole")} sub={t("st5_libNothingDeleted")} />
            </div>
          </div>

          <Panel
            title={scope === "tonight" ? t("stc_libTonight") : t("st5_libAllTitle")}
            sub={
              scope === "tonight"
                ? t("st5_libTonightSub")
                    .replace("{fresh}", String(plan.fresh.length))
                    .replace("{round}", String(plan.round.length))
                    .replace("{shelf}", String(plan.shelf.length))
                : t("st5_libAllSub").replace("{n}", words(activeSec))
            }
          >
            <ChoiceChips<Scope>
              label={t("st5_libScope")}
              value={scope}
              onChange={setScope}
              options={[
                { id: "tonight", label: t("stc_libTonight") },
                { id: "all", label: t("st5_libAllTitle") },
              ]}
            />
            {allReady && units.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-muted">{t("st5_libEmpty")}</p>
                <Link href="/studio/p5-tensteps" className={BTN_GHOST}>
                  {t("st5_rtGoClarify")} →
                </Link>
              </div>
            ) : (
              // stays mounted even when the live queue empties, so a pass in progress is never cut off
              <QueuePlayer
                key={scope}
                units={queue}
                lookup={lookup}
                emptyText={scope === "tonight" ? t("st5_libNothingTonight") : t("st5_qEmpty")}
                accent={phase.color}
                onHeard={onHeard}
                onCold={onCold}
                onFlag={(unit, at) => void addMark(unit.item.id, at)}
              />
            )}
          </Panel>

          {history.length > 0 && (
            <Panel title={t("st5_libShrinkTitle")} sub={t("st5_libShrinkSub")}>
              <ul className="space-y-3">
                {history.map((snap) => (
                  <li key={snap.day} className="grid grid-cols-[5.5rem_1fr] items-center gap-3 sm:grid-cols-[7rem_1fr_11rem]">
                    <span className="text-xs tabular-nums text-muted">{showDay(snap.day)}</span>
                    <Meter
                      value={snap.activeSec}
                      max={Math.max(1, snap.totalSec)}
                      accent={phase.color}
                      label={`${showDay(snap.day)}: ${words(snap.activeSec)} / ${words(snap.totalSec)}`}
                    />
                    <span className="col-span-2 text-xs tabular-nums text-muted sm:col-span-1 sm:text-right">
                      {words(snap.activeSec)} / {words(snap.totalSec)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {shelf.length > 0 && (
            <Panel
              title={`${t("st5_libShelfTitle")} · ${shelf.length}`}
              sub={t("st5_libShelfSub")}
              right={
                <button
                  type="button"
                  onClick={() => setShowShelf((v) => !v)}
                  aria-expanded={showShelf}
                  className={BTN_GHOST}
                >
                  {showShelf ? t("st5_hide") : t("st5_show")}
                </button>
              }
            >
              {showShelf && (
                <ul className="space-y-2">
                  {shelf.map((u) => (
                    <li key={u.key} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-2.5">
                      <span className="min-w-0 flex-1 basis-40">
                        <span className="block truncate text-sm font-semibold text-ink">{u.item.title}</span>
                        <span className="block text-xs tabular-nums text-muted">
                          {u.stretchNo
                            ? `${t("st5_stretch")} ${u.stretchNo} · ${fmtDuration(u.start)}–${fmtDuration(u.end)}`
                            : fmtDuration(u.seconds)}
                        </span>
                      </span>
                      <button type="button" onClick={() => onCold(u, false)} className={BTN_GHOST}>
                        ↩ {t("st5_bringBack")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          {waiting.length > 0 && (
            <Panel title={`${t("st5_libWaitingTitle")} · ${waiting.length}`} sub={t("st5_libWaitingSub")}>
              <ul className="space-y-1 text-sm text-ink">
                {waiting.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{it.title}</span>
                    <span className="shrink-0 tabular-nums text-muted">{fmtDuration(it.durationSec)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/studio/p5-tensteps" className={BTN_GHOST}>
                {t("st5_rtGoClarify")} →
              </Link>
            </Panel>
          )}
        </div>
      )}

      {tab === "words" && <WordsTab lang={lang} accent={phase.color} items={items} />}

      {tab === "reading" && (
        <div className="space-y-6">
          <ReadingTab
            lang={lang}
            accent={phase.color}
            activityId={activity.id}
            entries={store.reading}
            onChange={(update) => setStore((prev) => ({ ...prev, reading: update(prev.reading) }))}
          />
          <Panel title={t("st5_rdRecsTitle")}>
            <RecordingList
              filter={{ activityId: activity.id, lang }}
              accent={phase.color}
              gapTypes={gapTypes}
              emptyText={t("st5_rdRecsEmpty")}
            />
          </Panel>
        </div>
      )}

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
