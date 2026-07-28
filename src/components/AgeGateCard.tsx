"use client";

/**
 * 18+ age gate for community exchange — a plain date-of-birth question, not a
 * "yes I'm an adult" checkbox: a neutral date is the defensible ask, and it
 * lets a 17-year-old become eligible on their birthday without asking again.
 *
 * The date is sent to the server, which stores it and derives adulthood from
 * it on every call. Nothing here decides access; it only decides what we show.
 * If the answer is under 18 we say so once, kindly, and stop asking — the
 * learning app stays wide open.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { ADULT_AGE, ageOn, useAgeStatus } from "@/lib/age";

const FIELD =
  "mt-1.5 w-full rounded-xl border border-line bg-raised-2 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-violet";

const LABEL = "block text-[11px] font-bold uppercase tracking-wider text-muted";

/** days in a month, tolerant of an unpicked month/year (falls back to 31) */
function daysInMonth(month: number, year: number): number {
  if (!month) return 31;
  if (!year) return month === 2 ? 29 : new Date(Date.UTC(2024, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function AgeGateCard({ className = "" }: { className?: string }) {
  const { t, uiLang } = useApp();
  const { attested, adult, loading, attest } = useAgeStatus();

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** set the moment we learn this person is under 18, before the reload */
  const [under, setUnder] = useState(false);

  const thisYear = new Date().getFullYear();

  const monthNames = useMemo(() => {
    let fmt: Intl.DateTimeFormat;
    try {
      fmt = new Intl.DateTimeFormat(uiLang, { month: "long", timeZone: "UTC" });
    } catch {
      fmt = new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" });
    }
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2024, i, 1))));
  }, [uiLang]);

  const years = useMemo(
    () => Array.from({ length: 101 }, (_, i) => thisYear - i),
    [thisYear]
  );
  const dayCount = daysInMonth(Number(month), Number(year));

  /** Feb 31 can't survive a month change — drop the day rather than error later. */
  const clampDay = (m: number, y: number) => {
    if (day && Number(day) > daysInMonth(m, y)) setDay("");
  };

  // nothing to ask: they're already through the gate, or we don't know yet
  if (adult || loading) return null;

  const underAge = under || (attested && !adult);

  if (underAge) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`rounded-2xl bg-white/5 p-4 ${className}`}
        role="status"
      >
        <p className="font-display text-sm font-bold">🌱 {t("ageUnderTitle")}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{t("ageUnderBody")}</p>
      </motion.div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!day || !month || !year) {
      setError(t("ageIncomplete"));
      return;
    }
    const birthDate = `${year}-${pad2(Number(month))}-${pad2(Number(day))}`;
    const age = ageOn(birthDate, Date.now());
    if (age === null) {
      setError(t("ageIncomplete"));
      return;
    }
    setBusy(true);
    try {
      await attest(birthDate);
      // the server accepted it; the refreshed status flips this card off
      if (age < ADULT_AGE) setUnder(true);
    } catch {
      // an under-18 date is refused by the server — name that, not a failure
      if (age < ADULT_AGE) setUnder(true);
      else setError(t("safTryAgain"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl bg-white/5 p-4 ${className}`}
    >
      <p className="font-display text-sm font-bold">🎂 {t("ageConfirmTitle")}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{t("ageConfirmSub")}</p>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <label className={LABEL}>
          {t("ageDay")}
          <select value={day} onChange={(e) => setDay(e.target.value)} className={FIELD}>
            <option value="">—</option>
            {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          {t("ageMonth")}
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              clampDay(Number(e.target.value), Number(year));
            }}
            className={FIELD}
          >
            <option value="">—</option>
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          {t("ageYear")}
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              clampDay(Number(month), Number(e.target.value));
            }}
            className={FIELD}
          >
            <option value="">—</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-2 text-[11px] text-muted">🔒 {t("agePrivacyNote")}</p>

      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="pill mt-3 flex w-full justify-center bg-violet px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        style={{ boxShadow: "var(--shadow-glow-violet)" }}
      >
        {busy ? "…" : `✓ ${t("ageConfirmBtn")}`}
      </button>

      {error && (
        <p className="mt-2 text-center text-xs text-coral" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
