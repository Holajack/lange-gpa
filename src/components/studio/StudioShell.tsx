"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronDown, ImagePlus, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { phaseById } from "@/lib/phases";
import { phaseKey } from "@/lib/phaseI18n";
import { phaseUnlocked } from "@/lib/phaseAccess";
import type { Phase, PhaseActivity } from "@/lib/types";
import {
  fmtDuration,
  useBlobUrl,
  useLibrary,
  usePictures,
  type LibraryFilter,
  type LibraryItem,
  type PictureItem,
} from "@/lib/library";
import { Mascot } from "@/components/Mascot";
import { ClarifyPlayer, type GapType } from "./ClarifyPlayer";
import type { StudioMode } from "./types";

/* ------------------------------------------------------------------ *
 *  Shared chrome for every studio tool. Compose these; don't fork them.
 * ------------------------------------------------------------------ */

/** Readable text class on top of a phase accent color. */
export function textOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "text-canvas" : "text-white";
}

/** Localized name/description/how for a curriculum activity. */
export function useActivityText(phase: Phase, activity: PhaseActivity) {
  const { t } = useApp();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  return {
    name: tr(phaseKey.activity.name(phase.id, activity.id), activity.name),
    description: tr(phaseKey.activity.description(phase.id, activity.id), activity.description),
    how: tr(phaseKey.activity.how(phase.id, activity.id), activity.how),
  };
}

/* ------------------------------ header ------------------------------ */

export function StudioHeader({
  phase,
  activity,
  emoji,
  mode,
}: {
  phase: Phase;
  activity: PhaseActivity;
  emoji: string;
  mode: StudioMode;
}) {
  const { t } = useApp();
  const text = useActivityText(phase, activity);
  return (
    <header className="mb-6 space-y-4">
      <Link
        href={`/courses/${phase.slug}`}
        className="pill inline-flex min-h-10 bg-white/6 px-4 py-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> {t("stc_backToPhase")}
      </Link>
      <div className="flex items-start gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
          style={{ background: `color-mix(in srgb, ${phase.color} 18%, transparent)` }}
          aria-hidden
        >
          {emoji}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: phase.color }}>
            {t("phaseWord")} {phase.id}
          </p>
          <h1 className="headline text-2xl leading-tight sm:text-3xl lg:text-4xl">{text.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{text.description}</p>
          <div className="mt-3">
            <ModeBadge mode={mode} />
          </div>
        </div>
      </div>
    </header>
  );
}

const MODE_ICON: Record<StudioMode, string> = { solo: "🌱", nurturer: "🤝", either: "🌿" };
const MODE_KEY: Record<StudioMode, string> = {
  solo: "stc_modeSolo",
  nurturer: "stc_modeNurturer",
  either: "stc_modeEither",
};

/** The honest label: can the app carry this alone, or does it need a person? */
export function ModeBadge({ mode }: { mode: StudioMode }) {
  const { t } = useApp();
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-line bg-white/6 px-3 py-1.5 text-xs font-semibold text-ink"
      title={t(`${MODE_KEY[mode]}Sub`)}
    >
      <span aria-hidden>{MODE_ICON[mode]}</span> {t(MODE_KEY[mode])}
    </span>
  );
}

/* ----------------------------- phase gate ---------------------------- */

/** Renders children only once the grower has reached this phase. */
export function PhaseGate({ phaseId, children }: { phaseId: number; children: ReactNode }) {
  const { profile, t } = useApp();
  if (!profile) return null;
  if (phaseUnlocked(profile, phaseId)) return <>{children}</>;
  const current = phaseById(profile.phase);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center py-10">
      <div className="card p-7 text-center sm:p-10">
        <Mascot size={120} mood="think" />
        <p className="mt-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
          <LockKeyhole size={13} strokeWidth={2.5} aria-hidden />
          {t("stc_unlocksAt").replace("{n}", String(phaseId))}
        </p>
        <h1 className="headline mt-2 text-3xl">{t("stc_lockedTitle")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("stc_lockedBody").replace("{n}", String(phaseId))}
        </p>
        <Link
          href={`/courses/${current.slug}`}
          className="pill mt-7 inline-flex bg-violet px-5 py-3 text-sm font-bold text-white"
        >
          {t("stc_lockedCta")}
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------ step guide --------------------------- */

export interface GuideStep {
  title: string;
  body: string;
  who?: "you" | "nurturer" | "both";
}

const WHO_KEY = { you: "stc_whoYou", nurturer: "stc_whoNurturer", both: "stc_whoBoth" } as const;

/** The activity's real procedure, numbered — collapsible so it never crowds the workbench. */
export function StepGuide({
  steps,
  accent,
  defaultOpen = true,
  title,
}: {
  steps: GuideStep[];
  accent: string;
  defaultOpen?: boolean;
  title?: string;
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-10 w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="font-display text-lg font-bold text-ink">{title ?? t("stc_steps")}</h2>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <ol className="mt-4 space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-ink">
                  {s.title}
                  {s.who && (
                    <span className="ml-2 rounded-full bg-white/6 px-2 py-0.5 text-[11px] font-semibold text-muted">
                      {t(WHO_KEY[s.who])}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ------------------------------ callouts ----------------------------- */

export function Callout({
  icon,
  title,
  children,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  tone?: "neutral" | "warm" | "safe";
}) {
  const border =
    tone === "warm"
      ? "border-amber/40"
      : tone === "safe"
        ? "border-mint/40"
        : "border-line";
  return (
    <div className={`flex items-start gap-3 rounded-3xl border ${border} bg-raised p-4 sm:p-5`}>
      <span className="mt-0.5 shrink-0 text-xl" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {children && <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>}
      </div>
    </div>
  );
}

/** For activities that need a real person: says so, and points at where to find one. */
export function NeedsPersonCallout({ children }: { children?: ReactNode }) {
  const { t } = useApp();
  return (
    <Callout icon="🤝" title={t("stc_modeNurturer")} tone="warm">
      <p>{children ?? t("stc_modeNurturerSub")}</p>
      <Link
        href="/schedule"
        className="mt-1 inline-flex min-h-10 items-center text-sm font-semibold text-ink underline underline-offset-4"
      >
        {t("stc_findPerson")} →
      </Link>
    </Callout>
  );
}

/** Labels AI practice as rehearsal — never as the real activity. */
export function RehearsalCallout({ children }: { children?: ReactNode }) {
  const { t } = useApp();
  return (
    <Callout icon="🌱" title={t("stc_rehearsal")}>
      <p>{children ?? t("stc_rehearsalSub")}</p>
    </Callout>
  );
}

/** The confidentiality promise — required on any surface that records someone's life. */
export function ConfidentialBanner() {
  const { t } = useApp();
  return (
    <Callout icon={<ShieldCheck size={20} strokeWidth={2.25} className="text-mint" />} title={t("stc_confTitle")} tone="safe">
      <p>{t("stc_confBody")}</p>
    </Callout>
  );
}

/* ---------------------------- session timer -------------------------- */

/**
 * Counts the minutes this tool has actually been open and visible, and logs
 * them as growing time. Hours are the journey's backbone, so they're
 * measured, never self-reported.
 */
export function useStudioTimer(activityId: string) {
  const { completeActivity } = useApp();
  const [seconds, setSeconds] = useState(0);
  const [logged, setLogged] = useState(false);
  const secondsRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const finish = (words: number | string[] = 0) => {
    const minutes = Math.max(1, Math.round(secondsRef.current / 60));
    completeActivity(activityId, minutes, words);
    secondsRef.current = 0;
    setSeconds(0);
    setLogged(true);
  };

  return { seconds, minutes: Math.floor(seconds / 60), logged, finish };
}

/** The "log this session" footer every tool ends with. */
export function FinishBar({
  timer,
  accent,
  disabled,
}: {
  timer: ReturnType<typeof useStudioTimer>;
  accent: string;
  disabled?: boolean;
}) {
  const { t } = useApp();
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
      <div>
        <p className="text-sm font-semibold text-ink">
          <span className="tabular-nums">{fmtDuration(timer.seconds)}</span> · {t("stc_minutesHere")}
        </p>
        <p className="text-xs text-muted">{t("stc_finishSub")}</p>
      </div>
      <button
        type="button"
        onClick={() => timer.finish()}
        disabled={disabled || timer.seconds < 30}
        className={`pill px-5 py-3 text-sm font-bold disabled:opacity-40 ${textOn(accent.startsWith("#") ? accent : "#7c5cff")}`}
        style={{ background: accent }}
      >
        <Check size={15} strokeWidth={3} /> {timer.logged && timer.seconds < 30 ? t("stc_finished") : t("stc_finish")}
      </button>
    </div>
  );
}

/* --------------------------- recording list -------------------------- */

/** Recordings matching a filter; tap one to open it in the ClarifyPlayer. */
export function RecordingList({
  filter,
  accent,
  gapTypes,
  moves,
  title,
  emptyText,
  allowWords = true,
  hideFamiliar = false,
  renderExtra,
}: {
  filter: LibraryFilter;
  accent: string;
  gapTypes?: GapType[];
  moves?: string[];
  title?: string;
  emptyText?: string;
  allowWords?: boolean;
  /** shrinking-copy mode: leave out recordings marked "I know this one cold" */
  hideFamiliar?: boolean;
  /** extra controls rendered under an opened recording (e.g. a retell recorder) */
  renderExtra?: (item: LibraryItem) => ReactNode;
}) {
  const { t } = useApp();
  const { items, ready } = useLibrary(filter);
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = hideFamiliar ? items.filter((it) => !it.familiar) : items;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">{title ?? t("stc_myRecordings")}</h3>
      {ready && shown.length === 0 && <p className="text-sm text-muted">{emptyText ?? t("stc_noRecordings")}</p>}
      <ul className="space-y-2">
        {shown.map((it) => {
          const open = openId === it.id;
          const openMarks = it.marks.filter((m) => !m.resolved).length;
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : it.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-3 text-left hover:bg-raised-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{it.title}</span>
                  <span className="block text-xs text-muted">
                    {t(`stc_kind_${it.kind}`)} · {fmtDuration(it.durationSec)} · {t("stc_plHeard")}{" "}
                    {it.relistens.length}×
                  </span>
                </span>
                {openMarks > 0 && (
                  <span className="rounded-full bg-coral/20 px-2.5 py-1 text-xs font-bold text-coral">
                    🚩 {openMarks}
                  </span>
                )}
                {it.familiar && <span className="text-xs font-bold text-mint">✓</span>}
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="mt-2 space-y-3">
                  <ClarifyPlayer
                    item={it}
                    accent={accent}
                    gapTypes={gapTypes}
                    moves={moves}
                    allowWords={allowWords}
                    onDeleted={() => setOpenId(null)}
                  />
                  {renderExtra?.(it)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------ pictures ----------------------------- */

function PictureThumb({
  pic,
  selected,
  onSelect,
  onRemove,
}: {
  pic: PictureItem;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { t } = useApp();
  const url = useBlobUrl(pic.id);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={pic.title}
        className={`block h-20 w-20 overflow-hidden rounded-2xl border-2 bg-raised-2 ${
          selected ? "border-white" : "border-transparent"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt={pic.title} className="h-full w-full object-cover" />}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("stc_removePicture")}
        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-canvas text-muted hover:text-coral"
      >
        <X size={12} strokeWidth={3} />
      </button>
    </div>
  );
}

/** Full-size view of one of the grower's own pictures. */
export function PictureView({ pic, className = "" }: { pic: PictureItem; className?: string }) {
  const url = useBlobUrl(pic.id);
  if (!url) return <div className={`aspect-video w-full rounded-3xl bg-raised-2 ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={pic.title} className={`w-full rounded-3xl object-contain ${className}`} />;
}

/**
 * Bring-your-own pictures: wordless-book pages the grower owns, family
 * photos, street scenes. Device-only, like the recordings.
 */
export function PictureShelf({
  activityId,
  selectedId,
  onSelect,
}: {
  activityId: string;
  selectedId: string | null;
  onSelect: (pic: PictureItem | null) => void;
}) {
  const { t } = useApp();
  const { pictures, add, remove } = usePictures(activityId);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    let last: PictureItem | null = null;
    for (const file of Array.from(files).slice(0, 12)) {
      if (!file.type.startsWith("image/")) continue;
      last = await add({ activityId, title: file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 60) }, file);
    }
    if (last) onSelect(last);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink">{t("stc_yourPictures")}</p>
      <div className="flex flex-wrap items-center gap-3">
        {pictures.map((pic) => (
          <PictureThumb
            key={pic.id}
            pic={pic}
            selected={selectedId === pic.id}
            onSelect={() => onSelect(pic)}
            onRemove={() => {
              if (selectedId === pic.id) onSelect(null);
              remove(pic.id);
            }}
          />
        ))}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/20 bg-white/4 text-xs font-semibold text-muted hover:text-ink"
        >
          <ImagePlus size={18} strokeWidth={2.25} />
          {t("stc_addPicture")}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted">{t("stc_addPictureHint")}</p>
    </div>
  );
}
