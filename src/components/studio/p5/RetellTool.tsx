"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, updateRecording, useLibrary, type LibraryItem } from "@/lib/library";
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
import { RETELL_MOVES } from "./content";
import { discoursesOf, retellQueue, TAG, useFlows, useRetellStore } from "./discourse";
import { addMark, MarkList } from "./MarkList";
import { RangePlayer, type SeekRequest } from "./RangePlayer";
import { showDay, todayIso } from "./storage";
import { accentBtn, BTN_GHOST, BTN_QUIET, Field, HostPhrases, INPUT, Panel } from "./ui";

interface Target {
  itemId: string;
  start: number;
  end: number;
  whole: boolean;
}

/** The mentor's own telling of the same thing, threaded under the grower's retelling. */
function MentorTelling({ retelling, lang, accent, activityId }: { retelling: LibraryItem; lang: LangCode; accent: string; activityId: string }) {
  const { t } = useApp();
  return (
    <div className="space-y-2 rounded-3xl border border-line bg-raised p-4">
      <p className="text-sm font-semibold text-ink">{t("st5_rtMentorTitle")}</p>
      <p className="text-sm leading-relaxed text-muted">{t("st5_rtMentorBody")}</p>
      <RecordPanel
        lang={lang}
        phase={5}
        activityId={activityId}
        kind="improved"
        defaultTitle={`${t("st5_rtMentorRecTitle")}: ${retelling.title}`.slice(0, 80)}
        accent={accent}
        speaker="nurturer"
        parentId={retelling.id}
        tags={[TAG.mentorTelling]}
        showConsent
        label={t("st5_rtMentorRec")}
      />
    </div>
  );
}

/** Free notes on a retelling, saved onto the recording when you leave the box. */
function HolesNote({ retelling }: { retelling: LibraryItem }) {
  const { t } = useApp();
  const [draft, setDraft] = useState(retelling.note ?? "");
  useEffect(() => setDraft(retelling.note ?? ""), [retelling.id, retelling.note]);
  return (
    <Field label={t("st5_rtHoles")} hint={t("st5_rtHolesHint")}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== (retelling.note ?? "")) void updateRecording(retelling.id, { note: draft.trim() || undefined });
        }}
        rows={3}
        maxLength={600}
        className={`${INPUT} resize-y`}
      />
    </Field>
  );
}

/**
 * p5-retell — Next-Day Retelling.
 *
 * Whatever was clarified yesterday (or earlier) and has not been retold yet
 * surfaces here on its own. The grower retells it from memory first, then
 * listens to the original once to hear what went missing.
 */
export function RetellTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const { items, ready } = useLibrary({ lang });
  const { flows, ready: flowsReady } = useFlows(lang);
  const [retellStore, setRetellStore] = useRetellStore(lang);
  const today = todayIso();

  const [target, setTarget] = useState<Target | null>(null);
  const [retellId, setRetellId] = useState<string | null>(null);
  const [told, setTold] = useState(false);
  const [seek, setSeek] = useState<SeekRequest | null>(null);
  const [other, setOther] = useState("");

  const queue = retellQueue(items, flows, lang, today, retellStore.toldLive);
  const due = queue.filter((entry) => entry.due);
  const discourses = discoursesOf(items, lang);
  const source = target ? items.find((it) => it.id === target.itemId) : undefined;
  const retelling = retellId ? items.find((it) => it.id === retellId) : undefined;
  const compare = Boolean(retelling) || told;

  const choose = (next: Target) => {
    setTarget(next);
    setRetellId(null);
    setTold(false);
  };

  const steps: GuideStep[] = [
    { title: t("st5_rtS1"), body: t("st5_rtS1b"), who: "you" },
    { title: t("st5_rtS2"), body: t("st5_rtS2b"), who: "you" },
    { title: t("st5_rtS3"), body: t("st5_rtS3b"), who: "both" },
    { title: t("st5_rtS4"), body: t("st5_rtS4b"), who: "you" },
    { title: t("st5_rtS5"), body: t("st5_rtS5b"), who: "you" },
    { title: t("st5_rtS6"), body: t("st5_rtS6b"), who: "both" },
    { title: t("st5_rtS7"), body: t("st5_rtS7b"), who: "you" },
  ];

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="🗣️" mode="either" />
      <Callout icon="🤝" title={t("st5_rtModeTitle")}>
        <p>{t("st5_rtModeBody")}</p>
      </Callout>
      {ready && (
        <StepGuide
          steps={steps}
          accent={phase.color}
          defaultOpen={!items.some((it) => it.activityId === activity.id)}
        />
      )}

      <Panel title={t("st5_rtDueTitle")} sub={t("st5_rtDueSub")}>
        {ready && flowsReady && queue.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted">{t("st5_rtDueEmpty")}</p>
            <Link href="/studio/p5-tensteps" className={BTN_GHOST}>
              {t("st5_rtGoClarify")} →
            </Link>
          </div>
        )}
        <ul className="space-y-2">
          {queue.map((entry) => {
            const on = target?.itemId === entry.item.id && target.start === entry.start && target.end === entry.end;
            return (
              <li key={entry.item.id} className="rounded-2xl border border-line bg-raised-2 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-semibold text-ink">{entry.item.title}</p>
                    <p className="text-xs tabular-nums text-muted">
                      {entry.whole ? t("st5_rtWhole") : `${fmtDuration(entry.start)}–${fmtDuration(entry.end)}`} ·{" "}
                      {t("st5_rtClarifiedOn")} {showDay(entry.clarifiedOn)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      entry.due ? "bg-amber/20 text-amber" : "bg-white/6 text-muted"
                    }`}
                  >
                    {entry.due ? `⏰ ${t("st5_rtDue")}` : t("st5_rtDueTomorrow")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      choose({ itemId: entry.item.id, start: entry.start, end: entry.end, whole: entry.whole })
                    }
                    aria-pressed={on}
                    {...accentBtn(phase.color)}
                  >
                    {t("st5_rtStart")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {ready && due.length > 0 && <p className="text-xs text-muted">{t("st5_rtDueCount").replace("{n}", String(due.length))}</p>}

        {discourses.length > 0 && (
          <div className="grid gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label={t("st5_rtOther")}>
              <select value={other} onChange={(e) => setOther(e.target.value)} className={INPUT}>
                <option value="">{t("st5_rtOtherPick")}</option>
                {discourses.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.title}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="button"
              disabled={!other}
              onClick={() => {
                const it = discourses.find((d) => d.id === other);
                if (it) choose({ itemId: it.id, start: 0, end: it.durationSec, whole: true });
              }}
              className={BTN_GHOST}
            >
              {t("st5_rtStart")}
            </button>
          </div>
        )}
      </Panel>

      {target && source && (
        <Panel
          title={t("st5_rtBenchTitle")}
          sub={`${source.title} · ${target.whole ? t("st5_rtWhole") : `${fmtDuration(target.start)}–${fmtDuration(target.end)}`}`}
        >
          {/* 1. from memory */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">1 · {t("st5_rtFromMemory")}</p>
            <p className="text-sm leading-relaxed text-muted">{t("st5_rtFromMemoryBody")}</p>
            <RecordPanel
              lang={lang}
              phase={5}
              activityId={activity.id}
              kind="retell"
              defaultTitle={`${t("st5_rtRecTitle")}: ${source.title}`.slice(0, 80)}
              accent={phase.color}
              speaker="me"
              parentId={source.id}
              tags={[`range:${Math.round(target.start)}-${Math.round(target.end)}`, target.whole ? "whole" : "part"]}
              label={t("st5_rtRec")}
              onSaved={(saved) => setRetellId(saved.id)}
            />
            {!compare && (
              <button
                type="button"
                onClick={() => {
                  setTold(true);
                  setRetellStore((prev) => ({
                    toldLive: { ...prev.toldLive, [target.itemId]: new Date().toISOString() },
                  }));
                }}
                className={BTN_QUIET}
              >
                {t("st5_rtToldLive")}
              </button>
            )}
            <HostPhrases title={t("st5_sayIt")} lines={RETELL_MOVES} lang={lang} />
          </div>

          {/* 2. compare */}
          {compare ? (
            <div className="space-y-4 border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">2 · {t("st5_rtCompare")}</p>
              <p className="text-sm leading-relaxed text-muted">{t("st5_rtCompareBody")}</p>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">{t("st5_rtOriginal")}</p>
                <RangePlayer item={source} start={target.start} end={target.end} accent={phase.color} />
              </div>
              {retelling && (
                <>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted">{t("st5_rtYours")}</p>
                    <RangePlayer
                      item={retelling}
                      start={0}
                      end={retelling.durationSec}
                      accent={phase.color}
                      marks={retelling.marks}
                      onFlag={(at) => void addMark(retelling.id, at)}
                      flagLabel={t("st5_rtFlag")}
                      seekRequest={seek}
                    />
                  </div>
                  <MarkList
                    item={retelling}
                    start={0}
                    end={0}
                    accent={phase.color}
                    lang={lang}
                    activityId={activity.id}
                    onJump={(to) => setSeek((prev) => ({ t: to, n: (prev?.n ?? 0) + 1 }))}
                    wordRecorder={false}
                    emptyText={t("st5_rtNoFlags")}
                  />
                  <HolesNote retelling={retelling} />
                  <MentorTelling retelling={retelling} lang={lang} accent={phase.color} activityId={activity.id} />
                </>
              )}
              <p className="flex items-center gap-1.5 text-sm font-semibold text-mint" role="status">
                <Check size={15} strokeWidth={3} aria-hidden /> {retelling ? t("st5_rtSaved") : t("st5_rtToldNote")}
              </p>
            </div>
          ) : (
            <p className="border-t border-line pt-4 text-sm text-muted">🔒 {t("st5_rtCompareLocked")}</p>
          )}
        </Panel>
      )}

      <Panel title={t("st5_rtPastTitle")}>
        <RecordingList
          filter={{ activityId: activity.id, lang, kind: ["retell", "improved"] }}
          accent={phase.color}
          title={t("st5_rtPastList")}
          emptyText={t("st5_rtPastEmpty")}
          renderExtra={(it) =>
            it.kind === "retell" ? (
              <MentorTelling retelling={it} lang={lang} accent={phase.color} activityId={activity.id} />
            ) : null
          }
        />
      </Panel>

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
