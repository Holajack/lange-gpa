"use client";

import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { useWordLog } from "@/lib/wordLog";
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
import { hostMoves } from "./content";
import {
  P6,
  READ_ICON,
  READ_INITIAL,
  READ_KINDS,
  clampInt,
  fmtDay,
  inWeek,
  localIso,
  newId,
  weekStart,
  type ReadEntry,
  type ReadFit,
  type ReadKind,
  type ReadState,
} from "./model";
import { TaggedRecordingList } from "./Recordings";
import { useStudioStore } from "./store";
import { AccentButton, Chips, Field, Panel, RemoveButton, Stat, inputCls } from "./ui";

const FITS: Exclude<ReadFit, "">[] = ["easy", "stretch", "over"];

/**
 * p6-read — Read Promiscuously.
 * A reading log that shows breadth across kinds of text (never a score), a
 * list of words to ask about per piece, and the guide's recorded word
 * discussion with a host friend who has read the same thing.
 */
export function ReadTool({ activity, phase, lang }: StudioToolProps) {
  const { t, uiLang } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { state, update } = useStudioStore<ReadState>(P6.read, lang, READ_INITIAL);
  const words = useWordLog(lang);
  const moves = hostMoves("reading", lang);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ReadKind>("news");
  const [minutes, setMinutes] = useState("20");
  const [pages, setPages] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const patch = (id: string, fn: (e: ReadEntry) => ReadEntry) =>
    update((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? fn(e) : e)) }));

  const add = () => {
    const clean = title.trim().slice(0, 120);
    if (!clean) return;
    const entry: ReadEntry = {
      id: newId("rd"),
      title: clean,
      kind,
      minutes: clampInt(Number(minutes), 0, 600),
      pages: clampInt(Number(pages), 0, 2000),
      date: localIso(),
      fit: "",
      partner: "",
      words: [],
      note: "",
    };
    update((s) => ({ ...s, entries: [entry, ...s.entries] }));
    setTitle("");
    setPages("");
    setOpenId(entry.id);
  };

  /* ---- breadth: minutes and pieces per kind ---- */
  const week = weekStart();
  const byKind = READ_KINDS.map((k) => {
    const own = state.entries.filter((e) => e.kind === k);
    return { kind: k, pieces: own.length, minutes: own.reduce((sum, e) => sum + e.minutes, 0) };
  });
  const touched = byKind.filter((k) => k.pieces > 0);
  const untouched = byKind.filter((k) => k.pieces === 0);
  const longest = Math.max(1, ...touched.map((k) => k.minutes));
  const weekMinutes = state.entries.filter((e) => inWeek(e.date, week)).reduce((sum, e) => sum + e.minutes, 0);
  const totalMinutes = state.entries.reduce((sum, e) => sum + e.minutes, 0);

  const steps: GuideStep[] = [
    { title: t("st6_r_step1T"), body: t("st6_r_step1B"), who: "you" },
    { title: t("st6_r_step2T"), body: t("st6_r_step2B"), who: "you" },
    { title: t("st6_r_step3T"), body: t("st6_r_step3B"), who: "nurturer" },
    { title: t("st6_r_step4T"), body: t("st6_r_step4B"), who: "both" },
    { title: t("st6_r_step5T"), body: t("st6_r_step5B"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="📚" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      {/* ---- log a piece ---- */}
      <Panel title={t("st6_r_logTitle")} sub={t("st6_r_logSub")}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Field label={t("st6_r_titleLabel")}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder={t("st6_r_titlePlaceholder")}
              className={inputCls}
            />
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st6_r_kindLabel")}</p>
            <Chips
              label={t("st6_r_kindLabel")}
              options={READ_KINDS.map((k) => ({ id: k, label: t(`st6_r_kind_${k}`), icon: READ_ICON[k] }))}
              value={[kind]}
              onToggle={setKind}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <Field label={t("st6_r_minutesLabel")}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={600}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t("st6_r_pagesLabel")}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={2000}
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <AccentButton accent={accent} type="submit" disabled={!title.trim()}>
            <Plus size={15} strokeWidth={3} /> {t("st6_r_add")}
          </AccentButton>
        </form>
      </Panel>

      {/* ---- breadth ---- */}
      <Panel title={t("st6_r_breadthTitle")} sub={t("st6_r_breadthSub")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat value={weekMinutes} label={t("st6_r_statWeek")} />
          <Stat value={totalMinutes} label={t("st6_r_statAll")} />
          <Stat value={`${touched.length}/${READ_KINDS.length}`} label={t("st6_r_statKinds")} />
        </div>
        {touched.length === 0 ? (
          <p className="text-sm text-muted">{t("st6_r_breadthEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {touched.map((k) => (
              <li key={k.kind} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-xs font-semibold text-ink sm:w-40">
                  <span aria-hidden>{READ_ICON[k.kind]}</span> {t(`st6_r_kind_${k.kind}`)}
                </span>
                <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8" aria-hidden>
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.max(4, (k.minutes / longest) * 100)}%`, background: accent }}
                  />
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {t("st6_r_kindRow").replace("{m}", String(k.minutes)).replace("{n}", String(k.pieces))}
                </span>
              </li>
            ))}
          </ul>
        )}
        {state.entries.length > 0 && untouched.length > 0 && (
          <p className="text-xs leading-relaxed text-muted">
            {t("st6_r_untouched")} {untouched.map((k) => t(`st6_r_kind_${k.kind}`)).join(" · ")}
          </p>
        )}
      </Panel>

      <Callout icon="🗣️" title={t("st6_r_aloudTitle")}>
        <p>{t("st6_r_aloudBody")}</p>
      </Callout>

      {/* ---- the pieces ---- */}
      <Panel title={t("st6_r_listTitle")} sub={t("st6_r_listSub")}>
        {state.entries.length === 0 && <p className="text-sm text-muted">{t("st6_r_listEmpty")}</p>}
        <ul className="space-y-3">
          {state.entries.map((entry) => {
            const open = openId === entry.id;
            return (
              <li key={entry.id} className="rounded-3xl border border-line bg-raised-2">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : entry.id)}
                  aria-expanded={open}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="text-xl" aria-hidden>
                    {READ_ICON[entry.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{entry.title}</span>
                    <span className="block text-xs text-muted">
                      {t(`st6_r_kind_${entry.kind}`)} · {fmtDay(entry.date, uiLang)} ·{" "}
                      {t("st6_r_min").replace("{n}", String(entry.minutes))}
                      {entry.words.length > 0 && ` · ${t("st6_r_wordsCount").replace("{n}", String(entry.words.length))}`}
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <EntryBody
                    entry={entry}
                    accent={accent}
                    moves={moves}
                    phaseId={phase.id}
                    activityId={activity.id}
                    lang={lang}
                    onPatch={(fn) => patch(entry.id, fn)}
                    onRemove={() => update((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== entry.id) }))}
                    onWord={(text) => words.add(text, { context: entry.title, phase: phase.id })}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <RecordingList
        filter={{ activityId: activity.id, lang }}
        accent={accent}
        moves={moves}
        title={t("st6_r_allDiscussions")}
        emptyText={t("st6_r_noDiscussions")}
      />

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}

function EntryBody({
  entry,
  accent,
  moves,
  phaseId,
  activityId,
  lang,
  onPatch,
  onRemove,
  onWord,
}: {
  entry: ReadEntry;
  accent: string;
  moves?: string[];
  phaseId: StudioToolProps["phase"]["id"];
  activityId: string;
  lang: StudioToolProps["lang"];
  onPatch: (fn: (e: ReadEntry) => ReadEntry) => void;
  onRemove: () => void;
  onWord: (text: string) => void;
}) {
  const { t } = useApp();
  const [word, setWord] = useState("");
  const tag = `read:${entry.id}`;

  const addWord = () => {
    const clean = word.trim().slice(0, 80);
    if (!clean) return;
    if (!entry.words.includes(clean)) onPatch((e) => ({ ...e, words: [...e.words, clean] }));
    onWord(clean); // also lands in the Word Log (deduped there)
    setWord("");
  };

  return (
    <div className="space-y-4 border-t border-line px-4 pb-4 pt-4">
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <Field label={t("st6_r_minutesLabel")}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            value={entry.minutes}
            onChange={(e) => onPatch((x) => ({ ...x, minutes: clampInt(Number(e.target.value), 0, 600) }))}
            className={inputCls}
          />
        </Field>
        <Field label={t("st6_r_pagesLabel")}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={2000}
            value={entry.pages}
            onChange={(e) => onPatch((x) => ({ ...x, pages: clampInt(Number(e.target.value), 0, 2000) }))}
            className={inputCls}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted">{t("st6_r_fitLabel")}</p>
        <Chips
          label={t("st6_r_fitLabel")}
          options={FITS.map((f) => ({ id: f, label: t(`st6_r_fit_${f}`) }))}
          value={entry.fit ? [entry.fit] : []}
          onToggle={(f) => onPatch((x) => ({ ...x, fit: x.fit === f ? "" : f }))}
        />
        {entry.fit === "over" && <p className="mt-2 text-xs leading-relaxed text-amber">{t("st6_r_fitOverNote")}</p>}
      </div>

      {/* words to ask about */}
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">{t("st6_r_wordsLabel")}</p>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addWord();
          }}
        >
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            maxLength={80}
            placeholder={t("st6_r_wordPlaceholder")}
            aria-label={t("st6_r_wordsLabel")}
            className={`${inputCls} flex-1 basis-48`}
          />
          <AccentButton accent={accent} type="submit" disabled={!word.trim()}>
            <Plus size={15} strokeWidth={3} /> {t("st6_r_wordAdd")}
          </AccentButton>
        </form>
        {entry.words.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {entry.words.map((w) => (
              <li
                key={w}
                className="flex items-center gap-1 rounded-full border border-line bg-white/6 py-1 pl-3 pr-1 text-sm text-ink"
              >
                {w}
                <button
                  type="button"
                  onClick={() => onPatch((x) => ({ ...x, words: x.words.filter((y) => y !== w) }))}
                  aria-label={`${t("st6_remove")}: ${w}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-coral"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs leading-relaxed text-muted">{t("st6_r_wordsHint")}</p>
      </div>

      {/* the recorded word discussion */}
      <div className="space-y-3 rounded-2xl border border-line bg-raised p-4">
        <p className="text-sm font-semibold text-ink">{t("st6_r_discussTitle")}</p>
        <NeedsPersonCallout>{t("st6_r_discussBody")}</NeedsPersonCallout>
        <Field label={t("st6_r_partnerLabel")}>
          <input
            value={entry.partner}
            onChange={(e) => onPatch((x) => ({ ...x, partner: e.target.value.slice(0, 80) }))}
            placeholder={t("st6_r_partnerPlaceholder")}
            className={inputCls}
          />
        </Field>
        <RecordPanel
          lang={lang}
          phase={phaseId}
          activityId={activityId}
          kind="primary"
          speaker="both"
          tags={[tag]}
          defaultTitle={`${t("st6_r_discussName")} · ${entry.title}`.slice(0, 80)}
          accent={accent}
          allowImport
          showConsent
          label={t("st6_r_discussRecord")}
        />
        <TaggedRecordingList
          filter={{ activityId, lang }}
          tags={[tag]}
          accent={accent}
          moves={moves}
          title={t("st6_r_discussList")}
          emptyText={t("st6_r_discussEmpty")}
        />
      </div>

      <Field label={t("st6_r_noteLabel")}>
        <textarea
          value={entry.note}
          onChange={(e) => onPatch((x) => ({ ...x, note: e.target.value.slice(0, 400) }))}
          rows={2}
          placeholder={t("st6_r_notePlaceholder")}
          className={inputCls}
        />
      </Field>

      <div className="flex justify-end">
        <RemoveButton label={t("st6_remove")} onConfirm={onRemove} />
      </div>
    </div>
  );
}
