"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { LangCode, PhaseId } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, useLibrary, type LibraryItem } from "@/lib/library";
import { ClarifyPlayer } from "../ClarifyPlayer";
import { RecordPanel } from "../RecordPanel";
import {
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { REMINISCE_PHRASES } from "./content";
import { isoDay, newId, useHeard, useStudioState } from "./hooks";
import { IdeaBoard, SocialReminder } from "./boards";
import { Disclosure, MassageStatus, MovesBar, Panel, PhraseBank, toPhrases, usePlayerMoves } from "./shared";

/**
 * p3-shared — Shared Experience + Reminiscing. Do something real together,
 * note that it happened, then have the nurturer tell it back while the grower
 * listens like a real listener. Each journal entry is tied to its recording.
 */

interface Outing {
  id: string;
  what: string;
  who: string;
  /** YYYY-MM-DD */
  date: string;
  happened: boolean;
  notes: string;
  /** the reminiscing recording */
  recId?: string;
}

interface SharedState {
  outings: Outing[];
}
const EMPTY: SharedState = { outings: [] };
const SUGGESTION_KEYS = [
  "st3_shSug1",
  "st3_shSug2",
  "st3_shSug3",
  "st3_shSug4",
  "st3_shSug5",
  "st3_shSug6",
  "st3_shSug7",
  "st3_shSug8",
];

const field =
  "w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30";

function OutingCard({
  outing,
  rec,
  lang,
  phaseId,
  activityId,
  accent,
  moves,
  onPatch,
  onRemove,
}: {
  outing: Outing;
  rec?: LibraryItem;
  lang: LangCode;
  phaseId: PhaseId;
  activityId: string;
  accent: string;
  moves?: string[];
  onPatch: (patch: Partial<Outing>) => void;
  onRemove: () => void;
}) {
  const { t } = useApp();
  const [playing, setPlaying] = useState(false);
  const status = rec ? "st3_shStReminisced" : outing.happened ? "st3_shStHappened" : "st3_shStPlanned";

  return (
    <li className="space-y-3 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-ink">{outing.what}</p>
          <p className="text-xs text-muted">
            {outing.date}
            {outing.who && ` · ${t("st3_shWith")} ${outing.who}`}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            rec ? "bg-mint/20 text-mint" : "bg-white/8 text-ink"
          }`}
        >
          {rec && <Check size={12} strokeWidth={3} aria-hidden />}
          {t(status)}
        </span>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={outing.happened}
          onChange={(e) => onPatch({ happened: e.target.checked })}
          className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
        />
        {t("st3_shHappened")}
      </label>

      {outing.happened && (
        <>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_shNotes")}</span>
            <textarea
              value={outing.notes}
              onChange={(e) => onPatch({ notes: e.target.value.slice(0, 600) })}
              rows={3}
              placeholder={t("st3_shNotesPlaceholder")}
              className={`${field} leading-relaxed`}
            />
          </label>

          {rec ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-expanded={playing}
                className="flex min-h-11 w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-left"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-ink">🎧 {rec.title}</span>
                <span className="text-xs tabular-nums text-muted">
                  {fmtDuration(rec.durationSec)} · {t("stc_plHeard")} {rec.relistens.length} {t("stc_plTimes")}
                </span>
              </button>
              {playing && (
                <>
                  <ClarifyPlayer
                    key={`${rec.id}:${rec.relistens.length}`}
                    item={rec}
                    accent={accent}
                    moves={moves}
                    onDeleted={() => onPatch({ recId: undefined })}
                  />
                  <MassageStatus item={rec} lang={lang} accent={accent} />
                </>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs leading-relaxed text-muted">{t("st3_shRecHint")}</p>
              <RecordPanel
                lang={lang}
                phase={phaseId}
                activityId={activityId}
                kind="primary"
                speaker="both"
                defaultTitle={`${t("st3_shRecName")}: ${outing.what}`.slice(0, 80)}
                accent={accent}
                tags={["reminiscing", `outing:${outing.id}`]}
                showConsent
                label={t("st3_shRecord")}
                onSaved={(item) => onPatch({ recId: item.id })}
              />
            </div>
          )}
        </>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="flex min-h-10 items-center gap-1.5 text-xs font-semibold text-muted hover:text-coral"
        >
          <Trash2 size={12} strokeWidth={2.5} aria-hidden /> {t("st3_shRemove")}
        </button>
      </div>
    </li>
  );
}

export function SharedExperience({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<SharedState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const { all } = useLibrary();
  const signals = useMemo(() => toPhrases(REMINISCE_PHRASES, lang, t), [lang, t]);

  const [what, setWhat] = useState("");
  const [who, setWho] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => setDate(isoDay(new Date())), []);

  const outings = [...state.outings].sort((a, b) => b.date.localeCompare(a.date));
  const patch = (id: string, p: Partial<Outing>) =>
    setState((s) => ({ outings: s.outings.map((o) => (o.id === id ? { ...o, ...p } : o)) }));

  const add = () => {
    const clean = what.trim().slice(0, 120);
    if (!clean) return;
    const outing: Outing = {
      id: newId("out"),
      what: clean,
      who: who.trim().slice(0, 80),
      date: date || isoDay(new Date()),
      happened: false,
      notes: "",
    };
    setState((s) => ({ outings: [...s.outings, outing] }));
    setWhat("");
  };

  const steps: GuideStep[] = [
    { title: t("st3_shS1"), body: t("st3_shS1b"), who: "both" },
    { title: t("st3_shS2"), body: t("st3_shS2b"), who: "both" },
    { title: t("st3_shS3"), body: t("st3_shS3b"), who: "you" },
    { title: t("st3_shS4"), body: t("st3_shS4b"), who: "nurturer" },
    { title: t("st3_shS5"), body: t("st3_shS5b"), who: "you" },
    { title: t("st3_shS6"), body: t("st3_shS6b"), who: "both" },
    { title: t("st3_shS7"), body: t("st3_shS7b"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🚶" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st3_shNeeds")}</NeedsPersonCallout>

      <Panel step={1} title={t("st3_shP1")} sub={t("st3_shP1b")} accent={accent}>
        <IdeaBoard
          lang={lang}
          focus="outings"
          accent={accent}
          suggestions={SUGGESTION_KEYS.map((k) => t(k))}
          onPick={setWhat}
          pickLabel={t("st3_shPlanThis")}
        />
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_shWhat")}</span>
            <input
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              maxLength={120}
              placeholder={t("st3_shWhatPlaceholder")}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_shWho")}</span>
            <input
              value={who}
              onChange={(e) => setWho(e.target.value)}
              maxLength={80}
              placeholder={t("st3_shWhoPlaceholder")}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_shDate")}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!what.trim()}
              className={`pill min-h-11 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
              style={{ background: accent }}
            >
              <Plus size={14} strokeWidth={3} aria-hidden /> {t("st3_shAdd")}
            </button>
          </div>
        </form>
      </Panel>

      <Panel step={2} title={t("st3_shP2")} sub={t("st3_shP2b")} accent={accent}>
        <PhraseBank
          title={t("st3_shSignalsTitle")}
          hint={signals.some((p) => p.text) ? t("st3_shSignalsHint") : undefined}
          phrases={signals}
          lang={lang}
          heard={heard}
          onHeard={markHeard}
        />
      </Panel>

      <Panel step={3} title={t("st3_shP3")} sub={t("st3_shP3b")} accent={accent}>
        {outings.length === 0 && <p className="text-sm text-muted">{t("st3_shEmpty")}</p>}
        <ul className="space-y-3">
          {outings.map((o) => (
            <OutingCard
              key={o.id}
              outing={o}
              rec={o.recId ? all.find((it) => it.id === o.recId) : undefined}
              lang={lang}
              phaseId={phase.id}
              activityId={activity.id}
              accent={accent}
              moves={playerMoves}
              onPatch={(p) => patch(o.id, p)}
              onRemove={() => setState((s) => ({ outings: s.outings.filter((x) => x.id !== o.id) }))}
            />
          ))}
        </ul>
        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
        <Disclosure title={t("st3_shAllRecs")}>
          <RecordingList
            filter={{ activityId: activity.id, lang }}
            accent={accent}
            moves={playerMoves}
            renderExtra={(it) => <MassageStatus item={it} lang={lang} accent={accent} />}
          />
        </Disclosure>
      </Panel>

      <SocialReminder lang={lang} />
      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
