"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { useLibrary, type LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { SAMPLE_ASKS } from "./content";
import { hostSpeech, loopInfo, useHeard, useLoopMeta, useStudioState } from "./hooks";
import { MassageStatus, MovesBar, Panel, PhraseBank, Segmented, toPhrases, usePlayerMoves } from "./shared";

/**
 * p3-sample — a first Native-to-Native Sample (late 3C). A story the grower
 * already understands, told by host people to each other at their own speed
 * with the grower NOT there. Only real recordings get in: every one needs
 * the three points confirmed first. Nuri never produces such speech.
 */

type Route = "retold" | "made";
type Follow = "little" | "outline" | "most";
const FOLLOWS: Follow[] = ["little", "outline", "most"];
const POINTS = ["absent", "agreed", "known"] as const;
type Point = (typeof POINTS)[number];

interface SampleState {
  route: Route;
  /** the understood recording this sample retells */
  sourceId: string;
  attest: Record<Point, boolean>;
  /** recording id → how much the grower followed on the first lone listen */
  follow: Record<string, Follow>;
}
const NOT_ATTESTED: Record<Point, boolean> = { absent: false, agreed: false, known: false };
const EMPTY: SampleState = { route: "retold", sourceId: "", attest: NOT_ATTESTED, follow: {} };

const field =
  "w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30";

export function NativeSample({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<SampleState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const { all } = useLibrary();
  const asks = useMemo(() => toPhrases(SAMPLE_ASKS, lang, t), [lang, t]);

  /** stories told TO the grower that they now follow: the only fair material for a first sample */
  const pool = useMemo(() => hostSpeech(all, lang).filter((it) => it.activityId !== activity.id), [all, lang, activity.id]);
  const meta = useLoopMeta(pool);
  const understood = pool.filter((it) => it.familiar || loopInfo(it, meta[it.id]).stage === "done");
  const source = understood.find((it) => it.id === state.sourceId);

  const retold = state.route === "retold";
  const attested = POINTS.every((p) => state.attest[p]);
  const ready = attested && (!retold || Boolean(source));

  const steps: GuideStep[] = [
    { title: t("st3_smS1"), body: t("st3_smS1b"), who: "you" },
    { title: t("st3_smS2"), body: t("st3_smS2b"), who: "nurturer" },
    { title: t("st3_smS3"), body: t("st3_smS3b"), who: "both" },
    { title: t("st3_smS4"), body: t("st3_smS4b"), who: "you" },
    { title: t("st3_smS5"), body: t("st3_smS5b"), who: "both" },
    { title: t("st3_smS6"), body: t("st3_smS6b"), who: "you" },
  ];

  const extras = (it: LibraryItem) => {
    const from = it.parentId ? all.find((x) => x.id === it.parentId) : undefined;
    return (
      <>
        <div className="space-y-3 rounded-3xl border border-line bg-raised p-4 sm:p-5">
          {from && (
            <p className="text-xs text-muted">
              {t("st3_smFrom")} <span className="font-semibold text-ink">{from.title}</span>
            </p>
          )}
          <p className="text-sm font-semibold text-ink">{t("st3_smFollowTitle")}</p>
          <Segmented
            label={t("st3_smFollowTitle")}
            value={state.follow[it.id] ?? "unset"}
            onChange={(f) => {
              if (f !== "unset") setState((s) => ({ ...s, follow: { ...s.follow, [it.id]: f } }));
            }}
            options={FOLLOWS.map((id): { id: Follow | "unset"; label: string } => ({
              id,
              label: t(`st3_smFollow_${id}`),
            }))}
          />
          <p className="text-xs leading-relaxed text-muted">{t("st3_smFollowHint")}</p>
        </div>
        <MassageStatus item={it} lang={lang} accent={accent} note={t("st3_smStretch")} />
      </>
    );
  };

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="👥" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st3_smNeeds")}</NeedsPersonCallout>

      <Panel step={1} title={t("st3_smP1")} sub={t("st3_smP1b")} accent={accent}>
        <Segmented
          label={t("st3_smRouteLabel")}
          value={state.route}
          onChange={(route) => setState((s) => ({ ...s, route, attest: NOT_ATTESTED }))}
          options={[
            { id: "retold", label: t("st3_smRoute_retold") },
            { id: "made", label: t("st3_smRoute_made") },
          ]}
        />
        <p className="text-sm leading-relaxed text-muted">{t(`st3_smRouteHint_${state.route}`)}</p>
        {retold &&
          (understood.length === 0 ? (
            <Callout icon="👂" title={t("st3_smNoSourceTitle")}>
              <p>{t("st3_smNoSourceBody")}</p>
            </Callout>
          ) : (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_smSourceLabel")}</span>
              <select
                value={source ? state.sourceId : ""}
                onChange={(e) => setState((s) => ({ ...s, sourceId: e.target.value }))}
                className={field}
              >
                <option value="">{t("st3_smSourcePick")}</option>
                {understood.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.title}
                  </option>
                ))}
              </select>
            </label>
          ))}
      </Panel>

      <Panel step={2} title={t("st3_smP2")} sub={t("st3_smP2b")} accent={accent}>
        <PhraseBank
          title={t("st3_smAskTitle")}
          phrases={retold ? asks : asks.slice(2)}
          lang={lang}
          heard={heard}
          onHeard={markHeard}
        />
      </Panel>

      <Panel step={3} title={t("st3_smP3")} sub={t("st3_smP3b")} accent={accent}>
        <fieldset className="space-y-1">
          <legend className="mb-1 text-sm font-semibold text-ink">{t("st3_smAttestTitle")}</legend>
          {POINTS.map((p) => (
            <label key={p} className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={state.attest[p]}
                onChange={(e) => setState((s) => ({ ...s, attest: { ...s.attest, [p]: e.target.checked } }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-mint)]"
              />
              {t(`st3_smAttest_${state.route}_${p}`)}
            </label>
          ))}
        </fieldset>
        {ready ? (
          <>
            <p className="text-xs leading-relaxed text-muted">{t(retold ? "st3_smBringRetold" : "st3_smBringMade")}</p>
            <RecordPanel
              lang={lang}
              phase={phase.id}
              activityId={activity.id}
              kind="primary"
              speaker="native"
              parentId={retold ? source?.id : undefined}
              defaultTitle={(source ? `${source.title} · ${t("st3_smRecName")}` : t("st3_smRecName")).slice(0, 80)}
              accent={accent}
              tags={["native-sample", state.route]}
              allowImport
              showConsent
              label={t("st3_smRecord")}
              onSaved={() => setState((s) => ({ ...s, attest: NOT_ATTESTED }))}
            />
          </>
        ) : (
          <Callout icon="👆" title={t(retold && !source ? "st3_smNeedSource" : "st3_smNeedAttest")} />
        )}
      </Panel>

      <Panel step={4} title={t("st3_smP4")} sub={t("st3_smP4b")} accent={accent}>
        <Callout icon="🏔️" title={t("st3_smStretchTitle")}>
          <p>{t("st3_smStretch")}</p>
        </Callout>
        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
        <RecordingList
          filter={{ activityId: activity.id, lang }}
          accent={accent}
          moves={playerMoves}
          emptyText={t("st3_smNoRecordings")}
          renderExtra={extras}
        />
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
