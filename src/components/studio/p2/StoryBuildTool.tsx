"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useLibrary, type LibraryItem, type PictureItem } from "@/lib/library";
import type { StudioToolProps } from "../types";
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
import { hasP2Voice, hostLines, type Story } from "./content";
import { ScenePanel } from "./Panel";
import { ListenAndPoint } from "./ListenPoint";
import { LinePlayer, Pager, Section, Segmented, StepBadge, useStored } from "./kit";
import {
  PageStrip,
  SourceSwitch,
  StoryFormPlayer,
  StoryPicker,
  storyById,
  useStoryName,
  type PictureSource,
} from "./StoryParts";

type BuildMode = "nurturer" | "solo";

interface BuildState {
  mode: BuildMode;
  src: PictureSource;
  storyId: string;
  /** the nurturer's telling for each book: story id (or "own") → library recording id */
  recIds: Record<string, string>;
}

const INITIAL: BuildState = { mode: "nurturer", src: "builtin", storyId: "soup", recIds: {} };

/**
 * p2-storybuild — Story-Building with Pictures (2B, nurturer-led).
 * The workbench for the real thing: she tells the story page by page while it
 * records, then listen-and-point, her whole-story telling, and your retelling,
 * all threaded to her recording. Alone, Nuri reads an authored story as a
 * clearly-labeled rehearsal.
 */
export function StoryBuildTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, update] = useStored<BuildState>(activity.id, lang, INITIAL);
  const accent = phase.color;
  const voiced = hasP2Voice(lang);
  const mode: BuildMode = voiced ? state.mode : "nurturer";

  const steps: GuideStep[] = [
    { title: t("st2_sbS1"), body: t("st2_sbS1b"), who: "nurturer" },
    { title: t("st2_sbS2"), body: t("st2_sbS2b"), who: "nurturer" },
    { title: t("st2_sbS3"), body: t("st2_sbS3b"), who: "both" },
    { title: t("st2_sbS4"), body: t("st2_sbS4b"), who: "nurturer" },
    { title: t("st2_sbS5"), body: t("st2_sbS5b"), who: "both" },
    { title: t("st2_sbS6"), body: t("st2_sbS6b"), who: "nurturer" },
    { title: t("st2_sbS7"), body: t("st2_sbS7b"), who: "you" },
  ];

  const story = storyById(state.storyId);

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="📖" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />

      {voiced && (
        <Segmented
          value={mode}
          onChange={(m) => update((s) => ({ ...s, mode: m }))}
          label={t("st2_sbModeLabel")}
          options={[
            { id: "nurturer", label: t("st2_sbModeNurturer"), icon: "🤝" },
            { id: "solo", label: t("st2_sbModeSolo"), icon: "🌱" },
          ]}
        />
      )}

      {mode === "nurturer" ? (
        <WithNurturer
          state={state}
          story={story}
          lang={lang}
          accent={accent}
          activityId={activity.id}
          onSrc={(src) => update((s) => ({ ...s, src }))}
          onStory={(storyId) => update((s) => ({ ...s, storyId }))}
          onRec={(key, id) => update((s) => ({ ...s, recIds: { ...s.recIds, [key]: id } }))}
        />
      ) : (
        <SoloRehearsal
          story={story}
          lang={lang}
          accent={accent}
          activityId={activity.id}
          onStory={(storyId) => update((s) => ({ ...s, storyId }))}
        />
      )}

      <RecordingList
        filter={{ activityId: activity.id, lang }}
        accent={accent}
        renderExtra={(item) =>
          item.kind === "primary" ? (
            <RecordPanel
              lang={lang}
              phase={2}
              activityId={activity.id}
              kind="retell"
              speaker="me"
              accent={accent}
              parentId={item.id}
              defaultTitle={`${item.title} · ${t("st2_retellName")}`}
              label={t("st2_retellRecord")}
            />
          ) : null
        }
      />
      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}

/* ------------------------------ with a nurturer -------------------------- */

function WithNurturer({
  state,
  story,
  lang,
  accent,
  activityId,
  onSrc,
  onStory,
  onRec,
}: {
  state: BuildState;
  story: Story;
  lang: LangCode;
  accent: string;
  activityId: string;
  onSrc: (src: PictureSource) => void;
  onStory: (id: string) => void;
  onRec: (key: string, id: string) => void;
}) {
  const { t } = useApp();
  const name = useStoryName();
  const { all } = useLibrary();
  const [page, setPage] = useState(0);
  const [pic, setPic] = useState<PictureItem | null>(null);
  const own = state.src === "own";
  const bookKey = own ? "own" : story.id;
  const bookName = own ? t("st2_myBook") : name(story);

  useEffect(() => setPage(0), [story.id]);

  // the telling this book's later takes hang off (ignored once it has been erased)
  const telling: LibraryItem | undefined = all.find((it) => it.id === state.recIds[bookKey]);
  const pageLabel = t("st2_pageOf")
    .replace("{n}", String(page + 1))
    .replace("{total}", String(story.panels.length));

  return (
    <>
      <NeedsPersonCallout>{t("st2_sbNeeds")}</NeedsPersonCallout>

      <Section title={t("st2_sbBookTitle")} sub={t("st2_sbBookSub")}>
        <SourceSwitch value={state.src} onChange={onSrc} builtinLabel={t("st2_srcPictures")} />
        {own ? (
          <>
            <PictureShelf activityId={activityId} selectedId={pic?.id ?? null} onSelect={setPic} />
            {pic && <PictureView pic={pic} className="max-h-[70vh] bg-raised-2" />}
          </>
        ) : (
          <>
            <StoryPicker value={story.id} onChange={onStory} />
            <PageStrip story={story} page={page} onPage={setPage} />
            <div className="mx-auto max-w-2xl">
              <ScenePanel panel={story.panels[page]} label={t("st2_pageN").replace("{n}", String(page + 1))} />
            </div>
            <Pager
              index={page}
              count={story.panels.length}
              onChange={setPage}
              label={pageLabel}
              prevLabel={t("st2_prevPage")}
              nextLabel={t("st2_nextPage")}
            />
          </>
        )}
      </Section>

      <Section
        title={t("st2_sbTellTitle")}
        sub={t("st2_sbTellSub")}
        badge={<StepBadge n={1} accent={accent} done={Boolean(telling)} />}
      >
        <RecordPanel
          lang={lang}
          phase={2}
          activityId={activityId}
          kind="primary"
          speaker="nurturer"
          accent={accent}
          defaultTitle={`${bookName} · ${t("st2_herTelling")}`}
          tags={[`story:${bookKey}`, "page-by-page"]}
          label={t("st2_sbTellRecord")}
          showConsent
          onSaved={(item) => onRec(bookKey, item.id)}
        />
        {telling && (
          <p className="text-sm text-muted" role="status">
            ✓ {t("st2_sbTellSaved").replace("{title}", telling.title)}
          </p>
        )}
      </Section>

      <Section
        title={t("st2_sbNextTitle")}
        sub={t("st2_sbNextSub")}
        badge={<StepBadge n={2} accent={accent} />}
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href="/studio/p2-clarify"
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink"
          >
            🚩 {t("st2_goClarify")}
          </Link>
          <Link
            href="/studio/p2-wsw"
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink"
          >
            🔤 {t("st2_goWsw")}
          </Link>
        </div>
      </Section>

      <Section
        title={t("st2_sbPointTitle")}
        sub={t("st2_sbPointSub")}
        badge={<StepBadge n={3} accent={accent} />}
      >
        <RecordPanel
          lang={lang}
          phase={2}
          activityId={activityId}
          kind="expansion"
          speaker="nurturer"
          accent={accent}
          parentId={telling?.id}
          defaultTitle={`${bookName} · ${t("st2_pointSample")}`}
          tags={[`story:${bookKey}`, "listen-point"]}
          label={t("st2_sbPointRecord")}
          showConsent
        />
      </Section>

      <Section
        title={t("st2_sbWholeTitle")}
        sub={t("st2_sbWholeSub")}
        badge={<StepBadge n={4} accent={accent} />}
      >
        <RecordPanel
          lang={lang}
          phase={2}
          activityId={activityId}
          kind="primary"
          speaker="nurturer"
          accent={accent}
          parentId={telling?.id}
          defaultTitle={`${bookName} · ${t("st2_wholeStory")}`}
          tags={[`story:${bookKey}`, "whole-story"]}
          label={t("st2_sbWholeRecord")}
          showConsent
        />
      </Section>

      <Section
        title={t("st2_retellTitle")}
        sub={t("st2_sbRetellSub")}
        badge={<StepBadge n={5} accent={accent} />}
      >
        <Callout icon="🫶" title={t("st2_sbFriendTitle")}>
          <p>{t("st2_sbFriend")}</p>
        </Callout>
        <RecordPanel
          lang={lang}
          phase={2}
          activityId={activityId}
          kind="retell"
          speaker="me"
          accent={accent}
          parentId={telling?.id}
          defaultTitle={`${bookName} · ${t("st2_retellName")}`}
          tags={[`story:${bookKey}`, "retell"]}
          label={t("st2_retellRecord")}
        />
        {telling && (
          <RecordingList
            filter={{ parentId: telling.id }}
            accent={accent}
            title={t("st2_sbTakes")}
            emptyText={t("st2_sbNoTakes")}
          />
        )}
      </Section>
    </>
  );
}

/* ----------------------------- solo rehearsal ---------------------------- */

function SoloRehearsal({
  story,
  lang,
  accent,
  activityId,
  onStory,
}: {
  story: Story;
  lang: LangCode;
  accent: string;
  activityId: string;
  onStory: (id: string) => void;
}) {
  const { t } = useApp();
  const name = useStoryName();
  const [page, setPage] = useState(0);
  const [heard, setHeard] = useState<number[]>([]);

  useEffect(() => {
    setPage(0);
    setHeard([]);
  }, [story.id]);

  const panel = story.panels[page];
  const lines = hostLines(panel.lines, lang);
  const pageHeard = heard.includes(page);
  const allHeard = heard.length >= story.panels.length;
  const pageLabel = t("st2_pageOf")
    .replace("{n}", String(page + 1))
    .replace("{total}", String(story.panels.length));

  if (!lines) return <NeedsPersonCallout>{t("st2_noVoice")}</NeedsPersonCallout>;

  return (
    <>
      <RehearsalCallout>{t("st2_sbSoloHonest")}</RehearsalCallout>

      <Section title={t("st2_sbSoloPick")}>
        <StoryPicker value={story.id} onChange={onStory} />
      </Section>

      <Section
        title={`${name(story)} · ${pageLabel}`}
        sub={t("st2_sbSoloListenSub")}
        badge={<StepBadge n={1} accent={accent} done={allHeard} />}
      >
        <PageStrip story={story} page={page} onPage={setPage} done={heard} />
        <div className="mx-auto max-w-2xl">
          <ScenePanel panel={panel} label={t("st2_pageN").replace("{n}", String(page + 1))} />
        </div>
        <LinePlayer
          lines={lines}
          lang={lang}
          accent={accent}
          label={t("st2_sbSoloPlay")}
          onHeard={() => setHeard((h) => (h.includes(page) ? h : [...h, page]))}
        />
        <Pager
          index={page}
          count={story.panels.length}
          onChange={setPage}
          label={pageLabel}
          prevLabel={t("st2_prevPage")}
          nextLabel={t("st2_nextPage")}
        />
      </Section>

      <Section
        title={t("st2_lpTitle")}
        sub={pageHeard ? t("st2_lpSub") : t("st2_lpLockedSolo")}
        badge={<StepBadge n={2} accent={accent} />}
      >
        {pageHeard && (
          <div className="mx-auto max-w-2xl">
            <ListenAndPoint
              panel={panel}
              lang={lang}
              accent={accent}
              pictureLabel={t("st2_pageN").replace("{n}", String(page + 1))}
            />
          </div>
        )}
      </Section>

      <Section
        title={t("st2_endTitle")}
        sub={allHeard ? t("st2_endSub") : t("st2_endLocked")}
        badge={<StepBadge n={3} accent={accent} />}
      >
        {allHeard && (
          <>
            <StoryFormPlayer story={story} lang={lang} accent={accent} />
            <p className="text-sm font-semibold text-ink">{t("st2_retellTitle")}</p>
            <p className="text-sm leading-relaxed text-muted">{t("st2_retellSub")}</p>
            <RecordPanel
              lang={lang}
              phase={2}
              activityId={activityId}
              kind="retell"
              speaker="me"
              accent={accent}
              defaultTitle={`${name(story)} · ${t("st2_retellName")}`}
              tags={[`story:${story.id}`, "retell", "solo"]}
              label={t("st2_retellRecord")}
            />
          </>
        )}
      </Section>
    </>
  );
}
