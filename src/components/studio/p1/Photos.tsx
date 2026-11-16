"use client";

import { useState } from "react";
import { Plus, Undo2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLibrary, usePictures, type PictureItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  PictureShelf,
  PictureView,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { Panel, useCanSpeak, usePersisted } from "./shared";

/**
 * Photos of US in Action (Phase 1A, listening). The grower's own photos of
 * their own group doing things; a nurturer asks "in which photo am I
 * walking?" and the grower points. Nuri cannot see the photos and does not
 * pretend to: this tool is the table, the pointer, the recorder and the
 * re-listen — the describing is a person's job.
 */

const picTag = (id: string) => `pic:${id}`;

export function Photos({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const canSpeak = useCanSpeak();
  const { pictures } = usePictures(activity.id);
  const { items } = useLibrary({ activityId: activity.id, lang });
  const [inPlay, setInPlay] = usePersisted<number>(activity.id, lang, 2);
  const [pointed, setPointed] = useState<string[]>([]);
  const [focus, setFocus] = useState<PictureItem | null>(null);

  const onTable = pictures.slice(0, Math.max(2, inPlay));
  const described = (id: string) => items.filter((it) => it.tags?.includes(picTag(id))).length;
  const focused = focus && pictures.some((p) => p.id === focus.id) ? focus : null;

  const point = (id: string) =>
    // "we" means two photos at once, so up to two can be pointed at
    setPointed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)));

  const steps: GuideStep[] = [
    { title: t("st1_phStep1T"), body: t("st1_phStep1B"), who: "both" },
    { title: t("st1_phStep2T"), body: t("st1_phStep2B"), who: "nurturer" },
    { title: t("st1_phStep3T"), body: t("st1_phStep3B"), who: "you" },
    { title: t("st1_phStep4T"), body: t("st1_phStep4B"), who: "nurturer" },
    { title: t("st1_phStep5T"), body: t("st1_phStep5B"), who: "both" },
    { title: t("st1_phStep6T"), body: t("st1_phStep6B"), who: "you" },
  ];

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="📸" mode="nurturer" />
      <NeedsPersonCallout>{t("st1_phNeeds")}</NeedsPersonCallout>
      <StepGuide steps={steps} accent={accent} />

      <Panel title={t("st1_phShelfTitle")} sub={t("st1_phShelfSub")}>
        <PictureShelf activityId={activity.id} selectedId={focused?.id ?? null} onSelect={setFocus} />
        <p className="text-xs leading-relaxed text-muted">🤝 {t("st1_phAskFirst")}</p>
      </Panel>

      <Panel title={t("st1_phTableTitle")} sub={t("st1_phTableSub")}>
        {pictures.length < 2 ? (
          <p className="rounded-2xl border border-dashed border-white/15 p-4 text-sm leading-relaxed text-muted">{t("st1_phNeedTwo")}</p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {onTable.map((pic, i) => {
                const at = pointed.indexOf(pic.id);
                const count = described(pic.id);
                return (
                  <li key={pic.id}>
                    <button
                      type="button"
                      onClick={() => point(pic.id)}
                      aria-pressed={at >= 0}
                      aria-label={t("st1_phPhoto").replace("{n}", String(i + 1))}
                      className={`relative block aspect-square w-full overflow-hidden rounded-3xl border-2 bg-canvas outline-none transition focus-visible:ring-2 focus-visible:ring-white ${
                        at >= 0 ? "border-white ring-2 ring-white/60" : "border-line"
                      }`}
                    >
                      <PictureView pic={pic} className="h-full" />
                      {at >= 0 && (
                        <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-black text-canvas" aria-hidden>
                          👉
                        </span>
                      )}
                      {count > 0 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-canvas/85 px-2 py-0.5 text-xs font-bold text-ink">
                          <span aria-hidden>🔊</span> {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInPlay(Math.min(pictures.length, Math.max(2, inPlay) + 1))}
                disabled={onTable.length >= pictures.length}
                className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
              >
                <Plus size={15} strokeWidth={2.5} aria-hidden /> {t("st1_phAddOne")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInPlay(2);
                  setPointed([]);
                }}
                disabled={onTable.length <= 2}
                className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-muted hover:text-ink disabled:opacity-40"
              >
                <Undo2 size={14} strokeWidth={2.5} aria-hidden /> {t("st1_phBackToTwo")}
              </button>
              {pointed.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPointed([])}
                  className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-muted hover:text-ink"
                >
                  {t("st1_phClear")}
                </button>
              )}
              <span className="text-xs text-muted">
                {t("st1_phOnTable").replace("{n}", String(onTable.length)).replace("{total}", String(pictures.length))}
              </span>
            </div>
          </>
        )}
      </Panel>

      <Panel title={t("st1_phRecordTitle")} sub={t("st1_phRecordSub")}>
        <RecordPanel
          lang={lang}
          phase={phase.id}
          activityId={activity.id}
          kind="primary"
          speaker="nurturer"
          defaultTitle={t("st1_phSampleName")}
          accent={accent}
          showConsent
          label={t("st1_phRecordGame")}
        />

        {focused ? (
          <div className="space-y-3 rounded-3xl border border-line bg-raised-2/60 p-3 sm:p-4">
            <PictureView pic={focused} className="max-h-72" />
            <p className="text-sm leading-relaxed text-muted">{t("st1_phOneSub")}</p>
            <RecordPanel
              key={focused.id}
              lang={lang}
              phase={phase.id}
              activityId={activity.id}
              kind="description"
              speaker="nurturer"
              defaultTitle={focused.title}
              accent={accent}
              tags={[picTag(focused.id)]}
              showConsent
              label={t("st1_phRecordOne")}
            />
            {/* 1B turns the game around: the grower describes the photos */}
            {canSpeak ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">{t("st1_phFlipTitle")}</p>
                <p className="text-sm leading-relaxed text-muted">{t("st1_phFlipSub")}</p>
                <RecordPanel
                  key={`me-${focused.id}`}
                  lang={lang}
                  phase={phase.id}
                  activityId={activity.id}
                  kind="description"
                  speaker="me"
                  defaultTitle={`${focused.title} · ${t("st1_phMine")}`}
                  accent={accent}
                  tags={[picTag(focused.id)]}
                  label={t("st1_phRecordMe")}
                />
              </div>
            ) : (
              <Callout icon="🌱" title={t("st1_phLaterTitle")}>
                <p>{t("st1_phLaterBody")}</p>
              </Callout>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted">{t("st1_phPickOne")}</p>
        )}
      </Panel>

      <Panel title={t("st1_phReliveTitle")} sub={t("st1_phReliveSub")}>
        <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} allowWords={false} emptyText={t("st1_phNoRecordings")} />
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
