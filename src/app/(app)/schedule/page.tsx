"use client";

/**
 * /schedule — book growing sessions with nurturers.
 * Left: upcoming bookings + the selected day's hour grid.
 * Right: nurturers who live the grower's target language.
 * A slide-over sheet books a fixed 30-minute Nuri session.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { gate1bPassed } from "@/lib/gates";
import { NURTURERS, nurturerById, nurturersForLang } from "@/lib/nurturers";
import { localizedNurturer } from "@/lib/nurturerI18n";
import { phaseById } from "@/lib/phases";
import { LANGUAGES, langByCode } from "@/lib/languages";
import { mascotForLang } from "@/lib/mascots";
import { Avatar } from "@/components/Avatar";
import { Mascot } from "@/components/Mascot";
import { MascotImage } from "@/components/MascotImage";
import { Card, Pill, SectionTitle, Tag } from "@/components/ui";
import type { Nurturer } from "@/lib/types";

const HOURS = Array.from({ length: 12 }, (_, i) => `${String(9 + i).padStart(2, "0")}:00`);
const CONFETTI = ["🎉", "✨", "🌱", "💜", "⭐", "🎊", "🧡", "💚", "🌍", "🪄"];
const SEEDED_NURTURERS =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
  process.env.NEXT_PUBLIC_ENABLE_SEEDED_NURTURERS === "true";

/** Nuri — the AI nurturer. Lives in every language; never sleeps. */
const NURI: Nurturer = {
  id: "ai",
  name: "Nuri",
  langs: LANGUAGES.map((l) => l.code),
  city: "Nuri",
  // bio/tags hold t() keys (resolved at render); "AI"/"24/7" stay literal per spec
  bio: "schNuriBio",
  tags: ["AI", "24/7", "schPictureCards"],
  sessions: 0,
  rating: 5,
  online: true,
  color: "#ff8a1e",
};

/** nurturerById that also resolves the AI nurturer */
const findNurturer = (id: string): Nurturer | undefined => (id === "ai" ? NURI : nurturerById(id));

interface DayCell {
  iso: string;
  label: string;
  num: number;
  isToday: boolean;
}

interface SheetState {
  nurturerId: string;
  date: string;
  time: string;
  activity: string;
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildWeek(locale: string): DayCell[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return {
      iso: isoOf(d),
      label: d.toLocaleDateString(locale, { weekday: "short" }).replace(".", ""),
      num: d.getDate(),
      isToday: i === 0,
    };
  });
}

function DayStrip({
  days,
  selected,
  onSelect,
  compact = false,
}: {
  days: DayCell[];
  selected: string;
  onSelect: (iso: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d, i) => {
        const sel = d.iso === selected;
        return (
          <motion.button
            key={d.iso}
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.4, ease: "easeOut" }}
            onClick={() => onSelect(d.iso)}
            className={`pill flex shrink-0 flex-col items-center gap-0.5 ${compact ? "min-w-[56px] px-3 py-2" : "min-w-[68px] px-4 py-3"} ${
              sel ? "bg-violet text-white" : "bg-white/5 text-muted hover:text-ink"
            } ${d.isToday ? "ring-2 ring-lime/80" : ""}`}
            style={sel ? { boxShadow: "var(--shadow-glow-violet)" } : undefined}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest">{d.label}</span>
            <span className={`font-display font-extrabold leading-none ${compact ? "text-base" : "text-xl"}`}>{d.num}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function NurturerCard({
  n: rawN,
  index,
  online,
  onBook,
  t,
}: {
  n: Nurturer;
  index: number;
  online: string;
  onBook: () => void;
  t: (key: string) => string;
}) {
  const n = localizedNurturer(rawN, t);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.07, duration: 0.5, ease: "easeOut" }}
    >
      <Card hover className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <Avatar name={n.name} color={n.color} size={52} ring />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold">{n.name}</p>
            <p className="truncate text-xs text-muted">📍 {n.city}</p>
          </div>
          {n.online && (
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-mint/10 px-2.5 py-1 text-[11px] font-semibold text-mint">
              <span className="pulsedot h-2 w-2 rounded-full bg-mint" />
              {online}
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{n.id === "ai" ? t(n.bio) : n.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {n.tags.map((tag) => (
            <Tag key={tag}>{n.id === "ai" && tag.startsWith("sch") ? t(tag) : tag}</Tag>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="text-sm font-semibold text-lemon">★ {n.rating.toFixed(1)}</span>
          <span className="text-xs text-muted">· {n.sessions} {t("schSessions")}</span>
          <div className="ml-auto flex items-center gap-2">
            <Pill onClick={onBook} className="bg-violet px-4 py-2 text-sm text-white">
              {t("book")}
            </Pill>
            {n.online && (
              <Link href={`/session?nurturer=${n.id}`} className="pill bg-lime px-4 py-2 text-sm font-semibold text-canvas">
                ⚡ {t("start")}
              </Link>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function SchedulePage() {
  const { profile, t, uiLang, addBooking, removeBooking } = useApp();

  const locale = langByCode(uiLang).tts;
  const days = useMemo(() => buildWeek(locale), [locale]);
  const [selectedIso, setSelectedIso] = useState<string>(() => isoOf(new Date()));
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const targetLang = profile?.targetLang ?? "es";
  const target = langByCode(targetLang);
  /** The target language's toy sibling — the AI nurturer's face and name */
  const sibling = mascotForLang(targetLang);
  // The closed beta executes Phase 1 only; later phases remain method previews.
  const phase = phaseById(1);
  const phase1aIds = new Set(phase.parts?.find((part) => part.id === "1a")?.activityIds ?? []);
  /* 1A-only until the real 1A → 1B gate is earned (stamp-or-predicate,
     src/lib/gates.ts) — same check as the session room and practice hub */
  const availableActivities =
    !profile || (profile.phase === 1 && !gate1bPassed(profile))
      ? phase.activities.filter((activity) => phase1aIds.has(activity.id))
      : phase.activities;
  const defaultActivity = availableActivities[0]?.name ?? t("schGrowingSession");

  // t() returns the key itself when missing — fall back to the schedule-local key
  const aiLabelRaw = t("aiNurturer");
  const aiLabel = aiLabelRaw === "aiNurturer" ? t("schAiNurturer") : aiLabelRaw;

  const forLang = useMemo(() => nurturersForLang(targetLang), [targetLang]);
  const roster = SEEDED_NURTURERS ? (forLang.length > 0 ? forLang : NURTURERS) : [];
  const noVerifiedNurturers = roster.length === 0;

  const bookings = useMemo(
    () =>
      profile
        ? [...profile.bookings]
            // Old prototype bookings can contain seeded character IDs. Do not
            // present them as real appointments outside the explicit seed demo.
            .filter((b) => b.nurturerId === "ai" || SEEDED_NURTURERS)
            .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
        : [],
    [profile]
  );

  if (!profile) return null;

  const openSheet = (preset: Partial<SheetState> = {}) => {
    setSheet({
      nurturerId: preset.nurturerId ?? roster.find((n) => n.online)?.id ?? roster[0]?.id ?? "ai",
      date: preset.date ?? selectedIso,
      time: preset.time ?? "18:00",
      activity: preset.activity ?? defaultActivity,
    });
  };

  const closeSheet = () => {
    if (!celebrate) setSheet(null);
  };

  const confirmBooking = () => {
    if (!sheet || celebrate) return;
    addBooking({ nurturerId: sheet.nurturerId, date: sheet.date, time: sheet.time, minutes: 30, activity: sheet.activity });
    setCelebrate(true);
    window.setTimeout(() => {
      setCelebrate(false);
      setSheet(null);
    }, 1500);
  };

  const fmtDate = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  const selectedLong = new Date(`${selectedIso}T12:00:00`).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="headline text-4xl lg:text-5xl">{t("scheduleTitle")}</h1>
          <p className="mt-2 text-sm text-muted">
            {target.flag} {target.nativeName} · 30 {t("minutes")} · GPA
          </p>
        </div>
        <Pill onClick={() => openSheet({ nurturerId: "ai" })} className="bg-orange px-6 py-3 font-semibold text-canvas" >
          ＋ {t("bookSession")}
        </Pill>
      </motion.div>

      {/* 7-day strip */}
      <DayStrip days={days} selected={selectedIso} onSelect={setSelectedIso} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: upcoming + hour grid */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: "easeOut" }}
          className="space-y-6"
        >
          <SectionTitle>{t("upcoming")}</SectionTitle>

          {bookings.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-8 text-center">
              <Mascot size={120} mood="think" />
              <p className="max-w-xs text-sm text-muted">{t("noSessions")}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((b, i) => {
                const n = findNurturer(b.nurturerId);
                const isAI = b.nurturerId === "ai";
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.06, duration: 0.45, ease: "easeOut" }}
                  >
                    <Card hover className="flex items-center gap-3 p-4">
                      {isAI ? (
                        <span
                          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full"
                          style={{
                            background: `color-mix(in srgb, ${sibling.color} 12%, transparent)`,
                            boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${sibling.color} 45%, transparent)`,
                          }}
                        >
                          <MascotImage mascot={sibling} size={38} float={false} />
                        </span>
                      ) : (
                        <Avatar name={n?.name ?? "?"} color={n?.color ?? "#7c5cff"} size={44} ring />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-bold">{isAI ? sibling.name : n?.name ?? b.nurturerId}</p>
                        <p className="truncate text-xs text-muted">
                          {fmtDate(b.date)} · {b.time} — {b.activity}
                        </p>
                      </div>
                      <Tag className="hidden sm:inline-flex shrink-0 bg-violet/15 text-violet-soft">
                        {b.minutes} {t("minutes")}
                      </Tag>
                      <Link
                        href={`/session?nurturer=${b.nurturerId}&activity=${encodeURIComponent(b.activity)}&duration=${b.minutes}`}
                        className="pill shrink-0 bg-violet px-4 py-2 text-sm text-white"
                      >
                        ▶ <span className="hidden sm:inline">{t("start")}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeBooking(b.id)}
                        aria-label={t("cancel")}
                        title={t("cancel")}
                        className="grid h-10 w-10 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-coral/15 hover:text-coral"
                      >
                        ✕
                      </button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* day hour grid */}
          <Card className="p-5">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <p className="font-display text-base font-bold capitalize">📅 {selectedLong}</p>
              <p className="text-xs text-muted">{t("schTapFreeHour")}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {HOURS.map((h, i) => {
                const booked = bookings.find((b) => b.date === selectedIso && b.time === h);
                const bn = booked ? findNurturer(booked.nurturerId) : undefined;
                return booked ? (
                  <motion.div
                    key={h}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.02 * i }}
                    className="flex flex-col items-center rounded-2xl bg-violet px-2 py-2.5 text-white"
                    style={{ boxShadow: "var(--shadow-glow-violet)" }}
                  >
                    <span className="font-display text-sm font-bold">{h}</span>
                    <span className="max-w-full truncate text-[10px] opacity-90">
                      {booked.nurturerId === "ai" ? sibling.name : bn?.name.split(" ")[0] ?? "—"}
                    </span>
                  </motion.div>
                ) : (
                  <motion.button
                    key={h}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.02 * i }}
                    onClick={() => openSheet({ date: selectedIso, time: h })}
                    className="rounded-2xl border border-line py-3 text-sm font-medium text-muted transition hover:border-violet/60 hover:bg-violet/10 hover:text-ink"
                  >
                    {h}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.section>

        {/* RIGHT: nurturers */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.55, ease: "easeOut" }}
          className="space-y-6"
        >
          <SectionTitle sub={`${target.flag} ${target.nativeName}`}>{t("availableNurturers")}</SectionTitle>

          {/* AI nurturer — the target language's toy sibling */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease: "easeOut" }}
          >
            <div
              className="rounded-[30px] p-[2px]"
              style={{
                background: `linear-gradient(135deg, ${sibling.color}, ${sibling.accent})`,
                boxShadow: `0 0 44px -14px color-mix(in srgb, ${sibling.color} 55%, transparent)`,
              }}
            >
              <div className="card relative overflow-hidden p-5" style={{ borderColor: "transparent" }}>
                <div
                  className="orb right-[-70px] top-[-70px] h-[180px] w-[180px]"
                  style={{ background: `color-mix(in srgb, ${sibling.accent} 15%, transparent)` }}
                />
                <div className="relative flex items-center gap-4">
                  <MascotImage mascot={sibling} size={64} float glow />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-bold">{sibling.name}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-canvas"
                        style={{ background: sibling.accent }}
                      >
                        AI
                      </span>
                      <span className="ml-auto flex items-center gap-1.5 rounded-full bg-mint/10 px-2.5 py-1 text-[11px] font-semibold text-mint">
                        <span className="pulsedot h-2 w-2 rounded-full bg-mint" />
                        24/7
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {aiLabel} · {t(`masc_${sibling.id}_toy`)}
                    </p>
                  </div>
                </div>
                <p className="relative mt-3 text-sm leading-relaxed text-muted">
                  “{sibling.nativeHello}”{" "}
                  {t("schAiDescription").replace("{name}", sibling.name).replace("{language}", target.nativeName)}
                </p>
                <div className="relative mt-4 flex items-center gap-2">
                  <Link
                    href="/session?nurturer=ai"
                    className="pill px-5 py-2 text-sm font-semibold text-canvas"
                    style={{
                      background: sibling.accent,
                      boxShadow: `0 0 30px -10px color-mix(in srgb, ${sibling.accent} 70%, transparent)`,
                    }}
                  >
                    ▶ {t("schStartNow")}
                  </Link>
                  <Pill onClick={() => openSheet({ nurturerId: "ai" })} className="bg-violet px-4 py-2 text-sm text-white">
                    {t("book")}
                  </Pill>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Real people */}
          <div className="space-y-1 pt-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">🫶 {t("schRealPeople")}</p>
            <p className="text-xs text-muted/80">{t("schRealPeopleSub")}</p>
          </div>

          {noVerifiedNurturers && (
            <Card className="flex flex-wrap items-center gap-3 p-4">
              <span className="text-2xl">🌍</span>
              <p className="min-w-0 flex-1 text-sm text-muted">
                {t("schMoreJoining").replace("{language}", target.nativeName)}
              </p>
              <Link href="/world" className="pill bg-violet px-4 py-2 text-sm font-semibold text-white">
                {t("world")} →
              </Link>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {roster.map((n, i) => (
              <NurturerCard key={n.id} n={n} index={i} online={t("online")} t={t} onBook={() => openSheet({ nurturerId: n.id })} />
            ))}
          </div>
        </motion.section>
      </div>

      {/* booking slide-over */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-[81] w-full max-w-[480px] overflow-y-auto border-l border-line bg-raised p-6 sm:p-8"
            >
              <div className="relative space-y-7">
                <div className="flex items-center justify-between">
                  <h2 className="headline text-2xl">{t("bookSession")}</h2>
                  <button
                    type="button"
                    onClick={closeSheet}
                    aria-label={t("cancel")}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/6 text-muted transition hover:bg-coral/15 hover:text-coral"
                  >
                    ✕
                  </button>
                </div>

                {/* nurturer select */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("nurturerWord")}</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {[NURI, ...roster].map((n) => {
                      const sel = sheet.nurturerId === n.id;
                      const isAI = n.id === "ai";
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setSheet((s) => (s ? { ...s, nurturerId: n.id } : s))}
                          className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5 transition ${
                            sel ? (isAI ? "" : "bg-violet/15 ring-2 ring-violet") : "hover:bg-white/5"
                          }`}
                          style={
                            sel && isAI
                              ? {
                                  background: `color-mix(in srgb, ${sibling.color} 10%, transparent)`,
                                  boxShadow: `inset 0 0 0 2px ${sibling.color}`,
                                }
                              : undefined
                          }
                        >
                          <div className="relative">
                            {isAI ? (
                              <span
                                className="grid h-12 w-12 place-items-center overflow-hidden rounded-full"
                                style={{ background: `color-mix(in srgb, ${sibling.color} 12%, transparent)` }}
                              >
                                <MascotImage mascot={sibling} size={42} float={false} />
                              </span>
                            ) : (
                              <Avatar name={n.name} color={n.color} size={48} ring={sel} />
                            )}
                            {isAI ? (
                              <span
                                className="absolute -right-1 -top-1 rounded-full px-1.5 py-px text-[8px] font-extrabold text-canvas"
                                style={{ background: sibling.accent }}
                              >
                                AI
                              </span>
                            ) : (
                              n.online && (
                                <span className="pulsedot absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-raised bg-mint" />
                              )
                            )}
                          </div>
                          <span className={`text-[11px] font-semibold ${sel ? "text-ink" : "text-muted"}`}>
                            {isAI ? sibling.name : n.name.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* date */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">📅</p>
                  <DayStrip
                    days={days}
                    selected={sheet.date}
                    onSelect={(iso) => setSheet((s) => (s ? { ...s, date: iso } : s))}
                    compact
                  />
                </div>

                {/* time */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">🕐</p>
                  <div className="grid grid-cols-4 gap-2">
                    {HOURS.map((h) => {
                      const sel = sheet.time === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSheet((s) => (s ? { ...s, time: h } : s))}
                          className={`rounded-xl py-2 text-sm font-semibold transition ${
                            sel ? "bg-violet text-white" : "border border-line text-muted hover:border-violet/50 hover:text-ink"
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* activity */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {phase.emoji} {t("phaseWord")} {phase.id} — {phase.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableActivities.map((a) => {
                      const sel = sheet.activity === a.name;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSheet((s) => (s ? { ...s, activity: a.name } : s))}
                          className={`pill px-4 py-2 text-sm ${
                            sel ? "bg-orange font-semibold text-canvas" : "bg-white/6 text-muted hover:text-ink"
                          }`}
                        >
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* fixed 30 minutes */}
                <Card className="flex items-start gap-3 bg-raised-2 p-4">
                  <span className="text-xl">⏱️</span>
                  <p className="text-xs leading-relaxed text-muted">
                    <span className="font-semibold text-ink">30 {t("minutes")}.</span> {t("schThirtyMinNote")}
                  </p>
                </Card>

                {/* actions */}
                <div className="flex items-center gap-3">
                  <Pill
                    onClick={confirmBooking}
                    disabled={celebrate}
                    className="flex-1 bg-violet py-3.5 font-semibold text-white"
                  >
                    ✓ {t("book")} — {fmtDate(sheet.date)} · {sheet.time}
                  </Pill>
                  <Pill onClick={closeSheet} className="bg-white/6 px-5 py-3.5 text-muted">
                    {t("cancel")}
                  </Pill>
                </div>

                {/* confetti cheer */}
                <AnimatePresence>
                  {celebrate && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[28px] bg-raised/90 backdrop-blur-sm"
                    >
                      <div className="relative">
                        <Mascot size={130} mood="cheer" float={false} />
                        {CONFETTI.map((c, i) => {
                          const ang = (i / CONFETTI.length) * Math.PI * 2;
                          return (
                            <motion.span
                              key={i}
                              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                              animate={{
                                x: Math.cos(ang) * 110,
                                y: Math.sin(ang) * 110,
                                scale: 1.2,
                                opacity: 0,
                              }}
                              transition={{ duration: 1.1, ease: "easeOut" }}
                              className="absolute left-1/2 top-1/2 text-2xl"
                            >
                              {c}
                            </motion.span>
                          );
                        })}
                      </div>
                      <p className="popin font-display text-xl font-bold text-lime">{t("done")} 🎉</p>
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
