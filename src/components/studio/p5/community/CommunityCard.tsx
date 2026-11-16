"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useWordLog } from "@/lib/wordLog";
import { addDays, showDay, todayIso, uid, weekStart } from "../storage";
import { BTN_GHOST, ChoiceChips, DraftInput, Field, INPUT, RemoveButton, Stat } from "../ui";
import { BELONGING, totalHours, type Community, type Missed } from "./model";

/** One thing that went past the grower, with what it turned out to be. */
export function MissedRow({
  missed,
  context,
  lang,
  onPatch,
  onRemove,
}: {
  missed: Missed;
  /** where it happened, for the Word Log */
  context: string;
  lang: LangCode;
  onPatch: (change: Partial<Missed>) => void;
  onRemove: () => void;
}) {
  const { t } = useApp();
  const wordLog = useWordLog(lang);
  const [word, setWord] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const addWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    const added = wordLog.add(word, { phase: 5, context });
    if (!added) {
      setMsg(t("stc_wlDup"));
      return;
    }
    onPatch({ words: [...missed.words, added.text] });
    setWord("");
    setMsg(null);
  };

  return (
    <li className="space-y-2 rounded-2xl border border-line bg-canvas p-3">
      <div className="flex flex-wrap items-start gap-2">
        <p className="min-w-0 flex-1 basis-48 break-words text-sm text-ink">{missed.text}</p>
        <button
          type="button"
          onClick={() => onPatch({ asked: !missed.asked })}
          aria-pressed={missed.asked}
          className={`pill min-h-10 px-3 py-2 text-xs font-bold ${
            missed.asked ? "bg-mint text-canvas" : "bg-white/8 text-muted"
          }`}
        >
          {missed.asked && <Check size={12} strokeWidth={3} aria-hidden />}
          {missed.asked ? t("st5_cmAsked") : t("st5_cmToAsk")}
        </button>
        <RemoveButton onConfirm={onRemove} />
      </div>
      <DraftInput
        value={missed.answer}
        label={t("st5_cmAnswer")}
        maxLength={300}
        onCommit={(answer) => onPatch({ answer: answer.trim() })}
      />
      <form onSubmit={addWord} className="flex flex-wrap items-center gap-2">
        {missed.words.map((w) => (
          <span key={w} className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink">
            {w}
          </span>
        ))}
        <input
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            setMsg(null);
          }}
          placeholder={t("stc_wlAddPlaceholder")}
          aria-label={t("stc_wlAddPlaceholder")}
          maxLength={80}
          className="min-w-0 flex-1 basis-44 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-ink outline-none focus:border-white/30"
        />
        <button type="submit" className="pill min-h-10 bg-white/10 px-3 py-2 text-xs font-bold text-ink">
          {t("stc_plAddWord")}
        </button>
        {msg && <span className="text-xs text-amber">{msg}</span>}
      </form>
    </li>
  );
}

/** The notebook page for one community. */
export function CommunityCard({
  community,
  lang,
  onPatch,
}: {
  community: Community;
  lang: LangCode;
  onPatch: (fn: (prev: Community) => Community) => void;
}) {
  const { t } = useApp();
  const thisWeek = weekStart(todayIso());
  const [week, setWeek] = useState(thisWeek);
  const [missedText, setMissedText] = useState("");
  const [personName, setPersonName] = useState("");
  const [personNote, setPersonNote] = useState("");

  const weekMissed = community.missed.filter((m) => m.week === week);
  const hours = community.hours[week] ?? 0;

  const patchMissed = (id: string, change: Partial<Missed>) =>
    onPatch((prev) => ({ ...prev, missed: prev.missed.map((m) => (m.id === id ? { ...m, ...change } : m)) }));

  const addMissed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!missedText.trim()) return;
    const next: Missed = {
      id: uid("miss"),
      week,
      text: missedText.trim().slice(0, 300),
      asked: false,
      answer: "",
      words: [],
    };
    onPatch((prev) => ({ ...prev, missed: [...prev.missed, next] }));
    setMissedText("");
  };

  const addPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;
    onPatch((prev) => ({
      ...prev,
      people: [
        ...prev.people,
        { id: uid("per"), name: personName.trim().slice(0, 60), note: personNote.trim().slice(0, 160) },
      ],
    }));
    setPersonName("");
    setPersonNote("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat value={hours} label={t("st5_cmHoursWeek")} />
        <Stat value={Math.round(totalHours(community) * 10) / 10} label={t("st5_cmHoursAll")} />
        <div className="col-span-2 sm:col-span-1">
          <Stat value={community.people.length} label={t("st5_cmPeopleCount")} sub={`${t("st5_cmSince")} ${showDay(community.since)}`} />
        </div>
      </div>

      <Field label={t("st5_cmRole")} hint={t("st5_cmRoleHint")}>
        <DraftInput
          value={community.role}
          label={t("st5_cmRole")}
          placeholder=""
          maxLength={160}
          onCommit={(role) => onPatch((prev) => ({ ...prev, role: role.trim() }))}
        />
      </Field>

      <div>
        <ChoiceChips
          label={t("st5_cmBelonging")}
          value={community.belonging}
          onChange={(belonging) => onPatch((prev) => ({ ...prev, belonging }))}
          options={BELONGING.map((id) => ({ id, label: t(`st5_cmBelong_${id}`) }))}
        />
        <p className="mt-2 text-xs leading-relaxed text-muted">{t("st5_cmBelongingHint")}</p>
      </div>

      {/* the week */}
      <div className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setWeek(addDays(week, -7))}
            aria-label={t("st5_cmWeekPrev")}
            title={t("st5_cmWeekPrev")}
            className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <p className="text-center text-sm font-semibold text-ink" aria-live="polite">
            {week === thisWeek ? t("st5_cmThisWeek") : `${t("st5_cmWeekOf")} ${showDay(week)}`}
          </p>
          <button
            type="button"
            onClick={() => setWeek(addDays(week, 7))}
            disabled={week >= thisWeek}
            aria-label={t("st5_cmWeekNext")}
            title={t("st5_cmWeekNext")}
            className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="w-full sm:w-56">
          <Field label={t("st5_cmHoursField")}>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.5}
              value={hours}
              onChange={(e) => {
                const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                onPatch((prev) => ({ ...prev, hours: { ...prev.hours, [week]: value } }));
              }}
              className={INPUT}
            />
          </Field>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">{t("st5_cmMissedTitle")}</p>
          <p className="text-sm leading-relaxed text-muted">{t("st5_cmMissedBody")}</p>
          <form onSubmit={addMissed} className="flex flex-wrap items-center gap-2">
            <input
              value={missedText}
              onChange={(e) => setMissedText(e.target.value)}
              placeholder={t("st5_cmMissedPlaceholder")}
              aria-label={t("st5_cmMissedPlaceholder")}
              maxLength={300}
              className={`${INPUT} flex-1 basis-56`}
            />
            <button type="submit" disabled={!missedText.trim()} className={BTN_GHOST}>
              <Plus size={14} strokeWidth={2.5} aria-hidden /> {t("st5_cmMissedAdd")}
            </button>
          </form>
          {weekMissed.length === 0 ? (
            <p className="text-sm text-muted">{t("st5_cmMissedEmpty")}</p>
          ) : (
            <ul className="space-y-2">
              {weekMissed.map((m) => (
                <MissedRow
                  key={m.id}
                  missed={m}
                  context={community.name}
                  lang={lang}
                  onPatch={(change) => patchMissed(m.id, change)}
                  onRemove={() => onPatch((prev) => ({ ...prev, missed: prev.missed.filter((x) => x.id !== m.id) }))}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* people */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-ink">{t("st5_cmPeopleTitle")}</p>
        <p className="text-sm leading-relaxed text-muted">{t("st5_cmPeopleBody")}</p>
        <form onSubmit={addPerson} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder={t("st5_cmPersonName")}
            aria-label={t("st5_cmPersonName")}
            maxLength={60}
            className={INPUT}
          />
          <input
            value={personNote}
            onChange={(e) => setPersonNote(e.target.value)}
            placeholder={t("st5_cmPersonNote")}
            aria-label={t("st5_cmPersonNote")}
            maxLength={160}
            className={INPUT}
          />
          <button type="submit" disabled={!personName.trim()} className={BTN_GHOST}>
            <Plus size={14} strokeWidth={2.5} aria-hidden /> {t("st5_cmPersonAdd")}
          </button>
        </form>
        {community.people.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {community.people.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-2xl border border-line bg-raised-2 px-4 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                  {p.note && <span className="block break-words text-xs text-muted">{p.note}</span>}
                </span>
                <RemoveButton
                  onConfirm={() => onPatch((prev) => ({ ...prev, people: prev.people.filter((x) => x.id !== p.id) }))}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
