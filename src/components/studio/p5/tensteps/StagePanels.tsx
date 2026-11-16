"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Pause, Play } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, logRelisten, type LibraryItem } from "@/lib/library";
import { RecordPanel } from "../../RecordPanel";
import {
  clearedThisSitting,
  clockAdvice,
  isComplete,
  liveSeconds,
  liveSittingSeconds,
  openSitting,
  STAGE_TARGETS,
  stretchSeconds,
  type ClarifyAction,
  type ClarifyFlow,
  type Stage,
} from "../clarifyFlow";
import { SMALL_TALK } from "../content";
import { TAG } from "../discourse";
import { addMark } from "../MarkList";
import { RangePlayer } from "../RangePlayer";
import { addDays, fmtClock, todayIso } from "../storage";
import { accentBtn, BTN_GHOST, BTN_QUIET, ChoiceChips, Field, HostPhrases, INPUT, useDurationWords } from "../ui";

type Dispatch = (action: ClarifyAction) => void;

const RAIL: Stage[] = ["arrive", "listen", "summary", "clarify", "clean", "wrap"];

/** Re-renders once a second so the clock face moves between banked ticks. */
function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return now;
}

/** Where the sitting is, how long it has run, and what the clock suggests. */
export function ClockStrip({ flow, dispatch, accent }: { flow: ClarifyFlow; dispatch: Dispatch; accent: string }) {
  const { t } = useApp();
  const running = flow.clockAt !== null;
  const now = useNow(running);
  const advice = clockAdvice(flow, now);
  const target = STAGE_TARGETS[flow.stage];
  const stageSec = liveSeconds(flow, flow.stage, now);

  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <ol className="no-scrollbar flex gap-2 overflow-x-auto" aria-label={t("st5_railLabel")}>
        {RAIL.map((stage, i) => {
          const at = RAIL.indexOf(flow.stage);
          const on = stage === flow.stage;
          const skipped =
            (stage === "listen" && Boolean(flow.firstListen) && !on) ||
            (stage === "summary" && Boolean(flow.summary) && !on);
          const done = i < at || skipped;
          return (
            <li
              key={stage}
              aria-current={on ? "step" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                on ? "border-white/50 bg-white/15 text-ink" : "border-line text-muted"
              }`}
            >
              {done ? <Check size={12} strokeWidth={3.5} className="text-mint" aria-hidden /> : <span aria-hidden>{i + 1}</span>}
              {t(`st5_stage_${stage}`)}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="headline text-3xl tabular-nums text-ink" aria-live="off">
            {fmtClock(stageSec)}
            {target && (
              <span className="ml-2 text-sm font-semibold text-muted">
                / {Math.round(target[0] / 60)}–{Math.round(target[1] / 60)} {t("st5_unitMin")}
              </span>
            )}
          </p>
          <p className="text-xs text-muted">
            {t(`st5_stage_${flow.stage}`)} · {t("st5_clockSitting")} {fmtClock(liveSittingSeconds(flow, now))}
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: running ? "pause" : "resume", now: Date.now() })}
          aria-pressed={!running}
          className={BTN_GHOST}
        >
          {running ? <Pause size={14} strokeWidth={2.5} aria-hidden /> : <Play size={14} strokeWidth={2.5} aria-hidden />}
          {running ? t("st5_clockPause") : t("st5_clockResume")}
        </button>
      </div>

      {advice && (
        <p className="rounded-2xl border border-amber/40 bg-raised-2 px-4 py-3 text-sm text-ink" role="status">
          ⏱️ {t(`st5_advice_${advice}`)}
        </p>
      )}
      <div aria-hidden className="h-1 w-full rounded-full" style={{ background: accent, opacity: running ? 0.9 : 0.25 }} />
    </div>
  );
}

/* ------------------------------- arrive ------------------------------- */

export function ArrivePanel({
  lang,
  accent,
  dispatch,
  retellDue,
}: {
  lang: LangCode;
  accent: string;
  dispatch: Dispatch;
  retellDue: boolean;
}) {
  const { t } = useApp();
  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-ink">{t("st5_arriveTitle")}</h3>
      <p className="text-sm leading-relaxed text-muted">{t("st5_arriveBody")}</p>
      <HostPhrases title={t("st5_sayIt")} lines={SMALL_TALK} lang={lang} />
      {retellDue && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber/40 bg-raised-2 p-3">
          <p className="min-w-0 flex-1 basis-48 text-sm text-ink">🗣️ {t("st5_arriveRetell")}</p>
          <Link href="/studio/p5-retell" className={BTN_GHOST}>
            {t("st5_ctxRetellGo")} →
          </Link>
        </div>
      )}
      <button type="button" onClick={() => dispatch({ type: "next", now: Date.now() })} {...accentBtn(accent)}>
        {t("st5_arriveNext")} →
      </button>
    </div>
  );
}

/* ----------------------------- first listen ---------------------------- */

const GRASPS = ["0", "1", "2", "3", "4"] as const;

export function ListenPanel({
  item,
  flow,
  accent,
  dispatch,
}: {
  item: LibraryItem;
  flow: ClarifyFlow;
  accent: string;
  dispatch: Dispatch;
}) {
  const { t } = useApp();
  const grasp = flow.firstListen ? String(flow.firstListen.grasp) : null;
  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-ink">{t("st5_listenTitle")}</h3>
      <p className="text-sm leading-relaxed text-muted">{t("st5_listenBody")}</p>
      <RangePlayer
        item={item}
        start={0}
        end={flow.durationSec}
        accent={accent}
        marks={item.marks}
        onFlag={(at) => void addMark(item.id, at)}
        flagLabel={t("st5_roomFlag")}
        pauseOnFlag={false}
        onRangeEnd={() => void logRelisten(item.id)}
      />
      <ChoiceChips
        label={t("st5_listenGrasp")}
        value={grasp as (typeof GRASPS)[number] | null}
        onChange={(id) => dispatch({ type: "grasp", now: Date.now(), grasp: Number(id) })}
        options={GRASPS.map((id) => ({ id, label: t(`st5_grasp_${id}`) }))}
      />
      <button
        type="button"
        disabled={!flow.firstListen}
        onClick={() => dispatch({ type: "next", now: Date.now() })}
        {...accentBtn(accent)}
      >
        {t("st5_listenNext")} →
      </button>
    </div>
  );
}

/* ------------------------------- summary ------------------------------- */

export function SummaryPanel({
  item,
  flow,
  lang,
  accent,
  activityId,
  dispatch,
}: {
  item: LibraryItem;
  flow: ClarifyFlow;
  lang: LangCode;
  accent: string;
  activityId: string;
  dispatch: Dispatch;
}) {
  const { t } = useApp();
  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-ink">{t("st5_sumTitle")}</h3>
      <p className="text-sm leading-relaxed text-muted">{t("st5_sumBody")}</p>
      <RecordPanel
        lang={lang}
        phase={5}
        activityId={activityId}
        kind="expansion"
        defaultTitle={`${t("st5_sumRecTitle")}: ${item.title}`.slice(0, 80)}
        accent={accent}
        speaker="nurturer"
        parentId={item.id}
        tags={[TAG.mentorReply]}
        showConsent
        label={t("st5_sumRec")}
        onSaved={(saved) => dispatch({ type: "summarized", now: Date.now(), responseId: saved.id })}
      />
      {flow.summary?.responseId && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-mint" role="status">
          <Check size={15} strokeWidth={3} aria-hidden /> {t("st5_sumSaved")}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const now = Date.now();
            dispatch({ type: "summarized", now });
            dispatch({ type: "next", now });
          }}
          {...accentBtn(accent)}
        >
          {t("st5_sumNext")} →
        </button>
        <button type="button" onClick={() => dispatch({ type: "next", now: Date.now() })} className={BTN_QUIET}>
          {t("st5_sumSkip")}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- clean listen ---------------------------- */

export function CleanPanel({
  item,
  flow,
  accent,
  dispatch,
}: {
  item: LibraryItem;
  flow: ClarifyFlow;
  accent: string;
  dispatch: Dispatch;
}) {
  const { t } = useApp();
  const todays = clearedThisSitting(flow).sort((a, b) => a.start - b.start);
  const [at, setAt] = useState(0);
  const [rolling, setRolling] = useState(false);
  const sitting = openSitting(flow);
  const current = todays[Math.min(at, Math.max(0, todays.length - 1))];
  const finished = sitting?.cleanListen === "done";

  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-ink">{t("st5_cleanTitle")}</h3>
      <p className="text-sm leading-relaxed text-muted">{t("st5_cleanBody")}</p>
      {current && (
        <>
          <p className="text-xs font-semibold tabular-nums text-muted">
            {t("st5_stretch")} {current.index + 1} · {Math.min(at + 1, todays.length)}/{todays.length}
          </p>
          <RangePlayer
            item={item}
            start={current.start}
            end={current.end}
            accent={accent}
            autoPlay={rolling}
            onTime={() => setRolling(true)}
            onRangeEnd={() => {
              if (at + 1 < todays.length) {
                setAt(at + 1);
              } else {
                setRolling(false);
                void logRelisten(item.id);
                dispatch({ type: "cleanListen", now: Date.now(), how: "done" });
              }
            }}
          />
        </>
      )}
      {finished && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-mint" role="status">
          <Check size={15} strokeWidth={3} aria-hidden /> {t("st5_cleanDone")}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => dispatch({ type: "next", now: Date.now() })} {...accentBtn(accent)}>
          {t("st5_cleanNext")} →
        </button>
        {!finished && (
          <button
            type="button"
            onClick={() => {
              const now = Date.now();
              dispatch({ type: "cleanListen", now, how: "tonight" });
              dispatch({ type: "next", now });
            }}
            className={BTN_QUIET}
          >
            {t("st5_cleanTonight")}
          </button>
        )}
        <button type="button" onClick={() => dispatch({ type: "back", now: Date.now() })} className={BTN_QUIET}>
          ← {t("st5_backToClarify")}
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- wrap -------------------------------- */

export function WrapPanel({
  flow,
  accent,
  openMarks,
  dispatch,
}: {
  flow: ClarifyFlow;
  accent: string;
  /** flagged moments on this recording that are still open */
  openMarks: number;
  dispatch: Dispatch;
}) {
  const { t } = useApp();
  const words = useDurationWords();
  const sitting = openSitting(flow);
  const todays = clearedThisSitting(flow);
  const clearedToday = todays.reduce((sum, s) => sum + stretchSeconds(s), 0);
  const tomorrow = addDays(todayIso(), 1);
  // the retelling is tomorrow's opener unless the grower picks another day
  const retellOn = sitting?.retellOn ?? tomorrow;
  const whole = isComplete(flow);

  const close = () => {
    const now = Date.now();
    if (todays.length > 0 && !sitting?.retellOn) dispatch({ type: "retellOn", now, day: tomorrow });
    dispatch({ type: "close", now });
  };

  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-ink">{t("st5_wrapTitle")}</h3>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: t("st5_wrapStretches"), v: String(todays.length) },
          { k: t("st5_wrapCleared"), v: fmtDuration(clearedToday) },
          { k: t("st5_wrapClarifyTime"), v: words(sitting?.seconds.clarify ?? 0) },
          { k: t("st5_wrapOpen"), v: String(openMarks) },
        ].map((row) => (
          <div key={row.k} className="rounded-2xl border border-line bg-raised-2 p-3">
            <dd className="headline text-xl tabular-nums text-ink">{row.v}</dd>
            <dt className="mt-1 text-xs text-muted">{row.k}</dt>
          </div>
        ))}
      </dl>

      {todays.length > 0 && sitting?.cleanListen !== "done" && (
        <p className="text-sm leading-relaxed text-muted">
          🌙 {t("st5_wrapTonight")}{" "}
          <Link href="/studio/p5-library" className="font-semibold text-ink underline underline-offset-4">
            {t("st5_wrapTonightGo")} →
          </Link>
        </p>
      )}

      {todays.length > 0 && (
        <div className="space-y-3 rounded-3xl border border-line bg-raised-2 p-4">
          <p className="text-sm font-semibold text-ink">{whole ? t("st5_wrapRetellWhole") : t("st5_wrapRetell")}</p>
          <p className="text-sm leading-relaxed text-muted">{t("st5_wrapRetellBody")}</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-52">
              <Field label={t("st5_wrapRetellOn")}>
                <input
                  type="date"
                  value={retellOn}
                  min={todayIso()}
                  onChange={(e) => dispatch({ type: "retellOn", now: Date.now(), day: e.target.value || tomorrow })}
                  className={INPUT}
                />
              </Field>
            </div>
            {retellOn !== tomorrow && (
              <button
                type="button"
                onClick={() => dispatch({ type: "retellOn", now: Date.now(), day: tomorrow })}
                className={BTN_GHOST}
              >
                {t("st5_wrapRetellTomorrow")}
              </button>
            )}
            <span className="flex min-h-10 items-center gap-1.5 text-sm font-semibold text-mint" role="status">
              <Check size={15} strokeWidth={3} aria-hidden /> {t("st5_wrapRetellSet")}
            </span>
          </div>
        </div>
      )}

      <p className="text-sm leading-relaxed text-muted">
        {t("st5_wrapTalk")}{" "}
        <Link href="/studio/p5-epic" className="font-semibold text-ink underline underline-offset-4">
          {t("st5_wrapTalkGo")} →
        </Link>
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={close} {...accentBtn(accent)}>
          {t("st5_wrapClose")}
        </button>
        <button type="button" onClick={() => dispatch({ type: "back", now: Date.now() })} className={BTN_QUIET}>
          ← {t("st5_wrapBack")}
        </button>
      </div>
    </div>
  );
}
