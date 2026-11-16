"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDuration, useLibrary, type LibraryItem } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import type { StudioToolProps } from "../types";
import {
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import { ClarifyPlayer, type GapType } from "../ClarifyPlayer";
import { RecordPanel } from "../RecordPanel";
import { ASK_MOVES, hostLines } from "./content";
import { SayChip, Section, useStored } from "./kit";

/** Phase 2 activities whose recordings are worth clarifying. */
const SOURCES = ["p2-storybuild", "p2-describe", "p2-busy", "p2-process", "p2-lifestory", "p2-clarify"];

interface ClarifyState {
  selected: string | null;
  /** recording id → how many full listens it had when its last flag was cleared */
  cleared: Record<string, number>;
}

const INITIAL: ClarifyState = { selected: null, cleared: {} };

const openMarks = (it: LibraryItem) => it.marks.filter((m) => !m.resolved).length;

/**
 * p2-clarify — Clarifying the Recording, the phase's cornerstone.
 * Pick something your nurturer said → listen → flag every moment you lose →
 * work each one out WITH HER, in her language → note it, log the word, mark
 * it understood → listen again clean. The app never explains the audio.
 */
export function ClarifyTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, update] = useStored<ClarifyState>(activity.id, lang, INITIAL);
  const [askOpen, setAskOpen] = useState(false);
  const accent = phase.color;
  const { items, ready } = useLibrary({ lang, activityId: SOURCES, kind: ["primary", "improved", "imported"] });
  const { words } = useWordLog(lang);

  // someone else's speech only — your own descriptions are not what gets clarified
  const recordings = items.filter((it) => it.speaker !== "me");
  const rec = recordings.find((it) => it.id === state.selected) ?? null;

  const total = rec?.marks.length ?? 0;
  const resolved = rec ? total - openMarks(rec) : 0;
  const heard = rec?.relistens.length ?? 0;
  const clearedAt = rec ? state.cleared[rec.id] : undefined;
  const recId = rec?.id;

  // remember the moment the last flag was cleared, so a listen AFTER it counts as the clean one
  useEffect(() => {
    if (!recId) return;
    const allClear = total > 0 && resolved === total;
    if (allClear && clearedAt === undefined) {
      update((s) => ({ ...s, cleared: { ...s.cleared, [recId]: heard } }));
    } else if (!allClear && clearedAt !== undefined) {
      update((s) => {
        const next = { ...s.cleared };
        delete next[recId];
        return { ...s, cleared: next };
      });
    }
  }, [recId, total, resolved, heard, clearedAt, update]);

  const steps: GuideStep[] = [
    { title: t("st2_clS1"), body: t("st2_clS1b"), who: "both" },
    { title: t("st2_clS2"), body: t("st2_clS2b"), who: "you" },
    { title: t("st2_clS3"), body: t("st2_clS3b"), who: "both" },
    { title: t("st2_clS4"), body: t("st2_clS4b"), who: "you" },
    { title: t("st2_clS5"), body: t("st2_clS5b"), who: "nurturer" },
    { title: t("st2_clS6"), body: t("st2_clS6b"), who: "you" },
  ];

  const gapTypes: GapType[] = [
    { id: "new", label: t("st2_gapNew") },
    { id: "fast", label: t("st2_gapFast") },
    { id: "stretch", label: t("st2_gapStretch") },
  ];

  const moves = hostLines(ASK_MOVES, lang);

  const stages = [
    { label: t("st2_clStage1"), done: heard > 0 || total > 0 },
    { label: t("st2_clStage2"), done: total > 0 },
    { label: t("st2_clStage3"), done: total > 0 && resolved === total },
    { label: t("st2_clStage4"), done: clearedAt !== undefined && heard > clearedAt },
  ];

  const sum = (fn: (it: LibraryItem) => number) => recordings.reduce((n, it) => n + fn(it), 0);
  const stats = [
    { n: sum((it) => it.marks.length), label: t("st2_clStatFlagged") },
    { n: sum((it) => it.marks.length - openMarks(it)), label: t("st2_clStatCleared") },
    { n: sum((it) => it.relistens.length), label: t("st2_clStatHeard") },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🚩" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st2_clNeeds")}</NeedsPersonCallout>

      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{s.n}</dd>
            <dt className="mt-1 text-xs leading-snug text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>

      <Section title={t("st2_clPickTitle")} sub={t("st2_clPickSub")}>
        {ready && recordings.length === 0 && (
          <p className="text-sm leading-relaxed text-muted">
            {t("st2_clEmpty")}{" "}
            <Link href="/studio/p2-storybuild" className="font-semibold text-ink underline underline-offset-4">
              {t("st2_clEmptyLink")}
            </Link>
          </p>
        )}
        <ul className="space-y-2">
          {recordings.map((it) => {
            const picked = it.id === rec?.id;
            const marks = it.marks.length;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  aria-pressed={picked}
                  onClick={() => update((s) => ({ ...s, selected: picked ? null : it.id }))}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left hover:bg-raised-2 ${
                    picked ? "border-white/40 bg-raised-2" : "border-line bg-raised"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{it.title}</span>
                    <span className="block text-xs text-muted">
                      {fmtDuration(it.durationSec)} · {t("stc_plHeard")} {it.relistens.length} {t("stc_plTimes")}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-xs font-bold tabular-nums text-ink">
                    {marks === 0
                      ? t("st2_clNoFlags")
                      : t("st2_clFlagsOf")
                          .replace("{n}", String(marks - openMarks(it)))
                          .replace("{total}", String(marks))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">{t("st2_clAddTitle")}</p>
          <RecordPanel
            lang={lang}
            phase={2}
            activityId={activity.id}
            kind="primary"
            speaker="nurturer"
            accent={accent}
            defaultTitle={t("st2_clAddName")}
            label={t("st2_clAddRecord")}
            allowImport
            showConsent
            onSaved={(item) => update((s) => ({ ...s, selected: item.id }))}
          />
        </div>
      </Section>

      {rec && (
        <Section title={t("st2_clWorkTitle")} sub={t("st2_clWorkSub")}>
          <ol className="grid gap-2 sm:grid-cols-2">
            {stages.map((stage, i) => (
              <li
                key={i}
                className="flex items-center gap-2.5 rounded-2xl border border-line bg-raised-2 px-3 py-2.5 text-sm"
              >
                {stage.done ? (
                  <Check size={16} strokeWidth={3} className="shrink-0 text-mint" aria-hidden />
                ) : (
                  <Circle size={16} strokeWidth={2.5} className="shrink-0 text-muted" aria-hidden />
                )}
                <span className={stage.done ? "font-semibold text-ink" : "text-muted"}>
                  {i + 1}. {stage.label}
                  <span className="sr-only"> {stage.done ? t("st2_done") : t("st2_notYet")}</span>
                </span>
              </li>
            ))}
          </ol>

          <p className="text-sm text-muted" role="status">
            {t("st2_clProgress")
              .replace("{flagged}", String(total))
              .replace("{cleared}", String(resolved))
              .replace("{heard}", String(heard))
              .replace("{words}", String(words.filter((w) => w.sourceId === rec.id).length))}
          </p>

          <ClarifyPlayer
            item={rec}
            accent={accent}
            gapTypes={gapTypes}
            moves={moves ?? undefined}
            onDeleted={() => update((s) => ({ ...s, selected: null }))}
          />

          {/* the player lists the ways to ask; this lets the grower hear them said */}
          {moves && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setAskOpen((v) => !v)}
                aria-expanded={askOpen}
                className="text-sm font-semibold text-ink underline underline-offset-4"
              >
                {t("st2_clAskTitle")}
              </button>
              {askOpen && (
                <>
                  <p className="text-xs leading-relaxed text-muted">{t("st2_clAskSub")}</p>
                  <div className="flex flex-wrap gap-2">
                    {moves.map((m) => (
                      <SayChip key={m} text={m} lang={lang} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">{t("st2_clExplainTitle")}</p>
            <p className="text-xs leading-relaxed text-muted">{t("st2_clExplainSub")}</p>
            <RecordPanel
              lang={lang}
              phase={2}
              activityId={activity.id}
              kind="expansion"
              speaker="nurturer"
              accent={accent}
              parentId={rec.id}
              defaultTitle={`${rec.title} · ${t("st2_clExplainName")}`}
              label={t("st2_clExplainRecord")}
              showConsent
            />
          </div>
          <RecordingList
            filter={{ parentId: rec.id }}
            accent={accent}
            title={t("st2_clTakes")}
            emptyText={t("st2_clNoTakes")}
            gapTypes={gapTypes}
            moves={moves ?? undefined}
          />
        </Section>
      )}

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
