"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, Plus, Square, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode, PhaseId } from "@/lib/types";
import { useBlobUrl, useLibrary, type LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { P4_FEEDBACK_ASKS, P4_JOURNAL_ASK, P4_TALK_MENU } from "./content";
import { JournalCapture, TalkPicker, type JournalEntry } from "./TalkJournal";
import {
  AddLine,
  AnonymizeNote,
  INPUT,
  Panel,
  PhraseBook,
  ROW,
  SMALL_BTN,
  SUB,
  uid,
  useGapTypes,
  useReturning,
  useSteps,
  useStudioState,
} from "./shared";

/**
 * p4-feedback — Record Yourself for Feedback.
 * The solo half is real: talk at length, listen back, flag what you doubt.
 * The verdict is not Nuri's to give: "would someone here say it that way?"
 * is answered by a mentor, sentence by sentence, and they record their own
 * version to compare against.
 */

/** One line of the guide's three-column chart. */
interface ChartRow {
  id: string;
  recId: string;
  said: string;
  native: string;
  why?: string;
}

/** Something that keeps coming up, worth its own practice. */
interface Issue {
  id: string;
  text: string;
  seen: number;
  sorted?: boolean;
}

interface FeedbackState {
  rows: ChartRow[];
  issues: Issue[];
  pick: string | null;
  tellings: Record<string, number>;
  journal: JournalEntry[];
}

const INITIAL: FeedbackState = { rows: [], issues: [], pick: null, tellings: {}, journal: [] };

/** Plays the grower's take and the mentor's version one after the other. */
function PairCompare({ mine, theirs, accent }: { mine: LibraryItem; theirs: LibraryItem; accent: string }) {
  const { t } = useApp();
  const mineUrl = useBlobUrl(mine.id);
  const theirsUrl = useBlobUrl(theirs.id);
  const mineRef = useRef<HTMLAudioElement | null>(null);
  const theirsRef = useRef<HTMLAudioElement | null>(null);
  const [chain, setChain] = useState(false);
  const [now, setNow] = useState<"mine" | "theirs" | null>(null);

  const stop = () => {
    mineRef.current?.pause();
    theirsRef.current?.pause();
    setChain(false);
  };
  const play = (which: "mine" | "theirs", chained = false) => {
    mineRef.current?.pause();
    theirsRef.current?.pause();
    setChain(chained);
    const el = which === "mine" ? mineRef.current : theirsRef.current;
    if (!el) return;
    try {
      el.currentTime = 0;
    } catch {
      // unseekable — plays from wherever it is
    }
    el.play().catch(() => setNow(null));
  };
  const btn = (on: boolean) =>
    `pill min-h-10 px-4 py-2 text-sm font-bold ${on ? "bg-white/15 text-ink" : "bg-white/6 text-ink"}`;

  return (
    <div className={SUB}>
      <div>
        <h3 className="text-sm font-semibold text-ink">{t("st4_fb_compareTitle")}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t("st4_fb_compareBody")}</p>
      </div>
      {mineUrl && (
        <audio
          ref={mineRef}
          src={mineUrl}
          onPlay={() => setNow("mine")}
          onPause={() => setNow((n) => (n === "mine" ? null : n))}
          onEnded={() => {
            if (chain) play("theirs");
          }}
        />
      )}
      {theirsUrl && (
        <audio
          ref={theirsRef}
          src={theirsUrl}
          onPlay={() => setNow("theirs")}
          onPause={() => setNow((n) => (n === "theirs" ? null : n))}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => play("mine", true)}
          disabled={!mineUrl || !theirsUrl}
          className={`pill min-h-10 px-4 py-2 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
          style={{ background: accent }}
        >
          {t("st4_fb_playBoth")}
        </button>
        <button type="button" onClick={() => play("mine")} aria-pressed={now === "mine"} className={btn(now === "mine")}>
          {t("st4_fb_playMine")}
        </button>
        <button
          type="button"
          onClick={() => play("theirs")}
          aria-pressed={now === "theirs"}
          className={btn(now === "theirs")}
        >
          {t("st4_fb_playTheirs")}
        </button>
        {now && (
          <button type="button" onClick={stop} className={SMALL_BTN}>
            <Square size={12} strokeWidth={3} aria-hidden /> {t("stc_recStop")}
          </button>
        )}
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        {now ? t(now === "mine" ? "st4_fb_nowMine" : "st4_fb_nowTheirs") : ""}
      </p>
    </div>
  );
}

/** Everything that hangs off one of the grower's recordings: the chart, the mentor's version, the comparison. */
function FeedbackBench({
  item,
  rows,
  onRows,
  onIssue,
  phaseId,
  lang,
  accent,
}: {
  item: LibraryItem;
  rows: ChartRow[];
  onRows: (fn: (prev: ChartRow[]) => ChartRow[]) => void;
  onIssue: (text: string) => void;
  phaseId: PhaseId;
  lang: LangCode;
  accent: string;
}) {
  const { t } = useApp();
  const { all } = useLibrary();
  const gapTypes = useGapTypes();
  const [draft, setDraft] = useState({ said: "", native: "", why: "" });
  const mine = rows.filter((r) => r.recId === item.id);
  const improved = all.filter((it) => it.parentId === item.id && it.kind === "improved");

  const addRow = () => {
    const said = draft.said.trim();
    const native = draft.native.trim();
    if (!said || !native) return;
    onRows((prev) => [...prev, { id: uid("row"), recId: item.id, said, native, why: draft.why.trim() || undefined }]);
    setDraft({ said: "", native: "", why: "" });
  };

  return (
    <div className="space-y-3">
      {/* the three-column chart */}
      <div className={SUB}>
        <div>
          <h3 className="text-sm font-semibold text-ink">{t("st4_fb_chartTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("st4_fb_chartBody")}</p>
        </div>
        {mine.length > 0 && (
          <ul className="space-y-2">
            {mine.map((r) => (
              <li key={r.id} className={ROW}>
                <dl className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold text-muted">{t("st4_fb_colSaid")}</dt>
                    <dd lang={lang} className="break-words text-sm text-ink">
                      {r.said}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted">{t("st4_fb_colNative")}</dt>
                    <dd lang={lang} className="break-words text-sm font-semibold text-ink">
                      {r.native}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted">{t("st4_fb_colWhy")}</dt>
                    <dd className="break-words text-sm text-ink">{r.why ?? "–"}</dd>
                  </div>
                </dl>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onIssue(r.why ?? r.native)} className={SMALL_BTN}>
                    <Plus size={12} strokeWidth={3} aria-hidden /> {t("st4_fb_toIssues")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRows((prev) => prev.filter((x) => x.id !== r.id))}
                    aria-label={t("st4_remove")}
                    className="pill h-10 w-10 justify-center bg-white/5 p-0 text-muted hover:text-coral"
                  >
                    <Trash2 size={14} strokeWidth={2.5} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid gap-2 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            addRow();
          }}
        >
          <input
            value={draft.said}
            onChange={(e) => setDraft((d) => ({ ...d, said: e.target.value }))}
            placeholder={t("st4_fb_colSaid")}
            aria-label={t("st4_fb_colSaid")}
            maxLength={200}
            lang={lang}
            className={`${INPUT} w-full`}
          />
          <input
            value={draft.native}
            onChange={(e) => setDraft((d) => ({ ...d, native: e.target.value }))}
            placeholder={t("st4_fb_colNative")}
            aria-label={t("st4_fb_colNative")}
            maxLength={200}
            lang={lang}
            className={`${INPUT} w-full`}
          />
          <input
            value={draft.why}
            onChange={(e) => setDraft((d) => ({ ...d, why: e.target.value }))}
            placeholder={t("st4_fb_colWhyPlaceholder")}
            aria-label={t("st4_fb_colWhy")}
            maxLength={200}
            className={`${INPUT} w-full`}
          />
          <button
            type="submit"
            disabled={!draft.said.trim() || !draft.native.trim()}
            className={`pill min-h-11 px-4 py-2 text-sm font-bold disabled:opacity-40 sm:col-span-3 sm:justify-self-start ${textOn(accent)}`}
            style={{ background: accent }}
          >
            <Plus size={15} strokeWidth={3} aria-hidden /> {t("st4_fb_addRow")}
          </button>
        </form>
      </div>

      {/* the mentor's version, threaded under the grower's take */}
      <div className={SUB}>
        <div>
          <h3 className="text-sm font-semibold text-ink">{t("st4_fb_improvedTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("st4_fb_improvedBody")}</p>
        </div>
        <RecordPanel
          lang={lang}
          phase={phaseId}
          activityId={item.activityId}
          kind="improved"
          speaker="native"
          parentId={item.id}
          showConsent
          confidential={item.confidential}
          accent={accent}
          defaultTitle={`${item.title} · ${t("st4_fb_theirWay")}`.slice(0, 80)}
          label={t("st4_fb_recordTheirs")}
        />
        <RecordingList
          filter={{ parentId: item.id, kind: "improved" }}
          accent={accent}
          gapTypes={gapTypes}
          title={t("st4_fb_improvedList")}
          emptyText={t("st4_fb_improvedEmpty")}
        />
      </div>

      {improved[0] && <PairCompare mine={item} theirs={improved[0]} accent={accent} />}
    </div>
  );
}

export function FeedbackTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, setState] = useStudioState<FeedbackState>(activity.id, INITIAL);
  const { items, ready: libReady } = useLibrary({ activityId: activity.id, lang, kind: "feedback" });
  const returning = useReturning(libReady, items.length > 0);
  const steps = useSteps("st4_fb_s", ["you", "you", "you", "both", "both", "nurturer", "you"]);

  const pick = P4_TALK_MENU.find((m) => m.id === state.pick) ?? null;
  const addIssue = (text: string) =>
    setState((s) =>
      s.issues.some((i) => i.text === text)
        ? { ...s, issues: s.issues.map((i) => (i.text === text ? { ...i, seen: i.seen + 1, sorted: false } : i)) }
        : { ...s, issues: [...s.issues, { id: uid("is"), text, seen: 1 }] }
    );
  const patchIssue = (id: string, fn: (issue: Issue) => Issue) =>
    setState((s) => ({ ...s, issues: s.issues.map((i) => (i.id === id ? fn(i) : i)) }));

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🪞" mode="either" />
      <StepGuide
        key={returning ? "returning" : "first"}
        steps={steps}
        accent={phase.color}
        defaultOpen={!returning}
      />
      <NeedsPersonCallout>{t("st4_fb_needs")}</NeedsPersonCallout>
      <PhraseBook
        lang={lang}
        groups={[
          { title: t("st4_phr_feedback"), lines: P4_FEEDBACK_ASKS },
          { title: t("st4_phr_journal"), lines: P4_JOURNAL_ASK },
        ]}
      />

      {/* what to talk about */}
      <Panel title={t("st4_talkTitle")} sub={t("st4_talkSub")}>
        <TalkPicker
          picked={state.pick}
          onPick={(id) => setState((s) => ({ ...s, pick: id }))}
          tellings={state.tellings}
          onTell={(id) => setState((s) => ({ ...s, tellings: { ...s.tellings, [id]: (s.tellings[id] ?? 0) + 1 } }))}
          lang={lang}
          accent={phase.color}
        />
      </Panel>

      {/* solo: record yourself at length */}
      <Panel title={t("st4_fb_recordTitle")} sub={t("st4_fb_recordSub")}>
        <RecordPanel
          lang={lang}
          phase={phase.id}
          activityId={activity.id}
          kind="feedback"
          speaker="me"
          confidential={Boolean(pick?.othersStory)}
          accent={phase.color}
          defaultTitle={pick ? t(`st4_talk_${pick.id}`) : t("st4_fb_defaultTitle")}
          label={t("st4_fb_record")}
        />
        {pick?.othersStory && <AnonymizeNote />}
        <RecordingList
          filter={{ activityId: activity.id, lang, kind: "feedback" }}
          accent={phase.color}
          title={t("st4_fb_listTitle")}
          emptyText={t("st4_fb_listEmpty")}
          renderExtra={(item) => (
            <FeedbackBench
              item={item}
              rows={state.rows}
              onRows={(fn) => setState((s) => ({ ...s, rows: fn(s.rows) }))}
              onIssue={addIssue}
              phaseId={phase.id}
              lang={lang}
              accent={phase.color}
            />
          )}
        />
      </Panel>

      {/* recurring issues */}
      <Panel title={t("st4_fb_issuesTitle")} sub={t("st4_fb_issuesSub")}>
        <AddLine
          placeholder={t("st4_fb_issuePlaceholder")}
          button={t("st4_fb_issueAdd")}
          onAdd={addIssue}
          accent={phase.color}
          maxLength={200}
        />
        {state.issues.length === 0 ? (
          <p className="text-sm text-muted">{t("st4_fb_issuesEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {state.issues.map((issue) => (
              <li key={issue.id} className="rounded-2xl border border-line bg-raised-2 p-3">
                <p className={`break-words text-sm ${issue.sorted ? "text-muted line-through" : "text-ink"}`}>
                  {issue.text}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted">
                    {t("st4_fb_issueSeen").replace("{n}", String(issue.seen))}
                  </span>
                  <button
                    type="button"
                    onClick={() => patchIssue(issue.id, (i) => ({ ...i, seen: i.seen + 1, sorted: false }))}
                    className={SMALL_BTN}
                  >
                    + {t("st4_fb_issueAgain")}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchIssue(issue.id, (i) => ({ ...i, sorted: !i.sorted }))}
                    aria-pressed={Boolean(issue.sorted)}
                    className={`pill min-h-10 px-3 py-2 text-xs font-bold ${
                      issue.sorted ? "bg-mint text-canvas" : "bg-white/6 text-ink"
                    }`}
                  >
                    <Check size={12} strokeWidth={3} aria-hidden /> {t("st4_fb_issueSorted")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setState((s) => ({ ...s, issues: s.issues.filter((i) => i.id !== issue.id) }))}
                    aria-label={t("st4_remove")}
                    className="pill h-10 w-10 justify-center bg-white/5 p-0 text-muted hover:text-coral"
                  >
                    <Trash2 size={14} strokeWidth={2.5} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs leading-relaxed text-muted">
          {t("st4_fb_floodHint")}{" "}
          <Link href="/studio/p3-flood" className="font-semibold text-ink underline underline-offset-4">
            {t("st4_fb_floodCta")} →
          </Link>
        </p>
      </Panel>

      {/* journal for a mentor */}
      <Panel title={t("st4_jr_title")} sub={t("st4_jr_sub")}>
        <JournalCapture
          entries={state.journal}
          onEntries={(fn) => setState((s) => ({ ...s, journal: fn(s.journal) }))}
          activityId={activity.id}
          phaseId={phase.id}
          lang={lang}
          accent={phase.color}
        />
      </Panel>

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
