"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Plus, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, type LibraryItem } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import { Callout, textOn } from "../StudioShell";
import { hostText } from "../types";
import { MOVES, type PhraseDef } from "./content";
import { loopInfo, useLoopMeta, useMassageClock, useNarrator, type LoopStage } from "./hooks";

/* ------------------------------ layout ------------------------------ */

/** One numbered section of a workbench. */
export function Panel({
  title,
  sub,
  step,
  accent,
  children,
}: {
  title: string;
  sub?: string;
  step?: number;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        {step !== undefined && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
            style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}
            aria-hidden
          >
            {step}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {sub && <p className="mt-1 text-sm leading-relaxed text-muted">{sub}</p>}
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Two- or three-way switch (with a tick, so the choice never rests on color alone). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`pill min-h-11 px-4 py-2.5 text-sm font-bold ${
            value === o.id ? "bg-white/15 text-ink" : "bg-white/5 text-muted"
          }`}
        >
          {value === o.id && <Check size={14} strokeWidth={3} aria-hidden />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-2.5 text-left text-sm font-semibold text-ink"
      >
        {title}
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

/** Shown where a tool's Nuri-narrated part has nothing authored for this language. */
export function NoSoloNote() {
  const { t } = useApp();
  return (
    <Callout icon="🌱" title={t("st3_noSoloTitle")}>
      <p>{t("st3_noSoloBody")}</p>
    </Callout>
  );
}

/* ------------------------------ pictures ---------------------------- */

function Turnip() {
  return (
    <svg viewBox="0 0 48 48" width="1em" height="1em" aria-hidden>
      <path d="M24 15c-3-7-9-9-13-8 1 6 6 9 11 9z" fill="#3ddc84" />
      <path d="M24 15c1-8 6-11 11-11 0 6-4 10-9 11z" fill="#b8f03c" />
      <path d="M24 13c9 0 15 6 15 14 0 8-7 13-13 15l-2 4-2-4C16 40 9 35 9 27c0-8 6-14 15-14z" fill="#f5f3ec" />
      <path
        d="M24 13c9 0 15 6 15 14 0 1-.1 2-.3 3C33 27 28 26 24 26s-9 1-14.7 4c-.2-1-.3-2-.3-3 0-8 6-14 15-14z"
        fill="#c084fc"
      />
    </svg>
  );
}

/** A wordless picture made of emoji (":turnip:" is drawn, since no emoji exists for it). */
export function PicStrip({ pic, className = "text-4xl" }: { pic: string; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-1.5 leading-none ${className}`} aria-hidden>
      {pic.split(" ").map((tok, i) => (tok === ":turnip:" ? <Turnip key={i} /> : <span key={i}>{tok}</span>))}
    </span>
  );
}

/* --------------------------- hear-then-read ------------------------- */

export interface Phrase {
  id: string;
  /** what the phrase is for, in the interface language */
  label: string;
  /** the host-language phrase, when one is authored for this language */
  text?: string;
}

export function toPhrases(defs: PhraseDef[], lang: LangCode, t: (key: string) => string): Phrase[] {
  return defs.map((d) => ({ id: d.id, label: t(d.labelKey), text: hostText(d.text, lang) }));
}

/**
 * Things to SAY to a person. Tap one to hear how it sounds; its written form
 * appears only after it has been heard. Where nothing is authored for the
 * language, the bank just names the move so the grower can ask how to say it.
 */
export function PhraseBank({
  title,
  hint,
  phrases,
  lang,
  heard,
  onHeard,
  checked,
  onToggleCheck,
  checkLabel,
}: {
  title: string;
  hint?: string;
  phrases: Phrase[];
  lang: LangCode;
  heard: string[];
  onHeard: (id: string) => void;
  /** optional per-phrase tick ("asked this one") */
  checked?: string[];
  onToggleCheck?: (id: string) => void;
  checkLabel?: string;
}) {
  const { t } = useApp();
  const narrator = useNarrator(lang);
  const authored = phrases.some((p) => p.text);

  return (
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {hint ?? t(authored ? "st3_phHint" : "st3_phAskHow")}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {phrases.map((p) => {
          const text = p.text;
          const isChecked = Boolean(checked?.includes(p.id));
          return (
            <li key={p.id} className="flex items-stretch gap-2">
              {text ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (await narrator.say([text], { id: p.id })) onHeard(p.id);
                  }}
                  aria-label={`${t("st3_phHear")}: ${p.label}`}
                  className="flex min-h-11 min-w-0 flex-1 items-start gap-2.5 rounded-2xl border border-line bg-raised-2 px-3.5 py-2.5 text-left hover:bg-white/8"
                >
                  <Volume2
                    size={16}
                    strokeWidth={2.5}
                    className={`mt-0.5 shrink-0 ${narrator.playing === p.id ? "text-ink" : "text-muted"}`}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{p.label}</span>
                    {heard.includes(p.id) && (
                      <span lang={lang} className="mt-0.5 block break-words text-sm text-muted">
                        {text}
                      </span>
                    )}
                  </span>
                </button>
              ) : (
                <span className="flex min-h-11 min-w-0 flex-1 items-center rounded-2xl border border-line bg-raised-2 px-3.5 py-2.5 text-sm font-semibold text-ink">
                  {p.label}
                </span>
              )}
              {onToggleCheck && (
                <button
                  type="button"
                  onClick={() => onToggleCheck(p.id)}
                  aria-pressed={isChecked}
                  aria-label={`${checkLabel ?? ""}: ${p.label}`}
                  title={checkLabel}
                  className={`flex w-11 shrink-0 items-center justify-center rounded-2xl border ${
                    isChecked ? "border-mint/50 bg-mint/20 text-mint" : "border-line bg-raised-2 text-muted"
                  }`}
                >
                  {isChecked ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={2.5} />}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The four negotiation moves, said aloud to the nurturer about a flagged spot. */
export function MovesBar({
  lang,
  heard,
  onHeard,
}: {
  lang: LangCode;
  heard: string[];
  onHeard: (id: string) => void;
}) {
  const { t } = useApp();
  const phrases = useMemo(() => toPhrases(MOVES, lang, t), [lang, t]);
  return <PhraseBank title={t("st3_mvTitle")} phrases={phrases} lang={lang} heard={heard} onHeard={onHeard} />;
}

/**
 * The "ways to ask" handed to the ClarifyPlayer: host-language phrases the
 * grower has already heard, or the bare move names for unauthored languages.
 */
export function usePlayerMoves(lang: LangCode, heard: string[]): string[] | undefined {
  const { t } = useApp();
  return useMemo(() => {
    const phrases = toPhrases(MOVES, lang, t);
    if (!phrases.some((p) => p.text)) return phrases.map((p) => p.label);
    const known = phrases.filter((p) => p.text && heard.includes(p.id)).map((p) => p.text as string);
    return known.length > 0 ? known : undefined;
  }, [lang, t, heard]);
}

/* ---------------------------- massage state ------------------------- */

const STAGES: LoopStage[] = ["listen", "negotiate", "relisten", "done"];

/** A compact stage label for list rows. */
export function StageChip({ stage }: { stage: LoopStage }) {
  const { t } = useApp();
  const done = stage === "done";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        done ? "bg-mint/20 text-mint" : "bg-white/8 text-ink"
      }`}
    >
      {done && <Check size={12} strokeWidth={3} aria-hidden />}
      {t(`st3_msStage_${stage}`)}
    </span>
  );
}

/**
 * The loop state of one recording, made explicit: where it stands, how many
 * marks are open / clarified, clean listens since the marks last changed, how
 * the pace compares with a healthy one, and a quick way to log a new word.
 */
export function MassageStatus({
  item,
  lang,
  accent,
  note,
}: {
  item: LibraryItem;
  lang: LangCode;
  accent: string;
  /** an extra line under the next step (e.g. "host stories need more listens") */
  note?: string;
}) {
  const { t } = useApp();
  const meta = useLoopMeta([item])[item.id];
  const info = loopInfo(item, meta);
  const sec = useMassageClock(item.id);
  const log = useWordLog(lang);
  const fromHere = log.words.filter((w) => w.sourceId === item.id);
  const [word, setWord] = useState("");
  const [dup, setDup] = useState(false);

  const cur = STAGES.indexOf(info.stage);
  const measurable = item.durationSec >= 20;
  const workPerMin = measurable ? sec / item.durationSec : 0;
  const wordsPerMin = measurable ? fromHere.length / (item.durationSec / 60) : 0;
  const hard = measurable && (workPerMin > 30 || wordsPerMin > 10);

  const addWord = () => {
    if (!word.trim()) return;
    const added = log.add(word, { sourceId: item.id, phase: item.phase, context: item.title });
    setDup(!added);
    if (added) setWord("");
  };

  const stats: { value: number; label: string }[] = [
    { value: info.open, label: t("st3_msOpen") },
    { value: info.clarified, label: t("st3_msClarified") },
    { value: info.listensSince, label: t("st3_msSince") },
    { value: info.listens, label: t("st3_msListens") },
  ];

  return (
    <div className="space-y-4 rounded-3xl border border-line bg-raised p-4 sm:p-5">
      <ol className="flex flex-wrap gap-2" aria-label={t("st3_msLoop")}>
        {STAGES.map((s, i) => (
          <li
            key={s}
            aria-current={i === cur ? "step" : undefined}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
              i === cur ? textOn(accent) : i < cur ? "bg-white/8 text-ink" : "bg-white/4 text-muted"
            }`}
            style={i === cur ? { background: accent } : undefined}
          >
            {i < cur ? <Check size={12} strokeWidth={3} aria-hidden /> : <span aria-hidden>{i + 1}</span>}
            {t(`st3_msStage_${s}`)}
          </li>
        ))}
      </ol>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/5 px-3 py-2.5">
            <dd className="font-display text-xl font-extrabold tabular-nums text-ink">{s.value}</dd>
            <dt className="text-[11px] leading-snug text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>

      <p className="text-sm leading-relaxed text-ink">{t(`st3_msNext_${info.stage}`)}</p>
      {note && <p className="text-sm leading-relaxed text-muted">{note}</p>}

      {measurable && (
        <p className="text-xs leading-relaxed text-muted">
          {t("st3_msPace")
            .replace("{work}", fmtDuration(sec))
            .replace("{len}", fmtDuration(item.durationSec))
            .replace("{words}", String(fromHere.length))}
        </p>
      )}
      {hard && (
        <Callout icon="🧗" title={t("st3_msHardTitle")} tone="warm">
          <p>{t("st3_msHardBody")}</p>
        </Callout>
      )}

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addWord();
        }}
      >
        <label className="sr-only" htmlFor={`st3-word-${item.id}`}>
          {t("st3_msWordLabel")}
        </label>
        <input
          id={`st3-word-${item.id}`}
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            setDup(false);
          }}
          placeholder={t("stc_wlAddPlaceholder")}
          maxLength={80}
          className="min-w-0 flex-1 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
        />
        <button
          type="submit"
          className={`pill min-h-11 px-4 py-2.5 text-sm font-bold ${textOn(accent)}`}
          style={{ background: accent }}
        >
          <Plus size={14} strokeWidth={3} aria-hidden /> {t("stc_wlAdd")}
        </button>
        {dup && (
          <span className="text-xs text-amber" role="status">
            {t("stc_wlDup")}
          </span>
        )}
      </form>
      {fromHere.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t("st3_msWordsHere")}>
          {fromHere.map((w) => (
            <li key={w.id} lang={lang} className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-medium text-ink">
              {w.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
