"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode } from "@/lib/types";
import { deleteRecording, useLibrary, type LibraryItem } from "@/lib/library";
import { ClarifyPlayer } from "../ClarifyPlayer";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { P4_CLARIFY_MOVES, P4_OBSERVE_ASKS, P4_TRIANGULATE_ASKS } from "./content";
import {
  AddLine,
  GHOST_BTN,
  Panel,
  PhraseBook,
  ROW,
  RecordingPicker,
  SUB,
  SayLines,
  TEXTAREA,
  hostLines,
  uid,
  useGapTypes,
  useReturning,
  useSteps,
  useStudioState,
} from "./shared";

/**
 * p4-observe — Observe and Describe (Detailed Observation).
 * Solo fieldwork (watch, note, write up) and then a mentor session: describe
 * the scene in full, hear what they make of it, record their account, check
 * it with others. Nuri prompts what to notice; it never says what a scene
 * meant. That reading belongs to people who live here.
 */

const NOTICE = ["people", "sequence", "objects", "said", "senses", "surprise"] as const;
type NoticeId = (typeof NOTICE)[number];

/** One person's reading of the scene, and how many others have confirmed or differed. */
interface Reading {
  id: string;
  text: string;
  agree: number;
  differ: number;
}

interface Observation {
  id: string;
  lang: LangCode;
  place: string;
  createdAt: string;
  notes: Partial<Record<NoticeId, string>>;
  /** layout, positions, a rough map in words */
  layout?: string;
  readings: Reading[];
}

interface ObserveState {
  observations: Observation[];
  activeId: string | null;
}

const INITIAL: ObserveState = { observations: [], activeId: null };
const obsTag = (id: string) => `obs:${id}`;

type Stage = "todo" | "notes" | "described" | "account";

function stageOf(obs: Observation, all: LibraryItem[]): Stage {
  const mine = all.filter((it) => it.tags?.includes(obsTag(obs.id)));
  if (mine.some((it) => it.kind === "improved")) return "account";
  if (mine.some((it) => it.kind === "description")) return "described";
  const wrote = NOTICE.some((id) => obs.notes[id]?.trim()) || Boolean(obs.layout?.trim());
  return wrote ? "notes" : "todo";
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const { t } = useApp();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        aria-label={`${label}: ${t("st4_ob_less")}`}
        className="pill h-10 w-10 justify-center bg-white/6 p-0 text-ink disabled:opacity-40"
      >
        <Minus size={14} strokeWidth={2.5} aria-hidden />
      </button>
      <span className="min-w-[7rem] text-center text-xs font-semibold text-ink">
        {label} · <span className="tabular-nums">{value}</span>
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`${label}: ${t("st4_ob_more")}`}
        className="pill h-10 w-10 justify-center bg-white/6 p-0 text-ink"
      >
        <Plus size={14} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

export function ObserveTool({ activity, phase, lang }: StudioToolProps) {
  const { t, uiLang } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, setState, ready] = useStudioState<ObserveState>(activity.id, INITIAL);
  const { all } = useLibrary();
  const gapTypes = useGapTypes();
  const [descId, setDescId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const steps = useSteps("st4_ob_s", ["you", "you", "you", "you", "both", "nurturer", "you"]);

  const observations = state.observations.filter((o) => o.lang === lang);
  const active = observations.find((o) => o.id === state.activeId) ?? null;
  const moves = hostLines(P4_CLARIFY_MOVES, lang);
  const returning = useReturning(ready, observations.length > 0);
  const descriptions = active
    ? all.filter((it) => it.kind === "description" && it.tags?.includes(obsTag(active.id))).reverse()
    : [];
  const desc = descriptions.find((d) => d.id === descId) ?? descriptions[descriptions.length - 1] ?? null;

  const patchActive = (fn: (obs: Observation) => Observation) => {
    if (!active) return;
    setState((s) => ({ ...s, observations: s.observations.map((o) => (o.id === active.id ? fn(o) : o)) }));
  };
  const patchReading = (id: string, change: Partial<Reading>) =>
    patchActive((o) => ({ ...o, readings: o.readings.map((r) => (r.id === id ? { ...r, ...change } : r)) }));

  const addObservation = (place: string) => {
    const obs: Observation = {
      id: uid("ob"),
      lang,
      place,
      createdAt: new Date().toISOString(),
      notes: {},
      readings: [],
    };
    setState((s) => ({ observations: [obs, ...s.observations], activeId: obs.id }));
    setDescId(null);
  };

  const removeActive = async () => {
    if (!active) return;
    for (const it of all.filter((x) => x.tags?.includes(obsTag(active.id)))) await deleteRecording(it.id);
    setState((s) => ({ observations: s.observations.filter((o) => o.id !== active.id), activeId: null }));
    setConfirmDelete(false);
    setDescId(null);
  };

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="👀" mode="either" />
      <StepGuide
        key={returning ? "returning" : "first"}
        steps={steps}
        accent={phase.color}
        defaultOpen={!returning}
      />
      <NeedsPersonCallout>{t("st4_ob_needs")}</NeedsPersonCallout>
      <PhraseBook
        lang={lang}
        groups={[
          { title: t("st4_phr_observe"), lines: P4_OBSERVE_ASKS },
          { title: t("st4_phr_triangulate"), lines: P4_TRIANGULATE_ASKS },
        ]}
      />

      {/* observation log */}
      <Panel title={t("st4_ob_logTitle")} sub={t("st4_ob_logSub")}>
        <AddLine
          placeholder={t("st4_ob_placePlaceholder")}
          button={t("st4_ob_add")}
          onAdd={addObservation}
          accent={phase.color}
          maxLength={60}
        />
        {observations.length === 0 ? (
          <p className="text-sm text-muted">{t("st4_ob_logEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {observations.map((o) => {
              const on = o.id === active?.id;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setState((s) => ({ ...s, activeId: on ? null : o.id }));
                      setDescId(null);
                      setConfirmDelete(false);
                    }}
                    aria-pressed={on}
                    className={`flex min-h-12 w-full flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left ${
                      on ? "border-white/40 bg-raised-2" : "border-line bg-raised hover:bg-raised-2"
                    }`}
                  >
                    <span className="min-w-0 break-words text-sm font-semibold text-ink">{o.place}</span>
                    <span className="text-xs text-muted">
                      {new Date(o.createdAt).toLocaleDateString(uiLang)} · {t(`st4_ob_stage_${stageOf(o, all)}`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {active && (
        <>
          {/* solo: field notes */}
          <Panel title={t("st4_ob_notesTitle")} sub={t("st4_ob_notesSub")}>
            {NOTICE.map((id) => (
              <label key={id} className="block">
                <span className="block text-sm font-semibold text-ink">{t(`st4_ob_n_${id}`)}</span>
                <span className="mb-1.5 block text-xs leading-relaxed text-muted">{t(`st4_ob_n_${id}_hint`)}</span>
                <textarea
                  value={active.notes[id] ?? ""}
                  onChange={(e) => patchActive((o) => ({ ...o, notes: { ...o.notes, [id]: e.target.value } }))}
                  maxLength={2000}
                  className={TEXTAREA}
                />
              </label>
            ))}
            <label className="block">
              <span className="block text-sm font-semibold text-ink">{t("st4_ob_layout")}</span>
              <span className="mb-1.5 block text-xs leading-relaxed text-muted">{t("st4_ob_layoutHint")}</span>
              <textarea
                value={active.layout ?? ""}
                onChange={(e) => patchActive((o) => ({ ...o, layout: e.target.value }))}
                maxLength={1000}
                className={TEXTAREA}
              />
            </label>
            <Callout icon="⏳" title={t("st4_ob_nowTitle")} tone="warm">
              <p>{t("st4_ob_nowBody")}</p>
            </Callout>
            <p className="text-xs leading-relaxed text-muted">{t("st4_ob_privacy")}</p>
          </Panel>

          {/* with your mentor: describe it, then record their account */}
          <Panel title={t("st4_ob_describeTitle")} sub={t("st4_ob_describeSub")}>
            <RecordPanel
              lang={lang}
              phase={phase.id}
              activityId={activity.id}
              kind="description"
              speaker="me"
              tags={[obsTag(active.id)]}
              accent={phase.color}
              defaultTitle={`${active.place} · ${t("st4_ob_myTelling")}`.slice(0, 80)}
              label={t("st4_ob_recordMine")}
              onSaved={(item) => setDescId(item.id)}
            />
            {descriptions.length > 1 && (
              <RecordingPicker
                items={descriptions}
                selectedId={desc?.id ?? null}
                onSelect={setDescId}
                emptyText={t("st4_ob_noDescription")}
              />
            )}
            {desc ? (
              <>
                <ClarifyPlayer key={desc.id} item={desc} accent={phase.color} onDeleted={() => setDescId(null)} />
                <div className={SUB}>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{t("st4_ob_accountTitle")}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{t("st4_ob_accountBody")}</p>
                  </div>
                  <SayLines lines={P4_OBSERVE_ASKS.slice(-2)} lang={lang} />
                  <RecordPanel
                    lang={lang}
                    phase={phase.id}
                    activityId={activity.id}
                    kind="improved"
                    speaker="native"
                    parentId={desc.id}
                    showConsent
                    tags={[obsTag(active.id)]}
                    accent={phase.color}
                    defaultTitle={`${active.place} · ${t("st4_ob_theirTelling")}`.slice(0, 80)}
                    label={t("st4_ob_recordTheirs")}
                  />
                  <RecordingList
                    filter={{ parentId: desc.id, kind: "improved" }}
                    accent={phase.color}
                    gapTypes={gapTypes}
                    moves={moves.length > 0 ? moves : undefined}
                    title={t("st4_ob_accountList")}
                    emptyText={t("st4_ob_waiting")}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">{t("st4_ob_noDescription")}</p>
            )}
          </Panel>

          {/* what it meant, checked with others */}
          <Panel title={t("st4_ob_readTitle")} sub={t("st4_ob_readSub")}>
            <AddLine
              placeholder={t("st4_ob_readPlaceholder")}
              button={t("st4_ob_readAdd")}
              onAdd={(text) =>
                patchActive((o) => ({ ...o, readings: [...o.readings, { id: uid("rd"), text, agree: 0, differ: 0 }] }))
              }
              accent={phase.color}
              maxLength={200}
            />
            {active.readings.length === 0 ? (
              <p className="text-sm text-muted">{t("st4_ob_readEmpty")}</p>
            ) : (
              <ul className="space-y-2">
                {active.readings.map((r) => {
                  const asked = r.agree + r.differ;
                  return (
                    <li key={r.id} className={ROW}>
                      <div className="flex items-start gap-2">
                        <p className="min-w-0 flex-1 break-words text-sm text-ink">{r.text}</p>
                        <button
                          type="button"
                          onClick={() =>
                            patchActive((o) => ({ ...o, readings: o.readings.filter((x) => x.id !== r.id) }))
                          }
                          aria-label={t("st4_remove")}
                          className="pill h-10 w-10 shrink-0 justify-center bg-white/5 p-0 text-muted hover:text-coral"
                        >
                          <Trash2 size={14} strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <Counter
                          label={t("st4_ob_agree")}
                          value={r.agree}
                          onChange={(n) => patchReading(r.id, { agree: n })}
                        />
                        <Counter
                          label={t("st4_ob_differ")}
                          value={r.differ}
                          onChange={(n) => patchReading(r.id, { differ: n })}
                        />
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {t(asked >= 2 ? "st4_ob_checked" : "st4_ob_unchecked").replace("{n}", String(asked))}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div className="flex flex-wrap items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-sm text-muted">{t("st4_ob_deleteConfirm")}</span>
                <button
                  type="button"
                  onClick={removeActive}
                  className="pill min-h-10 bg-coral px-4 py-2 text-sm font-bold text-canvas"
                >
                  {t("st4_ob_deleteYes")}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={GHOST_BTN}>
                  {t("st4_eraseNo")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex min-h-10 items-center gap-1.5 text-sm font-semibold text-muted hover:text-coral"
              >
                <Trash2 size={14} strokeWidth={2.5} aria-hidden /> {t("st4_ob_delete")}
              </button>
            )}
          </div>
        </>
      )}

      <RecordingList
        filter={{ activityId: activity.id, lang }}
        accent={phase.color}
        gapTypes={gapTypes}
        moves={moves.length > 0 ? moves : undefined}
      />
      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
