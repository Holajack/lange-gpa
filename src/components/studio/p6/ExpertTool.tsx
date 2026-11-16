"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { useWordLog } from "@/lib/wordLog";
import type { LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  ConfidentialBanner,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { hostMoves } from "./content";
import { EXPERT_INITIAL, P6, newId, type ExpertState, type ExpertTopic } from "./model";
import { Postcards } from "./Postcards";
import { TaggedRecordingList, TakesUnder } from "./Recordings";
import { useStudioStore } from "./store";
import { AccentButton, Field, Panel, RemoveButton, inputCls } from "./ui";
import { PeoplePlan, QuestionBank } from "./expert/ExpertPlan";
import { TopicSessions } from "./expert/ExpertSessions";

/**
 * p6-expert — Expert Interviewing / learning a subject through the language.
 *
 * One topic at a time, kept over many sittings: who knows it, a question
 * bank in the host language, recorded conversations (with consent, and
 * confidential where they turn personal), the clarify loop, the field's
 * vocabulary, and a ledger of hours. The experts are real people; nothing
 * here stands in for them.
 */
export function ExpertTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { state, update } = useStudioStore<ExpertState>(P6.expert, lang, EXPERT_INITIAL);
  const wordLog = useWordLog(lang);
  const moves = hostMoves("interview", lang);
  const feedbackMoves = hostMoves("feedback", lang);

  const [name, setName] = useState("");
  const [confidential, setConfidential] = useState(false);
  const [word, setWord] = useState("");

  const topic = state.topics.find((tp) => tp.id === state.activeId) ?? null;
  const topicTag = topic ? `topic:${topic.id}` : "";

  const patchTopic = (id: string, fn: (topic: ExpertTopic) => ExpertTopic) =>
    update((s) => ({ ...s, topics: s.topics.map((tp) => (tp.id === id ? fn(tp) : tp)) }));

  const addTopic = () => {
    const clean = name.trim().slice(0, 80);
    if (!clean) return;
    const fresh: ExpertTopic = {
      id: newId("top"),
      name: clean,
      why: "",
      people: [],
      questions: [],
      vocab: [],
      sessions: [],
      postcards: [],
      startedAt: new Date().toISOString(),
    };
    update((s) => ({ topics: [...s.topics, fresh], activeId: fresh.id }));
    setName("");
  };

  const addWord = () => {
    const clean = word.trim().slice(0, 80);
    if (!clean || !topic) return;
    if (!topic.vocab.includes(clean)) patchTopic(topic.id, (tp) => ({ ...tp, vocab: [...tp.vocab, clean] }));
    wordLog.add(clean, { context: topic.name, phase: phase.id }); // deduped in the Word Log
    setWord("");
  };

  const retellUnder = (item: LibraryItem) => (
    <div className="space-y-3 rounded-2xl border border-line bg-raised p-4">
      <p className="text-sm font-semibold text-ink">{t("st6_e_retellTitle")}</p>
      <p className="text-sm leading-relaxed text-muted">{t("st6_e_retellBody")}</p>
      <RecordPanel
        lang={lang}
        phase={phase.id}
        activityId={activity.id}
        kind="retell"
        speaker="me"
        parentId={item.id}
        confidential={item.confidential}
        tags={item.tags}
        defaultTitle={`${item.title} · ${t("st6_e_retellName")}`.slice(0, 80)}
        accent={accent}
        label={t("st6_e_retellRecord")}
      />
      <TakesUnder parent={item} accent={accent} title={t("st6_e_retellList")} moves={feedbackMoves} />
    </div>
  );

  const steps: GuideStep[] = [
    { title: t("st6_e_step1T"), body: t("st6_e_step1B"), who: "you" },
    { title: t("st6_e_step2T"), body: t("st6_e_step2B"), who: "you" },
    { title: t("st6_e_step3T"), body: t("st6_e_step3B"), who: "both" },
    { title: t("st6_e_step4T"), body: t("st6_e_step4B"), who: "both" },
    { title: t("st6_e_step5T"), body: t("st6_e_step5B"), who: "nurturer" },
    { title: t("st6_e_step6T"), body: t("st6_e_step6B"), who: "both" },
    { title: t("st6_e_step7T"), body: t("st6_e_step7B"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🎓" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st6_e_personBody")}</NeedsPersonCallout>

      {/* ---- which subject ---- */}
      <Panel title={t("st6_e_pickTitle")} sub={t("st6_e_pickSub")}>
        {state.topics.length > 0 && (
          <div role="group" aria-label={t("st6_e_pickTitle")} className="flex flex-wrap gap-2">
            {state.topics.map((tp) => {
              const on = tp.id === state.activeId;
              return (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => update((s) => ({ ...s, activeId: tp.id }))}
                  aria-pressed={on}
                  className={`pill min-h-10 max-w-full border px-3.5 py-2 text-xs font-semibold ${
                    on ? "border-white/45 bg-white/15 text-ink" : "border-line bg-white/5 text-muted hover:text-ink"
                  }`}
                >
                  <span aria-hidden>{on ? "●" : "○"}</span>
                  <span className="truncate">{tp.name}</span>
                </button>
              );
            })}
          </div>
        )}
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTopic();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={t("st6_e_topicPlaceholder")}
            aria-label={t("st6_e_topicLabel")}
            className={`${inputCls} flex-1 basis-56`}
          />
          <AccentButton accent={accent} type="submit" disabled={!name.trim()}>
            <Plus size={15} strokeWidth={3} /> {t("st6_e_topicAdd")}
          </AccentButton>
        </form>
        {topic && (
          <Field label={t("st6_e_whyLabel")}>
            <textarea
              value={topic.why}
              onChange={(e) => patchTopic(topic.id, (tp) => ({ ...tp, why: e.target.value.slice(0, 400) }))}
              rows={2}
              placeholder={t("st6_e_whyPlaceholder")}
              className={inputCls}
            />
          </Field>
        )}
      </Panel>

      <Callout icon="🚪" title={t("st6_e_waysTitle")}>
        <p>{t("st6_e_waysBody")}</p>
      </Callout>

      {topic && (
        <>
          <PeoplePlan topic={topic} accent={accent} onPatch={(fn) => patchTopic(topic.id, fn)} />
          <QuestionBank topic={topic} lang={lang} accent={accent} onPatch={(fn) => patchTopic(topic.id, fn)} />

          {/* ---- record, then go back through it ---- */}
          <Panel title={t("st6_e_recordTitle")} sub={t("st6_e_recordSub")}>
            <label className="flex min-h-10 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-3">
              <input
                type="checkbox"
                checked={confidential}
                onChange={(e) => setConfidential(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-mint)]"
              />
              <span className="text-sm leading-relaxed text-ink">
                {t("st6_e_confToggle")}
                <span className="block text-xs text-muted">{t("st6_e_confHint")}</span>
              </span>
            </label>
            {confidential && <ConfidentialBanner />}
            <RecordPanel
              lang={lang}
              phase={phase.id}
              activityId={activity.id}
              kind="primary"
              speaker="native"
              confidential={confidential || undefined}
              tags={[topicTag]}
              defaultTitle={`${topic.name} · ${t("st6_e_recName")}`.slice(0, 80)}
              accent={accent}
              allowImport
              showConsent
              label={t("st6_e_recLabel")}
            />
            <TaggedRecordingList
              filter={{ activityId: activity.id, lang, kind: ["primary", "imported"] }}
              tags={[topicTag]}
              accent={accent}
              moves={moves}
              title={t("st6_e_recList")}
              emptyText={t("st6_e_recEmpty")}
              renderExtra={retellUnder}
            />
          </Panel>

          {/* ---- the field's words ---- */}
          <Panel title={t("st6_e_vocabTitle")} sub={t("st6_e_vocabSub")}>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addWord();
              }}
            >
              <input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                maxLength={80}
                lang={lang}
                placeholder={t("st6_e_vocabPlaceholder")}
                aria-label={t("st6_e_vocabTitle")}
                className={`${inputCls} flex-1 basis-48`}
              />
              <AccentButton accent={accent} type="submit" disabled={!word.trim()}>
                <Plus size={15} strokeWidth={3} /> {t("st6_e_vocabAdd")}
              </AccentButton>
            </form>
            {topic.vocab.length === 0 ? (
              <p className="text-sm text-muted">{t("st6_e_vocabEmpty")}</p>
            ) : (
              <>
                <p className="text-xs font-semibold text-muted">
                  {t("st6_e_vocabCount").replace("{n}", String(topic.vocab.length))}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {topic.vocab.map((w) => (
                    <li
                      key={w}
                      lang={lang}
                      className="flex items-center gap-1 rounded-full border border-line bg-white/6 py-1 pl-3 pr-1 text-sm text-ink"
                    >
                      {w}
                      <button
                        type="button"
                        onClick={() => patchTopic(topic.id, (tp) => ({ ...tp, vocab: tp.vocab.filter((x) => x !== w) }))}
                        aria-label={`${t("st6_remove")}: ${w}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-coral"
                      >
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <TopicSessions topic={topic} accent={accent} onPatch={(fn) => patchTopic(topic.id, fn)} />

          <Postcards
            cards={topic.postcards}
            onChange={(next) => patchTopic(topic.id, (tp) => ({ ...tp, postcards: next }))}
            accent={accent}
            sub={t("st6_e_postcardsSub")}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs leading-relaxed text-muted">{t("st6_e_removeNote")}</p>
            <RemoveButton
              label={t("st6_e_removeTopic")}
              onConfirm={() =>
                update((s) => {
                  const topics = s.topics.filter((tp) => tp.id !== topic.id);
                  return { topics, activeId: topics[0]?.id ?? null };
                })
              }
            />
          </div>
        </>
      )}

      <RecordingList
        filter={{ activityId: activity.id, lang }}
        accent={accent}
        moves={moves}
        title={t("st6_e_allRecordings")}
        emptyText={t("st6_e_noRecordings")}
      />

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
