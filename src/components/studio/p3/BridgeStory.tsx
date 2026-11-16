"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { tonightsQueue, useLibrary, type LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  FinishBar,
  RecordingList,
  RehearsalCallout,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { BRIDGE_ASKS, hasP3Content } from "./content";
import { useHeard, useStudioState } from "./hooks";
import { IdeaBoard } from "./boards";
import {
  Disclosure,
  MassageStatus,
  MovesBar,
  NoSoloNote,
  Panel,
  PhraseBank,
  Segmented,
  toPhrases,
  usePlayerMoves,
} from "./shared";
import { TaleRehearsal, type TaleProgress } from "./TaleRehearsal";

/**
 * p3-bridge — the Bridge Story, Phase 3's mainstay. A story both people
 * already know is told by the nurturer and recorded; the grower then works
 * through THAT recording until all of it is understood, and keeps listening.
 * Solo: Nuri tells authored folk tales as a clearly-labeled rehearsal.
 */

type Mode = "person" | "solo";

interface BridgeState {
  story: string;
  bothKnow: boolean;
  mode: Mode;
  tales: Record<string, TaleProgress>;
}

const EMPTY: BridgeState = { story: "", bothKnow: false, mode: "person", tales: {} };
const NO_PROGRESS: TaleProgress = { heard: [], flags: [], passes: 0 };
const SUGGESTION_KEYS = ["st3_brSug1", "st3_brSug2", "st3_brSug3", "st3_brSug4", "st3_brSug5", "st3_brSug6", "st3_brSug7"];
const SOURCE_KINDS = ["primary", "imported"] as const;

export function BridgeStory({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<BridgeState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const { items } = useLibrary({ activityId: activity.id, lang, kind: [...SOURCE_KINDS] });
  const solo = hasP3Content(lang);
  const mode: Mode = solo ? state.mode : "person";

  const asks = useMemo(() => toPhrases(BRIDGE_ASKS, lang, t), [lang, t]);
  const queue = tonightsQueue(items, 3);
  const story = state.story.trim();

  const steps: GuideStep[] = [
    { title: t("st3_brS1"), body: t("st3_brS1b"), who: "both" },
    { title: t("st3_brS2"), body: t("st3_brS2b"), who: "nurturer" },
    { title: t("st3_brS3"), body: t("st3_brS3b"), who: "you" },
    { title: t("st3_brS4"), body: t("st3_brS4b"), who: "both" },
    { title: t("st3_brS5"), body: t("st3_brS5b"), who: "both" },
    { title: t("st3_brS6"), body: t("st3_brS6b"), who: "you" },
    { title: t("st3_brS7"), body: t("st3_brS7b"), who: "you" },
  ];

  const extras = (it: LibraryItem) => (
    <>
      <MassageStatus item={it} lang={lang} accent={accent} />
      <Disclosure title={`🗣️ ${t("st3_brRetellTitle")}`}>
        <p className="text-sm leading-relaxed text-muted">{t("st3_brRetellHint")}</p>
        <PhraseBank title={t("st3_brRetellAsk")} phrases={asks.slice(1)} lang={lang} heard={heard} onHeard={markHeard} />
        <RecordPanel
          lang={lang}
          phase={phase.id}
          activityId={activity.id}
          kind="retell"
          speaker="me"
          parentId={it.id}
          defaultTitle={`${it.title} · ${t("st3_brMyTelling")}`}
          accent={accent}
          label={t("st3_brRetellRecord")}
        />
        <RecordingList
          filter={{ parentId: it.id, kind: "retell" }}
          accent={accent}
          title={t("st3_brMyTellings")}
          emptyText={t("st3_brNoTellings")}
          allowWords={false}
        />
      </Disclosure>
    </>
  );

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🌉" mode={solo ? "either" : "nurturer"} />
      <StepGuide steps={steps} accent={accent} />

      {solo ? (
        <Segmented
          label={t("st3_modeLabel")}
          value={mode}
          onChange={(m) => setState((s) => ({ ...s, mode: m }))}
          options={[
            { id: "person", label: `🤝 ${t("st3_modePerson")}` },
            { id: "solo", label: `🌱 ${t("st3_modeSolo")}` },
          ]}
        />
      ) : (
        <NoSoloNote />
      )}

      {mode === "solo" ? (
        <Panel title={t("st3_brSoloTitle")} sub={t("st3_brSoloSub")} accent={accent}>
          <RehearsalCallout>{t("st3_brSoloNote")}</RehearsalCallout>
          <TaleRehearsal
            lang={lang}
            accent={accent}
            progress={state.tales}
            onProgress={(taleId, fn) =>
              setState((s) => ({ ...s, tales: { ...s.tales, [taleId]: fn(s.tales[taleId] ?? NO_PROGRESS) } }))
            }
          />
        </Panel>
      ) : (
        <>
          <Panel step={1} title={t("st3_brP1")} sub={t("st3_brP1b")} accent={accent}>
            <IdeaBoard
              lang={lang}
              focus="stories"
              accent={accent}
              suggestions={SUGGESTION_KEYS.map((k) => t(k))}
              onPick={(text) => setState((s) => ({ ...s, story: text }))}
              pickLabel={t("st3_brPickToday")}
            />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_brStoryLabel")}</span>
              <input
                value={state.story}
                onChange={(e) => setState((s) => ({ ...s, story: e.target.value.slice(0, 80) }))}
                placeholder={t("st3_brStoryPlaceholder")}
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
              />
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={state.bothKnow}
                onChange={(e) => setState((s) => ({ ...s, bothKnow: e.target.checked }))}
                className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
              />
              {t("st3_brBothKnow")}
            </label>
          </Panel>

          <Panel step={2} title={t("st3_brP2")} sub={t("st3_brP2b")} accent={accent}>
            <PhraseBank title={t("st3_brAskTitle")} phrases={asks.slice(0, 1)} lang={lang} heard={heard} onHeard={markHeard} />
            {story && state.bothKnow ? (
              <RecordPanel
                lang={lang}
                phase={phase.id}
                activityId={activity.id}
                kind="primary"
                speaker="nurturer"
                defaultTitle={story}
                accent={accent}
                tags={["bridge"]}
                allowImport
                showConsent
                label={t("st3_brRecord")}
              />
            ) : (
              <Callout icon="👆" title={t("st3_brNeedStory")} />
            )}
          </Panel>

          <Panel step={3} title={t("st3_brP3")} sub={t("st3_brP3b")} accent={accent}>
            <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
            <RecordingList
              filter={{ activityId: activity.id, lang, kind: [...SOURCE_KINDS] }}
              accent={accent}
              moves={playerMoves}
              title={t("st3_brTellings")}
              emptyText={t("st3_brNoRecordings")}
              renderExtra={extras}
            />
          </Panel>

          <Panel step={4} title={t("st3_brP4")} sub={t("st3_brP4b")} accent={accent}>
            {queue.length === 0 ? (
              <p className="text-sm text-muted">{t("st3_brQueueEmpty")}</p>
            ) : (
              <ul className="space-y-2">
                {queue.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-3"
                  >
                    <span className="min-w-0 truncate text-sm font-semibold text-ink">{it.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {t("stc_plHeard")} {it.relistens.length} {t("stc_plTimes")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
