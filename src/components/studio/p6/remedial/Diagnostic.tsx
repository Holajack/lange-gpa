"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useWordLog } from "@/lib/wordLog";
import {
  DIAG_QUESTIONS,
  HOURS_INITIAL,
  P6,
  diagRoute,
  fmtDay,
  fmtWeek,
  hearsALot,
  inWeek,
  localIso,
  newId,
  shiftWeek,
  understandsMost,
  weekHostHours,
  weekStart,
  type DiagQuestion,
  type DiagRoute,
  type Diagnostic as DiagnosticEntry,
  type HoursState,
  type RemedialState,
} from "../model";
import { useStudioStore } from "../store";
import { AccentButton, Panel, RemoveButton } from "../ui";

const OPTIONS = [0, 1, 2] as const;

/** Where each route sends the grower. `#…` targets are sections of this same tool. */
const ROUTE_LINKS: Record<DiagRoute, { href: string; key: string }[]> = {
  understanding: [
    { href: "#p6-pickup", key: "pickup" },
    { href: "/studio/p5-library", key: "p5library" },
    { href: "/studio/p4-holes", key: "p4holes" },
    { href: "/library", key: "library" },
    { href: "/practice", key: "practice" },
    { href: `/studio/${P6.rare}`, key: "rare" },
  ],
  lifestyle: [
    { href: `/studio/${P6.hours}`, key: "hours" },
    { href: `/studio/${P6.cop}`, key: "cop" },
  ],
  coasting: [
    { href: "#p6-holes", key: "holes" },
    { href: `/studio/${P6.read}`, key: "read" },
    { href: `/studio/${P6.needs}`, key: "needs" },
  ],
  onroad: [
    { href: "#p6-holes", key: "holes" },
    { href: `/studio/${P6.read}`, key: "read" },
  ],
};

/**
 * The un-6 diagnostic: a handful of reflective checks, saved over time so
 * drift is visible. It does not produce a score. It applies the guide's own
 * fork: do you understand most of what is said around you, and are you
 * actually around it? Each answer to that fork has a different remedy.
 */
export function Diagnostic({
  lang,
  accent,
  state,
  update,
}: {
  lang: LangCode;
  accent: string;
  state: RemedialState;
  update: (fn: (prev: RemedialState) => RemedialState) => void;
}) {
  const { t, uiLang } = useApp();
  const hours = useStudioStore<HoursState>(P6.hours, lang, HOURS_INITIAL).state;
  const { words } = useWordLog(lang);
  const week = weekStart();
  const lastWeek = shiftWeek(week, -1);
  // Judge exposure by a whole week, not a half-lived one: the last full week
  // until the weekend, then the week that is ending.
  const weekend = (new Date().getDay() + 6) % 7 >= 5;
  const auditWeek = (weekend ? [week, lastWeek] : [lastWeek, week]).find((w) => hours.weeks[w]) ?? null;
  const hostHours = auditWeek ? weekHostHours(hours.weeks[auditWeek]) : null;
  const wordsWeek = words.filter((w) => inWeek(w.addedAt, week)).length;

  const [answers, setAnswers] = useState<Partial<Record<DiagQuestion, number>>>({});
  const complete = DIAG_QUESTIONS.every((q) => answers[q] !== undefined);
  const latest = state.diagnostics[0];
  const drift = state.diagnostics.slice(0, 4).reverse(); // oldest → newest

  const save = () => {
    if (!complete) return;
    const entry: DiagnosticEntry = {
      id: newId("dx"),
      at: localIso(),
      answers,
      hostHours,
      wordsWeek,
      route: diagRoute(answers, hostHours),
    };
    update((s) => ({ ...s, diagnostics: [entry, ...s.diagnostics] }));
    setAnswers({});
  };

  return (
    <>
      <Panel title={t("st6_m_diagTitle")} sub={t("st6_m_diagSub")}>
        {/* what the other tools already know about this week */}
        <ul className="space-y-1 rounded-2xl border border-line bg-raised-2 px-4 py-3 text-sm text-muted">
          <li>
            {hostHours === null ? (
              <>
                {t("st6_m_factNoAudit")}{" "}
                <Link href={`/studio/${P6.hours}`} className="font-semibold text-ink underline underline-offset-4">
                  {t("st6_m_factAuditLink")}
                </Link>
              </>
            ) : (
              t("st6_m_factHours")
                .replace("{w}", auditWeek ? fmtWeek(auditWeek, uiLang) : "")
                .replace("{n}", String(hostHours))
            )}
          </li>
          <li>{t("st6_m_factWords").replace("{n}", String(wordsWeek))}</li>
        </ul>

        {DIAG_QUESTIONS.map((q) => (
          <fieldset key={q} className="space-y-2">
            <legend className="text-sm font-semibold leading-relaxed text-ink">{t(`st6_m_q_${q}`)}</legend>
            {OPTIONS.map((n) => {
              const on = answers[q] === n;
              return (
                <label
                  key={n}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm ${
                    on ? "border-white/45 bg-white/10 text-ink" : "border-line bg-raised-2 text-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name={`p6-diag-${q}`}
                    checked={on}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q]: n }))}
                    className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
                  />
                  {t(`st6_m_q_${q}_${n}`)}
                </label>
              );
            })}
          </fieldset>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <AccentButton accent={accent} onClick={save} disabled={!complete}>
            {t("st6_m_diagSave")}
          </AccentButton>
          {!complete && <p className="text-xs text-muted">{t("st6_m_diagIncomplete")}</p>}
        </div>
      </Panel>

      {latest && (
        <Panel
          title={t("st6_m_resultTitle")}
          sub={t("st6_m_resultSub").replace("{d}", fmtDay(latest.at, uiLang))}
          right={
            <RemoveButton
              label={t("st6_remove")}
              onConfirm={() => update((s) => ({ ...s, diagnostics: s.diagnostics.filter((d) => d.id !== latest.id) }))}
            />
          }
        >
          <ul className="space-y-2">
            {[
              { ok: understandsMost(latest.answers), key: "cond1" },
              { ok: hearsALot(latest.answers, latest.hostHours), key: "cond2" },
            ].map((c) => (
              <li
                key={c.key}
                className="flex items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-3 text-sm text-ink"
              >
                <span className="font-bold" aria-hidden>
                  {c.ok ? "✓" : "✗"}
                </span>
                {t(`st6_m_${c.key}_${c.ok ? "yes" : "no"}`)}
              </li>
            ))}
          </ul>

          <div>
            <h3 className="headline text-xl">{t(`st6_m_route_${latest.route}T`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(`st6_m_route_${latest.route}B`)}</p>
            {latest.route !== "onroad" && (latest.answers.special ?? 0) === 2 && (
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("st6_m_un6Note")}</p>
            )}
          </div>

          <ul className="space-y-2">
            {ROUTE_LINKS[latest.route].map((link) => {
              const cls =
                "flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-3 text-sm hover:bg-raised-2";
              const body = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{t(`st6_m_go_${link.key}T`)}</span>
                    <span className="block text-xs leading-relaxed text-muted">{t(`st6_m_go_${link.key}B`)}</span>
                  </span>
                  <ArrowRight size={15} strokeWidth={2.5} className="shrink-0 text-muted" aria-hidden />
                </>
              );
              return (
                <li key={link.href}>
                  {link.href.startsWith("#") ? (
                    <a href={link.href} className={cls}>
                      {body}
                    </a>
                  ) : (
                    <Link href={link.href} className={cls}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {drift.length >= 2 && (
        <Panel title={t("st6_m_driftTitle")} sub={t("st6_m_driftSub")}>
          <p className="text-xs font-semibold tabular-nums text-muted">
            {drift.map((d) => fmtDay(d.at, uiLang)).join("  →  ")}
          </p>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-semibold text-muted">{t("st6_m_driftRoute")}</dt>
              <dd className="text-sm text-ink">{drift.map((d) => t(`st6_m_route_${d.route}S`)).join("  →  ")}</dd>
            </div>
            {DIAG_QUESTIONS.map((q) => (
              <div key={q}>
                <dt className="text-xs font-semibold text-muted">{t(`st6_m_q_${q}_short`)}</dt>
                <dd className="text-sm text-ink">
                  {drift
                    .map((d) => (d.answers[q] === undefined ? "–" : t(`st6_m_q_${q}_s${d.answers[q]}`)))
                    .join("  →  ")}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-semibold text-muted">{t("st6_m_driftHours")}</dt>
              <dd className="text-sm tabular-nums text-ink">
                {drift.map((d) => (d.hostHours === null ? "–" : String(d.hostHours))).join("  →  ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">{t("st6_m_driftWords")}</dt>
              <dd className="text-sm tabular-nums text-ink">{drift.map((d) => String(d.wordsWeek)).join("  →  ")}</dd>
            </div>
          </dl>
        </Panel>
      )}
    </>
  );
}
