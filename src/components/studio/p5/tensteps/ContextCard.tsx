"use client";

import Link from "next/link";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, type LibraryItem } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import { clearedSec, isComplete, lastClosedSitting, openSitting, type ClarifyFlow } from "../clarifyFlow";
import type { RetellEntry } from "../discourse";
import { showDay } from "../storage";
import { Meter, Panel } from "../ui";

/**
 * Discourse context: where this recording stands, so each sitting starts
 * from the last one. Everything shown is the grower's own trail (what was
 * cleared, what is still flagged, the words logged). The app adds no
 * account of what the recording says.
 */
export function ContextCard({
  item,
  flow,
  lang,
  accent,
  retell,
}: {
  item: LibraryItem;
  flow: ClarifyFlow;
  lang: LangCode;
  accent: string;
  /** set when part of this recording is waiting to be retold */
  retell?: RetellEntry;
}) {
  const { t } = useApp();
  const { words } = useWordLog(lang);

  const last = lastClosedSitting(flow);
  const lastStretches = last ? last.cleared.map((i) => flow.stretches[i]).filter(Boolean) : [];
  const open = item.marks.filter((m) => !m.resolved).sort((a, b) => a.t - b.t);
  const fromHere = words.filter((w) => w.sourceId === item.id);
  const cleared = clearedSec(flow);
  const done = isComplete(flow);

  return (
    <Panel title={t("st5_ctxTitle")} sub={item.title}>
      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted">
          <span className="font-semibold">{done ? t("st5_ctxAllClear") : t("st5_ctxClearSoFar")}</span>
          <span className="tabular-nums">
            {fmtDuration(cleared)} / {fmtDuration(flow.durationSec)}
          </span>
        </div>
        <Meter value={cleared} max={Math.max(1, flow.durationSec)} accent={accent} label={t("st5_ctxClearSoFar")} />
      </div>

      {!last ? (
        <p className="text-sm leading-relaxed text-muted">
          {openSitting(flow) ? t("st5_ctxFirstOpen") : t("st5_ctxFirst")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted">
              {t("st5_ctxLastTime")} · {last.endedAt ? new Date(last.endedAt).toLocaleDateString() : ""}
            </p>
            {lastStretches.length === 0 ? (
              <p className="mt-1 text-sm text-muted">{t("st5_ctxNothingCleared")}</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm text-ink">
                {lastStretches.map((s) => (
                  <li key={s.index} className="tabular-nums">
                    ✓ {t("st5_stretch")} {s.index + 1} · {fmtDuration(s.start)}–{fmtDuration(s.end)}
                  </li>
                ))}
              </ul>
            )}
            {last.retellOn && (
              <p className="mt-2 text-xs text-muted">
                {t("st5_ctxRetellPlanned")} {showDay(last.retellOn)}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted">
              {t("st5_ctxOpen")} · {open.length}
            </p>
            {open.length === 0 ? (
              <p className="mt-1 text-sm text-muted">{t("st5_ctxNoOpen")}</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm text-ink">
                {open.slice(0, 5).map((m) => (
                  <li key={m.id} className="flex gap-2">
                    <span className="shrink-0 tabular-nums text-muted">{fmtDuration(m.t)}</span>
                    <span className="min-w-0 break-words">{m.note || t("st5_ctxNoNote")}</span>
                  </li>
                ))}
                {open.length > 5 && <li className="text-xs text-muted">+{open.length - 5}</li>}
              </ul>
            )}
          </div>
        </div>
      )}

      {fromHere.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted">
            {t("st5_ctxWords")} · {fromHere.length}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {fromHere.slice(0, 10).map((w) => (
              <span key={w.id} className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink">
                {w.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {retell?.due && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber/40 bg-raised-2 p-3">
          <p className="min-w-0 flex-1 basis-48 text-sm text-ink">🗣️ {t("st5_ctxRetellDue")}</p>
          <Link
            href="/studio/p5-retell"
            className="pill min-h-10 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-ink"
          >
            {t("st5_ctxRetellGo")} →
          </Link>
        </div>
      )}
    </Panel>
  );
}
