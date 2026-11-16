"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLibrary } from "@/lib/library";
import {
  Callout,
  FinishBar,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { uid, usePersisted } from "./storage";
import { accentBtn, Field, INPUT, Panel, RemoveButton, Stat, useDurationWords } from "./ui";
import { EpisodeCard } from "./epic/EpisodeCard";
import { EMPTY_EPIC_STORE, episodeState, type Epic, type EpicStore, type Episode } from "./epic/model";

/**
 * p5-epic — Epic Storytelling.
 *
 * One long story, told in parts across many sittings. Each part is told to a
 * person, then told again to someone else, and comes back better. Nuri can
 * sit in as a rehearsal audience; it never judges the telling.
 */
export function EpicTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const words = useDurationWords();
  const { items } = useLibrary({ lang });
  const [store, setStore, ready] = usePersisted<EpicStore>(activity.id, lang, EMPTY_EPIC_STORE);
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [part, setPart] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const mine = store.epics.filter((e) => e.lang === lang);
  const active = mine.find((e) => e.id === store.activeId) ?? null;

  const patchEpic = (id: string, fn: (prev: Epic) => Epic) =>
    setStore((prev) => ({ ...prev, epics: prev.epics.map((e) => (e.id === id ? fn(e) : e)) }));

  const patchEpisode = (epicId: string, episodeId: string, fn: (prev: Episode) => Episode) =>
    patchEpic(epicId, (e) => ({ ...e, episodes: e.episodes.map((x) => (x.id === episodeId ? fn(x) : x)) }));

  const addEpic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const next: Epic = {
      id: uid("epic"),
      lang,
      title: title.trim().slice(0, 80),
      about: about.trim().slice(0, 200),
      createdAt: new Date().toISOString(),
      episodes: [],
    };
    setStore((prev) => ({ epics: [...prev.epics, next], activeId: next.id }));
    setTitle("");
    setAbout("");
  };

  const addPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !part.trim()) return;
    const next: Episode = { id: uid("ep"), title: part.trim().slice(0, 80), plan: "", tellings: [], reactions: "", words: [] };
    patchEpic(active.id, (prev) => ({ ...prev, episodes: [...prev.episodes, next] }));
    setOpenId(next.id);
    setPart("");
  };

  const steps: GuideStep[] = [
    { title: t("st5_epS1"), body: t("st5_epS1b"), who: "you" },
    { title: t("st5_epS2"), body: t("st5_epS2b"), who: "you" },
    { title: t("st5_epS3"), body: t("st5_epS3b"), who: "you" },
    { title: t("st5_epS4"), body: t("st5_epS4b"), who: "both" },
    { title: t("st5_epS5"), body: t("st5_epS5b"), who: "both" },
    { title: t("st5_epS6"), body: t("st5_epS6b"), who: "both" },
    { title: t("st5_epS7"), body: t("st5_epS7b"), who: "both" },
  ];

  const told = active ? active.episodes.filter((x) => episodeState(x) !== "planned").length : 0;
  const tellings = active ? active.episodes.reduce((sum, x) => sum + x.tellings.length, 0) : 0;
  const recordedSec = active
    ? items
        .filter((it) => it.activityId === activity.id && it.speaker === "me" && it.tags?.includes(`epic:${active.id}`))
        .reduce((sum, it) => sum + it.durationSec, 0)
    : 0;

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="📜" mode="either" />
      <Callout icon="🤝" title={t("st5_epPeopleTitle")} tone="warm">
        <p>{t("st5_epPeopleBody")}</p>
      </Callout>
      {ready && <StepGuide steps={steps} accent={phase.color} defaultOpen={mine.length === 0} />}

      <Panel title={t("st5_epEpicsTitle")} sub={t("st5_epEpicsSub")}>
        <form onSubmit={addEpic} className="space-y-3 rounded-3xl border border-line bg-raised-2 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("st5_epEpicName")}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required className={INPUT} />
            </Field>
            <Field label={t("st5_epEpicAbout")}>
              <input value={about} onChange={(e) => setAbout(e.target.value)} maxLength={200} className={INPUT} />
            </Field>
          </div>
          <button type="submit" disabled={!title.trim()} {...accentBtn(phase.color)}>
            <Plus size={15} strokeWidth={3} aria-hidden /> {t("st5_epEpicAdd")}
          </button>
        </form>

        {mine.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {mine.map((e) => {
              const on = e.id === active?.id;
              return (
                <li key={e.id} className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => setStore((prev) => ({ ...prev, activeId: e.id }))}
                    aria-pressed={on}
                    className={`flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                      on ? "border-white/50 bg-white/10" : "border-line bg-raised-2 hover:bg-white/5"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{e.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {t("st5_epPartsCount").replace("{n}", String(e.episodes.length))}
                        {e.about ? ` · ${e.about}` : ""}
                      </span>
                    </span>
                    {on && <Check size={16} strokeWidth={3} className="shrink-0 text-mint" aria-hidden />}
                  </button>
                  <RemoveButton
                    label={t("st5_epRemoveEpic")}
                    onConfirm={() =>
                      setStore((prev) => ({
                        epics: prev.epics.filter((x) => x.id !== e.id),
                        activeId: prev.activeId === e.id ? null : prev.activeId,
                      }))
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {active && (
        <Panel title={active.title} sub={active.about || undefined}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={active.episodes.length} label={t("st5_epStatParts")} />
            <Stat value={told} label={t("st5_epStatTold")} />
            <Stat value={tellings} label={t("st5_epStatTellings")} />
            <Stat value={words(recordedSec)} label={t("st5_epStatRecorded")} />
          </div>

          {active.episodes.length === 0 && <p className="text-sm text-muted">{t("st5_epNoParts")}</p>}

          <ol className="space-y-2">
            {active.episodes.map((episode, i) => (
              <EpisodeCard
                key={episode.id}
                epic={active}
                episode={episode}
                number={i + 1}
                open={openId === episode.id}
                onToggle={() => setOpenId(openId === episode.id ? null : episode.id)}
                lang={lang}
                accent={phase.color}
                activityId={activity.id}
                items={items}
                onPatch={(fn) => patchEpisode(active.id, episode.id, fn)}
                onRemove={() =>
                  patchEpic(active.id, (prev) => ({
                    ...prev,
                    episodes: prev.episodes.filter((x) => x.id !== episode.id),
                  }))
                }
              />
            ))}
          </ol>

          <form onSubmit={addPart} className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
            <div className="min-w-0 flex-1 basis-56">
              <Field label={t("st5_epPartName")} hint={t("st5_epPartHint")}>
                <input value={part} onChange={(e) => setPart(e.target.value)} maxLength={80} className={INPUT} />
              </Field>
            </div>
            <button type="submit" disabled={!part.trim()} {...accentBtn(phase.color)}>
              <Plus size={15} strokeWidth={3} aria-hidden /> {t("st5_epPartAdd")}
            </button>
          </form>
        </Panel>
      )}

      <Panel title={t("st5_epRecsTitle")}>
        <RecordingList
          filter={{ activityId: activity.id, lang }}
          accent={phase.color}
          allowWords={false}
          emptyText={t("st5_epRecsEmpty")}
        />
      </Panel>

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
