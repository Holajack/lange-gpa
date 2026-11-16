"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode } from "@/lib/types";
import { useLibrary } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  ConfidentialBanner,
  FinishBar,
  NeedsPersonCallout,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { ChapterBench, type FollowUp } from "./Bench";
import {
  P4_CLARIFY_MOVES,
  P4_CONSENT_ASK,
  P4_RETELL_OPENER,
  P4_WALK_ANGLES,
  P4_WALK_FRAMING,
} from "./content";
import { ListsOfLife, type LifeList } from "./ListsOfLife";
import {
  ErasePerson,
  FallbackCard,
  INPUT,
  Panel,
  PersonChips,
  PhraseBook,
  RecordingPicker,
  SMALL_BTN,
  SayLines,
  Stat,
  personTag,
  recordingsOf,
  uid,
  useReturning,
  useSteps,
  useStudioState,
  type P4Person,
} from "./shared";

/**
 * p4-walkoflife — Walk-of-Life Conversations.
 * Present-day life in a role (a baker, a driver, a nurse), learned from the
 * person who lives it: plan who to talk to, ask about a typical day, record,
 * clear up, tour the details, fill a list of life. Nuri supplies ways to ask;
 * only the person supplies answers.
 */

interface WalkPerson extends P4Person {
  /** planned time of the conversation, as typed into the planner */
  when?: string;
  /** the grower is paying them fairly for their time */
  paid?: boolean;
  /** question angles already asked */
  asked?: string[];
}

interface WalkState {
  people: WalkPerson[];
  followUps: FollowUp[];
  lists: LifeList[];
  activeId: string | null;
}

const INITIAL: WalkState = { people: [], followUps: [], lists: [], activeId: null };

function AngleBank({
  lang,
  asked,
  onToggle,
  accent,
}: {
  lang: LangCode;
  asked: string[];
  onToggle: (id: string) => void;
  accent: string;
}) {
  const { t } = useApp();
  const [openId, setOpenId] = useState<string | null>(P4_WALK_ANGLES[0]?.id ?? null);
  return (
    <ul className="space-y-2">
      {P4_WALK_ANGLES.map((angle, i) => {
        const open = openId === angle.id;
        const done = asked.includes(angle.id);
        return (
          <li key={angle.id} className="rounded-2xl border border-line bg-raised-2">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : angle.id)}
              aria-expanded={open}
              className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {t(`st4_angle_${angle.id}`)}
                  {i === 0 && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${textOn(accent)}`}
                      style={{ background: accent }}
                    >
                      {t("st4_wl_startHere")}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {t(`st4_angle_${angle.id}_hint`)}
                </span>
              </span>
              {done && <span className="shrink-0 text-xs font-bold text-mint">✓ {t("st4_wl_asked")}</span>}
              <ChevronDown
                size={16}
                strokeWidth={2.5}
                className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {open && (
              <div className="space-y-3 px-4 pb-4">
                <SayLines lines={angle.lines} lang={lang} />
                <button type="button" onClick={() => onToggle(angle.id)} aria-pressed={done} className={SMALL_BTN}>
                  {t(done ? "st4_wl_askedUndo" : "st4_wl_markAsked")}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function WalkOfLifeTool({ activity, phase, lang }: StudioToolProps) {
  const { t, uiLang } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, setState, ready] = useStudioState<WalkState>(activity.id, INITIAL);
  const { all, ready: libReady } = useLibrary();
  const [talkId, setTalkId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ label: "", role: "", when: "" });
  const steps = useSteps("st4_wl_s", [
    "you",
    "both",
    "you",
    "nurturer",
    "both",
    "you",
    "nurturer",
    "both",
    "you",
    "you",
  ]);

  const people = state.people.filter((p) => p.lang === lang);
  const active = people.find((p) => p.id === state.activeId) ?? people[0] ?? null;
  const talks = active
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
  const talk = talks.find((c) => c.id === talkId) ?? null;
  const returning = useReturning(ready, people.length > 0);

  // the tracker: one row per walk of life, however many people speak for it
  const walks = useMemo(() => {
    const rows = new Map<string, { role: string; people: number; talks: number; minutes: number }>();
    for (const p of people) {
      const role = p.role?.trim() || "…";
      const key = role.toLocaleLowerCase();
      const recs = recordingsOf(all, p.id).filter((it) => it.speaker !== "me");
      const row = rows.get(key) ?? { role, people: 0, talks: 0, minutes: 0 };
      row.people += 1;
      row.talks += recs.filter((it) => !it.parentId).length;
      row.minutes += recs.reduce((sum, it) => sum + it.durationSec, 0) / 60;
      rows.set(key, row);
    }
    return [...rows.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, state.people, lang]);

  // notes about a conversation go when its recording goes
  useEffect(() => {
    if (!ready || !libReady || all.length === 0) return;
    const ids = new Set(all.map((it) => it.id));
    if (state.followUps.some((f) => !ids.has(f.sourceId))) {
      setState((s) => ({ ...s, followUps: s.followUps.filter((f) => ids.has(f.sourceId)) }));
    }
  }, [all, libReady, ready, setState, state.followUps]);

  const patchActive = (change: Partial<WalkPerson>) => {
    if (!active) return;
    setState((s) => ({ ...s, people: s.people.map((p) => (p.id === active.id ? { ...p, ...change } : p)) }));
  };

  const addPerson = () => {
    const label = draft.label.trim();
    const role = draft.role.trim();
    if (!label || !role) return;
    const person: WalkPerson = {
      id: uid("wl"),
      lang,
      label,
      role,
      when: draft.when || undefined,
      addedAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, people: [...s.people, person], activeId: person.id }));
    setDraft({ label: "", role: "", when: "" });
    setTalkId(null);
  };

  const whenText = (when?: string) => {
    if (!when) return t("st4_wl_noTime");
    const d = new Date(when);
    return Number.isNaN(d.getTime()) ? when : d.toLocaleString(uiLang, { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🧺" mode="nurturer" />
      <ConfidentialBanner />
      <NeedsPersonCallout>{t("st4_wl_needs")}</NeedsPersonCallout>
      <StepGuide
        key={returning ? "returning" : "first"}
        steps={steps}
        accent={phase.color}
        defaultOpen={!returning}
      />
      <PhraseBook
        lang={lang}
        groups={[
          { title: t("st4_phr_permission"), lines: P4_CONSENT_ASK },
          { title: t("st4_phr_framing"), lines: P4_WALK_FRAMING },
          { title: t("st4_phr_clarify"), lines: P4_CLARIFY_MOVES },
          { title: t("st4_phr_retell"), lines: P4_RETELL_OPENER },
        ]}
      />

      {/* planner */}
      <Panel title={t("st4_wl_planTitle")} sub={t("st4_wl_planSub")}>
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            addPerson();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st4_wl_who")}</span>
            <input
              value={draft.label}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              placeholder={t("st4_ls_addPlaceholder")}
              maxLength={40}
              className={`${INPUT} w-full`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st4_wl_role")}</span>
            <input
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
              placeholder={t("st4_wl_rolePlaceholder")}
              maxLength={40}
              className={`${INPUT} w-full`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st4_wl_when")}</span>
            <input
              type="datetime-local"
              value={draft.when}
              onChange={(e) => setDraft((d) => ({ ...d, when: e.target.value }))}
              className={`${INPUT} w-full min-w-0 max-w-full`}
              style={{ colorScheme: "dark" }}
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!draft.label.trim() || !draft.role.trim()}
              className={`pill min-h-11 w-full px-4 py-2 text-sm font-bold disabled:opacity-40 ${textOn(phase.color)}`}
              style={{ background: phase.color }}
            >
              {t("st4_wl_addPerson")}
            </button>
          </div>
        </form>
        <PersonChips
          people={people}
          activeId={active?.id ?? null}
          onSelect={(id) => {
            setState((s) => ({ ...s, activeId: id }));
            setTalkId(null);
          }}
          accent={phase.color}
          label={t("st4_wl_planTitle")}
        />
      </Panel>

      {/* tracker of walks of life covered */}
      <Panel title={t("st4_wl_trackTitle")} sub={t("st4_wl_trackSub")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat value={walks.filter((w) => w.talks > 0).length} label={t("st4_wl_statCovered")} />
          <Stat value={walks.filter((w) => w.talks === 0).length} label={t("st4_wl_statPlanned")} />
          <Stat value={Math.round(walks.reduce((sum, w) => sum + w.minutes, 0))} label={t("st4_wl_statMinutes")} />
        </div>
        {walks.length === 0 ? (
          <p className="text-sm text-muted">{t("st4_wl_trackEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {walks.map((w) => (
              <li
                key={w.role}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-raised-2 px-4 py-3"
              >
                <span className="min-w-0 break-words text-sm font-semibold text-ink">{w.role}</span>
                <span className="text-xs text-muted">
                  {w.talks > 0
                    ? t("st4_wl_rowTalked")
                        .replace("{people}", String(w.people))
                        .replace("{talks}", String(w.talks))
                        .replace("{min}", String(Math.round(w.minutes)))
                    : t("st4_wl_rowPlanned")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {active && (
        <>
          <Panel
            title={`${active.label} · ${active.role ?? ""}`}
            sub={whenText(active.when)}
            aside={
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={Boolean(active.paid)}
                  onChange={(e) => patchActive({ paid: e.target.checked })}
                  className="h-5 w-5 accent-[var(--color-mint)]"
                />
                {t("st4_wl_paid")}
              </label>
            }
          >
            <p className="text-sm leading-relaxed text-muted">{t("st4_wl_anglesIntro")}</p>
            <AngleBank
              lang={lang}
              asked={active.asked ?? []}
              onToggle={(id) => {
                const asked = active.asked ?? [];
                patchActive({ asked: asked.includes(id) ? asked.filter((a) => a !== id) : [...asked, id] });
              }}
              accent={phase.color}
            />
          </Panel>

          <Panel title={t("st4_wl_recordTitle")} sub={t("st4_wl_recordSub")}>
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
              defaultTitle={`${active.label} · ${active.role ?? ""} ${talks.length + 1}`.trim()}
              label={t("st4_wl_record")}
              onSaved={(item) => setTalkId(item.id)}
            />
            <RecordingPicker
              items={talks}
              selectedId={talk?.id ?? null}
              onSelect={setTalkId}
              emptyText={t("st4_wl_talksEmpty")}
            />
            {talk && (
              <ChapterBench
                key={talk.id}
                item={talk}
                person={active}
                activityId={activity.id}
                phaseId={phase.id}
                lang={lang}
                accent={phase.color}
                followUps={state.followUps}
                onFollowUps={(fn) => setState((s) => ({ ...s, followUps: fn(s.followUps) }))}
                onDeleted={() => setTalkId(null)}
              />
            )}
          </Panel>

          <Panel title={t("st4_wl_listsTitle")} sub={t("st4_wl_listsSub")}>
            <ListsOfLife
              personId={active.id}
              lists={state.lists}
              onLists={(fn) => setState((s) => ({ ...s, lists: fn(s.lists) }))}
              lang={lang}
              accent={phase.color}
            />
          </Panel>

          <ErasePerson
            person={active}
            onErased={() => {
              setState((s) => ({
                ...s,
                people: s.people.filter((p) => p.id !== active.id),
                followUps: s.followUps.filter((f) => f.personId !== active.id),
                lists: s.lists.filter((l) => l.personId !== active.id),
                activeId: null,
              }));
              setTalkId(null);
            }}
          />
        </>
      )}

      <FallbackCard />
      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
