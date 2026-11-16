"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { Callout, FinishBar, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import {
  COP_DOMAINS,
  COP_IDEA_COUNT,
  COP_INITIAL,
  DOMAIN_ICON,
  P6,
  fmtDay,
  localIso,
  newId,
  type CopCheck,
  type CopCircle,
  type CopLanguage,
  type CopState,
} from "./model";
import { useStudioStore } from "./store";
import { AccentButton, Chips, Field, Panel, RemoveButton, inputCls } from "./ui";

const LANGS: CopLanguage[] = ["home", "mixed", "host"];
const OUTCOMES: CopCheck["outcome"][] = ["done", "partly", "notyet"];
const LANG_MARK: Record<CopLanguage, string> = { home: "○", mixed: "◐", host: "●" };

/**
 * p6-cop — Make a Host Community of Practice.
 * A planner for the places the grower already belongs to: who is there, what
 * language the place runs in today, one concrete change that moves it toward
 * the host language, and a date to look again. The people are real; the app
 * only keeps the commitments.
 */
export function CopTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { state, update } = useStudioStore<CopState>(P6.cop, lang, COP_INITIAL);
  const [domain, setDomain] = useState<string>(COP_DOMAINS[0]);
  const [name, setName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const patch = (id: string, fn: (c: CopCircle) => CopCircle) =>
    update((s) => ({ ...s, circles: s.circles.map((c) => (c.id === id ? fn(c) : c)) }));

  const add = () => {
    const clean = name.trim().slice(0, 80);
    if (!clean) return;
    const circle: CopCircle = {
      id: newId("cop"),
      domain,
      name: clean,
      people: "",
      runsIn: "home",
      hostToHost: false,
      change: "",
      checkOn: "",
      checks: [],
      createdAt: localIso(),
    };
    update((s) => ({ ...s, circles: [circle, ...s.circles] }));
    setName("");
    setOpenId(circle.id);
  };

  const counts = LANGS.map((l) => ({ l, n: state.circles.filter((c) => c.runsIn === l).length }));

  const steps: GuideStep[] = [
    { title: t("st6_c_step1T"), body: t("st6_c_step1B"), who: "you" },
    { title: t("st6_c_step2T"), body: t("st6_c_step2B"), who: "you" },
    { title: t("st6_c_step3T"), body: t("st6_c_step3B"), who: "both" },
    { title: t("st6_c_step4T"), body: t("st6_c_step4B"), who: "both" },
    { title: t("st6_c_step5T"), body: t("st6_c_step5B"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🏘️" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />

      <Callout icon="🤝" title={t("st6_c_peopleTitle")} tone="warm">
        <p>{t("st6_c_peopleBody")}</p>
      </Callout>

      {/* ---- add a circle ---- */}
      <Panel title={t("st6_c_addTitle")} sub={t("st6_c_addSub")}>
        <Chips
          label={t("st6_c_domainLabel")}
          options={COP_DOMAINS.map((d) => ({ id: d, label: t(`st6_dom_${d}`), icon: DOMAIN_ICON[d] }))}
          value={[domain as (typeof COP_DOMAINS)[number]]}
          onToggle={(d) => setDomain(d)}
        />
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={t("st6_c_namePlaceholder")}
            aria-label={t("st6_c_nameLabel")}
            className={`${inputCls} flex-1 basis-56`}
          />
          <AccentButton accent={accent} type="submit" disabled={!name.trim()}>
            <Plus size={15} strokeWidth={3} /> {t("st6_c_add")}
          </AccentButton>
        </form>
      </Panel>

      {/* ---- the map of circles ---- */}
      <Panel title={t("st6_c_listTitle")} sub={t("st6_c_listSub")}>
        {state.circles.length === 0 ? (
          <p className="text-sm text-muted">{t("st6_c_empty")}</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {counts.map(({ l, n }) => `${LANG_MARK[l]} ${t(`st6_c_runs_${l}`)}: ${n}`).join("  ·  ")}
            </p>
            <ul className="space-y-3">
              {state.circles.map((c) => (
                <CircleCard
                  key={c.id}
                  circle={c}
                  accent={accent}
                  open={openId === c.id}
                  onToggle={() => setOpenId(openId === c.id ? null : c.id)}
                  onPatch={(fn) => patch(c.id, fn)}
                  onRemove={() => update((s) => ({ ...s, circles: s.circles.filter((x) => x.id !== c.id) }))}
                />
              ))}
            </ul>
          </>
        )}
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}

function CircleCard({
  circle,
  accent,
  open,
  onToggle,
  onPatch,
  onRemove,
}: {
  circle: CopCircle;
  accent: string;
  open: boolean;
  onToggle: () => void;
  onPatch: (fn: (c: CopCircle) => CopCircle) => void;
  onRemove: () => void;
}) {
  const { t, uiLang } = useApp();
  const [outcome, setOutcome] = useState<CopCheck["outcome"] | null>(null);
  const [note, setNote] = useState("");
  const today = localIso();
  const due = Boolean(circle.checkOn) && circle.checkOn <= today;
  const ideas = Array.from({ length: COP_IDEA_COUNT[circle.domain] ?? 0 }, (_, i) =>
    t(`st6_c_idea_${circle.domain}${i + 1}`)
  );

  const saveCheck = () => {
    if (!outcome) return;
    onPatch((c) => ({
      ...c,
      checks: [{ at: today, outcome, note: note.trim().slice(0, 240) }, ...c.checks],
      checkOn: "",
    }));
    setOutcome(null);
    setNote("");
  };

  return (
    <li className="rounded-3xl border border-line bg-raised-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-xl" aria-hidden>
          {DOMAIN_ICON[circle.domain] ?? "👥"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{circle.name}</span>
          <span className="block text-xs text-muted">
            {t(`st6_dom_${circle.domain}`)} · {LANG_MARK[circle.runsIn]} {t(`st6_c_runs_${circle.runsIn}`)}
          </span>
        </span>
        {due && (
          <span className="shrink-0 rounded-full bg-amber/20 px-2.5 py-1 text-xs font-bold text-amber">
            {t("st6_c_dueBadge")}
          </span>
        )}
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-line px-4 pb-4 pt-4">
          {due && (
            <div className="space-y-3 rounded-2xl border border-amber/40 bg-raised p-4">
              <p className="text-sm font-semibold text-ink">{t("st6_c_checkTitle")}</p>
              {circle.change && <p className="text-sm text-muted">{circle.change}</p>}
              <Chips
                label={t("st6_c_checkTitle")}
                options={OUTCOMES.map((o) => ({ id: o, label: t(`st6_c_out_${o}`) }))}
                value={outcome ? [outcome] : []}
                onToggle={(o) => setOutcome(o)}
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={240}
                placeholder={t("st6_c_checkNote")}
                aria-label={t("st6_c_checkNote")}
                className={inputCls}
              />
              <AccentButton accent={accent} onClick={saveCheck} disabled={!outcome}>
                {t("st6_c_checkSave")}
              </AccentButton>
            </div>
          )}

          <Field label={t("st6_c_peopleLabel")} hint={t("st6_c_peopleHint")}>
            <input
              value={circle.people}
              onChange={(e) => onPatch((c) => ({ ...c, people: e.target.value.slice(0, 200) }))}
              placeholder={t("st6_c_peoplePlaceholder")}
              className={inputCls}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st6_c_runsLabel")}</p>
            <Chips
              label={t("st6_c_runsLabel")}
              options={LANGS.map((l) => ({ id: l, label: `${LANG_MARK[l]} ${t(`st6_c_runs_${l}`)}` }))}
              value={[circle.runsIn]}
              onToggle={(l) => onPatch((c) => ({ ...c, runsIn: l }))}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st6_c_h2hLabel")}</p>
            <Chips
              label={t("st6_c_h2hLabel")}
              options={[
                { id: "yes", label: t("st6_c_h2hYes") },
                { id: "no", label: t("st6_c_h2hNo") },
              ]}
              value={[circle.hostToHost ? "yes" : "no"]}
              onToggle={(v) => onPatch((c) => ({ ...c, hostToHost: v === "yes" }))}
            />
          </div>

          <Field label={t("st6_c_changeLabel")} hint={t("st6_c_changeHint")}>
            <textarea
              value={circle.change}
              onChange={(e) => onPatch((c) => ({ ...c, change: e.target.value.slice(0, 280) }))}
              rows={2}
              placeholder={t("st6_c_changePlaceholder")}
              className={inputCls}
            />
          </Field>
          {ideas.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">{t("st6_c_ideasLabel")}</p>
              <ul className="space-y-2">
                {ideas.map((idea) => (
                  <li key={idea}>
                    <button
                      type="button"
                      onClick={() => onPatch((c) => ({ ...c, change: idea }))}
                      className="min-h-10 w-full rounded-2xl border border-dashed border-white/20 bg-white/4 px-4 py-2.5 text-left text-sm leading-relaxed text-muted hover:text-ink"
                    >
                      {idea}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Field label={t("st6_c_checkOnLabel")} hint={t("st6_c_checkOnHint")}>
            <input
              type="date"
              value={circle.checkOn}
              min={today}
              onChange={(e) => onPatch((c) => ({ ...c, checkOn: e.target.value }))}
              className={`${inputCls} max-w-56`}
            />
          </Field>

          {circle.checks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">{t("st6_c_checksTitle")}</p>
              <ul className="space-y-2">
                {circle.checks.map((ck, i) => (
                  <li key={`${ck.at}-${i}`} className="rounded-2xl border border-line bg-raised px-4 py-2.5 text-sm">
                    <span className="text-xs text-muted">{fmtDay(ck.at, uiLang)}</span>{" "}
                    <span className="font-semibold text-ink">{t(`st6_c_out_${ck.outcome}`)}</span>
                    {ck.note && <span className="block text-muted">{ck.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <RemoveButton label={t("st6_remove")} onConfirm={onRemove} />
          </div>
        </div>
      )}
    </li>
  );
}
