"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import type { LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
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
import { MEDIA_MOVES } from "./content";
import { TAG } from "./discourse";
import { useGapTypes } from "./MarkList";
import { showDay, todayIso, uid, usePersisted } from "./storage";
import { accentBtn, BTN_GHOST, Field, HostPhrases, INPUT, Panel, RemoveButton } from "./ui";
import { MomentAdder, MomentList } from "./media/MomentList";
import { EMPTY_MEDIA_STORE, type MediaStore, type MediaTitle, type Moment } from "./media/model";

/** The mentor's reading of a scene, threaded under the grower's description of it. */
function InsiderView({ description, lang, accent, activityId }: { description: LibraryItem; lang: LangCode; accent: string; activityId: string }) {
  const { t } = useApp();
  return (
    <div className="space-y-2 rounded-3xl border border-line bg-raised p-4">
      <p className="text-sm font-semibold text-ink">{t("st5_mdInsiderTitle")}</p>
      <p className="text-sm leading-relaxed text-muted">{t("st5_mdInsiderBody")}</p>
      <RecordPanel
        lang={lang}
        phase={5}
        activityId={activityId}
        kind="expansion"
        defaultTitle={`${t("st5_mdInsiderRecTitle")}: ${description.title}`.slice(0, 80)}
        accent={accent}
        speaker="nurturer"
        parentId={description.id}
        tags={[TAG.insider]}
        showConsent
        label={t("st5_mdInsiderRec")}
      />
    </div>
  );
}

/**
 * p5-media — Clarify a Movie or TV Drama.
 *
 * The film stays wherever the grower watches it. This is the notebook that
 * sits beside it: timecoded moments that stayed dark, what the grower saw,
 * what a mentor said it was, the words that came out of it.
 */
export function MediaTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const gapTypes = useGapTypes();
  const [store, setStore, ready] = usePersisted<MediaStore>(activity.id, lang, EMPTY_MEDIA_STORE);
  const [title, setTitle] = useState("");
  const [episode, setEpisode] = useState("");
  const [hostMade, setHostMade] = useState(true);

  const mine = store.titles.filter((x) => x.lang === lang);
  const active = mine.find((x) => x.id === store.activeId) ?? null;

  const patchTitle = (id: string, fn: (prev: MediaTitle) => MediaTitle) =>
    setStore((prev) => ({ ...prev, titles: prev.titles.map((x) => (x.id === id ? fn(x) : x)) }));

  const patchMoment = (momentId: string, change: Partial<Moment>) => {
    if (!active) return;
    patchTitle(active.id, (x) => ({
      ...x,
      moments: x.moments.map((m) => (m.id === momentId ? { ...m, ...change } : m)),
    }));
  };

  const addTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const next: MediaTitle = {
      id: uid("media"),
      lang,
      title: title.trim().slice(0, 100),
      episode: episode.trim().slice(0, 60),
      hostMade,
      createdAt: new Date().toISOString(),
      moments: [],
    };
    setStore((prev) => ({ titles: [...prev.titles, next], activeId: next.id }));
    setTitle("");
    setEpisode("");
  };

  const steps: GuideStep[] = [
    { title: t("st5_mdS1"), body: t("st5_mdS1b"), who: "you" },
    { title: t("st5_mdS2"), body: t("st5_mdS2b"), who: "you" },
    { title: t("st5_mdS3"), body: t("st5_mdS3b"), who: "you" },
    { title: t("st5_mdS4"), body: t("st5_mdS4b"), who: "both" },
    { title: t("st5_mdS5"), body: t("st5_mdS5b"), who: "both" },
    { title: t("st5_mdS6"), body: t("st5_mdS6b"), who: "both" },
    { title: t("st5_mdS7"), body: t("st5_mdS7b"), who: "you" },
  ];

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="🎬" mode="either" />
      <Callout icon="🤝" title={t("st5_mdModeTitle")} tone="warm">
        <p>{t("st5_mdModeBody")}</p>
      </Callout>
      <Callout icon="🎞️" title={t("st5_mdNoMediaTitle")}>
        <p>{t("st5_mdNoMediaBody")}</p>
      </Callout>
      {ready && <StepGuide steps={steps} accent={phase.color} defaultOpen={mine.length === 0} />}

      <Panel title={t("st5_mdTitlesTitle")} sub={t("st5_mdTitlesSub")}>
        <form onSubmit={addTitle} className="space-y-3 rounded-3xl border border-line bg-raised-2 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("st5_mdTitleField")}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required className={INPUT} />
            </Field>
            <Field label={t("st5_mdEpisodeField")}>
              <input value={episode} onChange={(e) => setEpisode(e.target.value)} maxLength={60} className={INPUT} />
            </Field>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={hostMade}
              onChange={(e) => setHostMade(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-mint)]"
            />
            <span>{t("st5_mdHostMade")}</span>
          </label>
          <button type="submit" disabled={!title.trim()} {...accentBtn(phase.color)}>
            <Plus size={15} strokeWidth={3} aria-hidden /> {t("st5_mdAddTitle")}
          </button>
        </form>

        {mine.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {mine.map((x) => {
              const on = x.id === active?.id;
              const open = x.moments.filter((m) => !m.understood).length;
              return (
                <li key={x.id} className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => setStore((prev) => ({ ...prev, activeId: x.id }))}
                    aria-pressed={on}
                    className={`flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                      on ? "border-white/50 bg-white/10" : "border-line bg-raised-2 hover:bg-white/5"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {x.title}
                        {x.episode ? ` · ${x.episode}` : ""}
                      </span>
                      <span className="block text-xs text-muted">
                        {t("st5_mdOpenCount")
                          .replace("{open}", String(open))
                          .replace("{all}", String(x.moments.length))}
                        {!x.hostMade ? ` · ${t("st5_mdDubbed")}` : ""}
                      </span>
                    </span>
                    {on && <Check size={16} strokeWidth={3} className="shrink-0 text-mint" aria-hidden />}
                  </button>
                  <RemoveButton
                    label={t("st5_mdRemoveTitle")}
                    onConfirm={() =>
                      setStore((prev) => ({
                        titles: prev.titles.filter((y) => y.id !== x.id),
                        activeId: prev.activeId === x.id ? null : prev.activeId,
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
        <>
          <Panel
            title={t("st5_mdMomentsTitle")}
            sub={`${active.title}${active.episode ? ` · ${active.episode}` : ""}`}
          >
            <MomentAdder
              accent={phase.color}
              onAdd={(moment) => patchTitle(active.id, (x) => ({ ...x, moments: [...x.moments, moment] }))}
            />
            <MomentList
              title={active}
              lang={lang}
              onPatch={patchMoment}
              onRemove={(momentId) =>
                patchTitle(active.id, (x) => ({ ...x, moments: x.moments.filter((m) => m.id !== momentId) }))
              }
            />
            <HostPhrases title={t("st5_mdSay")} lines={MEDIA_MOVES} lang={lang} />
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <p className="min-w-0 flex-1 basis-56 text-sm text-muted">
                {active.rewatchedOn
                  ? `${t("st5_mdRewatched")} ${showDay(active.rewatchedOn)}`
                  : t("st5_mdRewatchHint")}
              </p>
              <button
                type="button"
                onClick={() =>
                  patchTitle(active.id, (x) => ({ ...x, rewatchedOn: x.rewatchedOn ? undefined : todayIso() }))
                }
                aria-pressed={Boolean(active.rewatchedOn)}
                className={BTN_GHOST}
              >
                {active.rewatchedOn && <Check size={14} strokeWidth={3} className="text-mint" aria-hidden />}
                {t("st5_mdRewatchBtn")}
              </button>
            </div>
          </Panel>

          <Panel title={t("st5_mdDescribeTitle")} sub={t("st5_mdDescribeSub")}>
            <RecordPanel
              lang={lang}
              phase={5}
              activityId={activity.id}
              kind="description"
              defaultTitle={`${t("st5_mdDescribeRecTitle")}: ${active.title}`.slice(0, 80)}
              accent={phase.color}
              speaker="me"
              tags={[TAG.media, `title:${active.id}`]}
              label={t("st5_mdDescribeRec")}
            />
          </Panel>

          <Panel title={t("st5_mdClipTitle")} sub={t("st5_mdClipSub")}>
            <RecordPanel
              lang={lang}
              phase={5}
              activityId={activity.id}
              kind="imported"
              defaultTitle={`${active.title}${active.episode ? ` ${active.episode}` : ""}`.slice(0, 80)}
              accent={phase.color}
              speaker="native"
              tags={[TAG.media, `title:${active.id}`]}
              allowImport
              label={t("st5_mdClipRec")}
            />
            <p className="text-xs leading-relaxed text-muted">{t("st5_mdClipAfter")}</p>
          </Panel>
        </>
      )}

      <Panel title={t("st5_mdRecsTitle")}>
        <RecordingList
          filter={{ activityId: activity.id, lang }}
          accent={phase.color}
          gapTypes={gapTypes}
          emptyText={t("st5_mdRecsEmpty")}
          renderExtra={(it) =>
            it.kind === "description" ? (
              <InsiderView description={it} lang={lang} accent={phase.color} activityId={activity.id} />
            ) : null
          }
        />
      </Panel>

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
