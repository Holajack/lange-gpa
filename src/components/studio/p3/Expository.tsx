"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLibrary } from "@/lib/library";
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
import { EXPOSITORY_ASKS } from "./content";
import { newId, useHeard, useStudioState } from "./hooks";
import { MassageStatus, MovesBar, Panel, PhraseBank, Segmented, toPhrases, usePlayerMoves } from "./shared";

/**
 * p3-expository — Familiar Topics (3C). The step past stories: a host person
 * EXPLAINS something, with no pictures and no plot to lean on. It stays
 * understandable because the grower already knows the subject well: their
 * own work, a film both have seen, news both follow. Record, massage,
 * re-listen, and come back to the same topic later. Nuri explains nothing.
 */

type TopicKind = "topic" | "film" | "book" | "news" | "talk";
const KINDS: TopicKind[] = ["topic", "film", "book", "news", "talk"];

interface Topic {
  id: string;
  title: string;
  kind: TopicKind;
  /** the first recording; later ones thread under it as updates */
  rootId?: string;
  /** the grower has brought it up with someone other than the nurturer */
  raised?: boolean;
}

interface ExpoState {
  kind: TopicKind;
  topics: Topic[];
}
const EMPTY: ExpoState = { kind: "topic", topics: [] };

const field =
  "w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30";

export function Expository({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<ExpoState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const { all } = useLibrary();
  const asks = useMemo(() => toPhrases(EXPOSITORY_ASKS, lang, t), [lang, t]);

  const [title, setTitle] = useState("");
  const [mine, setMine] = useState(false);
  const [same, setSame] = useState(false);
  const kind = state.kind;
  /** "what people are talking about" is new ground by nature, so it has no shared-knowledge check */
  const needsChecks = kind !== "talk";
  const canAdd = Boolean(title.trim()) && (!needsChecks || (mine && same));

  const add = () => {
    if (!canAdd) return;
    const topic: Topic = { id: newId("tp"), title: title.trim().slice(0, 100), kind };
    setState((s) => ({ ...s, topics: [topic, ...s.topics] }));
    setTitle("");
    setMine(false);
    setSame(false);
  };
  const patch = (id: string, p: Partial<Topic>) =>
    setState((s) => ({ ...s, topics: s.topics.map((x) => (x.id === id ? { ...x, ...p } : x)) }));

  const steps: GuideStep[] = [
    { title: t("st3_exS1"), body: t("st3_exS1b"), who: "you" },
    { title: t("st3_exS2"), body: t("st3_exS2b"), who: "both" },
    { title: t("st3_exS3"), body: t("st3_exS3b"), who: "nurturer" },
    { title: t("st3_exS4"), body: t("st3_exS4b"), who: "both" },
    { title: t("st3_exS5"), body: t("st3_exS5b"), who: "you" },
    { title: t("st3_exS6"), body: t("st3_exS6b"), who: "both" },
    { title: t("st3_exS7"), body: t("st3_exS7b"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🧠" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st3_exNeeds")}</NeedsPersonCallout>

      <Panel step={1} title={t("st3_exP1")} sub={t("st3_exP1b")} accent={accent}>
        <Segmented
          label={t("st3_exKindLabel")}
          value={kind}
          onChange={(k) => setState((s) => ({ ...s, kind: k }))}
          options={KINDS.map((id) => ({ id, label: t(`st3_exKind_${id}`) }))}
        />
        <p className="text-sm leading-relaxed text-muted">{t(`st3_exKindHint_${kind}`)}</p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_exTitleLabel")}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder={t("st3_exTitlePlaceholder")}
              className={field}
            />
          </label>
          {needsChecks && (
            <div className="space-y-1">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={mine}
                  onChange={(e) => setMine(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
                />
                {t("st3_exCheckMine")}
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={same}
                  onChange={(e) => setSame(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
                />
                {t("st3_exCheckSame")}
              </label>
              {title.trim() && !(mine && same) && (
                <p className="text-xs leading-relaxed text-muted">{t("st3_exNotShared")}</p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={!canAdd}
            className={`pill min-h-11 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
            style={{ background: accent }}
          >
            <Plus size={14} strokeWidth={3} aria-hidden /> {t("st3_exAdd")}
          </button>
        </form>
        <PhraseBank title={t("st3_exAskTitle")} phrases={asks} lang={lang} heard={heard} onHeard={markHeard} />
      </Panel>

      <Panel step={2} title={t("st3_exP2")} sub={t("st3_exP2b")} accent={accent}>
        {state.topics.length === 0 && <p className="text-sm text-muted">{t("st3_exEmpty")}</p>}
        <ul className="space-y-3">
          {state.topics.map((topic) => {
            const tag = `topic:${topic.id}`;
            const recs = all.filter((it) => it.tags?.includes(tag));
            const root = topic.rootId ? all.find((it) => it.id === topic.rootId) : undefined;
            return (
              <li key={topic.id} className="space-y-3 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-ink">{topic.title}</p>
                    <p className="text-xs text-muted">
                      {t(`st3_exKind_${topic.kind}`)} · {t("st3_exRecCount").replace("{n}", String(recs.length))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setState((s) => ({ ...s, topics: s.topics.filter((x) => x.id !== topic.id) }))}
                    aria-label={`${t("st3_exRemove")}: ${topic.title}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-muted hover:text-coral"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </div>

                {root && <p className="text-xs leading-relaxed text-muted">{t("st3_exUpdateHint")}</p>}
                <RecordPanel
                  lang={lang}
                  phase={phase.id}
                  activityId={activity.id}
                  kind={root ? "expansion" : "primary"}
                  speaker="nurturer"
                  parentId={root?.id}
                  defaultTitle={(root ? `${topic.title} · ${t("st3_exUpdateName")}` : topic.title).slice(0, 80)}
                  accent={accent}
                  tags={["expository", topic.kind, tag]}
                  allowImport
                  showConsent
                  label={t(root ? "st3_exRecordUpdate" : "st3_exRecord")}
                  onSaved={(item) => {
                    if (!root) patch(topic.id, { rootId: item.id });
                  }}
                />

                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(topic.raised)}
                    onChange={(e) => patch(topic.id, { raised: e.target.checked })}
                    className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
                  />
                  {t("st3_exRaised")}
                </label>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel step={3} title={t("st3_exP3")} sub={t("st3_exP3b")} accent={accent}>
        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
        <RecordingList
          filter={{ activityId: activity.id, lang }}
          accent={accent}
          moves={playerMoves}
          emptyText={t("st3_exNoRecordings")}
          renderExtra={(it) => <MassageStatus item={it} lang={lang} accent={accent} />}
        />
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
