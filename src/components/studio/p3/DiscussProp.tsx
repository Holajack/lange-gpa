"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { usePictures } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  FinishBar,
  NeedsPersonCallout,
  PictureShelf,
  PictureView,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { PROP_ANGLES } from "./content";
import { useHeard, useStudioState } from "./hooks";
import { IdeaBoard } from "./boards";
import { Disclosure, MassageStatus, MovesBar, Panel, PhraseBank, toPhrases, usePlayerMoves } from "./shared";

/**
 * p3-prop — Discuss-a-Prop. One everyday object (or a photo of one) between
 * two people: handle it, ask about it from many angles, record the whole
 * conversation including the back-and-forth, then massage the recording.
 */

interface PropState {
  name: string;
  picId: string | null;
  /** prop key → angle ids already asked about it */
  asked: Record<string, string[]>;
}
const EMPTY: PropState = { name: "", picId: null, asked: {} };
const SUGGESTION_KEYS = [
  "st3_prSug1",
  "st3_prSug2",
  "st3_prSug3",
  "st3_prSug4",
  "st3_prSug5",
  "st3_prSug6",
  "st3_prSug7",
  "st3_prSug8",
];
const TALK_KINDS = ["primary", "imported"] as const;

export function DiscussProp({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<PropState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const { pictures } = usePictures(activity.id);
  const angles = useMemo(() => toPhrases(PROP_ANGLES, lang, t), [lang, t]);

  const pic = pictures.find((p) => p.id === state.picId) ?? null;
  const name = state.name.trim();
  const propKey = pic?.id ?? (name ? `name:${name.toLocaleLowerCase()}` : "");
  const asked = propKey ? state.asked[propKey] ?? [] : [];
  const title = name || pic?.title || t("st3_prRecName");

  const toggleAsked = (id: string) => {
    if (!propKey) return;
    setState((s) => {
      const cur = s.asked[propKey] ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...s, asked: { ...s.asked, [propKey]: next } };
    });
  };

  const steps: GuideStep[] = [
    { title: t("st3_prS1"), body: t("st3_prS1b"), who: "you" },
    { title: t("st3_prS2"), body: t("st3_prS2b"), who: "both" },
    { title: t("st3_prS3"), body: t("st3_prS3b"), who: "you" },
    { title: t("st3_prS4"), body: t("st3_prS4b"), who: "both" },
    { title: t("st3_prS5"), body: t("st3_prS5b"), who: "both" },
    { title: t("st3_prS6"), body: t("st3_prS6b"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🏺" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st3_prNeeds")}</NeedsPersonCallout>

      <Panel step={1} title={t("st3_prP1")} sub={t("st3_prP1b")} accent={accent}>
        <PictureShelf
          activityId={activity.id}
          selectedId={state.picId}
          onSelect={(p) => setState((s) => ({ ...s, picId: p?.id ?? null }))}
        />
        {pic && <PictureView pic={pic} className="max-h-80 bg-raised-2" />}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_prNameLabel")}</span>
          <input
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value.slice(0, 80) }))}
            placeholder={t("st3_prNamePlaceholder")}
            className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
          />
        </label>
        <IdeaBoard
          lang={lang}
          focus="props"
          accent={accent}
          suggestions={SUGGESTION_KEYS.map((k) => t(k))}
          onPick={(text) => setState((s) => ({ ...s, name: text, picId: null }))}
          pickLabel={t("st3_prPickToday")}
        />
      </Panel>

      <Panel step={2} title={t("st3_prP2")} sub={t("st3_prP2b")} accent={accent}>
        <PhraseBank
          title={t("st3_prAnglesTitle")}
          phrases={angles}
          lang={lang}
          heard={heard}
          onHeard={markHeard}
          checked={asked}
          onToggleCheck={propKey ? toggleAsked : undefined}
          checkLabel={t("st3_prAsked")}
        />
        {propKey && (
          <p className="text-xs text-muted" role="status">
            {t("st3_prAskedCount").replace("{n}", String(asked.length)).replace("{total}", String(angles.length))}
          </p>
        )}
      </Panel>

      <Panel step={3} title={t("st3_prP3")} sub={t("st3_prP3b")} accent={accent}>
        <RecordPanel
          lang={lang}
          phase={phase.id}
          activityId={activity.id}
          kind="primary"
          speaker="both"
          defaultTitle={title}
          accent={accent}
          tags={pic ? ["prop", `pic:${pic.id}`] : ["prop"]}
          allowImport
          showConsent
          label={t("st3_prRecord")}
        />
        <Disclosure title={`🌱 ${t("st3_prWarmTitle")}`}>
          <p className="text-sm leading-relaxed text-muted">{t("st3_prWarmHint")}</p>
          <RecordPanel
            lang={lang}
            phase={phase.id}
            activityId={activity.id}
            kind="description"
            speaker="me"
            defaultTitle={`${title} · ${t("st3_prWarmName")}`}
            accent={accent}
            tags={["prop", "warm-up"]}
            label={t("st3_prWarmRecord")}
          />
          <RecordingList
            filter={{ activityId: activity.id, lang, kind: "description" }}
            accent={accent}
            title={t("st3_prWarmList")}
            emptyText={t("st3_prWarmEmpty")}
            allowWords={false}
          />
        </Disclosure>
      </Panel>

      <Panel step={4} title={t("st3_prP4")} sub={t("st3_prP4b")} accent={accent}>
        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
        <RecordingList
          filter={{ activityId: activity.id, lang, kind: [...TALK_KINDS] }}
          accent={accent}
          moves={playerMoves}
          title={t("st3_prTalks")}
          emptyText={t("st3_prNoRecordings")}
          renderExtra={(it) => <MassageStatus item={it} lang={lang} accent={accent} />}
        />
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
