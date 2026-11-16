"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode, PhaseId } from "@/lib/types";
import { RecordPanel } from "../RecordPanel";
import { RecordingList, textOn } from "../StudioShell";
import { P4_JOURNAL_ASK, P4_TALK_MENU } from "./content";
import { INPUT, ROW, SMALL_BTN, SUB, SayLines, TEXTAREA, uid } from "./shared";

/* ------------------------------------------------------------------ *
 *  The two output pieces Phase 4 adds on top of its listening-heavy
 *  core: the "ways to talk a lot" menu and the journal for a mentor.
 *  Both are controlled: the tool that hosts them owns the saved state.
 * ------------------------------------------------------------------ */

/**
 * Ways to talk a lot — a small picker of things to go and say at length.
 * The count is tellings to real people; the guide's point is that the same
 * story gets markedly better by the fourth or fifth telling.
 */
export function TalkPicker({
  picked,
  onPick,
  tellings,
  onTell,
  lang,
  accent,
}: {
  picked: string | null;
  onPick: (id: string | null) => void;
  tellings: Record<string, number>;
  onTell: (id: string) => void;
  lang: LangCode;
  accent: string;
}) {
  const { t } = useApp();
  const item = P4_TALK_MENU.find((m) => m.id === picked) ?? null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("st4_talkTitle")}>
        {P4_TALK_MENU.map((m) => {
          const on = m.id === picked;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(on ? null : m.id)}
              aria-pressed={on}
              className={`pill min-h-10 px-4 py-2 text-left text-sm font-semibold ${
                on ? textOn(accent) : "bg-white/6 text-ink"
              }`}
              style={on ? { background: accent } : undefined}
            >
              {t(`st4_talk_${m.id}`)}
            </button>
          );
        })}
      </div>
      {item && (
        <div className={SUB}>
          <p className="text-sm leading-relaxed text-muted">{t(`st4_talk_${item.id}_how`)}</p>
          {item.starter && <SayLines lines={item.starter} lang={lang} />}
          {item.id !== "group" && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-ink">
                  {t("st4_talkTold").replace("{n}", String(tellings[item.id] ?? 0))}
                </span>
                <button type="button" onClick={() => onTell(item.id)} className={SMALL_BTN}>
                  + {t("st4_talkToldAgain")}
                </button>
              </div>
              <p className="text-xs leading-relaxed text-muted">{t("st4_talkCurve")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** A journal entry the grower wrote in the host language, to bring to a mentor. */
export interface JournalEntry {
  id: string;
  lang: LangCode;
  date: string;
  text: string;
  /** the mentor has read it */
  read?: boolean;
  /** what the mentor changed, in the grower's own words */
  changes?: string;
}

/**
 * Journal for a mentor: written or spoken. Writing formally begins in this
 * phase, so the grower's own host-language writing is welcome here. Nuri
 * does not correct it; that is the mentor's part.
 */
export function JournalCapture({
  entries,
  onEntries,
  activityId,
  phaseId,
  lang,
  accent,
}: {
  entries: JournalEntry[];
  onEntries: (fn: (prev: JournalEntry[]) => JournalEntry[]) => void;
  activityId: string;
  phaseId: PhaseId;
  lang: LangCode;
  accent: string;
}) {
  const { t, uiLang } = useApp();
  const [draft, setDraft] = useState("");
  const mine = entries.filter((e) => e.lang === lang);
  const patch = (id: string, change: Partial<JournalEntry>) =>
    onEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...change } : e)));

  return (
    <div className="space-y-4">
      <SayLines lines={P4_JOURNAL_ASK} lang={lang} />

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          onEntries((prev) => [{ id: uid("jr"), lang, date: new Date().toISOString(), text }, ...prev]);
          setDraft("");
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">{t("st4_jr_write")}</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("st4_jr_placeholder")}
            maxLength={4000}
            lang={lang}
            dir="auto"
            className={TEXTAREA}
          />
        </label>
        <button
          type="submit"
          disabled={!draft.trim()}
          className={`pill min-h-11 px-5 py-2 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
          style={{ background: accent }}
        >
          {t("st4_jr_save")}
        </button>
      </form>

      {mine.length > 0 && (
        <ul className="space-y-2">
          {mine.map((entry) => (
            <li key={entry.id} className={ROW}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-muted">{new Date(entry.date).toLocaleDateString(uiLang)}</p>
                <button
                  type="button"
                  onClick={() => onEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                  aria-label={t("st4_remove")}
                  className="pill h-10 w-10 shrink-0 justify-center bg-white/5 p-0 text-muted hover:text-coral"
                >
                  <Trash2 size={14} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
              <p lang={lang} dir="auto" className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                {entry.text}
              </p>
              <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={Boolean(entry.read)}
                  onChange={(e) => patch(entry.id, { read: e.target.checked })}
                  className="h-5 w-5 accent-[var(--color-mint)]"
                />
                {t("st4_jr_read")}
              </label>
              {entry.read && (
                <input
                  value={entry.changes ?? ""}
                  onChange={(e) => patch(entry.id, { changes: e.target.value })}
                  placeholder={t("st4_jr_changes")}
                  aria-label={t("st4_jr_changes")}
                  maxLength={300}
                  lang={lang}
                  dir="auto"
                  className={`${INPUT} mt-1 w-full`}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className={SUB}>
        <p className="text-sm leading-relaxed text-muted">{t("st4_jr_speakBody")}</p>
        <RecordPanel
          lang={lang}
          phase={phaseId}
          activityId={activityId}
          kind="journal"
          speaker="me"
          accent={accent}
          defaultTitle={`${t("stc_kind_journal")} · ${new Date().toLocaleDateString(uiLang)}`}
          label={t("st4_jr_speak")}
        />
        <RecordingList
          filter={{ activityId, lang, kind: "journal" }}
          accent={accent}
          title={t("st4_jr_spokenList")}
          emptyText={t("st4_jr_spokenEmpty")}
        />
      </div>
    </div>
  );
}
