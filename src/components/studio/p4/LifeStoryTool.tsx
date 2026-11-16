"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { useLibrary, type LibraryItem } from "@/lib/library";
import { useWordLog, type WordEntry } from "@/lib/wordLog";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  ConfidentialBanner,
  FinishBar,
  NeedsPersonCallout,
  StepGuide,
  StudioHeader,
  useStudioTimer,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { ChapterBench, type FollowUp } from "./Bench";
import {
  P4_CLARIFY_MOVES,
  P4_CONSENT_ASK,
  P4_EXPAND_MOVES,
  P4_LIFE_OPENER,
  P4_RETELL_OPENER,
} from "./content";
import {
  AddLine,
  ErasePerson,
  FallbackCard,
  Panel,
  PersonChips,
  PhraseBook,
  RecordingPicker,
  SUB,
  SayLines,
  Stat,
  hostLines,
  personTag,
  recordingsOf,
  uid,
  useReturning,
  useSteps,
  useStudioState,
  type P4Person,
} from "./shared";

/**
 * p4-lifestory — The Life Story Activity.
 * One question, then the storyteller's own track: record a telling, clear up
 * the gaps, turn what they mentioned into follow-up questions, record the
 * answers under it, tell it back. Nuri has no part in the content: it never
 * tells, summarizes or explains anyone's life.
 */

interface LifeState {
  people: P4Person[];
  followUps: FollowUp[];
  activeId: string | null;
  /** ISO date the grower started their one-to-two-week try of this phase */
  tryStartedAt?: string;
}

const INITIAL: LifeState = { people: [], followUps: [], activeId: null };

function statsFor(person: P4Person, all: LibraryItem[], words: WordEntry[]) {
  const theirs = recordingsOf(all, person.id);
  const ids = new Set(theirs.map((it) => it.id));
  const hours = (person.sessionSec ?? 0) / 3600;
  const newWords = words.filter((w) => w.sourceId && ids.has(w.sourceId)).length;
  return {
    chapters: theirs.filter((it) => !it.parentId && (it.kind === "primary" || it.kind === "imported")).length,
    minutes: Math.round(
      theirs.filter((it) => it.speaker !== "me").reduce((sum, it) => sum + it.durationSec, 0) / 60
    ),
    openGaps: theirs.reduce((n, it) => n + it.marks.filter((m) => !m.resolved).length, 0),
    expansions: theirs.filter((it) => it.kind === "expansion").length,
    /** the guide's pacing signal: new words per hour of session time with this person */
    pace: hours >= 0.25 ? Math.round((newWords / hours) * 10) / 10 : null,
  };
}

export function LifeStoryTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, setState, ready] = useStudioState<LifeState>(activity.id, INITIAL);
  const { all, ready: libReady } = useLibrary();
  const { words } = useWordLog(lang);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const steps = useSteps("st4_ls_s", ["both", "you", "nurturer", "you", "both", "you", "you", "nurturer", "you", "you"]);

  const people = state.people.filter((p) => p.lang === lang);
  const active = people.find((p) => p.id === state.activeId) ?? people[0] ?? null;
  const chapters = active
    ? all
        .filter(
          (it) =>
            it.activityId === activity.id &&
            !it.parentId &&
            (it.kind === "primary" || it.kind === "imported") &&
            it.tags?.includes(personTag(active.id))
        )
        .reverse()
    : [];
  const chapter = chapters.find((c) => c.id === chapterId) ?? null;
  const stats = active ? statsFor(active, all, words) : null;
  const hasOpener = hostLines(P4_LIFE_OPENER, lang).length > 0;
  const returning = useReturning(ready, people.length > 0);

  // a follow-up question is a note about someone's life: it goes when its recording goes
  useEffect(() => {
    if (!ready || !libReady || all.length === 0) return;
    const ids = new Set(all.map((it) => it.id));
    if (state.followUps.some((f) => !ids.has(f.sourceId))) {
      setState((s) => ({ ...s, followUps: s.followUps.filter((f) => ids.has(f.sourceId)) }));
    }
  }, [all, libReady, ready, setState, state.followUps]);

  const addPerson = (label: string) => {
    const person: P4Person = { id: uid("st"), lang, label, addedAt: new Date().toISOString() };
    setState((s) => ({ ...s, people: [...s.people, person], activeId: person.id }));
    setChapterId(null);
  };

  // logging the session also credits its time to the storyteller, for the words-per-hour signal
  const sessionTimer = {
    ...timer,
    finish: (w?: number | string[]) => {
      const secs = timer.seconds;
      if (active) {
        setState((s) => ({
          ...s,
          people: s.people.map((p) =>
            p.id === active.id ? { ...p, sessionSec: (p.sessionSec ?? 0) + secs } : p
          ),
        }));
      }
      timer.finish(w);
    },
  };

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="📖" mode="nurturer" />
      <ConfidentialBanner />
      <NeedsPersonCallout>{t("st4_ls_needs")}</NeedsPersonCallout>

      <StepGuide
        key={returning ? "returning" : "first"}
        steps={steps}
        accent={phase.color}
        defaultOpen={!returning}
      />

      <Callout icon="🧭" title={t("st4_rulesTitle")}>
        <ol className="list-decimal space-y-1 pl-5">
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>{t(`st4_rule${n}`)}</li>
          ))}
        </ol>
      </Callout>

      <PhraseBook
        lang={lang}
        groups={[
          { title: t("st4_phr_permission"), lines: P4_CONSENT_ASK },
          { title: t("st4_phr_opener"), lines: P4_LIFE_OPENER },
          { title: t("st4_phr_clarify"), lines: P4_CLARIFY_MOVES },
          { title: t("st4_phr_expand"), lines: P4_EXPAND_MOVES },
          { title: t("st4_phr_retell"), lines: P4_RETELL_OPENER },
        ]}
      />

      {/* storytellers */}
      <Panel title={t("st4_ls_peopleTitle")} sub={t("st4_ls_peopleSub")}>
        <PersonChips
          people={people}
          activeId={active?.id ?? null}
          onSelect={(id) => {
            setState((s) => ({ ...s, activeId: id }));
            setChapterId(null);
          }}
          accent={phase.color}
          label={t("st4_ls_peopleTitle")}
        />
        <AddLine
          placeholder={t("st4_ls_addPlaceholder")}
          button={t("st4_ls_add")}
          onAdd={addPerson}
          accent={phase.color}
          maxLength={40}
        />
        {active && stats && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">{t("st4_ls_progress").replace("{name}", active.label)}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Stat value={stats.chapters} label={t("st4_ls_statChapters")} />
              <Stat value={stats.minutes} label={t("st4_ls_statMinutes")} />
              <Stat value={stats.openGaps} label={t("st4_ls_statGaps")} />
              <Stat value={stats.expansions} label={t("st4_ls_statExpansions")} />
              <Stat value={stats.pace ?? "–"} label={t("st4_ls_statPace")} />
            </div>
            <p className="text-xs leading-relaxed text-muted">
              {t(stats.pace === null ? "st4_ls_paceNone" : stats.pace >= 8 ? "st4_paceGood" : "st4_paceLow")}{" "}
              {stats.pace !== null && stats.pace < 8 && (
                <Link href="/studio/p4-holes" className="font-semibold text-ink underline underline-offset-4">
                  {t("st4_paceHolesCta")} →
                </Link>
              )}
            </p>
          </div>
        )}
      </Panel>

      {active && (
        <>
          {/* step 1–3: the one question, and the telling */}
          <Panel title={t("st4_ls_tellTitle")} sub={t("st4_ls_tellSub")}>
            {hasOpener ? (
              <div className={SUB}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: phase.color }}>
                  {t("st4_ls_oneQuestion")}
                </p>
                <SayLines lines={P4_LIFE_OPENER} lang={lang} />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted">{t("st4_ls_oneQuestionPlain")}</p>
            )}
            <RecordPanel
              lang={lang}
              phase={phase.id}
              activityId={activity.id}
              kind="primary"
              speaker="native"
              confidential
              showConsent
              allowImport
              tags={[personTag(active.id)]}
              accent={phase.color}
              defaultTitle={`${active.label} · ${t("st4_chapter")} ${chapters.length + 1}`}
              label={t("st4_ls_record")}
              onSaved={(item) => setChapterId(item.id)}
            />
            <p className="text-xs leading-relaxed text-muted">{t("st4_ls_noRecording")}</p>
          </Panel>

          {/* steps 4–10: one chapter at a time */}
          <Panel title={t("st4_ls_chaptersTitle")} sub={t("st4_ls_chaptersSub")}>
            <RecordingPicker
              items={chapters}
              selectedId={chapter?.id ?? null}
              onSelect={setChapterId}
              emptyText={t("st4_ls_chaptersEmpty")}
            />
            {chapter && (
              <ChapterBench
                key={chapter.id}
                item={chapter}
                person={active}
                activityId={activity.id}
                phaseId={phase.id}
                lang={lang}
                accent={phase.color}
                followUps={state.followUps}
                onFollowUps={(fn) => setState((s) => ({ ...s, followUps: fn(s.followUps) }))}
                onDeleted={() => setChapterId(null)}
              />
            )}
          </Panel>

          <Callout icon="🫶" title={t("st4_ls_yourTurnTitle")}>
            <p>{t("st4_ls_yourTurnBody")}</p>
            <Link
              href="/studio/p4-feedback"
              className="mt-2 inline-block text-sm font-semibold text-ink underline underline-offset-4"
            >
              {t("st4_ls_yourTurnCta")} →
            </Link>
          </Callout>

          <ErasePerson
            person={active}
            onErased={() => {
              setState((s) => ({
                ...s,
                people: s.people.filter((p) => p.id !== active.id),
                followUps: s.followUps.filter((f) => f.personId !== active.id),
                activeId: null,
              }));
              setChapterId(null);
            }}
          />
        </>
      )}

      <FallbackCard
        tryStartedAt={state.tryStartedAt}
        onStartTry={() => setState((s) => ({ ...s, tryStartedAt: new Date().toISOString() }))}
        onEndTry={() => setState((s) => ({ ...s, tryStartedAt: undefined }))}
      />

      <FinishBar timer={sessionTimer} accent={phase.color} />
    </div>
  );
}
