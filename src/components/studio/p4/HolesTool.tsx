"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Shuffle, Trash2, Volume2 } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode } from "@/lib/types";
import { updateRecording, useLibrary, type PictureItem } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import { speak, stopSpeaking } from "@/lib/tts";
import { RecordPanel } from "../RecordPanel";
import {
  FinishBar,
  NeedsPersonCallout,
  PictureShelf,
  PictureView,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
} from "../StudioShell";
import { hostText, type StudioToolProps } from "../types";
import { P4_HOLE_ASKS, P4_HOLE_DOMAINS } from "./content";
import {
  AddLine,
  INPUT,
  PaceMeter,
  Panel,
  PhraseBook,
  ROW,
  SMALL_BTN,
  SUB,
  Stat,
  uid,
  useReturning,
  useSteps,
  useStudioState,
} from "./shared";

/**
 * p4-holes — Hole-Finding.
 * The finding half is honestly solo: pick an area of life, talk it through
 * aloud, and catch every place you stall. The closing half needs a mentor:
 * their recording of how to say it, plus a Word Log entry tied to it. Nuri
 * reads the prompt card and nothing else; it never supplies the missing word.
 */

interface Hole {
  id: string;
  lang: LangCode;
  domainId: string;
  /** the grower's own reminder of what they couldn't say; dropped from view once closed */
  text: string;
  /** the talk-through it came up in */
  attemptId?: string;
  /** the mentor's recording of how to say it */
  fixId?: string;
  /** the word or phrase as the mentor says it, once logged */
  word?: string;
}

interface HolesState {
  holes: Hole[];
  domainId: string | null;
  /** which card each area is on */
  cardIx: Record<string, number>;
  /** `${domainId}:${cardIx}` for cards already talked through */
  talked: string[];
}

const INITIAL: HolesState = { holes: [], domainId: null, cardIx: {}, talked: [] };

export function HolesTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, setState, ready] = useStudioState<HolesState>(activity.id, INITIAL);
  const { all } = useLibrary();
  const log = useWordLog(lang);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [fixing, setFixing] = useState<string | null>(null);
  const [wordDraft, setWordDraft] = useState("");
  const [pic, setPic] = useState<PictureItem | null>(null);
  const steps = useSteps("st4_ho_s", ["you", "you", "you", "both", "nurturer", "you"]);

  useEffect(() => () => stopSpeaking(), []);

  const holes = state.holes.filter((h) => h.lang === lang);
  const returning = useReturning(ready, holes.length > 0);
  const open = holes.filter((h) => !h.word);
  const closed = holes.filter((h) => h.word);
  const domain = P4_HOLE_DOMAINS.find((d) => d.id === state.domainId) ?? null;
  const ix = domain && domain.cards.length > 0 ? (state.cardIx[domain.id] ?? 0) % domain.cards.length : 0;
  const prompt = domain ? hostText(domain.cards[ix], lang) : undefined;
  const cardKey = domain ? `${domain.id}:${ix}` : "";
  const exists = (id?: string) => Boolean(id && all.some((it) => it.id === id));

  const patchHole = (id: string, change: Partial<Hole>) =>
    setState((s) => ({ ...s, holes: s.holes.map((h) => (h.id === id ? { ...h, ...change } : h)) }));

  const closeHole = (hole: Hole) => {
    const word = wordDraft.trim();
    if (!word || !hole.fixId) return;
    // no gloss is stored with the word: its meaning lives in the mentor's recording
    log.add(word, { sourceId: hole.fixId, phase: 4 });
    void updateRecording(hole.fixId, { title: word.slice(0, 80) });
    // the grower's own-language reminder has done its job; don't keep it beside the word
    patchHole(hole.id, { word, text: "" });
    setWordDraft("");
    setFixing(null);
  };

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🕳️" mode="either" />
      <StepGuide
        key={returning ? "returning" : "first"}
        steps={steps}
        accent={phase.color}
        defaultOpen={!returning}
      />
      <PaceMeter lang={lang} />

      {/* solo: pick an area */}
      <Panel title={t("st4_ho_areasTitle")} sub={t("st4_ho_areasSub")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {P4_HOLE_DOMAINS.map((d) => {
            const on = d.id === domain?.id;
            const n = open.filter((h) => h.domainId === d.id).length;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setState((s) => ({ ...s, domainId: on ? null : d.id }));
                  setAttemptId(null);
                }}
                aria-pressed={on}
                className={`flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-2xl border px-3 py-2 text-left ${
                  on ? "border-white/40 bg-raised-2" : "border-line bg-raised hover:bg-raised-2"
                }`}
              >
                <span className="text-sm font-semibold text-ink">
                  <span aria-hidden>{d.emoji}</span> {t(`st4_dom_${d.id}`)}
                </span>
                {n > 0 && <span className="text-xs text-coral">{t("st4_ho_openCount").replace("{n}", String(n))}</span>}
              </button>
            );
          })}
        </div>
      </Panel>

      {/* solo: talk it through, catch the holes */}
      {domain && (
        <Panel title={`${domain.emoji} ${t(`st4_dom_${domain.id}`)}`} sub={t("st4_ho_talkSub")}>
          {domain.id === "picture" && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-muted">{t("st4_ho_pictureBody")}</p>
              <PictureShelf activityId={activity.id} selectedId={pic?.id ?? null} onSelect={setPic} />
              {pic && <PictureView pic={pic} className="max-h-[60vh]" />}
            </div>
          )}
          {domain.id === "film" && <p className="text-sm leading-relaxed text-muted">{t("st4_ho_filmBody")}</p>}
          {domain.cards.length > 0 &&
            (prompt ? (
              <div className={SUB}>
                <p className="text-xs font-semibold text-muted">
                  {t("st4_ho_cardCount")
                    .replace("{n}", String(ix + 1))
                    .replace("{total}", String(domain.cards.length))}
                  {state.talked.includes(cardKey) && <span className="ml-2 text-mint">✓ {t("st4_ho_talked")}</span>}
                </p>
                <p lang={lang} className="headline break-words text-xl leading-snug text-ink sm:text-2xl">
                  {prompt}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void speak(prompt, lang)} className={SMALL_BTN}>
                    <Volume2 size={14} strokeWidth={2.5} aria-hidden /> {t("st4_hear")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      setState((s) => ({ ...s, cardIx: { ...s.cardIx, [domain.id]: ix + 1 } }));
                      setAttemptId(null);
                    }}
                    className={SMALL_BTN}
                  >
                    <Shuffle size={14} strokeWidth={2.5} aria-hidden /> {t("st4_ho_nextCard")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted">{t("st4_ho_noCards")}</p>
            ))}

          <RecordPanel
            lang={lang}
            phase={phase.id}
            activityId={activity.id}
            kind="description"
            speaker="me"
            tags={[`hole:${domain.id}`]}
            accent={phase.color}
            defaultTitle={`${t(`st4_dom_${domain.id}`)} · ${t("st4_ho_attempt")}`}
            label={t("st4_ho_record")}
            onSaved={(item) => {
              setAttemptId(item.id);
              if (cardKey && domain.cards.length > 0) {
                setState((s) => (s.talked.includes(cardKey) ? s : { ...s, talked: [...s.talked, cardKey] }));
              }
            }}
          />

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">{t("st4_ho_stuckTitle")}</p>
            <AddLine
              placeholder={t("st4_ho_stuckPlaceholder")}
              button={t("st4_ho_stuckAdd")}
              onAdd={(text) =>
                setState((s) => ({
                  ...s,
                  holes: [
                    ...s.holes,
                    { id: uid("hole"), lang, domainId: domain.id, text, attemptId: attemptId ?? undefined },
                  ],
                }))
              }
              accent={phase.color}
            />
            <p className="text-xs leading-relaxed text-muted">{t("st4_ho_stuckHint")}</p>
          </div>
        </Panel>
      )}

      {/* with your mentor: close them */}
      <Panel title={t("st4_ho_listTitle")} sub={t("st4_ho_listSub")}>
        <div className="grid grid-cols-2 gap-2">
          <Stat value={open.length} label={t("st4_ho_statOpen")} />
          <Stat value={closed.length} label={t("st4_ho_statClosed")} />
        </div>
        {open.length === 0 ? (
          <p className="text-sm text-muted">{t("st4_ho_listEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {open.map((hole) => {
              const on = fixing === hole.id;
              const hasFix = exists(hole.fixId);
              return (
                <li key={hole.id} className="rounded-2xl border border-line bg-raised-2 p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm text-ink">{hole.text}</p>
                      <p className="text-xs text-muted">{t(`st4_dom_${hole.domainId}`)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setState((s) => ({ ...s, holes: s.holes.filter((h) => h.id !== hole.id) }))}
                      aria-label={t("st4_remove")}
                      className="pill h-10 w-10 shrink-0 justify-center bg-white/5 p-0 text-muted hover:text-coral"
                    >
                      <Trash2 size={14} strokeWidth={2.5} aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFixing(on ? null : hole.id);
                      setWordDraft("");
                    }}
                    aria-expanded={on}
                    className={`${SMALL_BTN} mt-2`}
                  >
                    {t("st4_ho_close")}
                    <ChevronDown
                      size={14}
                      strokeWidth={2.5}
                      className={`transition-transform ${on ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {on && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm leading-relaxed text-muted">
                        {t(hasFix ? "st4_ho_closeStep2" : "st4_ho_closeStep1")}
                      </p>
                      {!hasFix ? (
                        <RecordPanel
                          lang={lang}
                          phase={phase.id}
                          activityId={activity.id}
                          kind="improved"
                          speaker="native"
                          parentId={exists(hole.attemptId) ? hole.attemptId : undefined}
                          showConsent
                          accent={phase.color}
                          defaultTitle={`${t(`st4_dom_${hole.domainId}`)} · ${t("st4_ho_fixName")}`}
                          label={t("st4_ho_recordFix")}
                          onSaved={(item) => patchHole(hole.id, { fixId: item.id })}
                        />
                      ) : (
                        <form
                          className="flex flex-wrap gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            closeHole(hole);
                          }}
                        >
                          <input
                            value={wordDraft}
                            onChange={(e) => setWordDraft(e.target.value)}
                            placeholder={t("st4_ho_wordPlaceholder")}
                            aria-label={t("st4_ho_wordPlaceholder")}
                            maxLength={80}
                            lang={lang}
                            className={`${INPUT} min-w-[10rem] flex-1`}
                          />
                          <button
                            type="submit"
                            disabled={!wordDraft.trim()}
                            className={`pill min-h-11 px-4 py-2 text-sm font-bold disabled:opacity-40 ${textOn(phase.color)}`}
                            style={{ background: phase.color }}
                          >
                            <Check size={15} strokeWidth={3} aria-hidden /> {t("st4_ho_logClose")}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <NeedsPersonCallout>{t("st4_ho_needs")}</NeedsPersonCallout>

        {closed.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st4_ho_closedTitle")}</p>
            <ul className="flex flex-wrap gap-2">
              {closed.map((hole) => (
                <li key={hole.id} lang={lang} className={`${ROW} max-w-full break-words text-sm font-semibold text-ink`}>
                  {hole.word}
                </li>
              ))}
            </ul>
          </div>
        )}
        <RecordingList
          filter={{ activityId: activity.id, lang, kind: "improved" }}
          accent={phase.color}
          title={t("st4_ho_fixList")}
          emptyText={t("st4_ho_fixEmpty")}
        />
      </Panel>

      <PhraseBook lang={lang} groups={[{ title: t("st4_phr_holes"), lines: P4_HOLE_ASKS }]} />

      <RecordingList
        filter={{ activityId: activity.id, lang, kind: "description" }}
        accent={phase.color}
        title={t("st4_ho_attemptList")}
        emptyText={t("st4_ho_attemptEmpty")}
      />
      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
