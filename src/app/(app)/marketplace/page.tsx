"use client";

/**
 * /marketplace — the Nurturer Marketplace.
 *
 * A Preply-grounded talent feed for GPA. Three movements:
 *   BROWSE  — a vertical feed of tall nurturer cards with sticky filter chips
 *             (language, dialect/region, Method-certified, free-exchange-only,
 *             GPA phase). Fidelity stats lead, the price is PPP-honest, and a
 *             "time-for-time" pill marks exchange-open nurturers.
 *   PROFILE — a right-side drawer: intro-video block, a 5-stat GPA strip,
 *             dialect pills (no CEFR levels — GPA has none), grower notes, and
 *             two sticky CTAs (Book hours / Propose exchange) + chat.
 *   BOOKING — duration choice, auto-detected timezone with the nurturer's
 *             local time under each slot, a two-tap slot grid, then a confirm
 *             step. Paid → itemized session + platform fee, drawn from paid
 *             hours. Exchange → "−1 hr, +1 hr owed" via the wallet. Both reuse
 *             addBooking so the session lands in /schedule, then a celebratory
 *             success state links into /session.
 *
 * UI copy is English here on purpose — this transactional surface is i18n'd
 * later. The dark neon-playroom theme + .card/.pill come straight from the
 * rest of the app.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useWallet } from "@/lib/credits";
import { NURTURERS } from "@/lib/nurturers";
import { localizedNurturer } from "@/lib/nurturerI18n";
import { LANGUAGES, langByCode } from "@/lib/languages";
import { mascotForLang } from "@/lib/mascots";
import { MascotImage } from "@/components/MascotImage";
import { Avatar } from "@/components/Avatar";
import { Card, Pill } from "@/components/ui";
import type { LangCode, Nurturer } from "@/lib/types";

/* ------------------------------- constants -------------------------------- */

const PLATFORM_FEE_RATE = 0.1; // 10% — shown line-itemed at confirm
const CONFETTI = ["🎉", "✨", "🌱", "💜", "⭐", "🎊", "🧡", "💚", "🌍", "🪄"];

type Duration = 30 | 60;

const PHASE_FILTERS: { value: string; labelKey: string }[] = [
  { value: "all", labelKey: "mktPhaseAny" },
  { value: "1", labelKey: "mktPhase1" },
  { value: "2", labelKey: "mktPhase2" },
  { value: "3", labelKey: "mktPhase3" },
  { value: "4", labelKey: "mktPhase4Plus" },
];

/* Plausible per-city UTC offsets so the timezone line reads real. The grower's
   own offset comes from the browser; we only need the nurturer's to subtract. */
const CITY_OFFSET: Record<string, number> = {
  Valencia: 2, Cusco: -5, Tbilisi: 4, Almaty: 5, Lyon: 2, Marseille: 2,
  Leipzig: 2, Porto: 1, Bari: 2, Osaka: 9, Sapporo: 9, Chengdu: 8,
  Kunming: 8, Leeds: 1, Atlanta: -4, "Port-au-Prince": -4, "Cap-Haïtien": -4,
};

/* Reframed "reviews" — grower notes, GPA-flavoured (understanding, not grades). */
const GROWER_NOTES: Record<string, { whoKey: string; noteKey: string }[]> = {
  _default: [
    { whoKey: "mktNoteWho1", noteKey: "mktNote1" },
    { whoKey: "mktNoteWho2", noteKey: "mktNote2" },
  ],
};

/* --------------------------------- helpers -------------------------------- */

function phaseMatches(phasesGuided: string | undefined, filter: string): boolean {
  if (filter === "all") return true;
  if (!phasesGuided) return false;
  const want = filter === "4" ? [4, 5, 6] : [Number(filter)];
  const [lo, hi] = phasesGuided.split("–").map((s) => Number(s.trim()));
  const top = Number.isFinite(hi) ? hi : lo;
  return want.some((w) => w >= lo && w <= top);
}

/** Whole-hour cost of a session at this rate, given the duration. */
function priceFor(rate: number, duration: Duration): number {
  return Math.round(rate * (duration / 60) * 100) / 100;
}

function money(n: number): string {
  return `$${n.toFixed(2).replace(/\.00$/, "")}`;
}

/** Nurturer's local clock for a given grower-local "HH:MM" slot. */
function nurturerLocalTime(city: string, slot: string, growerOffset: number): string {
  const off = CITY_OFFSET[city];
  if (off === undefined) return "";
  const [h, m] = slot.split(":").map(Number);
  // work in minutes so fractional offsets (e.g. +5.5) stay exact, then wrap a day
  const total = (((h * 60 + m + Math.round((off - growerOffset) * 60)) % 1440) + 1440) % 1440;
  const lh = Math.floor(total / 60);
  const lm = total % 60;
  return `${String(lh).padStart(2, "0")}:${String(lm).padStart(2, "0")}`;
}

function notesFor(id: string) {
  return GROWER_NOTES[id] ?? GROWER_NOTES._default;
}

/* --------------------------- small UI primitives --------------------------- */

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pill shrink-0 px-3.5 py-2 text-xs font-semibold transition ${
        active ? "bg-violet text-white" : "bg-white/6 text-muted hover:text-ink"
      }`}
      style={active ? { boxShadow: "var(--shadow-glow-violet)" } : undefined}
    >
      {children}
    </button>
  );
}

function OnlineDot() {
  return <span className="pulsedot absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-raised bg-lime" />;
}

function CertifiedPill() {
  const { t } = useApp();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-[11px] font-bold text-lime">
      ✦ {t("mktMethodCertified")}
    </span>
  );
}

function ExchangePill() {
  const { t } = useApp();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange/15 px-2.5 py-0.5 text-[11px] font-bold text-orange">
      ⇄ {t("mktTimeForTime")}
    </span>
  );
}

/* ------------------------------ browse card ------------------------------- */

function NurturerRow({
  n: rawN,
  index,
  freeOnly,
  onOpen,
}: {
  n: Nurturer;
  index: number;
  freeOnly: boolean;
  onOpen: () => void;
}) {
  const { t } = useApp();
  const n = localizedNurturer(rawN, t);
  const lang = langByCode(n.langs[0]);
  const rate = n.ratePerHourUsd ?? 8;
  const priced = !freeOnly || !n.exchangeOpen; // free-exchange filter grays the price
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.45, ease: "easeOut" }}
    >
      <Card hover className="flex cursor-pointer gap-4 p-4 sm:p-5" >
        <button type="button" onClick={onOpen} className="flex w-full gap-4 text-left">
          {/* square avatar w/ online dot */}
          <div className="relative shrink-0">
            <div className="overflow-hidden rounded-2xl">
              <Avatar name={n.name} color={n.color} size={84} />
            </div>
            {n.online && <OnlineDot />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-display text-base font-bold leading-tight">{n.name}</p>
              <span className="text-sm">{lang.flag}</span>
              {n.methodCertified && <CertifiedPill />}
            </div>

            {/* dialect headline — no CEFR levels, GPA has none */}
            <p className="mt-0.5 truncate text-xs text-muted">
              {t("mktSpeaks")} {lang.nativeName} · {n.region ?? n.city}
            </p>

            {/* fidelity stat FIRST, star second */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-semibold text-lime">✓ {n.sessions} {t("mktSessionsGuided")}</span>
              <span className="text-xs text-lemon">★ {n.rating.toFixed(1)}</span>
            </div>

            {/* meta rows */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>🌱 {n.growersNurtured ?? "—"} {t("mktGrowersNurtured")}</span>
              <span>🪜 {t("mktPhases")} {n.phasesGuided ?? "1"}</span>
            </div>

            {n.exchangeOpen && (
              <div className="mt-2">
                <ExchangePill />
              </div>
            )}
          </div>

          {/* PPP rate block */}
          <div className="flex shrink-0 flex-col items-end justify-between text-right">
            <div className={priced ? "" : "opacity-35 line-through"}>
              <p className="font-display text-xl font-extrabold leading-none">{money(rate)} {t("mktPerHrSuffix")}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted">{t("mktPerHour")}</p>
            </div>
            <span className="mt-2 hidden text-xs font-semibold text-violet-soft sm:inline">{t("mktView")}</span>
          </div>
        </button>
      </Card>
    </motion.div>
  );
}

/* ------------------------------ profile drawer ----------------------------- */

interface BookingDraft {
  duration: Duration;
  slot: string | null;
  mode: "paid" | "exchange";
}

function ProfileDrawer({
  n: rawN,
  onClose,
  onBooked,
}: {
  n: Nurturer;
  onClose: () => void;
  onBooked: () => void;
}) {
  const router = useRouter();
  const { addBooking, profile, t } = useApp();
  const wallet = useWallet();
  const n = localizedNurturer(rawN, t);
  const lang = langByCode(n.langs[0]);
  const mascot = mascotForLang(n.langs[0]);
  const rate = n.ratePerHourUsd ?? 8;

  const [draft, setDraft] = useState<BookingDraft>({ duration: 60, slot: null, mode: "paid" });
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  // grower's own UTC offset (hours), browser-detected
  const growerOffset = useMemo(() => -new Date().getTimezoneOffset() / 60, []);
  const tzName = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "your timezone";
    } catch {
      return "your timezone";
    }
  }, []);

  // slot grid — grower-local hours
  const SLOTS = useMemo(() => ["09:00", "11:00", "13:00", "15:00", "17:00", "18:30", "20:00", "21:00"], []);

  const sessionPrice = priceFor(rate, draft.duration);
  const fee = Math.round(sessionPrice * PLATFORM_FEE_RATE * 100) / 100;
  const total = Math.round((sessionPrice + fee) * 100) / 100;
  const hoursNeeded = draft.duration / 60;
  const hasPaidHours = wallet.paidHours >= hoursNeeded;
  const hasExchangeHour = wallet.exchangeHours >= hoursNeeded;

  const tomorrowIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // first available is tomorrow
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const startBooking = (mode: "paid" | "exchange") => {
    setDraft((d) => ({ ...d, mode }));
    setConfirming(true);
  };

  const confirm = () => {
    if (!draft.slot || done) return;
    const date = tomorrowIso();
    const activity =
      draft.mode === "exchange"
        ? `Exchange session · ${lang.nativeName}`
        : `${draft.duration} min growing session · ${lang.nativeName}`;

    addBooking({ nurturerId: n.id, date, time: draft.slot, minutes: draft.duration, activity });

    if (draft.mode === "exchange") {
      // −1 hr from balance, +1 hr owed back — exchange currency
      wallet.spend({
        amount: hoursNeeded,
        partner: n.name,
        lang: n.langs[0],
        minutes: draft.duration,
        note: `Exchange session with ${n.name}`,
      });
    }
    // Paid sessions draw down purchased hours; the wallet has no paid-debit
    // primitive, so the spend is captured as the booking + itemized receipt.

    setDone(true);
    window.setTimeout(() => {
      onBooked();
      router.push(`/session?nurturer=${n.id}`);
    }, 1600);
  };

  return (
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm"
      />
      <motion.aside
        key="panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed inset-y-0 right-0 z-[81] w-full max-w-[520px] overflow-y-auto border-l border-line bg-raised"
      >
        <div className="relative">
          {/* close */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("mktClose")}
            className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-ink backdrop-blur transition hover:bg-coral/20 hover:text-coral"
          >
            ✕
          </button>

          {/* hero: intro-video placeholder block */}
          <div
            className="relative grid h-44 place-items-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${n.color}33, ${mascot.color}22)` }}
          >
            <div className="orb left-[-50px] top-[-40px] h-[160px] w-[160px]" style={{ background: `${mascot.accent}22` }} />
            <button
              type="button"
              className="relative flex items-center gap-2 rounded-full bg-black/45 px-5 py-2.5 text-sm font-semibold text-ink backdrop-blur transition hover:bg-black/60"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-canvas">▶</span>
              {t("mktWatchIntro")}
            </button>
            <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-ink/60">
              {t("mktHelloIn")} {lang.nativeName}
            </span>
          </div>

          <div className="space-y-7 p-6 sm:p-7">
            {/* avatar + name + dialect */}
            <div className="-mt-14 flex items-end gap-4">
              <div className="relative shrink-0 rounded-3xl border-4 border-raised">
                <div className="overflow-hidden rounded-2xl">
                  <Avatar name={n.name} color={n.color} size={88} />
                </div>
                {n.online && <OnlineDot />}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-extrabold leading-none">{n.name}</h2>
                  <span>{lang.flag}</span>
                </div>
                <p className="mt-1 text-xs text-muted">📍 {n.region ?? n.city}</p>
              </div>
            </div>

            {/* 5-column GPA stats strip */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 rounded-2xl bg-raised-2 p-3 text-center">
              {[
                { v: n.methodCertified ? "✦" : "—", l: n.methodCertified ? t("mktStatCertified") : t("mktStatMentor"), c: n.methodCertified ? "text-lime" : "text-muted" },
                { v: "✓", l: t("mktStatFidelity"), c: "text-mint" },
                { v: money(rate), l: t("mktPerHour"), c: "text-ink" },
                { v: String(n.sessions), l: t("mktStatSessions"), c: "text-ink" },
                { v: String(n.growersNurtured ?? "—"), l: t("mktStatGrowers"), c: "text-ink" },
              ].map((s, i) => (
                <div key={i} className="px-0.5">
                  <p className={`font-display text-sm font-extrabold leading-tight ${s.c}`}>{s.v}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">{s.l}</p>
                </div>
              ))}
            </div>

            {/* I speak — dialect / region pills (no CEFR levels) */}
            <section className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("mktISpeak")}</p>
              <div className="flex flex-wrap gap-2">
                {(n.region ?? `${lang.nativeName} · ${n.city}`).split(" · ").map((bit) => (
                  <span key={bit} className="rounded-full bg-violet/15 px-3 py-1 text-xs font-medium text-violet-soft">
                    {bit}
                  </span>
                ))}
                {n.langs.slice(1).map((l) => (
                  <span key={l} className="rounded-full bg-white/6 px-3 py-1 text-xs font-medium text-muted">
                    + {langByCode(l).nativeName}
                  </span>
                ))}
              </div>
              <p className="pt-1 text-sm leading-relaxed text-muted">{n.bio}</p>
            </section>

            {/* availability summary */}
            <section className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("mktAvailability")}</p>
              <div className="flex items-center gap-2 rounded-2xl border border-line p-3 text-sm text-muted">
                <span className="text-base">🗓️</span>
                {t("mktGuidesPhases")} {n.phasesGuided ?? "1"} · {t("mktAvailabilitySummary")}
              </div>
            </section>

            {/* grower notes (reframed reviews) */}
            <section className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("mktGrowerNotes")}</p>
              <div className="space-y-2">
                {notesFor(n.id).map((r, i) => (
                  <div key={i} className="rounded-2xl bg-raised-2 p-3">
                    <p className="text-sm leading-relaxed text-ink/90">“{t(r.noteKey)}”</p>
                    <p className="mt-1.5 text-[11px] font-semibold text-muted">{t(r.whoKey)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* spacer so sticky CTAs never cover content */}
            <div className="h-2" />
          </div>

          {/* sticky CTAs */}
          {!confirming && (
            <div className="sticky bottom-0 z-10 flex flex-col gap-2 sm:flex-row sm:items-center border-t border-line bg-raised/95 p-4 backdrop-blur">
              <Pill
                onClick={() => startBooking("paid")}
                className="flex-1 min-w-0 bg-lime py-3.5 font-bold text-canvas"
              >
                {t("mktBookHours")} · {money(rate)}{t("mktHrSuffix")}
              </Pill>
              {n.exchangeOpen && (
                <Pill
                  onClick={() => startBooking("exchange")}
                  className="flex-1 min-w-0 border-2 border-violet bg-transparent py-3.5 font-bold text-violet-soft"
                >
                  ⇄ {t("mktProposeExchange")}
                </Pill>
              )}
              <button
                type="button"
                aria-label={t("mktChat")}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/6 text-lg text-muted transition hover:bg-violet/15 hover:text-violet-soft"
              >
                💬
              </button>
            </div>
          )}

          {/* ---------- BOOKING overlay (within the drawer) ---------- */}
          <AnimatePresence>
            {confirming && (
              <motion.div
                key="booking"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-raised"
              >
                {done ? (
                  <div
                    className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
                    style={{ background: "linear-gradient(160deg, #2a1f5c, #15131f)" }}
                  >
                    <div className="relative">
                      <MascotImage mascot={mascot} size={130} float glow />
                      {CONFETTI.map((c, i) => {
                        const ang = (i / CONFETTI.length) * Math.PI * 2;
                        return (
                          <motion.span
                            key={i}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                            animate={{ x: Math.cos(ang) * 120, y: Math.sin(ang) * 120, scale: 1.2, opacity: 0 }}
                            transition={{ duration: 1.1, ease: "easeOut" }}
                            className="absolute left-1/2 top-1/2 text-2xl"
                          >
                            {c}
                          </motion.span>
                        );
                      })}
                    </div>
                    <p className="popin font-display text-2xl font-extrabold text-lime">
                      {draft.mode === "exchange" ? t("mktExchangeBooked") : t("mktSessionBooked")} 🎉
                    </p>
                    <p className="max-w-xs text-sm text-ink/80">
                      {mascot.nativeHello}{" "}
                      {t("mktBookedSuccess")
                        .replace("{name}", n.name.split(" ")[0])
                        .replace("{lang}", lang.nativeName)}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-3 border-b border-line p-5">
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        aria-label={t("mktBack")}
                        className="grid h-9 w-9 place-items-center rounded-full bg-white/6 text-muted transition hover:text-ink"
                      >
                        ←
                      </button>
                      <div>
                        <p className="font-display text-lg font-bold leading-none">
                          {draft.mode === "exchange" ? t("mktProposeExchange") : t("mktBookHours")}
                        </p>
                        <p className="text-xs text-muted">{t("mktWith")} {n.name}</p>
                      </div>
                    </div>

                    <div className="space-y-7 p-5 sm:p-6">
                      {/* duration */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("mktDuration")}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {([30, 60] as Duration[]).map((d) => {
                            const sel = draft.duration === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDraft((s) => ({ ...s, duration: d }))}
                                className={`rounded-2xl border p-4 text-left transition ${
                                  sel ? "border-violet bg-violet/12" : "border-line hover:border-violet/50"
                                }`}
                              >
                                <p className="font-display text-lg font-extrabold">{d} min</p>
                                <p className="text-xs text-muted">{d === 30 ? t("mktWarmUp") : t("mktFullSession")}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* timezone line */}
                      <div className="flex items-center gap-2 rounded-xl bg-raised-2 px-3 py-2 text-xs text-muted">
                        <span>🕓</span>
                        {t("mktTimesShownPrefix")}<span className="font-semibold text-ink">{tzName}</span>).
                        {CITY_OFFSET[n.city] !== undefined && <> {t("mktIsIn").replace("{name}", n.name.split(" ")[0]).replace("{city}", n.city)}</>}
                      </div>

                      {/* slot grid — two-tap select → inline confirm */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("mktPickATime")}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {SLOTS.map((slot) => {
                            const sel = draft.slot === slot;
                            const local = nurturerLocalTime(n.city, slot, growerOffset);
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setDraft((s) => ({ ...s, slot }))}
                                className={`flex flex-col items-center rounded-2xl border px-2 py-2.5 transition ${
                                  sel ? "border-violet bg-violet text-white" : "border-line text-muted hover:border-violet/50 hover:text-ink"
                                }`}
                              >
                                <span className="font-display text-sm font-bold">{slot}</span>
                                {local && (
                                  <span className={`text-[10px] ${sel ? "text-white/75" : "text-muted/70"}`}>
                                    {local} {t("mktTheirTime")}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* confirm step — itemized */}
                      <AnimatePresence>
                        {draft.slot && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <Card className="space-y-3 p-4">
                              {draft.mode === "paid" ? (
                                <>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">{t("mktReceiptSession").replace("{duration}", String(draft.duration))}</span>
                                    <span className="font-semibold">{money(sessionPrice)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">{t("mktPlatformFee")}</span>
                                    <span className="font-semibold">{money(fee)}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-line pt-2 text-sm">
                                    <span className="font-semibold text-ink">{t("mktTotal")}</span>
                                    <span className="font-display text-base font-extrabold text-lime">{money(total)}</span>
                                  </div>
                                  <p className="text-[11px] text-muted">
                                    {hasPaidHours
                                      ? t("mktCoveredByWallet").replace("{hours}", String(wallet.paidHours))
                                      : t("mktChargedAtConfirm")}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">{t("mktFromExchangeBalance")}</span>
                                    <span className="font-semibold text-coral">−{hoursNeeded} hr</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">{t("mktYouOweBack")}</span>
                                    <span className="font-semibold text-lime">+{hoursNeeded} hr</span>
                                  </div>
                                  <p className="text-[11px] text-muted">
                                    {hasExchangeHour
                                      ? t("mktBalanceAfter").replace("{hours}", String(Math.round((wallet.exchangeHours - hoursNeeded) * 10) / 10))
                                      : t("mktExchangeDebt")
                                          .replace("{banked}", String(wallet.exchangeHours))
                                          .replace("{debt}", String(Math.round((hoursNeeded - wallet.exchangeHours) * 10) / 10))}
                                  </p>
                                </>
                              )}
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* confirm CTA */}
                    <div className="sticky bottom-0 mt-auto border-t border-line bg-raised/95 p-4 backdrop-blur">
                      <Pill
                        onClick={confirm}
                        disabled={!draft.slot}
                        className={`w-full py-3.5 font-bold ${
                          draft.mode === "exchange" ? "bg-violet text-white" : "bg-lime text-canvas"
                        }`}
                      >
                        {draft.slot
                          ? draft.mode === "exchange"
                            ? t("mktConfirmExchange").replace("{slot}", draft.slot)
                            : t("mktConfirmPaid").replace("{total}", money(total)).replace("{slot}", draft.slot)
                          : t("mktPickTimeAbove")}
                      </Pill>
                      {profile == null && (
                        <p className="pt-2 text-center text-[11px] text-muted">{t("mktBookingAppears")}</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function MarketplacePage() {
  const { profile, t } = useApp();
  const wallet = useWallet();

  // default the language filter to the grower's target language
  const [langFilter, setLangFilter] = useState<LangCode | "all">("all");
  const [region, setRegion] = useState("");
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.targetLang) setLangFilter(profile.targetLang);
  }, [profile?.targetLang]);

  // languages actually represented in the roster, for the dropdown
  const langOptions = useMemo(() => {
    const codes = new Set<LangCode>();
    NURTURERS.forEach((n) => n.langs.forEach((l) => codes.add(l)));
    return LANGUAGES.filter((l) => codes.has(l.code));
  }, []);

  const regionOptions = useMemo(() => {
    // value = raw dialect (for matching against raw region); label = localized
    const map = new Map<string, string>();
    NURTURERS.forEach((n) => {
      const matchLang = langFilter === "all" || n.langs.includes(langFilter);
      if (matchLang && n.region) {
        const raw = n.region.split(" · ")[0];
        if (!map.has(raw)) {
          const loc = (localizedNurturer(n, t).region ?? raw).split(" · ")[0];
          map.set(raw, loc);
        }
      }
    });
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [langFilter, t]);

  const roster = useMemo(() => {
    return NURTURERS.filter((n) => {
      if (langFilter !== "all" && !n.langs.includes(langFilter)) return false;
      if (region && !(n.region ?? "").startsWith(region)) return false;
      if (certifiedOnly && !n.methodCertified) return false;
      if (freeOnly && !n.exchangeOpen) return false;
      if (!phaseMatches(n.phasesGuided, phaseFilter)) return false;
      return true;
    });
  }, [langFilter, region, certifiedOnly, freeOnly, phaseFilter]);

  const open = openId ? NURTURERS.find((n) => n.id === openId) ?? null : null;

  const closeDrawer = () => setOpenId(null);
  const onBooked = () => {
    setOpenId(null);
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="headline text-4xl lg:text-5xl">{t("mktFindNurturer")}</h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            {t("mktSubtitle")}
          </p>
        </div>
        {/* wallet balance chips */}
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-raised-2 px-4 py-2 text-center">
            <p className="font-display text-base font-extrabold text-lime">{wallet.ready ? wallet.exchangeHours : "—"}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">{t("mktExchangeHr")}</p>
          </div>
          <div className="rounded-2xl bg-raised-2 px-4 py-2 text-center">
            <p className="font-display text-base font-extrabold text-violet-soft">{wallet.ready ? wallet.paidHours : "—"}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">{t("mktPaidHr")}</p>
          </div>
        </div>
      </motion.div>

      {/* sticky filter chips */}
      <div className="sticky top-0 z-30 -mx-4 bg-canvas/85 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:px-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* language dropdown */}
          <div className="relative shrink-0">
            <select
              value={langFilter}
              onChange={(e) => {
                setLangFilter(e.target.value as LangCode | "all");
                setRegion("");
              }}
              className="pill cursor-pointer appearance-none bg-white/6 py-2 pl-3.5 pr-8 text-xs font-semibold text-ink focus:outline-none"
              aria-label={t("mktLanguage")}
            >
              <option value="all">🌍 {t("mktAllLanguages")}</option>
              {langOptions.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">▾</span>
          </div>

          {/* region/dialect dropdown */}
          {regionOptions.length > 0 && (
            <div className="relative shrink-0">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="pill cursor-pointer appearance-none bg-white/6 py-2 pl-3.5 pr-8 text-xs font-semibold text-ink focus:outline-none"
                aria-label={t("mktRegionOrDialect")}
              >
                <option value="">{t("mktAllDialects")}</option>
                {regionOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">▾</span>
            </div>
          )}

          <Chip active={certifiedOnly} onClick={() => setCertifiedOnly((v) => !v)}>
            ✦ {t("mktMethodCertified")}
          </Chip>
          <Chip active={freeOnly} onClick={() => setFreeOnly((v) => !v)}>
            ⇄ {t("mktFreeExchangeOnly")}
          </Chip>

          {/* phase */}
          <div className="relative shrink-0">
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="pill cursor-pointer appearance-none bg-white/6 py-2 pl-3.5 pr-8 text-xs font-semibold text-ink focus:outline-none"
              aria-label={t("mktGpaPhase")}
            >
              {PHASE_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {t(p.labelKey)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">▾</span>
          </div>
        </div>
      </div>

      {/* result count */}
      <p className="text-xs text-muted">
        {roster.length} {roster.length === 1 ? t("mktNurturer") : t("mktNurturers")}
        {freeOnly && ` ${t("mktOpenToExchange")}`}
      </p>

      {/* browse feed */}
      {roster.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <MascotImage mascot={mascotForLang(langFilter === "all" ? "en" : langFilter)} size={96} float />
          <p className="font-display text-lg font-bold">{t("mktEmptyHeading")}</p>
          <p className="max-w-xs text-sm text-muted">{t("mktEmptyBody")}</p>
          <Pill
            onClick={() => {
              setRegion("");
              setCertifiedOnly(false);
              setFreeOnly(false);
              setPhaseFilter("all");
            }}
            className="bg-violet px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t("mktClearFilters")}
          </Pill>
        </Card>
      ) : (
        <div className="space-y-3">
          {roster.map((n, i) => (
            <NurturerRow key={n.id} n={n} index={i} freeOnly={freeOnly} onOpen={() => setOpenId(n.id)} />
          ))}
        </div>
      )}

      <p className="pt-2 text-center text-xs text-muted/70">
        {t("mktBookedSessionsAppear")} <Link href="/schedule" className="font-semibold text-violet-soft hover:underline">{t("mktScheduleLink")}</Link>.
      </p>

      {/* profile + booking drawer */}
      <AnimatePresence>{open && <ProfileDrawer key={open.id} n={open} onClose={closeDrawer} onBooked={onBooked} />}</AnimatePresence>
    </div>
  );
}
