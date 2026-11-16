"use client";

import { Fragment, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { FinishBar, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import {
  BLOCK_HOURS,
  DAY_PARTS,
  DOMAIN_ICON,
  EMPTY_WEEK,
  HOURS_INITIAL,
  LIFE_DOMAINS,
  P6,
  WAKING_HOURS,
  dayName,
  fmtWeek,
  hostShare,
  newId,
  shiftWeek,
  weekHostHours,
  weekStart,
  type HoursClaim,
  type HoursState,
  type HoursWeek,
} from "./model";
import { useStudioStore } from "./store";
import { Chips, Field, MeterBar, Panel, inputCls } from "./ui";
import { WeeklySummaryCard } from "./WeeklySummary";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const PART_ICON = ["🌅", "☀️", "🌇", "🌙"] as const;
const KEPT = ["yes", "partly", "no"] as const;

/**
 * p6-hours — Claim Your Host Hours.
 * The Phase 6 "session plan" is the week itself: of roughly 100 waking
 * hours, how many were truly lived in the host world, in the host language?
 * A mirror, kept week over week. Nothing here is a target or a streak.
 */
export function HoursTool({ activity, phase, lang }: StudioToolProps) {
  const { t, uiLang } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { state, update } = useStudioStore<HoursState>(P6.hours, lang, HOURS_INITIAL);

  const thisWeek = weekStart();
  const nextWeek = shiftWeek(thisWeek, 1);
  const [week, setWeek] = useState(thisWeek);
  const data = state.weeks[week] ?? EMPTY_WEEK;
  const total = weekHostHours(data);
  const before = state.weeks[shiftWeek(week, -1)];

  const patchWeek = (fn: (w: HoursWeek) => HoursWeek) =>
    update((s) => ({ ...s, weeks: { ...s.weeks, [week]: fn(s.weeks[week] ?? EMPTY_WEEK) } }));

  const cycle = (day: number, part: number) =>
    patchWeek((w) => {
      const key = `${day}-${part}`;
      return { ...w, cells: { ...w.cells, [key]: ((w.cells[key] ?? 0) + 1) % (BLOCK_HOURS + 1) } };
    });

  const blockLabel = (day: number, part: number) =>
    `${dayName(day, uiLang, "long")}, ${t(`st6_h_part_${DAY_PARTS[part] ?? DAY_PARTS[0]}`)}`;

  /* ---- the one block to claim ---- */
  const due = state.claims.filter((c) => c.forWeek === thisWeek && c.what.trim());
  const draft = state.claims.find((c) => c.forWeek === nextWeek);
  const past = state.claims
    .filter((c) => c.forWeek < thisWeek && c.what.trim())
    .sort((a, b) => b.forWeek.localeCompare(a.forWeek))
    .slice(0, 6);

  const patchDraft = (patch: Partial<HoursClaim>) =>
    update((s) => {
      const existing = s.claims.find((c) => c.forWeek === nextWeek);
      if (existing) {
        return { ...s, claims: s.claims.map((c) => (c.id === existing.id ? { ...c, ...patch } : c)) };
      }
      const fresh: HoursClaim = { id: newId("cl"), forWeek: nextWeek, day: 0, part: 3, what: "", ...patch };
      return { ...s, claims: [...s.claims, fresh] };
    });

  const setKept = (id: string, kept: HoursClaim["kept"]) =>
    update((s) => ({ ...s, claims: s.claims.map((c) => (c.id === id ? { ...c, kept } : c)) }));

  const history = Object.entries(state.weeks)
    .map(([iso, w]) => ({ iso, hours: weekHostHours(w) }))
    .filter((w) => w.hours > 0 || w.iso === thisWeek)
    .sort((a, b) => b.iso.localeCompare(a.iso))
    .slice(0, 12);

  const steps: GuideStep[] = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: t(`st6_h_step${n}T`),
    body: t(`st6_h_step${n}B`),
    who: "you",
  }));

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🕰️" mode="solo" />
      <StepGuide steps={steps} accent={accent} />

      {/* ---- the week grid ---- */}
      <Panel
        title={t("st6_h_gridTitle")}
        sub={t("st6_h_gridSub")}
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeek(shiftWeek(week, -1))}
              aria-label={t("st6_h_prevWeek")}
              className="pill h-10 w-10 justify-center border border-line bg-white/6 p-0 text-ink"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <span className="min-w-[7.5rem] text-center text-xs font-semibold text-ink">
              {fmtWeek(week, uiLang)}
              {week === thisWeek && <span className="block text-muted">{t("st6_h_thisWeek")}</span>}
            </span>
            <button
              type="button"
              onClick={() => setWeek(shiftWeek(week, 1))}
              disabled={week >= thisWeek}
              aria-label={t("st6_h_nextWeek")}
              className="pill h-10 w-10 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-30"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        }
      >
        <div
          role="group"
          aria-label={t("st6_h_gridTitle")}
          className="grid grid-cols-[2.75rem_repeat(4,minmax(0,1fr))] gap-1.5"
        >
          <span />
          {DAY_PARTS.map((p, i) => (
            <span key={p} className="break-words px-0.5 text-center text-[10px] font-semibold leading-tight text-muted">
              <span className="block text-base" aria-hidden>
                {PART_ICON[i]}
              </span>
              {t(`st6_h_part_${p}`)}
            </span>
          ))}
          {DAYS.map((d) => (
            <Fragment key={d}>
              <span className="flex items-center text-xs font-semibold text-muted">{dayName(d, uiLang)}</span>
              {DAY_PARTS.map((p, pi) => {
                const n = data.cells[`${d}-${pi}`] ?? 0;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => cycle(d, pi)}
                    aria-label={`${blockLabel(d, pi)}: ${t("st6_h_cellHours").replace("{n}", String(n))}`}
                    className={`flex min-h-11 items-center justify-center rounded-xl border text-sm font-bold tabular-nums ${
                      n === 0 ? "border-line bg-white/4 text-muted/60" : n >= 3 ? "border-transparent text-canvas" : "border-transparent text-ink"
                    }`}
                    style={n > 0 ? { background: `color-mix(in srgb, ${accent} ${n * 22}%, transparent)` } : undefined}
                  >
                    {n > 0 ? n : "·"}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted">{t("st6_h_gridHint")}</p>
      </Panel>

      {/* ---- the mirror ---- */}
      <Panel title={t("st6_h_mirrorTitle")}>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <p className="font-display text-5xl font-extrabold tabular-nums text-ink">{total}</p>
          <div className="pb-1.5">
            <p className="text-sm font-semibold text-ink">{t("st6_h_hoursLived")}</p>
            <p className="text-sm text-muted">{t("st6_h_share").replace("{n}", String(hostShare(total)))}</p>
          </div>
        </div>
        <MeterBar
          value={total}
          max={WAKING_HOURS}
          accent={accent}
          marks={[
            { at: 10, label: "10" },
            { at: 20, label: "20" },
          ]}
          label={t("st6_h_meterLabel").replace("{n}", String(total))}
        />
        <p className="text-xs leading-relaxed text-muted">{t("st6_h_yardstick")}</p>
        {before && (
          <p className="text-sm text-muted">
            {t("st6_h_weekBefore").replace("{n}", String(weekHostHours(before)))}
          </p>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold text-muted">{t("st6_h_domainsLabel")}</p>
          <Chips
            label={t("st6_h_domainsLabel")}
            options={LIFE_DOMAINS.map((d) => ({ id: d, label: t(`st6_dom_${d}`), icon: DOMAIN_ICON[d] }))}
            value={data.domains as (typeof LIFE_DOMAINS)[number][]}
            onToggle={(d) =>
              patchWeek((w) => ({
                ...w,
                domains: w.domains.includes(d) ? w.domains.filter((x) => x !== d) : [...w.domains, d],
              }))
            }
          />
        </div>
        <Field label={t("st6_h_noteLabel")}>
          <textarea
            value={data.note}
            onChange={(e) => patchWeek((w) => ({ ...w, note: e.target.value.slice(0, 400) }))}
            rows={2}
            placeholder={t("st6_h_notePlaceholder")}
            className={inputCls}
          />
        </Field>
      </Panel>

      {/* ---- one block to claim ---- */}
      <Panel title={t("st6_h_claimTitle")} sub={t("st6_h_claimSub")}>
        {due.map((c) => (
          <div key={c.id} className="rounded-2xl border border-amber/40 bg-raised-2 p-4">
            <p className="text-xs font-semibold text-muted">{t("st6_h_claimDue")}</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {blockLabel(c.day, c.part)} · {c.what}
            </p>
            <p className="mb-2 mt-3 text-xs font-semibold text-muted">{t("st6_h_claimAsk")}</p>
            <Chips
              label={t("st6_h_claimAsk")}
              options={KEPT.map((k) => ({ id: k, label: t(`st6_h_kept_${k}`) }))}
              value={c.kept ? [c.kept] : []}
              onToggle={(k) => setKept(c.id, c.kept === k ? undefined : k)}
            />
          </div>
        ))}

        <div className="space-y-3 rounded-2xl border border-line bg-raised-2 p-4">
          <p className="text-sm font-semibold text-ink">
            {t("st6_h_claimNext")} · <span className="text-muted">{fmtWeek(nextWeek, uiLang)}</span>
          </p>
          <Chips
            label={t("st6_h_claimDay")}
            options={DAYS.map((d) => ({ id: String(d), label: dayName(d, uiLang) }))}
            value={draft ? [String(draft.day)] : []}
            onToggle={(d) => patchDraft({ day: Number(d) })}
          />
          <Chips
            label={t("st6_h_claimPart")}
            options={DAY_PARTS.map((p, i) => ({ id: String(i), label: t(`st6_h_part_${p}`), icon: PART_ICON[i] }))}
            value={draft ? [String(draft.part)] : []}
            onToggle={(p) => patchDraft({ part: Number(p) })}
          />
          <Field label={t("st6_h_claimWhat")} hint={t("st6_h_claimHint")}>
            <input
              value={draft?.what ?? ""}
              onChange={(e) => patchDraft({ what: e.target.value.slice(0, 160) })}
              placeholder={t("st6_h_claimPlaceholder")}
              className={inputCls}
            />
          </Field>
        </div>

        {past.length > 0 && (
          <details>
            <summary className="cursor-pointer text-xs font-semibold text-muted">{t("st6_h_claimPast")}</summary>
            <ul className="mt-2 space-y-2">
              {past.map((c) => (
                <li key={c.id} className="rounded-2xl border border-line bg-raised-2 px-4 py-3 text-sm">
                  <span className="block text-xs text-muted">{fmtWeek(c.forWeek, uiLang)}</span>
                  <span className="block text-ink">
                    {blockLabel(c.day, c.part)} · {c.what}
                  </span>
                  <span className="block text-xs text-muted">
                    {c.kept ? t(`st6_h_kept_${c.kept}`) : t("st6_h_keptUnmarked")}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Panel>

      {/* ---- week over week ---- */}
      <Panel title={t("st6_h_historyTitle")} sub={t("st6_h_historySub")}>
        {history.length === 0 ? (
          <p className="text-sm text-muted">{t("st6_h_historyEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {history.map((w) => (
              <li key={w.iso}>
                <button
                  type="button"
                  onClick={() => setWeek(w.iso)}
                  aria-pressed={w.iso === week}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left ${
                    w.iso === week ? "border-white/35 bg-raised-2" : "border-line bg-raised hover:bg-raised-2"
                  }`}
                >
                  <span className="w-28 shrink-0 text-xs font-semibold text-muted">{fmtWeek(w.iso, uiLang)}</span>
                  <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8" aria-hidden>
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${hostShare(w.hours)}%`, background: accent }}
                    />
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
                    {t("st6_h_historyRow").replace("{n}", String(w.hours)).replace("{p}", String(hostShare(w.hours)))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <WeeklySummaryCard lang={lang} here={P6.hours} />

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
