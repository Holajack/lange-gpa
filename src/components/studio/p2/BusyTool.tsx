"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import type { PictureItem } from "@/lib/library";
import { hostText, type StudioToolProps } from "../types";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  PictureShelf,
  PictureView,
  RecordingList,
  RehearsalCallout,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import { RecordPanel } from "../RecordPanel";
import { BUSY_SCENES, hasP2Voice, panelCardIds, type BusyScene } from "./content";
import { PanelThumb, ScenePanel, SpotLayer, type SpotState } from "./Panel";
import { ListenAndPoint } from "./ListenPoint";
import { SayChip, Section, Segmented, useStored } from "./kit";
import { SourceSwitch, type PictureSource } from "./StoryParts";

type BusyMode = "find" | "tell";

interface BusyState {
  src: PictureSource;
  sceneId: string;
  /** regions the grower has described themselves, per scene */
  told: Record<string, string[]>;
}

const INITIAL: BusyState = { src: "builtin", sceneId: BUSY_SCENES[0].id, told: {} };

/**
 * p2-busy — Busy Pictures. One crowded scene, many people doing many things.
 * Hear what someone is doing and find them; then pick a corner and describe
 * it yourself. Built-in scenes are original; your own picture works the same
 * way with your nurturer doing the describing.
 */
export function BusyTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, update] = useStored<BusyState>(activity.id, lang, INITIAL);
  const [mode, setMode] = useState<BusyMode>("find");
  const [pic, setPic] = useState<PictureItem | null>(null);
  const [used, setUsed] = useState<string[]>([]);
  const accent = phase.color;
  const voiced = hasP2Voice(lang);

  const scene = BUSY_SCENES.find((s) => s.id === state.sceneId) ?? BUSY_SCENES[0];
  const sceneNo = BUSY_SCENES.indexOf(scene) + 1;
  const sceneName = `${scene.icon} ${t("st2_sceneN").replace("{n}", String(sceneNo))}`;
  const told = state.told[scene.id] ?? [];
  const touch = () => setUsed((u) => (u.includes(scene.id) ? u : [...u, scene.id]));

  const steps: GuideStep[] = [
    { title: t("st2_bzS1"), body: t("st2_bzS1b"), who: "both" },
    { title: t("st2_bzS2"), body: t("st2_bzS2b"), who: "nurturer" },
    { title: t("st2_bzS3"), body: t("st2_bzS3b"), who: "you" },
    { title: t("st2_bzS4"), body: t("st2_bzS4b"), who: "you" },
    { title: t("st2_bzS5"), body: t("st2_bzS5b"), who: "nurturer" },
  ];

  // Phase-1 cards shown as stall signs in the scenes actually worked on
  const cardIds = BUSY_SCENES.filter((s) => used.includes(s.id)).flatMap((s) => panelCardIds(s.panel));

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🔎" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      <Section title={t("st2_bzPickTitle")} sub={t("st2_bzPickSub")}>
        <SourceSwitch
          value={state.src}
          onChange={(src) => update((s) => ({ ...s, src }))}
          builtinLabel={t("st2_srcScenes")}
        />
        {state.src === "builtin" ? (
          <div className="grid max-w-md grid-cols-2 gap-3">
            {BUSY_SCENES.map((s, i) => {
              const label = `${s.icon} ${t("st2_sceneN").replace("{n}", String(i + 1))}`;
              return (
                <div key={s.id}>
                  <PanelThumb
                    panel={s.panel}
                    ratio="1 / 1"
                    label={label}
                    selected={scene.id === s.id}
                    onClick={() => update((prev) => ({ ...prev, sceneId: s.id }))}
                    className="w-full"
                  />
                  <p className="mt-1.5 text-xs font-semibold text-ink">{label}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <PictureShelf activityId={activity.id} selectedId={pic?.id ?? null} onSelect={setPic} />
        )}
      </Section>

      {state.src === "builtin" ? (
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            label={t("st2_bzModeLabel")}
            options={[
              { id: "find", label: t("st2_bzModeFind"), icon: "👂" },
              { id: "tell", label: t("st2_bzModeTell"), icon: "🗣️" },
            ]}
          />

          {mode === "find" ? (
            <Section title={t("st2_bzFindTitle")} sub={voiced ? t("st2_bzFindSub") : t("st2_bzFindSubNurturer")}>
              <div className="mx-auto max-w-xl">
                {voiced ? (
                  <ListenAndPoint
                    key={scene.id}
                    panel={scene.panel}
                    lang={lang}
                    accent={accent}
                    ratio="1 / 1"
                    pictureLabel={sceneName}
                    onDone={touch}
                  />
                ) : (
                  <ScenePanel panel={scene.panel} ratio="1 / 1" label={sceneName} />
                )}
              </div>
              {voiced && <RehearsalCallout>{t("st2_bzFindHonest")}</RehearsalCallout>}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">{t("st2_bzHerTitle")}</p>
                <RecordPanel
                  lang={lang}
                  phase={2}
                  activityId={activity.id}
                  kind="primary"
                  speaker="nurturer"
                  accent={accent}
                  defaultTitle={`${sceneName} · ${t("st2_herTelling")}`}
                  tags={[`scene:${scene.id}`]}
                  label={t("st2_bzHerRecord")}
                  showConsent
                  onSaved={touch}
                />
              </div>
            </Section>
          ) : (
            <TellRegions
              key={scene.id}
              scene={scene}
              sceneName={sceneName}
              told={told}
              lang={lang}
              accent={accent}
              activityId={activity.id}
              onTold={(id) => {
                touch();
                update((s) => {
                  const prev = s.told[scene.id] ?? [];
                  return prev.includes(id) ? s : { ...s, told: { ...s.told, [scene.id]: [...prev, id] } };
                });
              }}
            />
          )}
        </>
      ) : pic ? (
        <Section title={pic.title} sub={t("st2_bzOwnSub")}>
          <PictureView pic={pic} className="max-h-[75vh] bg-raised-2" />
          <NeedsPersonCallout>{t("st2_bzOwnNeeds")}</NeedsPersonCallout>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">{t("st2_bzHerTitle")}</p>
            <RecordPanel
              lang={lang}
              phase={2}
              activityId={activity.id}
              kind="primary"
              speaker="nurturer"
              accent={accent}
              defaultTitle={`${pic.title} · ${t("st2_herTelling")}`}
              tags={["own-picture"]}
              label={t("st2_bzHerRecord")}
              showConsent
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">{t("st2_bzMineTitle")}</p>
            <RecordPanel
              lang={lang}
              phase={2}
              activityId={activity.id}
              kind="description"
              speaker="me"
              accent={accent}
              defaultTitle={`${pic.title} · ${t("st2_myTurn")}`}
              tags={["own-picture"]}
              label={t("st2_bzMineRecord")}
            />
          </div>
        </Section>
      ) : (
        <Callout icon="🖼️" title={t("st2_bzOwnHintTitle")}>
          <p>{t("st2_bzOwnHint")}</p>
        </Callout>
      )}

      <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} />
      <FinishBar timer={{ ...timer, finish: () => timer.finish(cardIds) }} accent={accent} />
    </div>
  );
}

/* --------------------------- your turn to describe ------------------------ */

function TellRegions({
  scene,
  sceneName,
  told,
  lang,
  accent,
  activityId,
  onTold,
}: {
  scene: BusyScene;
  sceneName: string;
  told: string[];
  lang: LangCode;
  accent: string;
  activityId: string;
  onTold: (id: string) => void;
}) {
  const { t } = useApp();
  const [picked, setPicked] = useState<string | null>(null);
  const spots = scene.panel.spots;
  const pickedIndex = spots.findIndex((s) => s.id === picked);
  const spot = pickedIndex >= 0 ? spots[pickedIndex] : null;
  const line = hostText(spot?.say, lang);
  const said = spot ? told.includes(spot.id) : false;
  const areaName = t("st2_area").replace("{n}", String(pickedIndex + 1));

  const states: Record<string, SpotState | undefined> = {};
  told.forEach((id) => (states[id] = "found"));
  if (picked) states[picked] = "picked";

  return (
    <Section
      title={t("st2_bzTellTitle")}
      sub={t("st2_bzTellSub").replace("{n}", String(told.length)).replace("{total}", String(spots.length))}
    >
      <div className="mx-auto max-w-xl">
        <ScenePanel panel={scene.panel} ratio="1 / 1" label={sceneName}>
          <SpotLayer
            spots={spots}
            states={states}
            numbered
            onTap={setPicked}
            labelFor={(i) => t("st2_area").replace("{n}", String(i + 1))}
          />
        </ScenePanel>
      </div>

      {spot ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">{t("st2_bzTellPicked").replace("{area}", areaName)}</p>
          <RecordPanel
            lang={lang}
            phase={2}
            activityId={activityId}
            kind="description"
            speaker="me"
            accent={accent}
            defaultTitle={`${sceneName} · ${areaName}`}
            tags={[`scene:${scene.id}`, `spot:${spot.id}`]}
            label={t("st2_bzMineRecord")}
            onSaved={() => onTold(spot.id)}
          />
          {!said && (
            <button
              type="button"
              onClick={() => onTold(spot.id)}
              className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink"
            >
              <Check size={14} strokeWidth={3} /> {t("st2_dsSaidIt")}
            </button>
          )}
          {said && line && (
            <div className="space-y-2">
              <p className="text-xs leading-relaxed text-muted">{t("st2_bzTellHear")}</p>
              <SayChip key={spot.id} text={line} lang={lang} mode="reveal" hiddenLabel={t("st2_bzTellHearBtn")} />
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted" role="status">
          {t("st2_bzTellPick")}
        </p>
      )}
    </Section>
  );
}
