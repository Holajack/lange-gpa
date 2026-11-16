"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { LangCode, PhaseId } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useLibrary, usePictures, type LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  PictureShelf,
  PictureView,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { HOST_ASKS } from "./content";
import { isoDay, newId, useHeard, useStudioState } from "./hooks";
import { SocialReminder } from "./boards";
import { MassageStatus, MovesBar, Panel, PhraseBank, toPhrases, usePlayerMoves } from "./shared";

/**
 * p3-host — Host Stories. Stories that belong to the nurturer's world, which
 * the grower does NOT know yet. So the gist comes first, over several days;
 * only then the full telling, recorded and massaged. Every story here is
 * named and told by a real person. Nuri never supplies one.
 */

type Way = "pretell" | "pictures" | "outside";
const WAYS: Way[] = ["pretell", "pictures", "outside"];
/** the guide asks for "several days"; below this the tool gently says so */
const ENOUGH_DAYS = 3;

interface HostStory {
  id: string;
  title: string;
  from: string;
  ways: Way[];
  /** YYYY-MM-DD days the grower went over the gist */
  days: string[];
  /** the pair decided to go ahead with fewer days */
  ready: boolean;
  gistRecId?: string;
  fullRecId?: string;
}

interface HostState {
  stories: HostStory[];
}
const EMPTY: HostState = { stories: [] };

const field =
  "w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30";

function RecLine({ rec }: { rec: LibraryItem }) {
  const { t } = useApp();
  return (
    <p className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm">
      <span className="min-w-0 truncate font-semibold text-ink">🎧 {rec.title}</span>
      <span className="text-xs tabular-nums text-muted">
        {t("stc_plHeard")} {rec.relistens.length} {t("stc_plTimes")}
      </span>
    </p>
  );
}

function StoryCard({
  story,
  gistRec,
  fullRec,
  today,
  lang,
  phaseId,
  activityId,
  accent,
  onPatch,
  onRemove,
}: {
  story: HostStory;
  gistRec?: LibraryItem;
  fullRec?: LibraryItem;
  today: string;
  lang: LangCode;
  phaseId: PhaseId;
  activityId: string;
  accent: string;
  onPatch: (patch: Partial<HostStory>) => void;
  onRemove: () => void;
}) {
  const { t } = useApp();
  const shelf = `${activityId}:${story.id}`;
  const { pictures } = usePictures(shelf);
  const [picId, setPicId] = useState<string | null>(null);
  const pic = pictures.find((p) => p.id === picId) ?? null;

  const days = story.days.length;
  const doneToday = story.days.includes(today);
  const canHear = story.ready || days >= ENOUGH_DAYS;
  const status = fullRec ? "st3_hsStHeard" : canHear ? "st3_hsStReady" : "st3_hsStGist";
  const toggleWay = (w: Way) =>
    onPatch({ ways: story.ways.includes(w) ? story.ways.filter((x) => x !== w) : [...story.ways, w] });

  return (
    <li className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-ink">{story.title}</p>
          {story.from && (
            <p className="text-xs text-muted">
              {t("st3_hsFrom")} {story.from}
            </p>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            fullRec ? "bg-mint/20 text-mint" : "bg-white/8 text-ink"
          }`}
        >
          {fullRec && <Check size={12} strokeWidth={3} aria-hidden />}
          {t(status)}
        </span>
      </div>

      {/* 1 — the gist, over several days */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("st3_hsGistTitle")}</p>
        <div className="space-y-1">
          {WAYS.map((w) => (
            <label key={w} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={story.ways.includes(w)}
                onChange={() => toggleWay(w)}
                className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
              />
              {t(`st3_hsWay_${w}`)}
            </label>
          ))}
        </div>

        {story.ways.includes("pretell") &&
          (gistRec ? (
            <RecLine rec={gistRec} />
          ) : (
            <RecordPanel
              lang={lang}
              phase={phaseId}
              activityId={activityId}
              kind="primary"
              speaker="nurturer"
              defaultTitle={`${story.title} · ${t("st3_hsGistName")}`.slice(0, 80)}
              accent={accent}
              tags={["host", `host:${story.id}`, "gist"]}
              showConsent
              label={t("st3_hsGistRecord")}
              onSaved={(item) => onPatch({ gistRecId: item.id })}
            />
          ))}
        {story.ways.includes("pictures") && (
          <>
            <PictureShelf activityId={shelf} selectedId={picId} onSelect={(p) => setPicId(p?.id ?? null)} />
            {pic && <PictureView pic={pic} className="max-h-80 bg-canvas" />}
          </>
        )}
        {story.ways.includes("outside") && <p className="text-xs leading-relaxed text-muted">{t("st3_hsOutsideHint")}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onPatch({ days: [...story.days, today] })}
            disabled={doneToday || !today}
            className="pill min-h-11 bg-white/10 px-4 py-2.5 text-sm font-bold text-ink disabled:opacity-40"
          >
            {doneToday ? <Check size={14} strokeWidth={3} aria-hidden /> : <Plus size={14} strokeWidth={3} aria-hidden />}
            {t(doneToday ? "st3_hsDayDone" : "st3_hsDayAdd")}
          </button>
          <p className="text-sm tabular-nums text-ink" aria-live="polite">
            {t("st3_hsDays").replace("{n}", String(days))}
          </p>
        </div>
      </div>

      {/* 2 — the full telling */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("st3_hsFullTitle")}</p>
        {fullRec ? (
          <>
            <RecLine rec={fullRec} />
            <p className="text-xs leading-relaxed text-muted">{t("st3_hsExtraListens")}</p>
          </>
        ) : canHear ? (
          <RecordPanel
            lang={lang}
            phase={phaseId}
            activityId={activityId}
            kind="primary"
            speaker="nurturer"
            defaultTitle={story.title.slice(0, 80)}
            accent={accent}
            tags={["host", `host:${story.id}`, "full"]}
            allowImport
            showConsent
            label={t("st3_hsFullRecord")}
            onSaved={(item) => onPatch({ fullRecId: item.id })}
          />
        ) : (
          <Callout icon="⏳" title={t("st3_hsWaitTitle")} tone="warm">
            <p>{t("st3_hsWaitBody").replace("{n}", String(days))}</p>
            <button
              type="button"
              onClick={() => onPatch({ ready: true })}
              className="mt-2 min-h-10 text-sm font-semibold text-ink underline underline-offset-4"
            >
              {t("st3_hsReadyAnyway")}
            </button>
          </Callout>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="flex min-h-10 items-center gap-1.5 text-xs font-semibold text-muted hover:text-coral"
        >
          <Trash2 size={12} strokeWidth={2.5} aria-hidden /> {t("st3_hsRemove")}
        </button>
      </div>
    </li>
  );
}

export function HostStories({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<HostState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const { all } = useLibrary();
  const asks = useMemo(() => toPhrases(HOST_ASKS, lang, t), [lang, t]);

  const [title, setTitle] = useState("");
  const [from, setFrom] = useState("");
  const [today, setToday] = useState("");
  useEffect(() => setToday(isoDay(new Date())), []);

  const add = () => {
    const clean = title.trim().slice(0, 100);
    if (!clean) return;
    const story: HostStory = { id: newId("hs"), title: clean, from: from.trim().slice(0, 80), ways: [], days: [], ready: false };
    setState((s) => ({ stories: [story, ...s.stories] }));
    setTitle("");
    setFrom("");
  };
  const patch = (id: string, p: Partial<HostStory>) =>
    setState((s) => ({ stories: s.stories.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const find = (id?: string) => (id ? all.find((it) => it.id === id) : undefined);

  const steps: GuideStep[] = [
    { title: t("st3_hsS1"), body: t("st3_hsS1b"), who: "nurturer" },
    { title: t("st3_hsS2"), body: t("st3_hsS2b"), who: "you" },
    { title: t("st3_hsS3"), body: t("st3_hsS3b"), who: "you" },
    { title: t("st3_hsS4"), body: t("st3_hsS4b"), who: "nurturer" },
    { title: t("st3_hsS5"), body: t("st3_hsS5b"), who: "both" },
    { title: t("st3_hsS6"), body: t("st3_hsS6b"), who: "you" },
    { title: t("st3_hsS7"), body: t("st3_hsS7b"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="📜" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st3_hsNeeds")}</NeedsPersonCallout>

      <Panel step={1} title={t("st3_hsP1")} sub={t("st3_hsP1b")} accent={accent}>
        <PhraseBank title={t("st3_hsAskTitle")} phrases={asks} lang={lang} heard={heard} onHeard={markHeard} />
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_hsTitleLabel")}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder={t("st3_hsTitlePlaceholder")}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_hsFromLabel")}</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              maxLength={80}
              placeholder={t("st3_hsFromPlaceholder")}
              className={field}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className={`pill min-h-11 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
              style={{ background: accent }}
            >
              <Plus size={14} strokeWidth={3} aria-hidden /> {t("st3_hsAdd")}
            </button>
          </div>
        </form>
      </Panel>

      <Panel step={2} title={t("st3_hsP2")} sub={t("st3_hsP2b")} accent={accent}>
        {state.stories.length === 0 && <p className="text-sm text-muted">{t("st3_hsEmpty")}</p>}
        <ul className="space-y-3">
          {state.stories.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              gistRec={find(s.gistRecId)}
              fullRec={find(s.fullRecId)}
              today={today}
              lang={lang}
              phaseId={phase.id}
              activityId={activity.id}
              accent={accent}
              onPatch={(p) => patch(s.id, p)}
              onRemove={() => setState((prev) => ({ stories: prev.stories.filter((x) => x.id !== s.id) }))}
            />
          ))}
        </ul>
      </Panel>

      <Panel step={3} title={t("st3_hsP3")} sub={t("st3_hsP3b")} accent={accent}>
        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
        <RecordingList
          filter={{ activityId: activity.id, lang }}
          accent={accent}
          moves={playerMoves}
          emptyText={t("st3_hsNoRecordings")}
          renderExtra={(it) => (
            <MassageStatus item={it} lang={lang} accent={accent} note={t("st3_hsExtraListens")} />
          )}
        />
      </Panel>

      <SocialReminder lang={lang} />
      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
