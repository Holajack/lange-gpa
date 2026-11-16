"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { Callout, FinishBar, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import { COMMUNITY_MOVES, hasHostLines } from "./content";
import { addDays, showDay, todayIso, uid, weekStart } from "./storage";
import { accentBtn, ChoiceChips, Field, HostPhrases, INPUT, Meter, Panel, RemoveButton, Stat } from "./ui";
import { CommunityCard, MissedRow } from "./community/CommunityCard";
import {
  COMMUNITY_KINDS,
  openQuestions,
  SOCIAL_CAP,
  totalHours,
  useCommunityStore,
  type Community,
  type CommunityKind,
} from "./community/model";

const WEEKS_SHOWN = 8;

/**
 * p5-community — Join a Community of Practice.
 *
 * Nothing here happens in the app. It is a notebook for a life lived among
 * people: where the grower goes, what part they play, the hours, what went
 * over their head (questions to carry to a person), and who they now know.
 */
export function CommunityTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [store, setStore, ready] = useCommunityStore(lang);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CommunityKind>("club");
  const [hostRun, setHostRun] = useState(true);

  const mine = store.communities.filter((c) => c.lang === lang);
  const active = mine.find((c) => c.id === store.activeId) ?? null;
  const questions = openQuestions(store.communities, lang);

  const patch = (id: string, fn: (prev: Community) => Community) =>
    setStore((prev) => ({ ...prev, communities: prev.communities.map((c) => (c.id === id ? fn(c) : c)) }));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const next: Community = {
      id: uid("com"),
      lang,
      name: name.trim().slice(0, 80),
      kind,
      role: "",
      since: todayIso(),
      hostRun,
      belonging: "guest",
      hours: {},
      missed: [],
      people: [],
    };
    setStore((prev) => ({ communities: [...prev.communities, next], activeId: next.id }));
    setName("");
  };

  const steps: GuideStep[] = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    title: t(`st5_cmS${n}`),
    body: t(`st5_cmS${n}b`)
      .replace("{low}", String(SOCIAL_CAP[0]))
      .replace("{high}", String(SOCIAL_CAP[1])),
    who: n === 5 ? "both" : "you",
  }));

  // hours across every community, week by week
  const thisWeek = weekStart(todayIso());
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => addDays(thisWeek, -7 * (WEEKS_SHOWN - 1 - i)));
  const weekHours = (week: string) => mine.reduce((sum, c) => sum + (Number(c.hours[week]) || 0), 0);
  const allHours = Math.round(mine.reduce((sum, c) => sum + totalHours(c), 0) * 10) / 10;
  const peak = Math.max(1, ...weeks.map(weekHours));
  const people = mine.reduce((sum, c) => sum + c.people.length, 0);

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="🏘️" mode="nurturer" />
      <Callout icon="🚶" title={t("st5_cmOutsideTitle")} tone="warm">
        <p>{t("st5_cmOutsideBody")}</p>
      </Callout>
      {ready && <StepGuide steps={steps} accent={phase.color} defaultOpen={mine.length === 0} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={mine.length} label={t("st5_cmStatGroups")} />
        <Stat value={weekHours(thisWeek)} label={t("st5_cmHoursWeek")} />
        <Stat value={allHours} label={t("st5_cmHoursAll")} />
        <Stat value={people} label={t("st5_cmPeopleCount")} />
      </div>

      <Panel title={t("st5_cmGroupsTitle")} sub={t("st5_cmGroupsSub")}>
        <form onSubmit={add} className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4">
          <Field label={t("st5_cmName")}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className={INPUT} />
          </Field>
          <ChoiceChips
            label={t("st5_cmKind")}
            value={kind}
            onChange={setKind}
            options={COMMUNITY_KINDS.map((id) => ({ id, label: t(`st5_cmKind_${id}`) }))}
          />
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={hostRun}
              onChange={(e) => setHostRun(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-mint)]"
            />
            <span>{t("st5_cmHostRun")}</span>
          </label>
          <button type="submit" disabled={!name.trim()} {...accentBtn(phase.color)}>
            <Plus size={15} strokeWidth={3} aria-hidden /> {t("st5_cmAdd")}
          </button>
        </form>

        {mine.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {mine.map((c) => {
              const on = c.id === active?.id;
              return (
                <li key={c.id} className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => setStore((prev) => ({ ...prev, activeId: c.id }))}
                    aria-pressed={on}
                    className={`flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                      on ? "border-white/50 bg-white/10" : "border-line bg-raised-2 hover:bg-white/5"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {t(`st5_cmKind_${c.kind}`)} · {t(`st5_cmBelong_${c.belonging}`)}
                        {!c.hostRun ? ` · ${t("st5_cmNotHostRun")}` : ""}
                      </span>
                    </span>
                    {on && <Check size={16} strokeWidth={3} className="shrink-0 text-mint" aria-hidden />}
                  </button>
                  <RemoveButton
                    label={t("st5_cmRemove")}
                    onConfirm={() =>
                      setStore((prev) => ({
                        communities: prev.communities.filter((x) => x.id !== c.id),
                        activeId: prev.activeId === c.id ? null : prev.activeId,
                      }))
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {active && (
        <Panel title={active.name} sub={t(`st5_cmKind_${active.kind}`)}>
          <CommunityCard key={active.id} community={active} lang={lang} onPatch={(fn) => patch(active.id, fn)} />
        </Panel>
      )}

      {mine.length > 0 && (
        <Panel title={`${t("st5_cmAskTitle")} · ${questions.length}`} sub={t("st5_cmAskSub")}>
          {questions.length === 0 ? (
            <p className="text-sm text-muted">{t("st5_cmAskEmpty")}</p>
          ) : (
            <ul className="space-y-2">
              {questions.map(({ community, missed }) => (
                <li key={missed.id} className="list-none">
                  <p className="mb-1 text-xs text-muted">
                    {community.name} · {t("st5_cmWeekOf")} {showDay(missed.week)}
                  </p>
                  <ul>
                    <MissedRow
                      missed={missed}
                      context={community.name}
                      lang={lang}
                      onPatch={(change) =>
                        patch(community.id, (prev) => ({
                          ...prev,
                          missed: prev.missed.map((m) => (m.id === missed.id ? { ...m, ...change } : m)),
                        }))
                      }
                      onRemove={() =>
                        patch(community.id, (prev) => ({
                          ...prev,
                          missed: prev.missed.filter((m) => m.id !== missed.id),
                        }))
                      }
                    />
                  </ul>
                </li>
              ))}
            </ul>
          )}
          {hasHostLines(COMMUNITY_MOVES, lang) && (
            <HostPhrases title={t("st5_cmSay")} lines={COMMUNITY_MOVES} lang={lang} />
          )}
        </Panel>
      )}

      {mine.length > 0 && (
        <Panel title={t("st5_cmHoursTitle")} sub={t("st5_cmHoursSub")}>
          <ul className="space-y-2">
            {weeks.map((week) => (
              <li key={week} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 sm:grid-cols-[7rem_1fr_4rem]">
                <span className="text-xs tabular-nums text-muted">{showDay(week)}</span>
                <Meter
                  value={weekHours(week)}
                  max={peak}
                  accent={phase.color}
                  label={`${showDay(week)}: ${weekHours(week)} ${t("st5_unitH")}`}
                />
                <span className="text-right text-xs tabular-nums text-muted">
                  {weekHours(week)} {t("st5_unitH")}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-muted">
            {t("st5_cmCap").replace("{low}", String(SOCIAL_CAP[0])).replace("{high}", String(SOCIAL_CAP[1]))}
          </p>
        </Panel>
      )}

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
