"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { getRecordingBlob, logRelisten, useBlobUrl, useLibrary, type LibraryItem } from "@/lib/library";
import { normalizeWord, useWordLog } from "@/lib/wordLog";
import { CardFace } from "@/app/(app)/session/CardFace";
import { hostText, type StudioToolProps } from "../types";
import {
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import { RecordPanel } from "../RecordPanel";
import { WSW_EXAMPLE } from "./content";
import { dayKey, Section, useSpeaker } from "./kit";

/**
 * p2-wsw — Word–Sentence–Word recordings.
 * For each new word the nurturer says: the word, one sentence that shows what
 * it means, the word again — one take per word. Each take is tied to the Word
 * Log, and the day's set plays back to back for the evening re-listen.
 */
export function WswTool({ activity, phase, lang }: StudioToolProps) {
  const { t, profile, uiLang } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const log = useWordLog(lang);
  const { items } = useLibrary({ activityId: activity.id, lang, kind: "word" });
  const [word, setWord] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [exampleHeard, setExampleHeard] = useState(false);

  const steps: GuideStep[] = [
    { title: t("st2_wwS1"), body: t("st2_wwS1b"), who: "both" },
    { title: t("st2_wwS2"), body: t("st2_wwS2b"), who: "nurturer" },
    { title: t("st2_wwS3"), body: t("st2_wwS3b"), who: "both" },
    { title: t("st2_wwS4"), body: t("st2_wwS4b"), who: "nurturer" },
    { title: t("st2_wwS5"), body: t("st2_wwS5b"), who: "you" },
  ];

  // words already in the log that have no word–sentence–word take yet
  const recorded = useMemo(() => new Set(items.map((it) => normalizeWord(it.title))), [items]);
  const waiting = log.words.filter((w) => !recorded.has(normalizeWord(w.text))).slice(0, 8);

  // sets by day, newest day first, each in the order it was recorded
  const days = useMemo(() => {
    const map = new Map<string, LibraryItem[]>();
    [...items]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .forEach((it) => {
        const key = dayKey(new Date(it.createdAt));
        map.set(key, [...(map.get(key) ?? []), it]);
      });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  const today = dayKey();
  const clean = word.trim();

  const dayLabel = (key: string) =>
    key === today
      ? t("st2_today")
      : new Date(`${key}T12:00:00`).toLocaleDateString(uiLang, { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🔤" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st2_wwNeeds")}</NeedsPersonCallout>

      <ExampleCard lang={lang} accent={accent} onHeard={() => setExampleHeard(true)} />

      <Section title={t("st2_wwCaptureTitle")} sub={t("st2_wwCaptureSub")}>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{t("st2_wwWordLabel")}</span>
          <input
            value={word}
            onChange={(ev) => {
              setWord(ev.target.value);
              setLastSaved(null);
            }}
            maxLength={80}
            lang={lang}
            placeholder={t("stc_wlAddPlaceholder")}
            className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-base text-ink outline-none focus:border-white/30"
          />
        </label>

        {waiting.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted">{t("st2_wwWaiting")}</p>
            <div className="flex flex-wrap gap-2">
              {waiting.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  lang={lang}
                  onClick={() => {
                    setWord(w.text);
                    setLastSaved(null);
                  }}
                  className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-medium text-ink"
                >
                  {w.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <ol className="grid grid-cols-3 gap-2 text-center">
          {[t("st2_wwBeat1"), t("st2_wwBeat2"), t("st2_wwBeat3")].map((beat, i) => (
            <li key={i} className="rounded-2xl border border-line bg-raised-2 px-2 py-3">
              <span className="block text-xs font-extrabold" style={{ color: accent }}>
                {i + 1}
              </span>
              <span className="mt-0.5 block text-xs font-semibold leading-snug text-ink">{beat}</span>
            </li>
          ))}
        </ol>

        {clean ? (
          <RecordPanel
            lang={lang}
            phase={2}
            activityId={activity.id}
            kind="word"
            speaker="nurturer"
            accent={accent}
            defaultTitle={clean}
            tags={["wsw", today]}
            label={t("st2_wwRecord")}
            showConsent
            onSaved={(item) => {
              // ties the take to the Word Log (a no-op when the word is already logged)
              log.add(item.title, { sourceId: item.id, t: 0, phase: 2 });
              setLastSaved(item.title);
              setWord("");
            }}
          />
        ) : (
          <p className="text-sm text-muted" role="status">
            {lastSaved ? `✓ ${t("st2_wwSavedNext").replace("{word}", lastSaved)}` : t("st2_wwTypeFirst")}
          </p>
        )}

        <p className="text-xs leading-relaxed text-muted">
          {t("st2_wwIceberg").replace("{n}", String(profile?.wordsMet ?? 0))}
        </p>
      </Section>

      <Section title={t("st2_wwSetsTitle")} sub={t("st2_wwSetsSub")}>
        {days.length === 0 && <p className="text-sm text-muted">{t("st2_wwNoSets")}</p>}
        {days.map(([key, set]) => (
          <DaySet key={key} label={dayLabel(key)} items={set} lang={lang} accent={accent} />
        ))}
      </Section>

      <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} allowWords={false} />
      <FinishBar
        timer={{ ...timer, finish: () => timer.finish(exampleHeard ? [WSW_EXAMPLE.cardId] : 0) }}
        accent={accent}
      />
    </div>
  );
}

/* ------------------------------ model example ---------------------------- */

function ExampleCard({ lang, accent, onHeard }: { lang: LangCode; accent: string; onHeard: () => void }) {
  const { t } = useApp();
  const speaker = useSpeaker(lang);
  const [which, setWhich] = useState<"good" | "weak" | null>(null);
  const word = hostText(WSW_EXAMPLE.word, lang);
  const good = hostText(WSW_EXAMPLE.good, lang);
  const weak = hostText(WSW_EXAMPLE.weak, lang);
  if (!word || !good || !weak) return null;

  const play = async (kind: "good" | "weak") => {
    setWhich(kind);
    const finished = await speaker.say([word, kind === "good" ? good : weak, word]);
    if (finished) {
      setWhich(null);
      onHeard();
    }
  };

  return (
    <Section title={t("st2_wwExampleTitle")} sub={t("st2_wwExampleSub")}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-5xl">
          <CardFace itemId={WSW_EXAMPLE.cardId} emoji={WSW_EXAMPLE.emoji} imgClassName="h-full w-full" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {(["good", "weak"] as const).map((kind) => {
            const active = speaker.speaking && which === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => (active ? speaker.stop() : void play(kind))}
                className={`pill min-h-11 justify-start px-4 py-2.5 text-left text-sm font-semibold ${
                  kind === "good" ? textOn(accent) : "border border-line bg-white/6 text-ink"
                }`}
                style={kind === "good" ? { background: accent } : undefined}
              >
                {active ? <Square size={14} strokeWidth={3} /> : <Volume2 size={16} strokeWidth={2.5} />}
                {kind === "good" ? t("st2_wwExGood") : t("st2_wwExWeak")}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted">{t("st2_wwExNote")}</p>
    </Section>
  );
}

/* --------------------------- back-to-back player -------------------------- */

function DaySet({
  label,
  items,
  lang,
  accent,
}: {
  label: string;
  items: LibraryItem[];
  lang: LangCode;
  accent: string;
}) {
  const { t } = useApp();
  // the first take is preloaded so Play starts inside the tap (mobile autoplay rules)
  const firstUrl = useBlobUrl(items[0]?.id);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queue = useRef<string[]>([]);
  const ownUrl = useRef<string | null>(null);
  const token = useRef(0);
  const [index, setIndex] = useState(-1);

  const release = () => {
    if (ownUrl.current) URL.revokeObjectURL(ownUrl.current);
    ownUrl.current = null;
  };

  const stop = () => {
    token.current += 1;
    audioRef.current?.pause();
    release();
    setIndex(-1);
  };

  useEffect(
    () => () => {
      token.current += 1;
      if (ownUrl.current) URL.revokeObjectURL(ownUrl.current);
    },
    []
  );

  const start = () => {
    const el = audioRef.current;
    if (!el || !firstUrl) return;
    token.current += 1;
    queue.current = items.map((it) => it.id);
    el.src = firstUrl;
    el.play().catch(() => setIndex(-1));
    setIndex(0);
  };

  const onEnded = () => {
    const el = audioRef.current;
    const finished = queue.current[index];
    if (finished) void logRelisten(finished);
    const next = index + 1;
    const nextId = queue.current[next];
    if (!el || !nextId) {
      release();
      setIndex(-1);
      return;
    }
    const mine = ++token.current;
    setIndex(next);
    void getRecordingBlob(nextId).then((blob) => {
      if (token.current !== mine || !blob) {
        if (token.current === mine) setIndex(-1);
        return;
      }
      release();
      ownUrl.current = URL.createObjectURL(blob);
      el.src = ownUrl.current;
      // a short breath between words
      window.setTimeout(() => {
        if (token.current === mine) el.play().catch(() => setIndex(-1));
      }, 500);
    });
  };

  const playing = index >= 0;

  return (
    <div className="rounded-3xl border border-line bg-raised-2 p-4">
      <audio ref={audioRef} onEnded={onEnded} preload="auto" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-muted">{t("st2_wwSetCount").replace("{n}", String(items.length))}</p>
        </div>
        <button
          type="button"
          onClick={playing ? stop : start}
          disabled={!firstUrl}
          className={`pill min-h-11 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
          style={{ background: accent }}
        >
          {playing ? <Square size={14} strokeWidth={3} /> : <Play size={15} strokeWidth={3} />}
          {playing ? t("st2_stop") : t("st2_wwPlayAll")}
        </button>
      </div>
      <ol className="mt-3 flex flex-wrap gap-2">
        {items.map((it, i) => (
          <li
            key={it.id}
            lang={lang}
            aria-current={index === i ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              index === i ? "bg-white/20 text-ink underline underline-offset-4" : "bg-white/6 text-ink"
            }`}
          >
            {it.title}
          </li>
        ))}
      </ol>
    </div>
  );
}
