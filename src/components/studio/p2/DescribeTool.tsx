"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import type { LibraryItem, PictureItem } from "@/lib/library";
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
import { hostLines, type Story } from "./content";
import { ScenePanel } from "./Panel";
import { ListenAndPoint } from "./ListenPoint";
import { MonoTimer } from "./MonoTimer";
import { LinePlayer, newId, Pager, Section, StepBadge, useStored } from "./kit";
import {
  PageStrip,
  SourceSwitch,
  StoryFormPlayer,
  StoryPicker,
  storyById,
  useStoryName,
  type PictureSource,
} from "./StoryParts";

interface DescribeState {
  src: PictureSource;
  storyId: string;
  /** the page the grower is on, per story */
  page: Record<string, number>;
  /** pages already described, per story */
  done: Record<string, number[]>;
  /** length of the monolingual block, minutes */
  block: number;
  longest: number;
  /** things that would not come out — saved for the nurturer, after the bell */
  notes: { id: string; text: string }[];
}

const INITIAL: DescribeState = {
  src: "builtin",
  storyId: "sock",
  page: {},
  done: {},
  block: 30,
  longest: 0,
  notes: [],
};

const IDEA_KEYS = ["st2_idea1", "st2_idea2", "st2_idea3", "st2_idea4", "st2_idea5", "st2_idea6"];

/**
 * p2-describe — Describe What You See (2A, the monolingual half hour).
 * Built-in wordless pages: describe aloud → hear Nuri's clean version of the
 * same page → listen and point. Your own book: describe, record, and take it
 * to your nurturer, because nobody authored a clean version of your pictures.
 */
export function DescribeTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, update] = useStored<DescribeState>(activity.id, lang, INITIAL);
  const accent = phase.color;

  const steps: GuideStep[] = [
    { title: t("st2_dsS1"), body: t("st2_dsS1b"), who: "you" },
    { title: t("st2_dsS2"), body: t("st2_dsS2b"), who: "you" },
    { title: t("st2_dsS3"), body: t("st2_dsS3b"), who: "you" },
    { title: t("st2_dsS4"), body: t("st2_dsS4b"), who: "both" },
    { title: t("st2_dsS5"), body: t("st2_dsS5b"), who: "both" },
    { title: t("st2_dsS6"), body: t("st2_dsS6b"), who: "nurturer" },
    { title: t("st2_dsS7"), body: t("st2_dsS7b"), who: "both" },
  ];

  const story = storyById(state.storyId);
  const page = Math.min(state.page[story.id] ?? 0, story.panels.length - 1);
  const done = state.done[story.id] ?? [];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🗣️" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      <Section title={t("st2_tmTitle")} sub={t("st2_tmSub")}>
        <MonoTimer
          accent={accent}
          minutes={state.block}
          longest={state.longest}
          onMinutes={(m) => update((s) => ({ ...s, block: m }))}
          onFinished={(m) => update((s) => ({ ...s, longest: Math.max(s.longest, m) }))}
        />
      </Section>

      <Section title={t("st2_dsPickTitle")} sub={t("st2_dsPickSub")}>
        <SourceSwitch
          value={state.src}
          onChange={(src) => update((s) => ({ ...s, src }))}
          builtinLabel={t("st2_srcStories")}
        />
        {state.src === "builtin" && (
          <StoryPicker value={story.id} onChange={(storyId) => update((s) => ({ ...s, storyId }))} />
        )}
      </Section>

      {state.src === "builtin" ? (
        <BuiltinBook
          key={story.id}
          story={story}
          page={page}
          done={done}
          lang={lang}
          accent={accent}
          activityId={activity.id}
          onPage={(i) => update((s) => ({ ...s, page: { ...s.page, [story.id]: i } }))}
          onDone={(i) =>
            update((s) => {
              const prev = s.done[story.id] ?? [];
              return prev.includes(i) ? s : { ...s, done: { ...s.done, [story.id]: [...prev, i] } };
            })
          }
        />
      ) : (
        <OwnBook lang={lang} accent={accent} activityId={activity.id} />
      )}

      <Section title={t("st2_nbTitle")} sub={t("st2_nbSub")}>
        <StuckNotes
          notes={state.notes}
          accent={accent}
          onAdd={(text) => update((s) => ({ ...s, notes: [...s.notes, { id: newId("n"), text }] }))}
          onRemove={(id) => update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }))}
        />
      </Section>

      <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} />
      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}

/* ----------------------------- built-in pages ---------------------------- */

function BuiltinBook({
  story,
  page,
  done,
  lang,
  accent,
  activityId,
  onPage,
  onDone,
}: {
  story: Story;
  page: number;
  done: number[];
  lang: LangCode;
  accent: string;
  activityId: string;
  onPage: (i: number) => void;
  onDone: (i: number) => void;
}) {
  const { t } = useApp();
  const name = useStoryName();
  const panel = story.panels[page];
  const lines = hostLines(panel.lines, lang);
  const [said, setSaid] = useState(false);
  const [heard, setHeard] = useState(false);
  const [ideas, setIdeas] = useState(false);
  const bookDone = done.length >= story.panels.length;
  const pageLabel = t("st2_pageOf")
    .replace("{n}", String(page + 1))
    .replace("{total}", String(story.panels.length));

  // each page starts from "say it yourself first"
  useEffect(() => {
    setSaid(false);
    setHeard(false);
  }, [panel.id]);

  const markSaid = () => {
    setSaid(true);
    onDone(page);
  };

  return (
    <>
      <Section title={`${name(story)} · ${pageLabel}`}>
        <PageStrip story={story} page={page} onPage={onPage} done={done} />
        <div className="mx-auto max-w-2xl">
          <ScenePanel panel={panel} label={t("st2_pageN").replace("{n}", String(page + 1))} />
        </div>
        <Pager
          index={page}
          count={story.panels.length}
          onChange={onPage}
          label={pageLabel}
          prevLabel={t("st2_prevPage")}
          nextLabel={t("st2_nextPage")}
        />
      </Section>

      <Section
        title={t("st2_dsSayTitle")}
        sub={t("st2_dsSaySub")}
        badge={<StepBadge n={1} accent={accent} done={said} />}
      >
        <button
          type="button"
          onClick={() => setIdeas((v) => !v)}
          aria-expanded={ideas}
          className="text-sm font-semibold text-ink underline underline-offset-4"
        >
          {t("st2_ideasToggle")}
        </button>
        {ideas && (
          <ul className="flex flex-wrap gap-2">
            {IDEA_KEYS.map((key) => (
              <li key={key} className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-medium text-ink">
                {t(key)}
              </li>
            ))}
          </ul>
        )}
        <RecordPanel
          lang={lang}
          phase={2}
          activityId={activityId}
          kind="description"
          speaker="me"
          accent={accent}
          defaultTitle={`${name(story)} · ${pageLabel}`}
          tags={[`story:${story.id}`, `page:${page + 1}`]}
          label={t("st2_dsRecord")}
          onSaved={markSaid}
        />
        {!said && (
          <button
            type="button"
            onClick={markSaid}
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink"
          >
            <Check size={14} strokeWidth={3} /> {t("st2_dsSaidIt")}
          </button>
        )}
      </Section>

      {lines ? (
        <>
          <Section
            title={t("st2_dsCleanTitle")}
            sub={said ? t("st2_dsCleanSub") : t("st2_dsCleanLocked")}
            badge={<StepBadge n={2} accent={accent} done={heard} />}
          >
            {said && (
              <>
                <RehearsalCallout>{t("st2_dsCleanHonest")}</RehearsalCallout>
                <LinePlayer
                  lines={lines}
                  lang={lang}
                  accent={accent}
                  label={t("st2_dsCleanPlay")}
                  onHeard={() => setHeard(true)}
                />
              </>
            )}
          </Section>

          <Section
            title={t("st2_lpTitle")}
            sub={heard ? t("st2_lpSub") : t("st2_lpLocked")}
            badge={<StepBadge n={3} accent={accent} />}
          >
            {heard && (
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
        </>
      ) : (
        <NeedsPersonCallout>{t("st2_noVoice")}</NeedsPersonCallout>
      )}

      {bookDone && (
        <Section title={t("st2_endTitle")} sub={t("st2_endSub")}>
          {hostLines(story.panels[0].past, lang) && (
            <>
              <RehearsalCallout>{t("st2_endHonest")}</RehearsalCallout>
              <StoryFormPlayer story={story} lang={lang} accent={accent} />
            </>
          )}
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
            tags={[`story:${story.id}`, "retell"]}
            label={t("st2_retellRecord")}
          />
        </Section>
      )}
    </>
  );
}

/* ------------------------------ your own book ---------------------------- */

function OwnBook({ lang, accent, activityId }: { lang: LangCode; accent: string; activityId: string }) {
  const { t } = useApp();
  const [pic, setPic] = useState<PictureItem | null>(null);
  const [mine, setMine] = useState<LibraryItem | null>(null);

  useEffect(() => setMine(null), [pic?.id]);

  return (
    <>
      <Section title={t("st2_ownTitle")} sub={t("st2_ownSub")}>
        <PictureShelf activityId={activityId} selectedId={pic?.id ?? null} onSelect={setPic} />
        {pic && <PictureView pic={pic} className="max-h-[70vh] bg-raised-2" />}
      </Section>

      {pic && (
        <>
          <Section
            title={t("st2_dsSayTitle")}
            sub={t("st2_dsSaySub")}
            badge={<StepBadge n={1} accent={accent} done={Boolean(mine)} />}
          >
            <RecordPanel
              lang={lang}
              phase={2}
              activityId={activityId}
              kind="description"
              speaker="me"
              accent={accent}
              defaultTitle={pic.title}
              tags={["own-book"]}
              label={t("st2_dsRecord")}
              onSaved={setMine}
            />
          </Section>

          <Section
            title={t("st2_ownTakeTitle")}
            sub={t("st2_ownTakeSub")}
            badge={<StepBadge n={2} accent={accent} />}
          >
            <NeedsPersonCallout>{t("st2_ownNoClean")}</NeedsPersonCallout>
            <RecordPanel
              lang={lang}
              phase={2}
              activityId={activityId}
              kind="improved"
              speaker="nurturer"
              accent={accent}
              parentId={mine?.id}
              defaultTitle={`${pic.title} · ${t("st2_herVersion")}`}
              tags={["own-book", "page-recording"]}
              label={t("st2_ownRecordHer")}
              showConsent
            />
          </Section>
        </>
      )}

      {!pic && (
        <Callout icon="📖" title={t("st2_ownHintTitle")}>
          <p>{t("st2_ownHint")}</p>
        </Callout>
      )}
    </>
  );
}

/* ---------------------------- "couldn't say it" --------------------------- */

function StuckNotes({
  notes,
  accent,
  onAdd,
  onRemove,
}: {
  notes: { id: string; text: string }[];
  accent: string;
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useApp();
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          const clean = text.trim().slice(0, 140);
          if (!clean) return;
          onAdd(clean);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(ev) => setText(ev.target.value)}
          maxLength={140}
          placeholder={t("st2_nbPlaceholder")}
          aria-label={t("st2_nbPlaceholder")}
          className="min-w-0 flex-1 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
        />
        <button
          type="submit"
          className="pill min-h-11 px-4 py-2.5 text-sm font-bold text-canvas"
          style={{ background: accent }}
        >
          <Plus size={15} strokeWidth={3} /> {t("st2_nbAdd")}
        </button>
      </form>
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-2.5 text-sm text-ink"
            >
              <span className="min-w-0 flex-1 break-words">{n.text}</span>
              <button
                type="button"
                onClick={() => onRemove(n.id)}
                aria-label={t("st2_nbRemove")}
                className="pill h-9 w-9 shrink-0 justify-center bg-white/5 p-0 text-muted hover:text-mint"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
