"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronDown, LockKeyhole, Pencil, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, useLibrary, type LibraryItem } from "@/lib/library";
import { Callout, FinishBar, StepGuide, StudioHeader, textOn, useStudioTimer, type GuideStep } from "../StudioShell";
import { hostText, type StudioToolProps } from "../types";
import { READING_ASKS, TALES, hasP3Content, type Tale } from "./content";
import { hostSpeech, isoDay, loopInfo, useHeard, useLoopMeta, useNarrator, useStudioState } from "./hooks";
import { Panel, PhraseBank, toPhrases } from "./shared";
import type { TaleProgress } from "./TaleRehearsal";

/**
 * p3-reading — Starting to Read (late 3C). Reading opens only on what the
 * grower already understands by ear: an authored tale once every sentence was
 * heard and nothing is flagged, or a real recording once it is understood and
 * the nurturer has written down what is said. No audio plays alongside the
 * text; checking a sentence by ear covers its words while it is spoken.
 */

interface Transcript {
  text: string;
  /** YYYY-MM-DD of each read-through */
  reads: string[];
}

interface ReadingState {
  texts: Record<string, Transcript>;
  taleReads: Record<string, string[]>;
}
const EMPTY: ReadingState = { texts: {}, taleReads: {} };

/** the slice of p3-bridge's saved state this tool reads (never writes) */
interface BridgeSlice {
  tales: Record<string, TaleProgress>;
}
const NO_BRIDGE: BridgeSlice = { tales: {} };

const row =
  "flex min-h-14 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-line bg-raised-2 px-4 py-3 text-left";

function ReadButton({ count, onRead, accent }: { count: number; onRead: () => void; accent: string }) {
  const { t } = useApp();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onRead}
        className={`pill min-h-11 px-4 py-2.5 text-sm font-bold ${textOn(accent)}`}
        style={{ background: accent }}
      >
        <Check size={14} strokeWidth={3} aria-hidden /> {t("st3_rdReadIt")}
      </button>
      <p className="text-sm tabular-nums text-ink" aria-live="polite">
        {t("st3_rdReadCount").replace("{n}", String(count))}
      </p>
    </div>
  );
}

function TaleReader({
  tale,
  lang,
  accent,
  reads,
  onRead,
}: {
  tale: Tale;
  lang: LangCode;
  accent: string;
  reads: number;
  onRead: () => void;
}) {
  const { t } = useApp();
  const narrator = useNarrator(lang);
  const [open, setOpen] = useState(false);
  const lines = useMemo(() => tale.sentences.map((s) => hostText(s.text, lang) ?? ""), [tale, lang]);

  return (
    <li>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={row}>
        <span className="text-2xl" aria-hidden>
          {tale.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{t(tale.titleKey)}</span>
          <span className="block text-xs text-muted">{t("st3_rdReadCount").replace("{n}", String(reads))}</span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-2 space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
          <p className="text-xs leading-relaxed text-muted">{t("st3_rdEarHint")}</p>
          <ol lang={lang} className="space-y-1">
            {lines.map((line, i) => {
              const covered = narrator.playing === `s${i}`;
              return (
                <li key={i} className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 py-2 text-base leading-relaxed text-ink">
                    {covered ? (
                      <span className="block h-6 animate-pulse rounded-full bg-white/10" aria-hidden />
                    ) : (
                      line
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => void narrator.say([line], { id: `s${i}` })}
                    aria-label={t("st3_rdCheckEar")}
                    title={t("st3_rdCheckEar")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/6 text-muted hover:text-ink"
                  >
                    <Volume2 size={15} strokeWidth={2.5} />
                  </button>
                </li>
              );
            })}
          </ol>
          <ReadButton count={reads} onRead={onRead} accent={accent} />
        </div>
      )}
    </li>
  );
}

function TranscriptCard({
  item,
  entry,
  lang,
  accent,
  onSave,
  onRead,
}: {
  item: LibraryItem;
  entry?: Transcript;
  lang: LangCode;
  accent: string;
  onSave: (text: string) => void;
  onRead: () => void;
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const has = Boolean(entry?.text);
  const writing = editing || !has;

  return (
    <li>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={row}>
        <BookOpen size={18} strokeWidth={2.25} className="shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
          <span className="block text-xs text-muted">
            {fmtDuration(item.durationSec)} ·{" "}
            {has ? t("st3_rdReadCount").replace("{n}", String(entry?.reads.length ?? 0)) : t("st3_rdNoText")}
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
        <div className="mt-2 space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
          {writing ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                onSave(draft);
                setEditing(false);
              }}
            >
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_rdWriteLabel")}</span>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 8000))}
                  rows={8}
                  lang={lang}
                  placeholder={t("st3_rdWritePlaceholder")}
                  className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-base leading-relaxed text-ink outline-none focus:border-white/30"
                />
              </label>
              <p className="text-xs leading-relaxed text-muted">{t("st3_rdWriteHint")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className={`pill min-h-11 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
                  style={{ background: accent }}
                >
                  <Check size={14} strokeWidth={3} aria-hidden /> {t("st3_rdSave")}
                </button>
                {has && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink"
                  >
                    {t("back")}
                  </button>
                )}
              </div>
            </form>
          ) : (
            <>
              <p lang={lang} className="whitespace-pre-wrap break-words text-base leading-relaxed text-ink">
                {entry?.text}
              </p>
              <ReadButton count={entry?.reads.length ?? 0} onRead={onRead} accent={accent} />
              <button
                type="button"
                onClick={() => {
                  setDraft(entry?.text ?? "");
                  setEditing(true);
                }}
                className="flex min-h-10 items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
              >
                <Pencil size={12} strokeWidth={2.5} aria-hidden /> {t("st3_rdEdit")}
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

export function Reading({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<ReadingState>(activity.id, lang, EMPTY);
  const [bridge] = useStudioState<BridgeSlice>("p3-bridge", lang, NO_BRIDGE);
  const { heard, markHeard } = useHeard(lang);
  const { all } = useLibrary();
  const asks = useMemo(() => toPhrases(READING_ASKS, lang, t), [lang, t]);
  const authored = hasP3Content(lang);

  const [today, setToday] = useState("");
  useEffect(() => setToday(isoDay(new Date())), []);

  const pool = useMemo(() => hostSpeech(all, lang), [all, lang]);
  const meta = useLoopMeta(pool);
  const understood = pool.filter((it) => it.familiar || loopInfo(it, meta[it.id]).stage === "done");
  const notYet = pool.length - understood.length;

  const taleOpen = (tale: Tale) => {
    const p = bridge.tales[tale.id];
    return Boolean(p) && p.heard.length >= tale.sentences.length && p.flags.length === 0;
  };
  const openTales = TALES.filter(taleOpen);
  const lockedTales = TALES.length - openTales.length;

  const steps: GuideStep[] = [
    { title: t("st3_rdS1"), body: t("st3_rdS1b"), who: "you" },
    { title: t("st3_rdS2"), body: t("st3_rdS2b"), who: "nurturer" },
    { title: t("st3_rdS3"), body: t("st3_rdS3b"), who: "you" },
    { title: t("st3_rdS4"), body: t("st3_rdS4b"), who: "you" },
    { title: t("st3_rdS5"), body: t("st3_rdS5b"), who: "both" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="📖" mode={authored ? "either" : "nurturer"} />
      <StepGuide steps={steps} accent={accent} />
      <Callout icon="👂" title={t("st3_rdRuleTitle")} tone="warm">
        <p>{t("st3_rdRuleBody")}</p>
      </Callout>

      {authored && (
        <Panel step={1} title={t("st3_rdP1")} sub={t("st3_rdP1b")} accent={accent}>
          {openTales.length === 0 && <p className="text-sm text-muted">{t("st3_rdNoTales")}</p>}
          <ul className="space-y-2">
            {openTales.map((tale) => (
              <TaleReader
                key={tale.id}
                tale={tale}
                lang={lang}
                accent={accent}
                reads={(state.taleReads[tale.id] ?? []).length}
                onRead={() =>
                  setState((s) => ({
                    ...s,
                    taleReads: { ...s.taleReads, [tale.id]: [...(s.taleReads[tale.id] ?? []), today] },
                  }))
                }
              />
            ))}
          </ul>
          {lockedTales > 0 && (
            <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed text-muted">
              <LockKeyhole size={13} strokeWidth={2.5} className="shrink-0" aria-hidden />
              {t("st3_rdTalesLocked").replace("{n}", String(lockedTales))}
              <Link href="/studio/p3-bridge" className="font-semibold text-ink underline underline-offset-4">
                {t("st3_rdGoBridge")}
              </Link>
            </p>
          )}
        </Panel>
      )}

      <Panel step={authored ? 2 : 1} title={t("st3_rdP2")} sub={t("st3_rdP2b")} accent={accent}>
        <PhraseBank title={t("st3_rdAskTitle")} phrases={asks} lang={lang} heard={heard} onHeard={markHeard} />
        {understood.length === 0 && <p className="text-sm text-muted">{t("st3_rdNoRecordings")}</p>}
        <ul className="space-y-2">
          {understood.map((it) => (
            <TranscriptCard
              key={it.id}
              item={it}
              entry={state.texts[it.id]}
              lang={lang}
              accent={accent}
              onSave={(text) =>
                setState((s) => ({
                  ...s,
                  texts: { ...s.texts, [it.id]: { text: text.trim(), reads: s.texts[it.id]?.reads ?? [] } },
                }))
              }
              onRead={() =>
                setState((s) => {
                  const cur = s.texts[it.id];
                  if (!cur) return s;
                  return { ...s, texts: { ...s.texts, [it.id]: { ...cur, reads: [...cur.reads, today] } } };
                })
              }
            />
          ))}
        </ul>
        {notYet > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed text-muted">
            <LockKeyhole size={13} strokeWidth={2.5} className="shrink-0" aria-hidden />
            {t("st3_rdNotYet").replace("{n}", String(notYet))}
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted">
          {t("st3_rdListenElsewhere")}{" "}
          <Link href="/library" className="font-semibold text-ink underline underline-offset-4">
            {t("library")}
          </Link>
        </p>
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
