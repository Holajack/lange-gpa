"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useWordLog } from "@/lib/wordLog";
import {
  HOURS_INITIAL,
  P6,
  RARE_INITIAL,
  READ_INITIAL,
  bankLabel,
  fmtHours,
  fmtWeek,
  hostShare,
  inWeek,
  trackWeekMinutes,
  weekHostHours,
  weekStart,
  type HoursState,
  type RareState,
  type ReadState,
} from "./model";
import { useStudioStore } from "./store";

function Tile({
  href,
  here,
  value,
  label,
  sub,
}: {
  href: string;
  /** this tile describes the tool it is shown inside: render it flat, not as a link */
  here: boolean;
  value: ReactNode;
  label: string;
  sub?: string;
}) {
  const body = (
    <>
      <span className="block font-display text-2xl font-extrabold tabular-nums text-ink">{value}</span>
      <span className="block text-xs font-semibold leading-snug text-muted">{label}</span>
      {sub && <span className="mt-1 block text-xs leading-snug text-muted">{sub}</span>}
    </>
  );
  const cls = "block min-w-0 rounded-2xl border border-line bg-raised-2 p-4 text-left";
  return here ? (
    <div className={cls}>{body}</div>
  ) : (
    <Link href={href} className={`${cls} hover:border-white/20`}>
      {body}
    </Link>
  );
}

/**
 * The week as it was lived: host hours, minutes read, time on the current
 * discourse target, words met. Four plain numbers pulled from the other
 * Phase 6 tools. No targets, no totals to beat, no comparison to anyone.
 */
export function WeeklySummaryCard({ lang, here }: { lang: LangCode; here?: string }) {
  const { t, uiLang } = useApp();
  const hours = useStudioStore<HoursState>(P6.hours, lang, HOURS_INITIAL).state;
  const read = useStudioStore<ReadState>(P6.read, lang, READ_INITIAL).state;
  const rare = useStudioStore<RareState>(P6.rare, lang, RARE_INITIAL).state;
  const { words } = useWordLog(lang);

  const week = weekStart();
  const audited = hours.weeks[week];
  const hostHours = weekHostHours(audited);
  const readMinutes = read.entries.filter((e) => inWeek(e.date, week)).reduce((sum, e) => sum + e.minutes, 0);
  const track = rare.tracks.find((tr) => tr.id === rare.activeId) ?? null;
  const wordsWeek = words.filter((w) => inWeek(w.addedAt, week)).length;

  return (
    <section className="card p-5 sm:p-6" aria-label={t("st6_s_title")}>
      <h2 className="font-display text-lg font-bold text-ink">{t("st6_s_title")}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {fmtWeek(week, uiLang)} · {t("st6_s_sub")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          href={`/studio/${P6.hours}`}
          here={here === P6.hours}
          value={audited ? hostHours : "–"}
          label={t("st6_s_hostHours")}
          sub={audited ? t("st6_s_share").replace("{n}", String(hostShare(hostHours))) : t("st6_s_notAudited")}
        />
        <Tile href={`/studio/${P6.read}`} here={here === P6.read} value={readMinutes} label={t("st6_s_readMinutes")} />
        <Tile
          href={`/studio/${P6.rare}`}
          here={here === P6.rare}
          value={track ? fmtHours(trackWeekMinutes(track, week)) : "–"}
          label={t("st6_s_targetHours")}
          sub={track ? bankLabel(track, t) : t("st6_s_noTarget")}
        />
        <Tile href="/library" here={false} value={wordsWeek} label={t("st6_s_words")} />
      </div>
    </section>
  );
}
