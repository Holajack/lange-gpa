"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, Plus, Trash2, Volume2 } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode } from "@/lib/types";
import { deleteRecording, fmtDuration, useLibrary, type LibraryItem } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import { speak, stopSpeaking } from "@/lib/tts";
import type { GapType } from "../ClarifyPlayer";
import { Callout, textOn, type GuideStep } from "../StudioShell";
import { hostText, type StudioText } from "../types";

/* ------------------------------------------------------------------ *
 *  Phase 4 shared pieces. In this phase the content is real people's
 *  lives, so the helpers here are mostly about keeping track of who
 *  said what, and about being able to erase it.
 * ------------------------------------------------------------------ */

export const INPUT =
  "min-h-11 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-white/40";
export const TEXTAREA =
  "min-h-24 w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm leading-relaxed text-ink outline-none placeholder:text-muted focus:border-white/40";
export const GHOST_BTN = "pill min-h-10 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-ink";
export const SMALL_BTN = "pill min-h-10 bg-white/6 px-3 py-2 text-xs font-semibold text-ink";
/** a sub-section inside a card, and a row inside a sub-section */
export const SUB = "space-y-3 rounded-3xl border border-line bg-canvas p-3 sm:p-5";
export const ROW = "rounded-2xl border border-line bg-raised p-3";

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* ------------------------------ tool state ---------------------------- */

const OWNER_KEY = "lange.profile.owner.v1";
const P4_EVENT = "lange:studio-p4";

/** `lange.studio.{activityId}.v1`, namespaced per account like the library and the word log. */
function storageKey(activityId: string): string {
  let owner = "local";
  try {
    owner = localStorage.getItem(OWNER_KEY) || "local";
  } catch {
    // storage blocked — fall through to the shared key
  }
  return `lange.studio.${activityId}.v1:${owner}`;
}

function readState<T>(activityId: string): Partial<T> | null {
  try {
    const raw = localStorage.getItem(storageKey(activityId));
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

/**
 * Tool state that survives a reload. One owner per activity id: only the
 * tool itself may call this for its own id, or two writers would clobber
 * each other. `initial` must be a module-level constant.
 */
export function useStudioState<T extends object>(activityId: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readState<T>(activityId);
    if (saved) setState({ ...initial, ...saved });
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey(activityId), JSON.stringify(state));
    } catch {
      // storage full / private mode — keep the in-memory copy for this visit
    }
    window.dispatchEvent(new CustomEvent(P4_EVENT));
  }, [activityId, ready, state]);

  return [state, setState, ready] as const;
}

/* -------------------------------- people ------------------------------ */

/** Someone whose life or work the grower is recording. The label never leaves this device. */
export interface P4Person {
  id: string;
  lang: LangCode;
  label: string;
  /** their walk of life, when they were added from that tool */
  role?: string;
  addedAt: string;
  /** seconds of logged session time spent with this person */
  sessionSec?: number;
}

/** Library tag that ties a recording to a person, so all of it can be erased together. */
export const personTag = (id: string) => `p4p:${id}`;

/** Everyone added in the Life Story and Walk-of-Life tools (read-only view for the other tools). */
export function useP4People(lang: LangCode): P4Person[] {
  const [people, setPeople] = useState<P4Person[]>([]);
  useEffect(() => {
    const load = () => {
      const a = readState<{ people: P4Person[] }>("p4-lifestory")?.people ?? [];
      const b = readState<{ people: P4Person[] }>("p4-walkoflife")?.people ?? [];
      setPeople([...a, ...b].filter((p) => p.lang === lang));
    };
    load();
    window.addEventListener(P4_EVENT, load);
    return () => window.removeEventListener(P4_EVENT, load);
  }, [lang]);
  return people;
}

/** Pick which person the bench is showing. */
export function PersonChips({
  people,
  activeId,
  onSelect,
  accent,
  label,
}: {
  people: P4Person[];
  activeId: string | null;
  onSelect: (id: string) => void;
  accent: string;
  label: string;
}) {
  if (people.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {people.map((p) => {
        const on = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-pressed={on}
            className={`pill min-h-10 max-w-full px-4 py-2 text-sm font-bold ${
              on ? textOn(accent) : "bg-white/6 text-muted hover:text-ink"
            }`}
            style={on ? { background: accent } : undefined}
          >
            <span className="truncate">
              {p.label}
              {p.role ? ` · ${p.role}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A recording plus every take threaded under it, however deep. */
export function withDescendants(all: LibraryItem[], roots: LibraryItem[]): LibraryItem[] {
  const ids = new Set(roots.map((it) => it.id));
  let grew = true;
  while (grew) {
    grew = false;
    for (const it of all) {
      if (it.parentId && ids.has(it.parentId) && !ids.has(it.id)) {
        ids.add(it.id);
        grew = true;
      }
    }
  }
  return all.filter((it) => ids.has(it.id));
}

/** Every recording that belongs to a person: tagged with them, or threaded under one that is. */
export function recordingsOf(all: LibraryItem[], personId: string): LibraryItem[] {
  const tag = personTag(personId);
  return withDescendants(
    all,
    all.filter((it) => it.tags?.includes(tag))
  );
}

/* ------------------------------ step guide ---------------------------- */

/** Builds a StepGuide's steps from `{prefix}{n}` (title) and `{prefix}{n}b` (body) strings. */
export function useSteps(prefix: string, who: NonNullable<GuideStep["who"]>[]): GuideStep[] {
  const { t } = useApp();
  return who.map((w, i) => ({ title: t(`${prefix}${i + 1}`), body: t(`${prefix}${i + 1}b`), who: w }));
}

/**
 * Whether the grower already has work in this tool, decided once when their
 * data has loaded. Latched so the step guide folds for a returning grower but
 * never collapses under someone who is reading it for the first time.
 */
export function useReturning(ready: boolean, hasWork: boolean): boolean {
  const [returning, setReturning] = useState<boolean | null>(null);
  useEffect(() => {
    if (ready && returning === null) setReturning(hasWork);
  }, [ready, hasWork, returning]);
  return returning === true;
}

/* ----------------------------- gap taxonomy --------------------------- */

const GAP_IDS = ["word", "sense", "idiom", "concept", "culture", "sound"] as const;

/** The guide's six kinds of comprehension gap, offered on every flagged moment. */
export function useGapTypes(): GapType[] {
  const { t } = useApp();
  return useMemo(() => GAP_IDS.map((id) => ({ id, label: t(`st4_gap_${id}`) })), [t]);
}

/* ------------------------- host-language phrases ---------------------- */

export function hostLines(lines: StudioText[], lang: LangCode): string[] {
  return lines.map((line) => hostText(line, lang)).filter((s): s is string => Boolean(s));
}

/** One authored host-language line with a button to hear it. */
export function SayLine({ text, lang }: { text: string; lang: LangCode }) {
  const { t } = useApp();
  return (
    <li className="flex items-start gap-2">
      <button
        type="button"
        onClick={() => void speak(text, lang)}
        aria-label={`${t("st4_hear")}: ${text}`}
        className="pill h-10 w-10 shrink-0 justify-center bg-white/8 p-0 text-ink"
      >
        <Volume2 size={16} strokeWidth={2.5} aria-hidden />
      </button>
      <span lang={lang} className="min-w-0 pt-2 text-sm leading-relaxed text-ink">
        {text}
      </span>
    </li>
  );
}

export function SayLines({ lines, lang }: { lines: StudioText[]; lang: LangCode }) {
  const shown = hostLines(lines, lang);
  if (shown.length === 0) return null;
  return (
    <ul className="space-y-2">
      {shown.map((line) => (
        <SayLine key={line} text={line} lang={lang} />
      ))}
    </ul>
  );
}

export interface PhraseGroup {
  title: string;
  lines: StudioText[];
}

/**
 * Things the grower says to a real person, grouped by moment. Nuri only
 * models how the line sounds; the answer always comes from the person.
 * Renders nothing for a language with no authored lines.
 */
export function PhraseBook({ groups, lang }: { groups: PhraseGroup[]; lang: LangCode }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  const shown = groups
    .map((g) => ({ title: g.title, lines: hostLines(g.lines, lang) }))
    .filter((g) => g.lines.length > 0);
  if (shown.length === 0) return null;
  return (
    <section className="card p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block font-display text-lg font-bold text-ink">{t("st4_phrasesTitle")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t("st4_phrasesSub")}</span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-4 space-y-5">
          {shown.map((g) => (
            <div key={g.title}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{g.title}</p>
              <ul className="space-y-2">
                {g.lines.map((line) => (
                  <SayLine key={line} text={line} lang={lang} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------- layout ------------------------------- */

export function Panel({
  title,
  sub,
  aside,
  children,
}: {
  title: string;
  sub?: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="card space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {sub && <p className="mt-1 text-sm leading-relaxed text-muted">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-raised-2 px-3 py-3">
      <p className="font-display text-xl font-bold tabular-nums text-ink">{value}</p>
      <p className="text-xs leading-snug text-muted">{label}</p>
    </div>
  );
}

/** A one-line "type it, add it" form. */
export function AddLine({
  placeholder,
  button,
  onAdd,
  accent,
  maxLength = 140,
  inputLang,
}: {
  placeholder: string;
  button: string;
  onAdd: (text: string) => void;
  accent: string;
  maxLength?: number;
  /** set when the field is meant for host-language writing */
  inputLang?: LangCode;
}) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = text.trim();
        if (!clean) return;
        onAdd(clean);
        setText("");
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={maxLength}
        lang={inputLang}
        className={`${INPUT} min-w-[10rem] flex-1`}
      />
      <button
        type="submit"
        className={`pill min-h-11 px-4 py-2 text-sm font-bold ${textOn(accent)}`}
        style={{ background: accent }}
      >
        <Plus size={15} strokeWidth={3} aria-hidden /> {button}
      </button>
    </form>
  );
}

/** Rows of recordings to choose from; the chosen one opens in the tool's own bench. */
export function RecordingPicker({
  items,
  selectedId,
  onSelect,
  emptyText,
}: {
  items: LibraryItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  emptyText: string;
}) {
  const { t } = useApp();
  if (items.length === 0) return <p className="text-sm text-muted">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const selected = it.id === selectedId;
        const open = it.marks.filter((m) => !m.resolved).length;
        return (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(selected ? null : it.id)}
              aria-pressed={selected}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                selected ? "border-white/40 bg-raised-2" : "border-line bg-raised hover:bg-raised-2"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{it.title}</span>
                <span className="block text-xs text-muted">
                  {t(`stc_kind_${it.kind}`)} · {fmtDuration(it.durationSec)} · {t("stc_plHeard")} {it.relistens.length}{" "}
                  {t("stc_plTimes")}
                </span>
              </span>
              {open > 0 && (
                <span className="shrink-0 rounded-full bg-coral/20 px-2.5 py-1 text-xs font-bold text-coral">
                  🚩 {open} <span className="sr-only">{t("st4_openGaps")}</span>
                </span>
              )}
              {it.familiar && (
                <span className="shrink-0 text-xs font-bold text-mint">
                  ✓ <span className="sr-only">{t("stc_plFamiliar")}</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------- confidentiality -------------------------- */

/**
 * "Erase everything from this person": every recording tagged with them and
 * every take threaded under those, gone at once. This is the promise the
 * grower made before recording, so it is always one tap and one confirm away.
 */
export function ErasePerson({ person, onErased }: { person: P4Person; onErased: () => void }) {
  const { t } = useApp();
  const { all } = useLibrary();
  const log = useWordLog(person.lang);
  const [confirm, setConfirm] = useState(false);
  const [alsoWords, setAlsoWords] = useState(false);
  const [busy, setBusy] = useState(false);

  const theirs = recordingsOf(all, person.id);
  const ids = new Set(theirs.map((it) => it.id));
  const theirWords = log.words.filter((w) => w.sourceId && ids.has(w.sourceId));

  const erase = async () => {
    setBusy(true);
    try {
      // deleteRecording takes threaded takes with it; already-gone ids are a no-op
      for (const it of theirs) await deleteRecording(it.id);
      if (alsoWords) theirWords.forEach((w) => log.remove(w.id));
      onErased();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  return (
    <div className="rounded-3xl border border-coral/30 bg-raised p-4 sm:p-5">
      <p className="text-sm font-semibold text-ink">{t("st4_eraseTitle").replace("{name}", person.label)}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {t("st4_eraseBody").replace("{n}", String(theirs.length))}
      </p>
      {!confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="pill mt-3 min-h-10 border border-coral/40 bg-coral/10 px-4 py-2 text-sm font-bold text-coral"
        >
          <Trash2 size={14} strokeWidth={2.5} aria-hidden /> {t("st4_eraseCta")}
        </button>
      ) : (
        <div className="mt-3 space-y-3" role="group" aria-label={t("st4_eraseCta")}>
          <p className="text-sm font-semibold text-ink">{t("st4_eraseConfirm")}</p>
          {theirWords.length > 0 && (
            <label className="flex cursor-pointer items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={alsoWords}
                onChange={(e) => setAlsoWords(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-coral)]"
              />
              <span>{t("st4_eraseWords").replace("{n}", String(theirWords.length))}</span>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={erase}
              disabled={busy}
              className="pill min-h-10 bg-coral px-4 py-2 text-sm font-bold text-canvas disabled:opacity-50"
            >
              {t("st4_eraseYes")}
            </button>
            <button type="button" onClick={() => setConfirm(false)} className={GHOST_BTN}>
              {t("st4_eraseNo")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Shown wherever the grower retells something a real person told them. */
export function AnonymizeNote() {
  const { t } = useApp();
  return (
    <Callout icon="🤐" title={t("st4_anonTitle")} tone="warm">
      <p>{t("st4_anonBody")}</p>
    </Callout>
  );
}

/* ------------------------------ escape hatch -------------------------- */

const DAY_MS = 86_400_000;

/**
 * The guide's own safety valve for this sink-or-swim phase: try it for a
 * week or two, and if it isn't getting easier, go back to Phase 3 for a
 * while. Always visible, never framed as failing.
 */
export function FallbackCard({
  tryStartedAt,
  onStartTry,
  onEndTry,
}: {
  /** ISO date the grower started their try; omit all three props for the plain card */
  tryStartedAt?: string;
  onStartTry?: () => void;
  onEndTry?: () => void;
}) {
  const { t } = useApp();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const day =
    tryStartedAt && now !== null
      ? Math.max(1, Math.floor((now - Date.parse(tryStartedAt)) / DAY_MS) + 1)
      : null;

  return (
    <Callout icon="🛟" title={t("st4_fallbackTitle")}>
      <p>{t("st4_fallbackBody")}</p>
      {day !== null && (
        <p className="mt-2 font-semibold text-ink">
          {t(day >= 7 ? "st4_fallbackWeekIn" : "st4_fallbackDay").replace("{n}", String(day))}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/courses/knowable" className={GHOST_BTN}>
          {t("st4_fallbackCta")} <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
        </Link>
        {onStartTry && !tryStartedAt && (
          <button type="button" onClick={onStartTry} className={GHOST_BTN}>
            {t("st4_fallbackStart")}
          </button>
        )}
        {onEndTry && tryStartedAt && (
          <button type="button" onClick={onEndTry} className={GHOST_BTN}>
            {t("st4_fallbackEasier")}
          </button>
        )}
      </div>
    </Callout>
  );
}

/* -------------------------------- pacing ------------------------------ */

/**
 * The guide's vocabulary throttle: about eight strong new words for every
 * hour of Phase 4 activity, watched over four days. Under that, the fifth
 * day goes to finding holes. Plain numbers, no score.
 */
export function PaceMeter({ lang, showHolesLink = false }: { lang: LangCode; showHolesLink?: boolean }) {
  const { profile, t } = useApp();
  const { words } = useWordLog(lang);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  if (!profile || now === null) return null;

  const since = now - 4 * DAY_MS;
  const minutes = (profile.activityLog ?? [])
    .filter((a) => a.activityId.startsWith("p4-") && Date.parse(a.completedAt) >= since)
    .reduce((sum, a) => sum + a.minutes, 0);
  const fresh = words.filter((w) => w.phase === 4 && Date.parse(w.addedAt) >= since).length;
  const hours = minutes / 60;
  const rate = hours >= 1 ? Math.round((fresh / hours) * 10) / 10 : null;

  return (
    <Callout icon="🧭" title={t("st4_paceTitle")}>
      {rate === null ? (
        <p>{t("st4_paceNeedHours")}</p>
      ) : (
        <>
          <p className="font-semibold text-ink">
            {t("st4_paceLine")
              .replace("{words}", String(fresh))
              .replace("{hours}", String(Math.round(hours * 10) / 10))
              .replace("{rate}", String(rate))}
          </p>
          <p className="mt-1">{t(rate >= 8 ? "st4_paceGood" : "st4_paceLow")}</p>
        </>
      )}
      {showHolesLink && (rate === null || rate < 8) && (
        <Link
          href="/studio/p4-holes"
          className="mt-2 inline-block text-sm font-semibold text-ink underline underline-offset-4"
        >
          {t("st4_paceHolesCta")} →
        </Link>
      )}
    </Callout>
  );
}
