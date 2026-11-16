"use client";

import { useState } from "react";
import { Check, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { deleteRecording } from "@/lib/library";
import type { StudioToolProps } from "../types";
import {
  ConfidentialBanner,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import { RecordPanel } from "../RecordPanel";
import { hostLines, TALK_STARTERS } from "./content";
import { dayKey, newId, SayChip, Section, StepBadge, useStored } from "./kit";

type About = "them" | "me";

interface Fact {
  id: string;
  lang: LangCode;
  /** the day it was learned, yyyy-mm-dd */
  day: string;
  about: About;
  /** in the host language, the way it was heard or said */
  text: string;
  /** optional voice note in the Listening Library */
  recId?: string;
  /** times it has come up again since */
  revisits: number;
  lastRevisit?: string;
}

interface TalkState {
  facts: Fact[];
  /** days on which small talk happened, yyyy-mm-dd */
  talked: string[];
}

const INITIAL: TalkState = { facts: [], talked: [] };

/**
 * p2-smalltalk — Small Talk + One New Fact, the ritual that opens every
 * meeting. Today's card (talk a few minutes, learn one thing, give one back),
 * a running list of what you know about each other, and one older fact
 * surfaced to bring back up. Counts what you know — never streaks.
 */
export function SmallTalkTool({ activity, phase, lang }: StudioToolProps) {
  const { t, uiLang } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, update] = useStored<TalkState>(activity.id, lang, INITIAL);
  const [skipped, setSkipped] = useState<string[]>([]);
  const accent = phase.color;
  const today = dayKey();

  const facts = state.facts.filter((f) => f.lang === lang);
  const todays = (about: About) => facts.filter((f) => f.day === today && f.about === about);
  const talkedToday = state.talked.includes(today);
  const starters = hostLines(TALK_STARTERS, lang);

  // the fact about them that has gone longest without coming up
  const stale = facts
    .filter((f) => f.about === "them" && f.day < today && f.lastRevisit !== today && !skipped.includes(f.id))
    .sort((a, b) => (a.lastRevisit ?? a.day).localeCompare(b.lastRevisit ?? b.day))[0];

  const addFact = (about: About, text: string) =>
    update((s) => ({
      ...s,
      facts: [...s.facts, { id: newId("f"), lang, day: today, about, text, revisits: 0 }],
    }));
  const patchFact = (id: string, patch: Partial<Fact>) =>
    update((s) => ({ ...s, facts: s.facts.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  // erasing a fact erases its voice note with it
  const removeFact = (id: string) => {
    const recId = state.facts.find((f) => f.id === id)?.recId;
    if (recId) void deleteRecording(recId);
    update((s) => ({ ...s, facts: s.facts.filter((f) => f.id !== id) }));
  };

  const dateLabel = (day: string) =>
    day === today
      ? t("st2_today")
      : new Date(`${day}T12:00:00`).toLocaleDateString(uiLang, { month: "short", day: "numeric" });

  const steps: GuideStep[] = [
    { title: t("st2_stS1"), body: t("st2_stS1b"), who: "both" },
    { title: t("st2_stS2"), body: t("st2_stS2b"), who: "you" },
    { title: t("st2_stS3"), body: t("st2_stS3b"), who: "you" },
    { title: t("st2_stS4"), body: t("st2_stS4b"), who: "you" },
    { title: t("st2_stS5"), body: t("st2_stS5b"), who: "both" },
  ];

  const newestAboutThem = todays("them")[todays("them").length - 1];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="☕" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st2_stNeeds")}</NeedsPersonCallout>

      {/* ---- today's card ---- */}
      <Section
        title={t("st2_stTalkTitle")}
        sub={t("st2_stTalkSub")}
        badge={<StepBadge n={1} accent={accent} done={talkedToday} />}
      >
        {starters && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted">{t("st2_stStarters")}</p>
            <div className="flex flex-wrap gap-2">
              {starters.map((line, i) => (
                <SayChip
                  key={line}
                  text={line}
                  lang={lang}
                  mode="reveal"
                  hiddenLabel={t("st2_stStarterN").replace("{n}", String(i + 1))}
                />
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          aria-pressed={talkedToday}
          onClick={() =>
            update((s) => ({
              ...s,
              talked: talkedToday ? s.talked.filter((d) => d !== today) : [...s.talked, today],
            }))
          }
          className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${
            talkedToday ? textOn(accent) : "border border-line bg-white/6 text-ink"
          }`}
          style={talkedToday ? { background: accent } : undefined}
        >
          <Check size={15} strokeWidth={3} /> {talkedToday ? t("st2_stTalked") : t("st2_stTalkMark")}
        </button>
      </Section>

      <Section
        title={t("st2_stThemTitle")}
        sub={t("st2_stThemSub")}
        badge={<StepBadge n={2} accent={accent} done={todays("them").length > 0} />}
      >
        <FactForm lang={lang} accent={accent} placeholder={t("st2_stThemPlaceholder")} onAdd={(text) => addFact("them", text)} />
        <FactList
          facts={todays("them")}
          lang={lang}
          dateLabel={dateLabel}
          onRemove={removeFact}
          revisitLabel={t("st2_stCameUp")}
          removeLabel={t("st2_stRemove")}
        />
        {newestAboutThem && !newestAboutThem.recId && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted">{t("st2_stVoiceTitle")}</p>
            <RecordPanel
              lang={lang}
              phase={2}
              activityId={activity.id}
              kind="journal"
              speaker="both"
              accent={accent}
              confidential
              defaultTitle={newestAboutThem.text.slice(0, 60)}
              tags={["fact", today]}
              label={t("st2_stVoiceRecord")}
              showConsent
              onSaved={(item) => patchFact(newestAboutThem.id, { recId: item.id })}
            />
          </div>
        )}
      </Section>

      <Section
        title={t("st2_stMeTitle")}
        sub={t("st2_stMeSub")}
        badge={<StepBadge n={3} accent={accent} done={todays("me").length > 0} />}
      >
        <FactForm lang={lang} accent={accent} placeholder={t("st2_stMePlaceholder")} onAdd={(text) => addFact("me", text)} />
        <FactList
          facts={todays("me")}
          lang={lang}
          dateLabel={dateLabel}
          onRemove={removeFact}
          revisitLabel={t("st2_stCameUp")}
          removeLabel={t("st2_stRemove")}
        />
      </Section>

      {/* ---- bring one back ---- */}
      {stale && (
        <Section title={t("st2_stBackTitle")} sub={t("st2_stBackSub")}>
          <blockquote
            lang={lang}
            className="rounded-2xl border border-line bg-raised-2 px-4 py-3 text-base font-medium leading-relaxed text-ink"
          >
            {stale.text}
            <footer className="mt-1 text-xs font-normal text-muted">{dateLabel(stale.day)}</footer>
          </blockquote>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => patchFact(stale.id, { revisits: stale.revisits + 1, lastRevisit: today })}
              className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${textOn(accent)}`}
              style={{ background: accent }}
            >
              <Check size={15} strokeWidth={3} /> {t("st2_stBackDone")}
            </button>
            <button
              type="button"
              onClick={() => setSkipped((ids) => [...ids, stale.id])}
              className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink"
            >
              <RefreshCw size={14} strokeWidth={2.5} /> {t("st2_stBackOther")}
            </button>
          </div>
        </Section>
      )}

      {/* ---- everything so far ---- */}
      <Section
        title={t("st2_stKnowTitle")}
        sub={t("st2_stKnowSub")
          .replace("{them}", String(facts.filter((f) => f.about === "them").length))
          .replace("{me}", String(facts.filter((f) => f.about === "me").length))}
      >
        <ConfidentialBanner />
        {facts.length === 0 && <p className="text-sm text-muted">{t("st2_stKnowEmpty")}</p>}
        <div className="grid gap-5 md:grid-cols-2">
          {(["them", "me"] as const).map((about) => {
            const list = facts.filter((f) => f.about === about).sort((a, b) => b.day.localeCompare(a.day));
            if (list.length === 0) return null;
            return (
              <div key={about} className="space-y-2">
                <h3 className="text-sm font-semibold text-ink">
                  {about === "them" ? t("st2_stAboutThem") : t("st2_stAboutMe")}
                </h3>
                <FactList
                  facts={list}
                  lang={lang}
                  dateLabel={dateLabel}
                  onRemove={removeFact}
                  revisitLabel={t("st2_stCameUp")}
                  removeLabel={t("st2_stRemove")}
                />
              </div>
            );
          })}
        </div>
      </Section>

      <RecordingList
        filter={{ activityId: activity.id, lang }}
        accent={accent}
        title={t("st2_stVoiceList")}
        emptyText={t("st2_stVoiceEmpty")}
      />
      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}

function FactForm({
  lang,
  accent,
  placeholder,
  onAdd,
}: {
  lang: LangCode;
  accent: string;
  placeholder: string;
  onAdd: (text: string) => void;
}) {
  const { t } = useApp();
  const [text, setText] = useState("");
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(ev) => {
        ev.preventDefault();
        const clean = text.trim().slice(0, 200);
        if (!clean) return;
        onAdd(clean);
        setText("");
      }}
    >
      <input
        value={text}
        onChange={(ev) => setText(ev.target.value)}
        maxLength={200}
        lang={lang}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 rounded-2xl border border-line bg-canvas px-4 py-3 text-base text-ink outline-none focus:border-white/30"
      />
      <button
        type="submit"
        className="pill min-h-11 px-4 py-2.5 text-sm font-bold text-canvas"
        style={{ background: accent }}
      >
        <Plus size={15} strokeWidth={3} /> {t("st2_stSave")}
      </button>
    </form>
  );
}

function FactList({
  facts,
  lang,
  dateLabel,
  onRemove,
  revisitLabel,
  removeLabel,
}: {
  facts: Fact[];
  lang: LangCode;
  dateLabel: (day: string) => string;
  onRemove: (id: string) => void;
  revisitLabel: string;
  removeLabel: string;
}) {
  if (facts.length === 0) return null;
  return (
    <ul className="space-y-2">
      {facts.map((f) => (
        <li key={f.id} className="flex items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p lang={lang} className="break-words text-sm font-medium leading-relaxed text-ink">
              {f.text}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {dateLabel(f.day)}
              {f.revisits > 0 && ` · ${revisitLabel.replace("{n}", String(f.revisits))}`}
              {f.recId && " · 🎙️"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            aria-label={removeLabel}
            className="pill h-9 w-9 shrink-0 justify-center bg-white/5 p-0 text-muted hover:text-coral"
          >
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </li>
      ))}
    </ul>
  );
}
