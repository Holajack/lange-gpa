"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown, Plus, Target } from "lucide-react";
import { useApp } from "@/lib/store";
import { Callout, FinishBar, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import {
  BANK_ICON,
  NEEDS_BANK,
  NEEDS_INITIAL,
  P6,
  bankLabel,
  fmtDay,
  localIso,
  needScore,
  newId,
  type NeedsState,
  type Situation,
} from "./model";
import { useStudioStore } from "./store";
import { AccentButton, GhostButton, Panel, RangeRow, RemoveButton, inputCls } from "./ui";

/** "3 + 5 − 1 = 7" — the guide's sum, shown rather than hidden. */
const sumLine = (s: Situation) => `${s.freq} + ${s.imp} − ${s.skill} = ${needScore(s)}`;

/**
 * p6-needs — Needs Analysis.
 * List the kinds of talk a life demands, rate each one three ways, and let
 * the guide's sum (how often + how much it matters − how well it already
 * goes) show where deliberate work pays. The grower confirms ONE current
 * target; the discourse pipeline (p6-rare) picks it up from here.
 */
export function NeedsTool({ activity, phase, lang }: StudioToolProps) {
  const { t, uiLang } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { state, update } = useStudioStore<NeedsState>(P6.needs, lang, NEEDS_INITIAL);
  const [custom, setCustom] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const used = new Set(state.situations.map((s) => s.seed).filter(Boolean));
  const bankLeft = NEEDS_BANK.filter((id) => !used.has(id));

  const addSituation = (name: string, seed?: string) => {
    const situation: Situation = { id: newId("need"), name, seed, freq: 2, imp: 3, skill: 3 };
    update((s) => ({ ...s, situations: [...s.situations, situation] }));
    setOpenId(situation.id);
  };

  const patch = (id: string, change: Partial<Situation>) =>
    update((s) => ({ ...s, situations: s.situations.map((x) => (x.id === id ? { ...x, ...change } : x)) }));

  const remove = (id: string) =>
    update((s) => ({
      ...s,
      situations: s.situations.filter((x) => x.id !== id),
      targetId: s.targetId === id ? null : s.targetId,
    }));

  const confirm = (id: string) => update((s) => ({ ...s, targetId: id, confirmedAt: localIso() }));

  const ranked = [...state.situations].sort((a, b) => needScore(b) - needScore(a) || b.imp - a.imp);
  const target = state.situations.find((s) => s.id === state.targetId) ?? null;

  const steps: GuideStep[] = [
    { title: t("st6_n_step1T"), body: t("st6_n_step1B"), who: "both" },
    { title: t("st6_n_step2T"), body: t("st6_n_step2B"), who: "you" },
    { title: t("st6_n_step3T"), body: t("st6_n_step3B"), who: "you" },
    { title: t("st6_n_step4T"), body: t("st6_n_step4B"), who: "you" },
    { title: t("st6_n_step5T"), body: t("st6_n_step5B"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🧭" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      <Callout icon="🚕" title={t("st6_n_whyTitle")}>
        <p>{t("st6_n_whyBody")}</p>
      </Callout>

      {/* ---- the list ---- */}
      <Panel title={t("st6_n_listTitle")} sub={t("st6_n_listSub")}>
        {bankLeft.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st6_n_bankLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {bankLeft.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => addSituation("", id)}
                  className="pill min-h-10 border border-dashed border-white/20 bg-white/4 px-3.5 py-2 text-xs font-semibold text-muted hover:text-ink"
                >
                  <span aria-hidden>{BANK_ICON[id]}</span> {t(`st6_bank_${id}`)}
                  <Plus size={12} strokeWidth={3} aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const clean = custom.trim().slice(0, 80);
            if (!clean) return;
            addSituation(clean);
            setCustom("");
          }}
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={80}
            placeholder={t("st6_n_customPlaceholder")}
            aria-label={t("st6_n_customLabel")}
            className={`${inputCls} flex-1 basis-56`}
          />
          <AccentButton accent={accent} type="submit" disabled={!custom.trim()}>
            <Plus size={15} strokeWidth={3} /> {t("st6_n_add")}
          </AccentButton>
        </form>

        {state.situations.length === 0 ? (
          <p className="text-sm text-muted">{t("st6_n_empty")}</p>
        ) : (
          <ul className="space-y-3">
            {state.situations.map((s) => {
              const open = openId === s.id;
              return (
                <li key={s.id} className="rounded-3xl border border-line bg-raised-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : s.id)}
                    aria-expanded={open}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="text-xl" aria-hidden>
                      {s.seed ? BANK_ICON[s.seed] : "💬"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{bankLabel(s, t)}</span>
                      <span className="block text-xs tabular-nums text-muted">{sumLine(s)}</span>
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <div className="space-y-4 border-t border-line px-4 pb-4 pt-4">
                      <RangeRow
                        label={t("st6_n_freqLabel")}
                        value={s.freq}
                        min={0}
                        max={5}
                        onChange={(n) => patch(s.id, { freq: n })}
                        accent={accent}
                        low={t("st6_n_freqLow")}
                        high={t("st6_n_freqHigh")}
                      />
                      <RangeRow
                        label={t("st6_n_impLabel")}
                        value={s.imp}
                        min={0}
                        max={5}
                        onChange={(n) => patch(s.id, { imp: n })}
                        accent={accent}
                        low={t("st6_n_impLow")}
                        high={t("st6_n_impHigh")}
                      />
                      <RangeRow
                        label={t("st6_n_skillLabel")}
                        value={s.skill}
                        min={0}
                        max={10}
                        onChange={(n) => patch(s.id, { skill: n })}
                        accent={accent}
                        low={t("st6_n_skillLow")}
                        high={t("st6_n_skillHigh")}
                        prefix="−"
                      />
                      <div className="flex justify-end">
                        <RemoveButton label={t("st6_remove")} onConfirm={() => remove(s.id)} />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* ---- the ranking ---- */}
      <Panel title={t("st6_n_rankTitle")} sub={t("st6_n_rankSub")}>
        {ranked.length === 0 ? (
          <p className="text-sm text-muted">{t("st6_n_rankEmpty")}</p>
        ) : (
          <ol className="space-y-2">
            {ranked.map((s, i) => {
              const score = needScore(s);
              const isTarget = s.id === state.targetId;
              return (
                <li
                  key={s.id}
                  className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 ${
                    isTarget ? "border-white/40 bg-raised-2" : "border-line bg-raised"
                  }`}
                >
                  <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 basis-40">
                    <span className="block truncate text-sm font-semibold text-ink">{bankLabel(s, t)}</span>
                    <span className="block text-xs tabular-nums text-muted">
                      {sumLine(s)}
                      {score <= 0 && ` · ${t("st6_n_lifeTrains")}`}
                    </span>
                  </span>
                  {isTarget ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-ink">
                      <Target size={13} strokeWidth={2.5} aria-hidden /> {t("st6_n_isTarget")}
                    </span>
                  ) : (
                    <GhostButton onClick={() => confirm(s.id)} className="text-xs">
                      {t("st6_n_makeTarget")}
                    </GhostButton>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <p className="text-xs leading-relaxed text-muted">{t("st6_n_rankNote")}</p>
      </Panel>

      {/* ---- the confirmed target ---- */}
      {target && (
        <section className="card p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
            {t("st6_n_targetKicker")}
          </p>
          <h2 className="headline mt-1 text-2xl">{bankLabel(target, t)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {state.confirmedAt && `${t("st6_n_targetSince").replace("{d}", fmtDay(state.confirmedAt, uiLang))} `}
            {t("st6_n_targetBody")}
          </p>
          <Link
            href={`/studio/${P6.rare}`}
            className="pill mt-4 inline-flex min-h-10 bg-white/10 px-5 py-2.5 text-sm font-bold text-ink"
          >
            {t("st6_n_openPipeline")} <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </section>
      )}

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
