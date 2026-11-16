"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLibrary } from "@/lib/library";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { NURI_PROMPTS, SAY_STRIPS, TALK_ASKS, hasP3Content } from "./content";
import { hostSpeech, newId, useHeard, useStudioState } from "./hooks";
import { Disclosure, MassageStatus, MovesBar, Panel, PicStrip, Segmented, toPhrases, usePlayerMoves } from "./shared";
import { TalkThread, type TalkThreadData, type TalkWay } from "./TalkThread";

/**
 * p3-talkmore — Talking More (3C). The grower carries the telling now: a
 * story they massaged, one from their own life, the next part of a long
 * story, an unusual day, or the many things people might say in a situation.
 * The nurturer then tells it back THEIR way, and that host telling is the
 * recording that gets massaged and re-listened. Nuri never produces one.
 */

const WAYS: TalkWay[] = ["retell", "life", "epic", "day", "say"];
const THEIR_KINDS = ["improved", "primary", "imported"] as const;
const MY_KINDS = ["retell", "journal"] as const;

interface TalkState {
  way: TalkWay;
  threads: TalkThreadData[];
  openId: string | null;
}
const EMPTY: TalkState = { way: "retell", threads: [], openId: null };

const field =
  "w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30";

export function TalkMore({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<TalkState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const { all } = useLibrary();
  const asks = useMemo(() => toPhrases(TALK_ASKS, lang, t), [lang, t]);
  const prompts = useMemo(() => toPhrases(NURI_PROMPTS, lang, t), [lang, t]);
  const solo = hasP3Content(lang);

  const [title, setTitle] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [stripId, setStripId] = useState(SAY_STRIPS[0].id);
  const way = state.way;
  /** stories worth telling back: host speech the grower has already worked on elsewhere */
  const sources = useMemo(() => hostSpeech(all, lang).filter((it) => it.activityId !== activity.id), [all, lang, activity.id]);
  const source = sources.find((it) => it.id === sourceId);
  const epicParts = state.threads.filter((x) => x.way === "epic").length;

  const canStart = way === "retell" ? Boolean(source) : way === "say" ? true : Boolean(title.trim());

  const start = () => {
    if (!canStart) return;
    const name = title.trim().slice(0, 70);
    const thread: TalkThreadData = { id: newId("tk"), way, title: name, toldTo: 0 };
    if (way === "retell" && source) {
      thread.title = source.title;
      thread.sourceId = source.id;
    } else if (way === "epic") {
      const part = t("st3_tmPart").replace("{n}", String(epicParts + 1));
      thread.title = name ? `${part}: ${name}` : part;
    } else if (way === "say") {
      thread.strip = stripId;
      thread.title = `${t("st3_tmSayName")} ${SAY_STRIPS.findIndex((s) => s.id === stripId) + 1}`;
    }
    setState((s) => ({ ...s, threads: [thread, ...s.threads], openId: thread.id }));
    setTitle("");
    setSourceId("");
  };
  const patch = (id: string, p: Partial<TalkThreadData>) =>
    setState((s) => ({ ...s, threads: s.threads.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const find = (id?: string) => (id ? all.find((it) => it.id === id) : undefined);

  const steps: GuideStep[] = [
    { title: t("st3_tmS1"), body: t("st3_tmS1b"), who: "you" },
    { title: t("st3_tmS2"), body: t("st3_tmS2b"), who: "you" },
    { title: t("st3_tmS3"), body: t("st3_tmS3b"), who: "nurturer" },
    { title: t("st3_tmS4"), body: t("st3_tmS4b"), who: "both" },
    { title: t("st3_tmS5"), body: t("st3_tmS5b"), who: "you" },
    { title: t("st3_tmS6"), body: t("st3_tmS6b"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🗣️" mode={solo ? "either" : "nurturer"} />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st3_tmNeeds")}</NeedsPersonCallout>

      <Panel step={1} title={t("st3_tmP1")} sub={t("st3_tmP1b")} accent={accent}>
        <Segmented
          label={t("st3_tmWayLabel")}
          value={way}
          onChange={(w) => setState((s) => ({ ...s, way: w }))}
          options={WAYS.map((id) => ({ id, label: t(`st3_tmWay_${id}`) }))}
        />
        <p className="text-sm leading-relaxed text-muted">{t(`st3_tmWayHint_${way}`)}</p>
        {way === "day" && (
          <Callout icon="☝️" title={t("st3_tmDayCareTitle")} tone="warm">
            <p>{t("st3_tmDayCareBody")}</p>
          </Callout>
        )}

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          {way === "retell" &&
            (sources.length === 0 ? (
              <p className="text-sm text-muted">{t("st3_tmNoSources")}</p>
            ) : (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_tmSourceLabel")}</span>
                <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={field}>
                  <option value="">{t("st3_tmSourcePick")}</option>
                  {sources.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.title}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          {(way === "life" || way === "epic" || way === "day") && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">
                {t(way === "epic" ? "st3_tmEpicLabel" : "st3_tmTitleLabel")}
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={70}
                placeholder={t(`st3_tmTitlePlaceholder_${way}`)}
                className={field}
              />
            </label>
          )}
          {way === "say" && (
            <div role="group" aria-label={t("st3_tmStripLabel")} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SAY_STRIPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStripId(s.id)}
                  aria-pressed={stripId === s.id}
                  aria-label={`${t("st3_tmSayName")} ${i + 1}`}
                  className={`relative flex min-h-20 items-center justify-center rounded-3xl border-2 bg-raised-2 px-2 py-3 ${
                    stripId === s.id ? "border-white" : "border-transparent hover:bg-white/8"
                  }`}
                >
                  <span className="absolute left-3 top-2 text-xs font-extrabold tabular-nums text-muted">{i + 1}</span>
                  <PicStrip pic={s.frames[0]} className="text-2xl" />
                </button>
              ))}
            </div>
          )}
          <button
            type="submit"
            disabled={!canStart}
            className={`pill min-h-11 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
            style={{ background: accent }}
          >
            <Plus size={14} strokeWidth={3} aria-hidden /> {t("st3_tmStart")}
          </button>
        </form>
      </Panel>

      <Panel step={2} title={t("st3_tmP2")} sub={t("st3_tmP2b")} accent={accent}>
        {state.threads.length === 0 && <p className="text-sm text-muted">{t("st3_tmEmpty")}</p>}
        <ul className="space-y-2">
          {state.threads.map((thread) => {
            const open = state.openId === thread.id;
            const mine = find(thread.mineId);
            const theirs = find(thread.theirsId);
            return (
              <li key={thread.id} className="rounded-3xl border border-line bg-raised-2">
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, openId: open ? null : thread.id }))}
                  aria-expanded={open}
                  className="flex min-h-14 w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left sm:px-5"
                >
                  <span className="min-w-0 flex-1 basis-40">
                    <span className="block truncate text-sm font-semibold text-ink">{thread.title}</span>
                    <span className="block text-xs text-muted">
                      {t(`st3_tmWay_${thread.way}`)}
                      {thread.toldTo > 0 && ` · ${t("st3_tmToldCount").replace("{n}", String(thread.toldTo))}`}
                    </span>
                  </span>
                  {theirs && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mint/20 px-2.5 py-1 text-xs font-bold text-mint">
                      <Check size={12} strokeWidth={3} aria-hidden /> {t("st3_tmHasTheirs")}
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <div className="border-t border-line px-4 py-4 sm:px-5">
                    <TalkThread
                      thread={thread}
                      mine={mine}
                      theirs={theirs}
                      lang={lang}
                      phaseId={phase.id}
                      activityId={activity.id}
                      accent={accent}
                      asks={asks}
                      prompts={prompts}
                      heard={heard}
                      markHeard={markHeard}
                      onPatch={(p) => patch(thread.id, p)}
                      onRemove={() =>
                        setState((s) => ({ ...s, openId: null, threads: s.threads.filter((x) => x.id !== thread.id) }))
                      }
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel step={3} title={t("st3_tmP3")} sub={t("st3_tmP3b")} accent={accent}>
        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
        <RecordingList
          filter={{ activityId: activity.id, lang, kind: [...THEIR_KINDS] }}
          accent={accent}
          moves={playerMoves}
          title={t("st3_tmTheirList")}
          emptyText={t("st3_tmNoTheirs")}
          renderExtra={(it) => <MassageStatus item={it} lang={lang} accent={accent} />}
        />
        <Disclosure title={t("st3_tmMyList")}>
          <p className="text-xs leading-relaxed text-muted">{t("st3_tmMyListHint")}</p>
          <RecordingList
            filter={{ activityId: activity.id, lang, kind: [...MY_KINDS] }}
            accent={accent}
            title={t("st3_tmMyList")}
            emptyText={t("st3_tmNoMine")}
            allowWords={false}
          />
        </Disclosure>
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
