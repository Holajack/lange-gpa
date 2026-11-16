"use client";

import { useState } from "react";
import { ChevronDown, Mic, Plus } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import type { LibraryItem } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import { RecordPanel } from "../../RecordPanel";
import { hostText } from "../../types";
import { EPIC_ASK, EPIC_OPEN } from "../content";
import { TAG } from "../discourse";
import { showDay, todayIso, uid } from "../storage";
import { BTN_GHOST, Disclosure, DraftInput, Field, HostPhrases, INPUT, RemoveButton } from "../ui";
import { RehearsalAudience } from "./RehearsalAudience";
import { episodeState, listenersOf, type Epic, type Episode, type Telling } from "./model";

/**
 * One part of the epic: plan it, rehearse it, tell it to someone, tell it
 * again to someone else, and keep what the listeners gave back.
 */
export function EpisodeCard({
  epic,
  episode,
  number,
  open,
  onToggle,
  lang,
  accent,
  activityId,
  items,
  onPatch,
  onRemove,
}: {
  epic: Epic;
  episode: Episode;
  number: number;
  open: boolean;
  onToggle: () => void;
  lang: LangCode;
  accent: string;
  activityId: string;
  /** library recordings, to check a threaded take still exists */
  items: LibraryItem[];
  onPatch: (fn: (prev: Episode) => Episode) => void;
  onRemove: () => void;
}) {
  const { t } = useApp();
  const wordLog = useWordLog(lang);
  const [to, setTo] = useState("");
  const [word, setWord] = useState("");
  const [wordMsg, setWordMsg] = useState<string | null>(null);

  const state = episodeState(episode);
  const first = episode.firstRecordingId ? items.find((it) => it.id === episode.firstRecordingId) : undefined;
  const tags = [`epic:${epic.id}`, `ep:${episode.id}`];
  const takeTitle = `${epic.title} · ${number}. ${episode.title}`.slice(0, 80);

  const addTelling = (recordingId?: string) => {
    const telling: Telling = { id: uid("tell"), to: to.trim().slice(0, 60), day: todayIso(), recordingId };
    onPatch((prev) => ({
      ...prev,
      tellings: [...prev.tellings, telling],
      firstRecordingId: prev.firstRecordingId && first ? prev.firstRecordingId : (recordingId ?? prev.firstRecordingId),
    }));
    setTo("");
  };

  const addWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    const added = wordLog.add(word, { phase: 5, context: `${epic.title} · ${episode.title}` });
    if (!added) {
      setWordMsg(t("stc_wlDup"));
      return;
    }
    onPatch((prev) => ({ ...prev, words: [...prev.words, added.text] }));
    setWord("");
    setWordMsg(null);
  };

  return (
    <li className="rounded-3xl border border-line bg-raised-2">
      <div className="flex items-stretch gap-1 pr-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/8 text-sm font-extrabold tabular-nums text-ink"
            aria-hidden
          >
            {number}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{episode.title}</span>
            <span className="block text-xs text-muted">
              {t(`st5_epState_${state}`)}
              {episode.tellings.length > 0 &&
                ` · ${t("st5_epToldTo").replace("{n}", String(listenersOf(episode) || episode.tellings.length))}`}
            </span>
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2.5}
            className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <span className="flex items-center">
          <RemoveButton onConfirm={onRemove} label={t("st5_epRemovePart")} />
        </span>
      </div>

      {open && (
        <div className="space-y-5 border-t border-line p-4 sm:p-5">
          <Field label={t("st5_epPlan")} hint={t("st5_epPlanHint")}>
            <DraftInput
              multiline
              value={episode.plan}
              label={t("st5_epPlan")}
              placeholder=""
              maxLength={600}
              onCommit={(plan) => onPatch((prev) => ({ ...prev, plan: plan.trim() }))}
            />
          </Field>

          {hostText(EPIC_OPEN.text, lang) && (
            <Disclosure title={t("st5_epRehearseTitle")}>
              <RehearsalAudience lang={lang} accent={accent} activityId={activityId} title={takeTitle} tags={tags} />
            </Disclosure>
          )}

          {/* tell it to a person */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">{t("st5_epTellTitle")}</p>
            <p className="text-sm leading-relaxed text-muted">{t("st5_epTellBody")}</p>
            <HostPhrases title={t("st5_sayIt")} lines={EPIC_ASK} lang={lang} />
            <Field label={t("st5_epListener")}>
              <input value={to} onChange={(e) => setTo(e.target.value)} maxLength={60} className={INPUT} />
            </Field>
            <RecordPanel
              lang={lang}
              phase={5}
              activityId={activityId}
              kind={first ? "retell" : "feedback"}
              defaultTitle={takeTitle}
              accent={accent}
              speaker="me"
              parentId={first?.id}
              tags={tags}
              showConsent
              label={t("st5_epRecTelling")}
              onSaved={(saved) => addTelling(saved.id)}
            />
            <button type="button" onClick={() => addTelling()} className={BTN_GHOST}>
              <Plus size={14} strokeWidth={2.5} aria-hidden /> {t("st5_epToldNoRec")}
            </button>

            {episode.tellings.length > 0 && (
              <ul className="space-y-1">
                {episode.tellings.map((x) => (
                  <li key={x.id} className="flex items-center gap-2 text-sm text-ink">
                    <span className="min-w-0 flex-1 break-words">
                      {x.to || t("st5_epSomeone")} <span className="text-xs tabular-nums text-muted">· {showDay(x.day)}</span>
                      {x.recordingId && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted">
                          <Mic size={11} strokeWidth={2.5} aria-hidden /> {t("st5_epRecorded")}
                        </span>
                      )}
                    </span>
                    <RemoveButton
                      label={t("st5_epRemoveTelling")}
                      onConfirm={() =>
                        onPatch((prev) => ({ ...prev, tellings: prev.tellings.filter((y) => y.id !== x.id) }))
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
            {state === "told" && <p className="text-xs leading-relaxed text-muted">{t("st5_epTellAgain")}</p>}
          </div>

          {/* what came back */}
          <Field label={t("st5_epReactions")} hint={t("st5_epReactionsHint")}>
            <DraftInput
              multiline
              value={episode.reactions}
              label={t("st5_epReactions")}
              placeholder=""
              maxLength={600}
              onCommit={(reactions) => onPatch((prev) => ({ ...prev, reactions: reactions.trim() }))}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st5_epWords")}</p>
            {episode.words.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {episode.words.map((w) => (
                  <span key={w} className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink">
                    {w}
                  </span>
                ))}
              </div>
            )}
            <form onSubmit={addWord} className="flex flex-wrap items-center gap-2">
              <input
                value={word}
                onChange={(e) => {
                  setWord(e.target.value);
                  setWordMsg(null);
                }}
                placeholder={t("stc_wlAddPlaceholder")}
                aria-label={t("stc_wlAddPlaceholder")}
                maxLength={80}
                className={`${INPUT} flex-1 basis-48`}
              />
              <button type="submit" className="pill min-h-10 bg-white/10 px-4 py-2 text-sm font-semibold text-ink">
                {t("stc_wlAdd")}
              </button>
              {wordMsg && <span className="text-xs text-amber">{wordMsg}</span>}
            </form>
          </div>

          {first && (
            <Disclosure title={t("st5_epTheirWay")}>
              <p className="text-sm leading-relaxed text-muted">{t("st5_epTheirWayBody")}</p>
              <RecordPanel
                lang={lang}
                phase={5}
                activityId={activityId}
                kind="improved"
                defaultTitle={`${t("st5_epTheirWayRecTitle")}: ${episode.title}`.slice(0, 80)}
                accent={accent}
                speaker="nurturer"
                parentId={first.id}
                tags={[...tags, TAG.mentorTelling]}
                showConsent
                label={t("st5_epTheirWayRec")}
              />
            </Disclosure>
          )}
        </div>
      )}
    </li>
  );
}
