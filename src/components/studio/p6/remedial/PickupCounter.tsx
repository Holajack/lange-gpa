"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Square, Timer } from "lucide-react";
import type { LangCode, PhaseId } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import { PICKUP_PACE, fmtDay, localIso, newId, type PickupSession, type RemedialState } from "../model";
import { AccentButton, Field, GhostButton, Panel, RemoveButton, Stat, inputCls } from "../ui";

const perHour = (words: number, seconds: number) => Math.round((words / (seconds / 3600)) * 10) / 10;

/**
 * The remedial pickup counter. One focused sitting with an earlier-phase
 * tool, counting the new words met, against the guide's remedial pace of
 * ten an hour. It is a plain rate, shown so the grower can tell when a
 * sitting has run thin and it is time to switch to denser material.
 */
export function PickupCounter({
  lang,
  phaseId,
  accent,
  state,
  update,
}: {
  lang: LangCode;
  phaseId: PhaseId;
  accent: string;
  state: RemedialState;
  update: (fn: (prev: RemedialState) => RemedialState) => void;
}) {
  const { t, uiLang } = useApp();
  const wordLog = useWordLog(lang);
  const live = state.live;
  const startedAt = live?.startedAt ?? null;
  const [now, setNow] = useState(() => Date.now());
  const [what, setWhat] = useState("");
  const [word, setWord] = useState("");

  useEffect(() => {
    if (startedAt === null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const elapsed = live ? Math.max(0, Math.floor((now - live.startedAt) / 1000)) : 0;
  const pace = live && elapsed >= 120 ? perHour(live.words, elapsed) : null;

  const start = () => update((s) => ({ ...s, live: { startedAt: Date.now(), words: 0, what: what.trim().slice(0, 120) } }));

  const bump = (by: number) =>
    update((s) => (s.live ? { ...s, live: { ...s.live, words: Math.max(0, s.live.words + by) } } : s));

  const keepWord = () => {
    const clean = word.trim().slice(0, 80);
    if (!clean) return;
    wordLog.add(clean, { context: live?.what || undefined, phase: phaseId }); // deduped in the Word Log
    bump(1);
    setWord("");
  };

  const end = (save: boolean) =>
    update((s) => {
      if (!s.live) return s;
      if (!save) return { ...s, live: null };
      const seconds = Math.max(0, Math.floor((Date.now() - s.live.startedAt) / 1000));
      const session: PickupSession = {
        id: newId("pk"),
        date: localIso(),
        minutes: Math.max(1, Math.min(240, Math.round(seconds / 60))),
        words: s.live.words,
        what: s.live.what,
      };
      return { ...s, live: null, pickups: [session, ...s.pickups] };
    });

  return (
    <div id="p6-pickup" className="scroll-mt-24">
      <Panel
        title={t("st6_m_pickupTitle")}
        sub={t("st6_m_pickupSub").replace("{n}", String(PICKUP_PACE))}
      >
        {!live ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
          >
            <Field label={t("st6_m_pickupWhat")} hint={t("st6_m_pickupWhatHint")}>
              <input
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                maxLength={120}
                placeholder={t("st6_m_pickupWhatPlaceholder")}
                className={inputCls}
              />
            </Field>
            <AccentButton accent={accent} type="submit">
              <Timer size={16} strokeWidth={2.5} /> {t("st6_m_pickupStart")}
            </AccentButton>
          </form>
        ) : (
          <div className="space-y-4">
            {live.what && <p className="break-words text-sm font-semibold text-ink">{live.what}</p>}
            <div className="grid grid-cols-3 gap-3">
              <Stat value={live.words} label={t("st6_m_pickupWords")} />
              <Stat value={fmtDuration(elapsed)} label={t("st6_m_pickupTime")} />
              <Stat
                value={pace === null ? "–" : pace}
                label={t("st6_m_pickupPace")}
                sub={t("st6_m_pickupPaceRef").replace("{n}", String(PICKUP_PACE))}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AccentButton accent={accent} onClick={() => bump(1)} className="min-h-14 flex-1 basis-48 text-base">
                <Plus size={18} strokeWidth={3} /> {t("st6_m_pickupPlus")}
              </AccentButton>
              <GhostButton onClick={() => bump(-1)} disabled={live.words === 0} label={t("st6_m_pickupMinus")}>
                <Minus size={16} strokeWidth={3} />
              </GhostButton>
            </div>

            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                keepWord();
              }}
            >
              <input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                maxLength={80}
                lang={lang}
                placeholder={t("st6_m_pickupKeepPlaceholder")}
                aria-label={t("st6_m_pickupKeepPlaceholder")}
                className={`${inputCls} flex-1 basis-48`}
              />
              <GhostButton type="submit" disabled={!word.trim()}>
                {t("st6_m_pickupKeep")}
              </GhostButton>
            </form>

            {pace !== null && elapsed >= 900 && pace < 7 && (
              <p className="rounded-2xl border border-amber/40 bg-raised-2 px-4 py-3 text-sm leading-relaxed text-ink" role="status">
                {t("st6_m_pickupThin")}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => end(true)}
                className="pill min-h-10 bg-coral px-5 py-2.5 text-sm font-bold text-canvas"
              >
                <Square size={14} strokeWidth={3} /> {t("st6_m_pickupEnd")}
              </button>
              <GhostButton onClick={() => end(false)}>{t("st6_m_pickupDiscard")}</GhostButton>
            </div>
          </div>
        )}

        {state.pickups.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st6_m_pickupHistory")}</p>
            <ul className="space-y-2">
              {state.pickups.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-2.5">
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-semibold tabular-nums text-ink">
                      {fmtDay(p.date, uiLang)} ·{" "}
                      {t("st6_m_pickupRow")
                        .replace("{w}", String(p.words))
                        .replace("{m}", String(p.minutes))
                        .replace("{p}", String(perHour(p.words, p.minutes * 60)))}
                    </span>
                    {p.what && <span className="block break-words text-xs text-muted">{p.what}</span>}
                  </span>
                  <RemoveButton
                    label={t("st6_remove")}
                    onConfirm={() => update((s) => ({ ...s, pickups: s.pickups.filter((x) => x.id !== p.id) }))}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </div>
  );
}
