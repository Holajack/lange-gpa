"use client";

import { useState, type ReactNode } from "react";
import { useApp } from "@/lib/store";
import type { LangCode, PhaseId } from "@/lib/types";
import type { LibraryItem, RecordingKind, Speaker } from "@/lib/library";
import type { GapType } from "../../ClarifyPlayer";
import { RecordPanel } from "../../RecordPanel";
import { Callout } from "../../StudioShell";
import { hostMoves, scriptsFor } from "../content";
import {
  STAGE_A_MAX_HOURS,
  STAGE_A_MIN_HOURS,
  STAGE_CHECKS,
  fmtDay,
  fmtHours,
  localIso,
  newId,
  trackMinutes,
  type Capstone,
  type StageId,
  type Track,
} from "../model";
import { TaggedRecordingList, TakesUnder } from "../Recordings";
import { AccentButton, CheckLine, Field, RemoveButton, inputCls } from "../ui";
import { Rehearsal } from "./Rehearsal";

export interface StageCtx {
  lang: LangCode;
  phaseId: PhaseId;
  activityId: string;
  accent: string;
  /** `track:{id}` — carried by every recording of this discourse track */
  trackTag: string;
  trackName: string;
}

const IMPROVEMENT_KINDS = ["word", "phrasing", "meaning", "manner"] as const;

function Rec({
  ctx,
  stage,
  kind,
  speaker,
  label,
  title,
  parentId,
  allowImport,
}: {
  ctx: StageCtx;
  stage: StageId;
  kind: RecordingKind;
  speaker: Speaker;
  label: string;
  title: string;
  parentId?: string;
  allowImport?: boolean;
}) {
  return (
    <RecordPanel
      lang={ctx.lang}
      phase={ctx.phaseId}
      activityId={ctx.activityId}
      kind={kind}
      speaker={speaker}
      parentId={parentId}
      tags={[ctx.trackTag, `stage:${stage}`]}
      defaultTitle={title.slice(0, 80)}
      accent={ctx.accent}
      allowImport={allowImport}
      showConsent={speaker !== "me"}
      label={label}
    />
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink">
        <span className="mr-2 text-muted">{n}.</span>
        {title}
      </p>
      {children}
    </div>
  );
}

/**
 * One stage of the discourse-mastery pipeline, as a workbench: its recorder,
 * its recordings (threaded: an improved version hangs under the attempt it
 * improves, a retelling under the model it retells), and its checklist.
 */
export function StagePanel({
  stage,
  ctx,
  track,
  onPatch,
}: {
  stage: StageId;
  ctx: StageCtx;
  track: Track;
  onPatch: (fn: (track: Track) => Track) => void;
}) {
  const { t } = useApp();
  const feedbackMoves = hostMoves("feedback", ctx.lang);
  const clarifyMoves = hostMoves("clarify", ctx.lang);
  const tags = [ctx.trackTag, `stage:${stage}`];
  const base = { activityId: ctx.activityId, lang: ctx.lang };
  const name = ctx.trackName;
  const stageAHours = trackMinutes(track).stageA / 60;

  const improvementKinds: GapType[] = IMPROVEMENT_KINDS.map((id) => ({ id, label: t(`st6_d_gap_${id}`) }));

  /** "Now you, in your own words" — a retelling threaded under a host person's recording. */
  const retellUnder = (item: LibraryItem) => (
    <div className="space-y-3 rounded-2xl border border-line bg-raised p-4">
      <p className="text-sm font-semibold text-ink">{t("st6_d_ownWordsTitle")}</p>
      <p className="text-sm leading-relaxed text-muted">{t("st6_d_ownWordsBody")}</p>
      <Rec
        ctx={ctx}
        stage={stage}
        kind="retell"
        speaker="me"
        parentId={item.id}
        label={t("st6_d_ownWordsRecord")}
        title={`${item.title} · ${t("st6_d_ownWordsName")}`}
      />
      <TakesUnder parent={item} accent={ctx.accent} title={t("st6_d_ownWordsList")} moves={feedbackMoves} />
    </div>
  );

  const checklist = (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted">{t("st6_d_checklist")}</p>
      {Array.from({ length: STAGE_CHECKS[stage] }, (_, i) => {
        const key = `${stage}.${i + 1}`;
        return (
          <CheckLine
            key={key}
            checked={Boolean(track.steps[key])}
            onChange={(next) => onPatch((tr) => ({ ...tr, steps: { ...tr.steps, [key]: next } }))}
          >
            {t(`st6_d_${stage}_c${i + 1}`)}
          </CheckLine>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-muted">{t(`st6_d_${stage}_intro`)}</p>

      {stage === "prelude" && (
        <>
          <Field label={t("st6_d_listLabel")} hint={t("st6_d_listHint")}>
            <textarea
              value={track.occasions}
              onChange={(e) => onPatch((tr) => ({ ...tr, occasions: e.target.value.slice(0, 1200) }))}
              rows={4}
              placeholder={t("st6_d_listPlaceholder")}
              className={inputCls}
            />
          </Field>
          <Step n={1} title={t("st6_d_prelude_s1")}>
            <Rec
              ctx={ctx}
              stage="prelude"
              kind="primary"
              speaker="both"
              label={t("st6_d_prelude_record")}
              title={`${name} · ${t("st6_d_prelude_name")}`}
            />
          </Step>
          <TaggedRecordingList
            filter={base}
            tags={tags}
            accent={ctx.accent}
            moves={clarifyMoves}
            title={t("st6_d_prelude_list")}
          />
        </>
      )}

      {stage === "a" && (
        <>
          <p className="rounded-2xl border border-line bg-raised-2 px-4 py-3 text-sm text-muted">
            {t("st6_d_a_hours")
              .replace("{n}", fmtHours(trackMinutes(track).stageA))
              .replace("{a}", String(STAGE_A_MIN_HOURS))
              .replace("{b}", String(STAGE_A_MAX_HOURS))}
          </p>
          <Step n={1} title={t("st6_d_a_s1")}>
            <Rec
              ctx={ctx}
              stage="a"
              kind="feedback"
              speaker="me"
              label={t("st6_d_a_record")}
              title={`${name} · ${t("st6_d_a_name")}`}
            />
          </Step>
          <Step n={2} title={t("st6_d_a_s2")}>
            <Callout icon="🎯" title={t("st6_d_a_ruleTitle")} tone="warm">
              <p>{t("st6_d_a_ruleBody")}</p>
            </Callout>
            <TaggedRecordingList
              filter={{ ...base, kind: "feedback" }}
              tags={tags}
              accent={ctx.accent}
              gapTypes={improvementKinds}
              moves={feedbackMoves}
              title={t("st6_d_a_list")}
              emptyText={t("st6_d_a_empty")}
              renderExtra={(item) => (
                <div className="space-y-3 rounded-2xl border border-line bg-raised p-4">
                  <p className="text-sm font-semibold text-ink">{t("st6_d_a_s3")}</p>
                  <p className="text-sm leading-relaxed text-muted">{t("st6_d_a_s3Body")}</p>
                  <Rec
                    ctx={ctx}
                    stage="a"
                    kind="improved"
                    speaker="native"
                    parentId={item.id}
                    label={t("st6_d_a_recordImproved")}
                    title={`${item.title} · ${t("st6_d_a_improvedName")}`}
                  />
                  <TakesUnder parent={item} accent={ctx.accent} title={t("st6_d_a_improvedList")} moves={clarifyMoves} />
                </div>
              )}
            />
          </Step>
        </>
      )}

      {stage === "b" && (
        <>
          {stageAHours < STAGE_A_MIN_HOURS && (
            <Callout icon="⏳" title={t("st6_d_b_gateTitle")} tone="warm">
              <p>
                {t("st6_d_b_gateBody")
                  .replace("{n}", fmtHours(trackMinutes(track).stageA))
                  .replace("{a}", String(STAGE_A_MIN_HOURS))
                  .replace("{b}", String(STAGE_A_MAX_HOURS))}
              </p>
            </Callout>
          )}
          <Step n={1} title={t("st6_d_b_s1")}>
            <Rec
              ctx={ctx}
              stage="b"
              kind="primary"
              speaker="native"
              allowImport
              label={t("st6_d_b_record")}
              title={`${name} · ${t("st6_d_b_name")}`}
            />
          </Step>
          <Step n={2} title={t("st6_d_b_s2")}>
            <TaggedRecordingList
              filter={{ ...base, kind: ["primary", "imported"] }}
              tags={tags}
              accent={ctx.accent}
              moves={clarifyMoves}
              title={t("st6_d_b_list")}
              emptyText={t("st6_d_b_empty")}
              renderExtra={retellUnder}
            />
          </Step>
        </>
      )}

      {stage === "script" && (
        <>
          <Step n={1} title={t("st6_d_script_s1")}>
            <Rec
              ctx={ctx}
              stage="script"
              kind="primary"
              speaker="native"
              label={t("st6_d_script_record")}
              title={`${name} · ${t("st6_d_script_name")}`}
            />
          </Step>
          <Step n={2} title={t("st6_d_script_s2")}>
            <TaggedRecordingList
              filter={{ ...base, kind: ["primary", "imported"] }}
              tags={tags}
              accent={ctx.accent}
              moves={clarifyMoves}
              title={t("st6_d_script_list")}
              emptyText={t("st6_d_script_empty")}
              renderExtra={retellUnder}
            />
          </Step>
        </>
      )}

      {stage === "roleplay" && (
        <>
          <Step n={1} title={t("st6_d_roleplay_s1")}>
            <Rec
              ctx={ctx}
              stage="roleplay"
              kind="primary"
              speaker="both"
              label={t("st6_d_roleplay_record")}
              title={`${name} · ${t("st6_d_roleplay_name")}`}
            />
          </Step>
          {/* the Nuri warm-up exists only where prompt lines are authored for the host language */}
          {scriptsFor(ctx.lang).length > 0 && (
            <Step n={2} title={t("st6_d_roleplay_s2")}>
              <Rehearsal ctx={ctx} track={track} onPatch={onPatch} />
            </Step>
          )}
          <TaggedRecordingList
            filter={base}
            tags={tags}
            accent={ctx.accent}
            gapTypes={improvementKinds}
            moves={feedbackMoves}
            title={t("st6_d_roleplay_list")}
          />
        </>
      )}

      {stage === "capstone" && (
        <>
          <Step n={1} title={t("st6_d_capstone_s1")}>
            <Rec
              ctx={ctx}
              stage="capstone"
              kind="primary"
              speaker="both"
              label={t("st6_d_capstone_record")}
              title={`${name} · ${t("st6_d_capstone_name")}`}
            />
            <TaggedRecordingList
              filter={base}
              tags={tags}
              accent={ctx.accent}
              moves={clarifyMoves}
              title={t("st6_d_capstone_list")}
            />
          </Step>
          <Step n={2} title={t("st6_d_capstone_s2")}>
            <CapstoneLog track={track} accent={ctx.accent} onPatch={onPatch} />
          </Step>
        </>
      )}

      {checklist}
    </div>
  );
}

/** The real-life performance, logged with a reflection. Plain record, no rating. */
function CapstoneLog({
  track,
  accent,
  onPatch,
}: {
  track: Track;
  accent: string;
  onPatch: (fn: (track: Track) => Track) => void;
}) {
  const { t, uiLang } = useApp();
  const [date, setDate] = useState(localIso());
  const [what, setWhat] = useState("");
  const [reflection, setReflection] = useState("");

  const save = () => {
    const clean = what.trim().slice(0, 160);
    if (!clean) return;
    const entry: Capstone = {
      id: newId("cap"),
      date: date || localIso(),
      what: clean,
      reflection: reflection.trim().slice(0, 800),
    };
    onPatch((tr) => ({ ...tr, capstones: [entry, ...tr.capstones] }));
    setWhat("");
    setReflection("");
  };

  return (
    <div className="space-y-3">
      <form
        className="space-y-3 rounded-2xl border border-line bg-raised-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[11rem_1fr]">
          <Field label={t("st6_d_capDate")}>
            <input
              type="date"
              value={date}
              max={localIso()}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t("st6_d_capWhat")}>
            <input
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              maxLength={160}
              placeholder={t("st6_d_capWhatPlaceholder")}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label={t("st6_d_capReflect")} hint={t("st6_d_capReflectHint")}>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={3}
            maxLength={800}
            placeholder={t("st6_d_capReflectPlaceholder")}
            className={inputCls}
          />
        </Field>
        <AccentButton accent={accent} type="submit" disabled={!what.trim()}>
          {t("st6_d_capSave")}
        </AccentButton>
      </form>
      {track.capstones.length > 0 && (
        <ul className="space-y-2">
          {track.capstones.map((c) => (
            <li key={c.id} className="flex items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-3">
              <span className="min-w-0 flex-1 text-sm">
                <span className="block text-xs text-muted">{fmtDay(c.date, uiLang)}</span>
                <span className="block break-words font-semibold text-ink">{c.what}</span>
                {c.reflection && <span className="mt-1 block break-words leading-relaxed text-muted">{c.reflection}</span>}
              </span>
              <RemoveButton
                label={t("st6_remove")}
                onConfirm={() => onPatch((tr) => ({ ...tr, capstones: tr.capstones.filter((x) => x.id !== c.id) }))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
