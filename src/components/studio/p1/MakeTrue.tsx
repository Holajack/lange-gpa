"use client";

import { useCallback, useMemo, useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";
import { useApp } from "@/lib/store";
import { IcebergToast, ProgressDots, type RoundResult } from "@/app/(app)/practice/shared";
import { CardFace } from "@/app/(app)/session/CardFace";
import { RecordPanel } from "../RecordPanel";
import { Callout, RecordingList, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import { MT_OBJECT_IDS, MT_SLOTS, isAuthored, mtSentence, pictureCard, type MtSlot, type MtSlotId, type P1Card } from "./content";
import {
  ActionButton,
  HearButton,
  Panel,
  PictureTile,
  Segmented,
  WordsFinishBar,
  pickKnown,
  pickOne,
  useCredited,
  useLater,
  useMetIds,
  useSpeaker,
} from "./shared";

/**
 * Make It True (Phase 1A, listening). Nuri — or your nurturer — states
 * something that is not true yet; the grower moves things around the little
 * scene until it is. Two things must be decoded by ear: WHICH thing, and
 * WHERE. Nothing is written and nobody has to speak.
 */

const ROUND = 8;

type Placed = Record<string, MtSlotId>;
interface Target {
  objId: string;
  slotId: MtSlotId;
}
interface Narrow {
  slots: MtSlotId[];
  objs: string[];
}

const slotById = (id: MtSlotId): MtSlot => MT_SLOTS.find((s) => s.id === id) ?? MT_SLOTS[0];

export function MakeTrue({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const met = useMetIds();
  const { say, busy } = useSpeaker(lang);
  const later = useLater();
  const { ids: credited, credit } = useCredited();
  const narrated = isAuthored(lang);

  const pool = useMemo(
    () => MT_OBJECT_IDS.map((id) => pictureCard(id, lang)).filter((c): c is P1Card => Boolean(c)),
    [lang]
  );
  const [objects, setObjects] = useState<P1Card[]>(() => pickKnown(pool, met, 4));
  const [mode, setMode] = useState<"nuri" | "person">(narrated ? "nuri" : "person");
  const [placed, setPlaced] = useState<Placed>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [status, setStatus] = useState<"idle" | "asking" | "right" | "finished">("idle");
  const [misses, setMisses] = useState(0);
  const [narrow, setNarrow] = useState<Narrow | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [toast, setToast] = useState(false);

  const sentence = useCallback(
    (tg: Target) => mtSentence(lang, tg.objId, slotById(tg.slotId)),
    [lang]
  );

  const ask = useCallback(
    (now: Placed, last: Target | null) => {
      const options: Target[] = [];
      for (const o of objects) {
        for (const s of MT_SLOTS) {
          if (now[o.id] === s.id) continue; // already true — not worth saying
          if (last && last.objId === o.id && last.slotId === s.id) continue;
          options.push({ objId: o.id, slotId: s.id });
        }
      }
      // a nurturer keeps the whole table busy: prefer a different thing than last time
      const fresh = options.filter((o) => !last || o.objId !== last.objId);
      const next = pickOne(fresh.length > 0 ? fresh : options);
      setTarget(next);
      setMisses(0);
      setNarrow(null);
      setSelected(null);
      setStatus("asking");
      void say(sentence(next));
    },
    [objects, say, sentence]
  );

  const start = () => {
    setResults([]);
    ask(placed, target);
  };

  const judge = (now: Placed, tg: Target) => {
    if (now[tg.objId] === tg.slotId) {
      const done = [...results, misses > 0 ? ("missed" as const) : ("correct" as const)];
      setResults(done);
      setStatus("right");
      credit([tg.objId, ...slotById(tg.slotId).vocabIds]);
      later(() => {
        if (done.length >= ROUND) {
          setStatus("finished");
          setTarget(null);
        } else ask(now, tg);
      }, 1300);
      return;
    }
    // not true yet: say it again, naturally, and let them keep arranging
    const n = misses + 1;
    setMisses(n);
    setToast(true);
    later(() => setToast(false), 1700);
    if (n >= 2 && !narrow) {
      const otherSlot = pickOne(MT_SLOTS.filter((s) => s.id !== tg.slotId)).id;
      const otherObj = pickOne(objects.filter((o) => o.id !== tg.objId)).id;
      setNarrow({ slots: [tg.slotId, otherSlot], objs: [tg.objId, otherObj] });
    }
    later(() => void say(sentence(tg)), 450);
  };

  const tapSlot = (slot: MtSlot) => {
    if (status === "right") return;
    const occupant = objects.find((o) => placed[o.id] === slot.id);
    if (!selected) {
      if (occupant) setSelected(occupant.id);
      return;
    }
    if (occupant?.id === selected) {
      setSelected(null);
      return;
    }
    const now: Placed = { ...placed };
    if (occupant) delete now[occupant.id];
    now[selected] = slot.id;
    setPlaced(now);
    setSelected(null);
    if (mode === "nuri" && target && status === "asking") judge(now, target);
  };

  const clearScene = () => {
    setPlaced({});
    setSelected(null);
  };

  const newThings = () => {
    setObjects(pickKnown(pool, met, 4));
    setPlaced({});
    setSelected(null);
    setTarget(null);
    setStatus("idle");
    setResults([]);
    setNarrow(null);
  };

  const switchMode = (m: "nuri" | "person") => {
    setMode(m);
    setTarget(null);
    setStatus("idle");
    setNarrow(null);
    setSelected(null);
  };

  const steps: GuideStep[] = [
    { title: t("st1_mtStep1T"), body: t("st1_mtStep1B"), who: "nurturer" },
    { title: t("st1_mtStep2T"), body: t("st1_mtStep2B"), who: "you" },
    { title: t("st1_mtStep3T"), body: t("st1_mtStep3B"), who: "nurturer" },
    { title: t("st1_mtStep4T"), body: t("st1_mtStep4B"), who: "both" },
    { title: t("st1_mtStep5T"), body: t("st1_mtStep5B"), who: "you" },
  ];

  const playing = mode === "nuri" && status !== "idle" && status !== "finished";
  const inTray = objects.filter((o) => !placed[o.id]);
  const dimObj = (id: string) => Boolean(narrow && !narrow.objs.includes(id));
  const dimSlot = (id: MtSlotId) => {
    if (!narrow || narrow.slots.includes(id)) return false;
    // a place holding one of the two things still in play stays live, so the thing can be picked up
    const occupant = objects.find((o) => placed[o.id] === id);
    return !(occupant && narrow.objs.includes(occupant.id));
  };

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="🏠" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      {narrated ? (
        <Segmented
          label={t("st1_whoWith")}
          value={mode}
          onChange={switchMode}
          accent={accent}
          options={[
            { value: "nuri", label: t("st1_withNuri"), icon: "🌱" },
            { value: "person", label: t("st1_withPerson"), icon: "🤝" },
          ]}
        />
      ) : (
        <Callout icon="🤝" title={t("st1_noVoiceTitle")} tone="warm">
          <p>{t("st1_noVoiceBody")}</p>
        </Callout>
      )}

      <Panel
        title={mode === "nuri" ? t("st1_mtBoardNuri") : t("st1_mtBoardPerson")}
        sub={mode === "nuri" ? t("st1_mtBoardNuriSub") : t("st1_mtBoardPersonSub")}
      >
        {mode === "nuri" && (
          <div className="flex flex-wrap items-center gap-3">
            {playing && target ? (
              <>
                <HearButton onClick={() => void say(sentence(target))} label={t("tryAgain")} accent={accent} busy={busy} />
                <p className="min-w-0 flex-1 text-sm text-muted" aria-live="polite">
                  {status === "right" ? `✓ ${t("st1_mtTrueNow")}` : narrow ? t("st1_mtNarrowed") : t("st1_mtListenMove")}
                </p>
              </>
            ) : (
              <>
                <ActionButton onClick={start} accent={accent}>
                  {status === "finished" ? t("st1_anotherRound") : t("start")}
                </ActionButton>
                {status === "finished" && <p className="text-sm text-muted">{t("st1_mtRoundDone")}</p>}
              </>
            )}
          </div>
        )}

        {/* the scene: a table, a little house, and nine places to put things */}
        <div
          className="relative isolate mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-line bg-canvas"
          role="group"
          aria-label={t("st1_mtSceneAria")}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 z-0 h-full w-full" aria-hidden>
            <rect x="0" y="74" width="100" height="26" style={{ fill: "rgba(255,255,255,0.05)" }} />
            <line x1="0" y1="74" x2="100" y2="74" style={{ stroke: "rgba(255,255,255,0.12)" }} strokeWidth="0.5" />
            {/* table */}
            <rect x="20" y="49" width="3" height="25" rx="1" style={{ fill: "var(--color-amber)", opacity: 0.55 }} />
            <rect x="41" y="49" width="3" height="25" rx="1" style={{ fill: "var(--color-amber)", opacity: 0.55 }} />
            <rect x="17" y="45" width="30" height="4.5" rx="1.5" style={{ fill: "var(--color-amber)", opacity: 0.85 }} />
          </svg>

          {MT_SLOTS.filter((s) => s.behind).map((slot) => (
            <SlotButton
              key={slot.id}
              slot={slot}
              z="z-10"
              occupant={objects.find((o) => placed[o.id] === slot.id)}
              selectedId={selected}
              ready={Boolean(selected)}
              dim={dimSlot(slot.id)}
              right={status === "right" && target?.slotId === slot.id}
              label={t("st1_mtPlace").replace("{n}", String(MT_SLOTS.indexOf(slot) + 1))}
              onTap={() => tapSlot(slot)}
            />
          ))}

          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden>
            {/* little house with an open doorway */}
            <rect x="58" y="42" width="24" height="32" rx="1.5" style={{ fill: "var(--color-raised-2)", stroke: "rgba(255,255,255,0.18)" }} strokeWidth="0.5" />
            <polygon points="54,42 70,26 86,42" style={{ fill: accent, opacity: 0.9 }} />
            <path d="M63 74 V56 a7 7 0 0 1 14 0 V74 Z" style={{ fill: "var(--color-canvas)" }} />
          </svg>

          {MT_SLOTS.filter((s) => !s.behind).map((slot) => (
            <SlotButton
              key={slot.id}
              slot={slot}
              z="z-30"
              occupant={objects.find((o) => placed[o.id] === slot.id)}
              selectedId={selected}
              ready={Boolean(selected)}
              dim={dimSlot(slot.id)}
              right={status === "right" && target?.slotId === slot.id}
              label={t("st1_mtPlace").replace("{n}", String(MT_SLOTS.indexOf(slot) + 1))}
              onTap={() => tapSlot(slot)}
            />
          ))}
        </div>

        {/* the tray */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("st1_mtTray")}</p>
          <div className="grid grid-cols-4 gap-2 sm:max-w-sm">
            {objects.map((o, i) =>
              placed[o.id] ? (
                <span key={o.id} className="aspect-square rounded-2xl border-2 border-dashed border-white/10" aria-hidden />
              ) : (
                <PictureTile
                  key={o.id}
                  card={o}
                  label={t("st1_picture").replace("{n}", String(i + 1))}
                  pressed={selected === o.id}
                  state={dimObj(o.id) ? "dim" : selected === o.id ? "selected" : "idle"}
                  onClick={() => setSelected(selected === o.id ? null : o.id)}
                />
              )
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {inTray.length === 0 && !selected ? t("st1_mtTrayEmpty") : t("st1_mtHowToMove")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={clearScene}
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <RotateCcw size={14} strokeWidth={2.5} aria-hidden /> {t("st1_mtClear")}
          </button>
          <button
            type="button"
            onClick={newThings}
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <Shuffle size={14} strokeWidth={2.5} aria-hidden /> {t("st1_mtNewThings")}
          </button>
        </div>

        {mode === "nuri" && status !== "idle" && (
          <ProgressDots total={ROUND} current={results.length} results={results} accent={accent} />
        )}
      </Panel>

      {mode === "person" && (
        <Panel title={t("st1_sampleTitle")} sub={t("st1_sampleSub")}>
          <RecordPanel
            lang={lang}
            phase={phase.id}
            activityId={activity.id}
            kind="primary"
            speaker="nurturer"
            defaultTitle={t("st1_mtSampleName")}
            accent={accent}
            showConsent
          />
          <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} allowWords={false} emptyText={t("st1_sampleEmpty")} />
        </Panel>
      )}

      <WordsFinishBar timer={timer} accent={accent} wordIds={credited} />
      <IcebergToast show={toast} />
    </div>
  );
}

function SlotButton({
  slot,
  z,
  occupant,
  selectedId,
  ready,
  dim,
  right,
  label,
  onTap,
}: {
  slot: MtSlot;
  z: string;
  occupant: P1Card | undefined;
  selectedId: string | null;
  /** a thing is in hand, so empty places light up as drop targets */
  ready: boolean;
  dim: boolean;
  right: boolean;
  label: string;
  onTap: () => void;
}) {
  const held = Boolean(occupant && occupant.id === selectedId);
  const frame = right
    ? "border-lime ring-2 ring-lime bg-raised-2"
    : held
      ? "border-white ring-2 ring-white/60 bg-raised-2"
      : occupant
        ? "border-transparent bg-raised-2"
        : ready
          ? "border-dashed border-white/60 bg-white/10"
          : "border-dashed border-white/20 bg-white/4";
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={dim}
      aria-label={label}
      aria-pressed={occupant ? held : undefined}
      className={`absolute ${z} flex aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-2xl border-2 p-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-white ${frame} ${
        dim ? "opacity-25" : ""
      }`}
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: "15%" }}
    >
      {occupant && (
        <CardFace itemId={occupant.id} emoji={occupant.emoji} className="text-2xl leading-none sm:text-3xl" imgClassName="h-full w-full rounded-xl" />
      )}
    </button>
  );
}
