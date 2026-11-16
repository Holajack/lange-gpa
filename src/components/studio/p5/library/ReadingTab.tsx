"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useWordLog } from "@/lib/wordLog";
import { RecordPanel } from "../../RecordPanel";
import { Callout } from "../../StudioShell";
import { READING_MOVES } from "../content";
import { TAG } from "../discourse";
import { addDays, showDay, todayIso, uid, weekStart } from "../storage";
import { accentBtn, Field, HostPhrases, INPUT, Panel, RemoveButton, Stat } from "../ui";
import type { ReadEntry } from "./model";

/** One reading entry, with the words it sent to the Word Log. */
function EntryRow({
  entry,
  lang,
  onWord,
  onRemove,
}: {
  entry: ReadEntry;
  lang: LangCode;
  onWord: (text: string) => void;
  onRemove: () => void;
}) {
  const { t } = useApp();
  const words = useWordLog(lang);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const added = words.add(text, { phase: 5, context: entry.what });
    if (!added) {
      setMsg(t("stc_wlDup"));
      return;
    }
    onWord(added.text);
    setText("");
    setMsg(null);
  };

  return (
    <li className="rounded-2xl border border-line bg-raised-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-ink">{entry.what}</p>
          <p className="text-xs tabular-nums text-muted">
            {showDay(entry.day)}
            {entry.pages > 0 ? ` · ${entry.pages} ${t("st5_rdPagesUnit")}` : ""}
            {entry.minutes > 0 ? ` · ${entry.minutes} ${t("st5_unitMin")}` : ""}
          </p>
        </div>
        <RemoveButton onConfirm={onRemove} />
      </div>
      {entry.words.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {entry.words.map((w) => (
            <span key={w} className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink">
              {w}
            </span>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setMsg(null);
          }}
          placeholder={t("st5_rdWordPlaceholder")}
          aria-label={t("st5_rdWordPlaceholder")}
          maxLength={80}
          className={`${INPUT} flex-1 basis-48`}
        />
        <button type="submit" className="pill min-h-10 bg-white/10 px-4 py-2 text-sm font-semibold text-ink">
          {t("st5_rdWordAdd")}
        </button>
        {msg && <span className="text-xs text-amber">{msg}</span>}
      </form>
    </li>
  );
}

/**
 * The reading programme starts in this phase: a lot of reading alone, plus
 * the mentor reading aloud so the recording can be clarified like any other.
 * This is a plain log. Reading done away from the app is not added to the
 * measured hours.
 */
export function ReadingTab({
  lang,
  accent,
  activityId,
  entries,
  onChange,
}: {
  lang: LangCode;
  accent: string;
  activityId: string;
  entries: ReadEntry[];
  onChange: (update: (prev: ReadEntry[]) => ReadEntry[]) => void;
}) {
  const { t } = useApp();
  const [what, setWhat] = useState("");
  const [pages, setPages] = useState("");
  const [minutes, setMinutes] = useState("");
  const [day, setDay] = useState(todayIso());

  const mine = entries.filter((e) => e.lang === lang).sort((a, b) => b.day.localeCompare(a.day));
  const monday = weekStart(todayIso());
  const thisWeek = mine.filter((e) => e.day >= monday && e.day < addDays(monday, 7));
  const sum = (list: ReadEntry[], pick: (e: ReadEntry) => number) => list.reduce((total, e) => total + pick(e), 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!what.trim()) return;
    const entry: ReadEntry = {
      id: uid("read"),
      lang,
      what: what.trim().slice(0, 120),
      day: day || todayIso(),
      pages: Math.max(0, Math.min(2000, Math.round(Number(pages) || 0))),
      minutes: Math.max(0, Math.min(1440, Math.round(Number(minutes) || 0))),
      words: [],
    };
    onChange((prev) => [...prev, entry]);
    setWhat("");
    setPages("");
    setMinutes("");
  };

  return (
    <div className="space-y-6">
      <Callout icon="📖" title={t("st5_rdRuleTitle")}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("st5_rdRule1")}</li>
          <li>{t("st5_rdRule2")}</li>
          <li>{t("st5_rdRule3")}</li>
        </ul>
      </Callout>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={sum(thisWeek, (e) => e.minutes)} label={t("st5_rdWeekMin")} />
        <Stat value={sum(thisWeek, (e) => e.pages)} label={t("st5_rdWeekPages")} />
        <Stat value={sum(mine, (e) => e.pages)} label={t("st5_rdAllPages")} />
        <Stat value={sum(mine, (e) => e.words.length)} label={t("st5_rdAllWords")} />
      </div>

      <Panel title={t("st5_rdLogTitle")} sub={t("st5_rdLogSub")}>
        <form onSubmit={submit} className="space-y-3 rounded-3xl border border-line bg-raised-2 p-4">
          <Field label={t("st5_rdWhat")}>
            <input value={what} onChange={(e) => setWhat(e.target.value)} maxLength={120} required className={INPUT} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={t("st5_rdPages")}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label={t("st5_rdMinutes")}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={INPUT}
              />
            </Field>
            <div className="col-span-2 sm:col-span-1">
              <Field label={t("st5_rdDay")}>
                <input type="date" value={day} max={todayIso()} onChange={(e) => setDay(e.target.value)} className={INPUT} />
              </Field>
            </div>
          </div>
          <button type="submit" disabled={!what.trim()} {...accentBtn(accent)}>
            <Plus size={15} strokeWidth={3} aria-hidden /> {t("st5_rdAdd")}
          </button>
        </form>

        {mine.length === 0 ? (
          <p className="text-sm text-muted">{t("st5_rdEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {mine.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                lang={lang}
                onWord={(text) =>
                  onChange((prev) => prev.map((e) => (e.id === entry.id ? { ...e, words: [...e.words, text] } : e)))
                }
                onRemove={() => onChange((prev) => prev.filter((e) => e.id !== entry.id))}
              />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t("st5_rdAloudTitle")} sub={t("st5_rdAloudSub")}>
        <HostPhrases title={t("st5_sayIt")} lines={READING_MOVES} lang={lang} />
        <RecordPanel
          lang={lang}
          phase={5}
          activityId={activityId}
          kind="primary"
          defaultTitle={t("st5_rdAloudRecTitle")}
          accent={accent}
          speaker="nurturer"
          tags={[TAG.readAloud]}
          showConsent
          label={t("st5_rdAloudRec")}
        />
        <p className="text-xs leading-relaxed text-muted">{t("st5_rdAloudAfter")}</p>
      </Panel>
    </div>
  );
}
