"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLibrary } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  ConfidentialBanner,
  FinishBar,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { ASK_TO_RECORD, hasHostLines } from "./content";
import { TAG, useFlows } from "./discourse";
import { useGapTypes } from "./MarkList";
import { usePersisted } from "./storage";
import { BTN_GHOST, ChoiceChips, Field, HostPhrases, INPUT, Panel } from "./ui";
import { PacingCard } from "./record/PacingCard";
import { RequestBoard, statusOf } from "./record/RequestBoard";
import {
  CLOSENESS,
  DISCOURSE_TYPES,
  EMPTY_RECORD_STORE,
  GOOD_RECORDING_MIN,
  MIN_RECORDING_MIN,
  type Closeness,
  type DiscourseType,
  type RecordStore,
} from "./record/model";

/**
 * p5-record — Collect Native-to-Native Recordings.
 *
 * A pipeline, not a practice screen. Host people make these recordings with
 * the grower out of the room; this tool keeps track of who was asked for
 * what, takes the finished audio into the library behind an absence
 * attestation, and shows whether collecting is keeping ahead of clarifying.
 */
export function RecordTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const gapTypes = useGapTypes();
  const [store, setStore, ready] = usePersisted<RecordStore>(activity.id, lang, EMPTY_RECORD_STORE);
  const { items } = useLibrary({ lang });
  const { flows } = useFlows(lang);

  // intake
  const intakeRef = useRef<HTMLDivElement>(null);
  const [forRequest, setForRequest] = useState<string>("");
  const [looseType, setLooseType] = useState<DiscourseType>("hot");
  const [looseCloseness, setLooseCloseness] = useState<Closeness>("strangers");
  const [absent, setAbsent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const open = store.requests.filter((r) => {
    if (r.lang !== lang) return false;
    const s = statusOf(r, items, flows);
    return s === "asked" || s === "recorded";
  });
  const request = open.find((r) => r.id === forRequest);
  const type = request?.type ?? looseType;
  const closeness = request?.closeness ?? looseCloseness;
  const attested = absent && consent;

  const steps: GuideStep[] = [
    { title: t("st5_recS1"), body: t("st5_recS1b"), who: "you" },
    { title: t("st5_recS2"), body: t("st5_recS2b"), who: "you" },
    { title: t("st5_recS3"), body: t("st5_recS3b") },
    {
      title: t("st5_recS4"),
      body: t("st5_recS4b")
        .replace("{good}", String(GOOD_RECORDING_MIN))
        .replace("{min}", String(MIN_RECORDING_MIN)),
    },
    { title: t("st5_recS5"), body: t("st5_recS5b"), who: "you" },
    { title: t("st5_recS6"), body: t("st5_recS6b"), who: "you" },
    { title: t("st5_recS7"), body: t("st5_recS7b"), who: "you" },
  ];

  const bringIn = (id: string) => {
    setForRequest(id);
    setJustSaved(false);
    intakeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="🎙️" mode="nurturer" />

      <Callout icon="🚪" title={t("st5_recRuleTitle")} tone="warm">
        <p>{t("st5_recRuleBody")}</p>
      </Callout>

      {ready && (
        <StepGuide
          steps={steps}
          accent={phase.color}
          defaultOpen={store.requests.length === 0 && items.length === 0}
        />
      )}

      <PacingCard
        lang={lang}
        accent={phase.color}
        weeklyHours={store.weeklyMentorHours}
        onWeeklyHours={(weeklyMentorHours) => setStore((prev) => ({ ...prev, weeklyMentorHours }))}
      />

      <RequestBoard
        lang={lang}
        accent={phase.color}
        requests={store.requests}
        items={items}
        flows={flows}
        onAdd={(req) => setStore((prev) => ({ ...prev, requests: [...prev.requests, req] }))}
        onPatch={(id, change) =>
          setStore((prev) => ({
            ...prev,
            requests: prev.requests.map((r) => (r.id === id ? { ...r, ...change } : r)),
          }))
        }
        onRemove={(id) => setStore((prev) => ({ ...prev, requests: prev.requests.filter((r) => r.id !== id) }))}
        onBringIn={bringIn}
      />

      <div ref={intakeRef} className="scroll-mt-6">
        <Panel title={t("st5_inTitle")} sub={t("st5_inSub")}>
          <Field label={t("st5_inFor")}>
            <select
              value={request ? request.id : ""}
              onChange={(e) => {
                setForRequest(e.target.value);
                setJustSaved(false);
              }}
              className={INPUT}
            >
              <option value="">{t("st5_inForNone")}</option>
              {open.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.topic || t(`st5_type_${r.type}`)} · {r.recorder}
                </option>
              ))}
            </select>
          </Field>

          {!request && (
            <div className="space-y-4">
              <ChoiceChips
                label={t("st5_reqType")}
                value={looseType}
                onChange={setLooseType}
                options={DISCOURSE_TYPES.map((id) => ({ id, label: t(`st5_type_${id}`) }))}
              />
              <ChoiceChips
                label={t("st5_reqCloseness")}
                value={looseCloseness}
                onChange={setLooseCloseness}
                options={CLOSENESS.map((id) => ({ id, label: t(`st5_close_${id}`) }))}
              />
            </div>
          )}

          <fieldset className="space-y-3 rounded-3xl border border-line bg-raised-2 p-4">
            <legend className="px-1 text-xs font-semibold text-muted">{t("st5_attTitle")}</legend>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
              <input
                type="checkbox"
                checked={absent}
                onChange={(e) => setAbsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-mint)]"
              />
              <span>{t("st5_attAbsent")}</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-mint)]"
              />
              <span>{t("st5_attConsent")}</span>
            </label>
          </fieldset>

          {type === "life" && <ConfidentialBanner />}

          {attested ? (
            <div className="space-y-2">
              <RecordPanel
                lang={lang}
                phase={5}
                activityId={activity.id}
                kind="imported"
                defaultTitle={request?.topic || t(`st5_type_${type}`)}
                accent={phase.color}
                speaker="native"
                confidential={type === "life"}
                tags={[TAG.attested, `type:${type}`, `close:${closeness}`]}
                allowImport
                showConsent
                label={t("st5_inRecordHere")}
                onSaved={(item) => {
                  if (request) {
                    setStore((prev) => ({
                      ...prev,
                      requests: prev.requests.map((r) =>
                        r.id === request.id
                          ? { ...r, status: "recorded", recordingId: item.id, attestedAt: new Date().toISOString() }
                          : r
                      ),
                    }));
                  }
                  setForRequest("");
                  setAbsent(false);
                  setConsent(false);
                  setJustSaved(true);
                }}
              />
              <p className="text-xs leading-relaxed text-muted">{t("st5_inRecordHereHint")}</p>
            </div>
          ) : (
            <p className="text-sm text-muted">{t("st5_attNeeded")}</p>
          )}

          {justSaved && (
            <div className="flex flex-wrap items-center gap-3" role="status">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-mint">
                <Check size={15} strokeWidth={3} aria-hidden /> {t("st5_inSaved")}
              </span>
              <Link href="/studio/p5-tensteps" className={BTN_GHOST}>
                {t("st5_reqClarify")} →
              </Link>
            </div>
          )}
        </Panel>
      </div>

      {hasHostLines(ASK_TO_RECORD, lang) && (
        <Panel title={t("st5_askTitle")} sub={t("st5_askSub")}>
          <HostPhrases title={t("st5_sayIt")} lines={ASK_TO_RECORD} lang={lang} />
        </Panel>
      )}

      <Panel title={t("st5_preTitle")} sub={t("st5_preSub")}>
        <RecordingList
          filter={{ activityId: activity.id, lang }}
          accent={phase.color}
          gapTypes={gapTypes}
          title={t("st5_preList")}
          emptyText={t("st5_preEmpty")}
        />
      </Panel>

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
