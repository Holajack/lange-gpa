"use client";

/**
 * /wallet — the Nuri hours wallet.
 *
 * Two strictly-separate currencies, made visually explicit:
 *   • GROWING HOURS (lime) — EARNED by nurturing, never bought. They net to
 *     zero: you give an hour, you earn an hour. The honest CRED mechanic.
 *   • PAID HOURS (violet) — the only purchasable currency. Top up when you
 *     want more growing than you can give back.
 *
 * Header: stacked balances + lifetime nurtured/grown honesty row + a 50/50
 *   pill bar (nurture to earn · spend an hour).
 * Ledger: segmented All|Earned|Spent control over a list grouped under sticky
 *   month headers, each row carrying its partner's mascot or initials and a
 *   signed amount colored by currency.
 * Buy sheet: ClassPass-style tiered packs with PPP per-hour pricing, a
 *   "Best value" tag on the mid tier, and an explicit demo-purchase note.
 *
 * A fresh grower lands on all zeros + inviting empty states.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "@/lib/credits";
import { useApp } from "@/lib/store";
import { mascotForLang } from "@/lib/mascots";
import { langByCode } from "@/lib/languages";
import { MascotImage } from "@/components/MascotImage";
import { Avatar } from "@/components/Avatar";
import { Card, Pill } from "@/components/ui";
import type { LangCode } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

type LedgerEntry = ReturnType<typeof useWallet>["ledger"][number];
type Filter = "all" | "earned" | "spent";
type TFn = (key: string) => string;

/** "12.5" — one decimal, but drop a trailing ".0" so whole hours read clean. */
function fmtHrs(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Country-adjusted (PPP) per-hour price for paid packs — demo figures. */
const PPP_PER_HOUR = 3.2;

const PACKS: { hours: number; best?: boolean }[] = [
  { hours: 5 },
  { hours: 10, best: true },
  { hours: 25 },
];

/** Title for a ledger row, derived from kind + currency. */
function titleFor(e: LedgerEntry, t: TFn): string {
  if (e.kind === "purchased") return t("walBoughtHours");
  const langName = e.lang ? langByCode(e.lang as LangCode).nativeName : null;
  if (e.kind === "earned")
    return langName ? t("walNurturedLang").replace("{langName}", langName) : t("walNurturedHour");
  // spent
  return langName ? t("walGrewLang").replace("{langName}", langName) : t("walGrewHour");
}

/** Grey subline: partner + duration. */
function sublineFor(e: LedgerEntry, t: TFn): string {
  const bits: string[] = [];
  if (e.partner) bits.push(t("walWith").replace("{partner}", e.partner));
  if (typeof e.minutes === "number" && e.minutes > 0) bits.push(`${e.minutes} min`);
  if (e.note && bits.length === 0) bits.push(e.note);
  return bits.join(" · ");
}

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

/** Group entries (newest first) under "Month Year" headers, order preserved. */
function groupByMonth(entries: LedgerEntry[]): { month: string; rows: LedgerEntry[] }[] {
  const sorted = [...entries].sort((a, b) => b.ts - a.ts);
  const out: { month: string; rows: LedgerEntry[] }[] = [];
  for (const e of sorted) {
    const month = MONTH_FMT.format(new Date(e.ts));
    const last = out[out.length - 1];
    if (last && last.month === month) last.rows.push(e);
    else out.push({ month, rows: [e] });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

/** Circular avatar for a ledger row — partner's mascot, else their initials. */
function RowAvatar({ entry }: { entry: LedgerEntry }) {
  if (entry.kind === "purchased") {
    return (
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg"
        style={{
          background: "color-mix(in srgb, var(--color-violet) 14%, transparent)",
          boxShadow: "inset 0 0 0 2px color-mix(in srgb, var(--color-violet) 45%, transparent)",
        }}
        aria-hidden
      >
        💳
      </span>
    );
  }
  if (entry.lang) {
    const mascot = mascotForLang(entry.lang as LangCode);
    return (
      <span
        className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full"
        style={{
          background: `color-mix(in srgb, ${mascot.color} 12%, transparent)`,
          boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${mascot.color} 42%, transparent)`,
        }}
      >
        <MascotImage mascot={mascot} size={38} float={false} />
      </span>
    );
  }
  return <Avatar name={entry.partner ?? "?"} size={44} ring />;
}

function LedgerRow({ entry, index, t }: { entry: LedgerEntry; index: number; t: TFn }) {
  const signed = entry.kind === "spent" ? -entry.amount : entry.amount;
  const isExchange = entry.currency === "exchange";
  // earned/purchased read as gains (currency-colored); spent reads as a soft outflow
  const amountColor = signed < 0 ? "text-coral" : isExchange ? "text-lime" : "text-violet-soft";
  const subline = sublineFor(entry, t);

  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-white/[0.03]">
        <RowAvatar entry={entry} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold">{titleFor(entry, t)}</p>
          {subline && <p className="truncate text-xs text-muted">{subline}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-base font-extrabold tabular-nums ${amountColor}`}>
            {signed > 0 ? "+" : "−"}
            {fmtHrs(Math.abs(signed))}
            <span className="ml-0.5 text-[11px] font-semibold opacity-70">{t("walHrs")}</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            {isExchange ? t("walGrowing") : t("walPaid")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export default function WalletPage() {
  const wallet = useWallet();
  const { t } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [buyOpen, setBuyOpen] = useState(false);
  const [buying, setBuying] = useState<number | null>(null);
  const [purchased, setPurchased] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "earned") return wallet.ledger.filter((e) => e.kind !== "spent");
    if (filter === "spent") return wallet.ledger.filter((e) => e.kind === "spent");
    return wallet.ledger;
  }, [wallet.ledger, filter]);

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  const closeBuy = () => {
    if (buying === null && !purchased) setBuyOpen(false);
  };

  const buy = (hours: number) => {
    if (buying !== null) return;
    setBuying(hours);
    wallet.purchase({ amount: hours, note: "Demo purchase — no card charged yet" });
    setPurchased(true);
    window.setTimeout(() => {
      setPurchased(false);
      setBuying(null);
      setBuyOpen(false);
    }, 1400);
  };

  // Loading shimmer while the wallet hydrates from storage.
  if (!wallet.ready) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-44 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-56 animate-pulse rounded-[28px] bg-white/5" />
        <div className="h-72 animate-pulse rounded-[28px] bg-white/5" />
      </div>
    );
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: t("walFilterAll") },
    { id: "earned", label: t("walFilterEarned") },
    { id: "spent", label: t("walFilterSpent") },
  ];

  return (
    <div className="mx-auto max-w-[680px] space-y-7">
      {/* title */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="headline text-4xl lg:text-5xl">{t("walTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("walSubtitle")}</p>
      </motion.div>

      {/* ===== HEADER CARD: stacked balances + honesty row + action bar ===== */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.55, ease: "easeOut" }}
      >
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div
            className="orb right-[-80px] top-[-90px] h-[220px] w-[220px]"
            style={{ background: "color-mix(in srgb, var(--color-lime) 16%, transparent)" }}
          />

          {/* big lime — growing hours */}
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("walGrowingHours")}</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold leading-none text-lime sm:text-6xl">
                {fmtHrs(wallet.exchangeHours)}
              </span>
              <span className="font-display text-xl font-bold text-lime/80">{t("walHrsToGrow")}</span>
            </p>
            <p className="mt-1.5 text-xs text-muted">{t("walEarnedNetsZero")}</p>
          </div>

          {/* smaller violet — paid hours */}
          <div className="relative mt-5 flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold leading-none text-violet-soft">
              {fmtHrs(wallet.paidHours)}
            </span>
            <span className="text-sm font-semibold text-violet-soft/80">{t("walPaidHours")}</span>
          </div>

          {/* honesty row: lifetime nurtured | lifetime grown */}
          <div className="relative mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{t("walLifetimeNurtured")}</p>
              <p className="mt-0.5 font-display text-xl font-bold text-lime">{fmtHrs(wallet.lifetimeEarned)} {t("walHrs")}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{t("walLifetimeGrown")}</p>
              <p className="mt-0.5 font-display text-xl font-bold text-ink">{fmtHrs(wallet.lifetimeSpent)} {t("walHrs")}</p>
            </div>
          </div>

          {/* 50/50 action bar */}
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/schedule"
              className="pill bg-lime px-4 py-3 text-sm font-bold text-canvas"
              style={{ boxShadow: "0 0 30px -12px color-mix(in srgb, var(--color-lime) 80%, transparent)" }}
            >
              🌱 {t("walNurtureToEarn")}
            </Link>
            <Link
              href="/marketplace"
              className="pill border border-violet/60 bg-violet/10 px-4 py-3 text-sm font-bold text-violet-soft"
            >
              {t("walSpendAnHour")}
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* buy paid hours entry */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5, ease: "easeOut" }}
      >
        <Card hover className="flex items-center gap-4 p-5">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
            style={{ background: "color-mix(in srgb, var(--color-violet) 16%, transparent)" }}
          >
            💳
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold">{t("walBuyPaidHours")}</p>
            <p className="text-xs text-muted">{t("walBuyEntryBody")}</p>
          </div>
          <Pill onClick={() => setBuyOpen(true)} className="shrink-0 bg-violet px-5 py-2.5 text-sm font-semibold text-white">
            {t("walBuy")}
          </Pill>
        </Card>
      </motion.div>

      {/* ===== LEDGER ===== */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.55, ease: "easeOut" }}
        className="space-y-4"
      >
        {/* segmented control */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="headline text-2xl">{t("walHistory")}</h2>
          <div className="flex rounded-full bg-white/5 p-1">
            {FILTERS.map((f) => {
              const sel = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className="relative rounded-full px-4 py-1.5 text-sm font-semibold transition"
                >
                  {sel && (
                    <motion.span
                      layoutId="wallet-filter-pill"
                      className="absolute inset-0 rounded-full bg-violet"
                      transition={{ type: "spring", damping: 30, stiffness: 320 }}
                    />
                  )}
                  <span className={`relative ${sel ? "text-white" : "text-muted"}`}>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {groups.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 p-10 text-center">
            <MascotImage mascot={mascotForLang("en")} size={96} float glow />
            <div className="space-y-1">
              <p className="font-display text-lg font-bold">
                {filter === "spent"
                  ? t("walEmptyGrownTitle")
                  : filter === "earned"
                  ? t("walEmptyEarnedTitle")
                  : t("walEmptyGrowingTitle")}
              </p>
              <p className="mx-auto max-w-xs text-sm text-muted">
                {filter === "spent"
                  ? t("walEmptySpentBody")
                  : t("walEmptyEarnedBody")}
              </p>
            </div>
            <Link href="/schedule" className="pill bg-lime px-5 py-2.5 text-sm font-bold text-canvas">
              🌱 {t("walNurtureAnHour")}
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden p-3 sm:p-4">
            {groups.map((g) => (
              <div key={g.month}>
                <div className="sticky top-0 z-10 -mx-3 bg-raised/95 px-5 py-2 backdrop-blur sm:-mx-4 sm:px-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{g.month}</p>
                </div>
                <div className="space-y-0.5 pt-1">
                  {g.rows.map((e, i) => (
                    <LedgerRow key={e.id} entry={e} index={i} t={t} />
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}
      </motion.section>

      {/* ===== BUY SHEET ===== */}
      <AnimatePresence>
        {buyOpen && (
          <>
            <motion.div
              key="buy-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBuy}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              key="buy-panel"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[81] mx-auto max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-t-[28px] border border-line bg-raised p-6 sm:p-8"
            >
              <div className="relative space-y-6">
                {/* drag handle */}
                <div className="mx-auto h-1.5 w-12 rounded-full bg-white/15" />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="headline text-2xl">{t("walBuyPaidHours")}</h2>
                    <p className="mt-1 text-sm text-muted">{t("walBuySheetSubtitle")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeBuy}
                    aria-label={t("walClose")}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/6 text-muted transition hover:bg-coral/15 hover:text-coral"
                  >
                    ✕
                  </button>
                </div>

                {/* PPP info chip */}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-3 py-1.5 text-xs font-medium text-muted">
                  🌍 {t("walPppNote")}
                </span>

                {/* tiered packs */}
                <div className="space-y-3">
                  {PACKS.map((p, i) => {
                    const total = p.hours * PPP_PER_HOUR;
                    const isThis = buying === p.hours;
                    return (
                      <motion.div
                        key={p.hours}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.06, duration: 0.4, ease: "easeOut" }}
                      >
                        <div
                          className="card relative flex items-center gap-4 p-5"
                          style={
                            p.best
                              ? {
                                  borderColor: "color-mix(in srgb, var(--color-lime) 55%, transparent)",
                                  boxShadow: "0 0 36px -16px color-mix(in srgb, var(--color-lime) 70%, transparent)",
                                }
                              : undefined
                          }
                        >
                          {p.best && (
                            <span className="absolute -top-2.5 left-5 rounded-full bg-lime px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-canvas">
                              {t("walBestValue")}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-2xl font-extrabold text-violet-soft">
                              {p.hours}
                              <span className="ml-1 text-base font-bold text-muted">{t("walHrs")}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted">≈ ${PPP_PER_HOUR.toFixed(2)}{t("walPerHrRegion")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-xl font-extrabold text-ink">${total.toFixed(2)}</p>
                            <p className="text-[11px] text-muted">{t("walPackTotal")}</p>
                          </div>
                          <Pill
                            onClick={() => buy(p.hours)}
                            disabled={buying !== null}
                            className="shrink-0 bg-violet px-5 py-2.5 text-sm font-semibold text-white"
                          >
                            {isThis ? "…" : t("walBuy")}
                          </Pill>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* demo note */}
                <p className="text-center text-xs text-muted/80">
                  {t("walDemoNote")}
                </p>

                {/* success overlay */}
                <AnimatePresence>
                  {purchased && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[24px] bg-raised/95 backdrop-blur-sm"
                    >
                      <span className="popin text-5xl">💜</span>
                      <p className="popin font-display text-xl font-bold text-violet-soft">
                        {t("walPaidHoursAdded").replace("{n}", String(buying))}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
