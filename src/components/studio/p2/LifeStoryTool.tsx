"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Pencil, Smile, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLibrary, usePictures } from "@/lib/library";
import type { StudioToolProps } from "../types";
import {
  Callout,
  ConfidentialBanner,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  RehearsalCallout,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import { RecordPanel } from "../RecordPanel";
import { BlobImg, newId, Pager, Section, Segmented, StepBadge, useStored } from "./kit";
import { SketchPad } from "./SketchPad";

type Who = "mine" | "theirs";
type AddMode = "emoji" | "draw" | null;

interface Moment {
  id: string;
  emoji?: string;
  /** a drawing or photo in the device-only picture store */
  picId?: string;
  /** optional name or word in the host language */
  cap?: string;
}

interface LifeState {
  mine: Moment[];
  theirs: Moment[];
  /** the main telling for each side: library recording id */
  recs: Partial<Record<Who, string>>;
}

const INITIAL: LifeState = { mine: [], theirs: [], recs: {} };

/** Quick stand-ins for a life moment when there is no time to draw. */
const LIFE_EMOJI = [
  "👶", "🏠", "👨‍👩‍👧", "👵", "🏫", "🎒", "⚽", "🎸",
  "📚", "🎓", "💼", "🛠️", "🌾", "✈️", "🚆", "🚗",
  "🚲", "🌍", "🏔️", "🌊", "🏙️", "🏥", "💍", "❤️",
  "🎂", "🐕", "🐈", "🌱", "🍲", "🎁", "📷", "⭐",
];

/**
 * p2-lifestory — Draw As You Go (2C). A timeline of life moments, each a
 * quick drawing, an emoji or a picture of your own, told aloud while it
 * records. Your nurturer's story is captured the same way and kept
 * confidential. Nuri never tells a life story: it does not have one.
 */
export function LifeStoryTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, update] = useStored<LifeState>(activity.id, lang, INITIAL);
  const { add: addPicture, remove: removePicture } = usePictures(activity.id);
  const { all } = useLibrary();
  const [who, setWho] = useState<Who>("mine");
  const [index, setIndex] = useState(0);
  const [adding, setAdding] = useState<AddMode>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const accent = phase.color;

  const moments = state[who];
  const current = moments[Math.min(index, moments.length - 1)] as Moment | undefined;
  const at = current ? moments.indexOf(current) : -1;
  const telling = all.find((it) => it.id === state.recs[who]);
  const theirs = who === "theirs";

  const setMoments = (fn: (list: Moment[]) => Moment[]) => update((s) => ({ ...s, [who]: fn(s[who]) }));

  const addMoment = (moment: Omit<Moment, "id">) => {
    setMoments((list) => [...list, { ...moment, id: newId("m") }]);
    setIndex(moments.length);
    setAdding(null);
  };

  const addImage = async (blob: Blob, title: string) => {
    const pic = await addPicture({ activityId: activity.id, title }, blob);
    addMoment({ picId: pic.id });
  };

  const removeMoment = (moment: Moment) => {
    if (moment.picId) void removePicture(moment.picId);
    setMoments((list) => list.filter((m) => m.id !== moment.id));
    setIndex((i) => Math.max(0, i - 1));
  };

  const shift = (dir: -1 | 1) => {
    const to = at + dir;
    if (at < 0 || to < 0 || to >= moments.length) return;
    setMoments((list) => {
      const next = [...list];
      [next[at], next[to]] = [next[to], next[at]];
      return next;
    });
    setIndex(to);
  };

  const steps: GuideStep[] = [
    { title: t("st2_lsS1"), body: t("st2_lsS1b"), who: "you" },
    { title: t("st2_lsS2"), body: t("st2_lsS2b"), who: "you" },
    { title: t("st2_lsS3"), body: t("st2_lsS3b"), who: "nurturer" },
    { title: t("st2_lsS4"), body: t("st2_lsS4b"), who: "both" },
    { title: t("st2_lsS5"), body: t("st2_lsS5b"), who: "nurturer" },
  ];

  const momentLabel = (i: number) => t("st2_lsMomentN").replace("{n}", String(i + 1));

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="✏️" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st2_lsNeeds")}</NeedsPersonCallout>

      <Callout icon="🌿" title={t("st2_lsLaterTitle")}>
        <p>{t("st2_lsLater")}</p>
        <Link
          href="/studio/p2-storybuild"
          className="mt-2 inline-block text-sm font-semibold text-ink underline underline-offset-4"
        >
          {t("st2_lsLaterLink")} →
        </Link>
      </Callout>

      <Segmented
        value={who}
        onChange={(next) => {
          setWho(next);
          setIndex(0);
          setAdding(null);
        }}
        label={t("st2_lsWhoLabel")}
        options={[
          { id: "mine", label: t("st2_lsMine"), icon: "🙋" },
          { id: "theirs", label: t("st2_lsTheirs"), icon: "🤝" },
        ]}
      />
      {theirs && <ConfidentialBanner />}

      {/* ---- the timeline ---- */}
      <Section
        title={theirs ? t("st2_lsLineTheirs") : t("st2_lsLineMine")}
        sub={theirs ? t("st2_lsLineTheirsSub") : t("st2_lsLineMineSub")}
        badge={<StepBadge n={1} accent={accent} done={moments.length > 0} />}
      >
        {moments.length > 0 && (
          <ol className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1">
            {moments.map((m, i) => (
              <li key={m.id} className="flex shrink-0 items-center gap-2">
                {i > 0 && <span className="h-0.5 w-3 rounded-full bg-white/20" aria-hidden />}
                <button
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setAdding(null);
                  }}
                  aria-pressed={at === i}
                  aria-label={momentLabel(i)}
                  className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 bg-raised-2 text-4xl ${
                    at === i ? "border-white" : "border-transparent"
                  }`}
                >
                  {m.picId ? (
                    <BlobImg id={m.picId} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>{m.emoji}</span>
                  )}
                  <span className="absolute left-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-canvas/85 px-1 text-[10px] font-bold text-ink">
                    {i + 1}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">{t("st2_lsAddTitle")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={adding === "draw"}
              onClick={() => setAdding(adding === "draw" ? null : "draw")}
              className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink"
            >
              <Pencil size={15} strokeWidth={2.5} /> {t("st2_lsAddDraw")}
            </button>
            <button
              type="button"
              aria-pressed={adding === "emoji"}
              onClick={() => setAdding(adding === "emoji" ? null : "emoji")}
              className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink"
            >
              <Smile size={15} strokeWidth={2.5} /> {t("st2_lsAddEmoji")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(ev) => {
                const file = ev.target.files?.[0];
                ev.target.value = "";
                if (file && file.type.startsWith("image/")) {
                  void addImage(file, file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 60));
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink"
            >
              <ImagePlus size={15} strokeWidth={2.5} /> {t("st2_lsAddPicture")}
            </button>
          </div>
        </div>

        {adding === "draw" && (
          <SketchPad
            accent={accent}
            onCancel={() => setAdding(null)}
            onSave={(png) => void addImage(png, momentLabel(moments.length))}
          />
        )}
        {adding === "emoji" && (
          <div role="group" aria-label={t("st2_lsAddEmoji")} className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {LIFE_EMOJI.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addMoment({ emoji })}
                aria-label={`${t("st2_lsUseEmoji")} ${emoji}`}
                className="flex aspect-square min-h-11 items-center justify-center rounded-2xl border border-line bg-raised-2 text-2xl hover:bg-white/10"
              >
                <span aria-hidden>{emoji}</span>
              </button>
            ))}
          </div>
        )}
        {moments.length === 0 && !adding && <p className="text-sm text-muted">{t("st2_lsEmpty")}</p>}
      </Section>

      {/* ---- one moment at a time: the thing you look at while telling ---- */}
      {current && (
        <Section
          title={t("st2_lsWalkTitle")}
          sub={t("st2_lsWalkSub")}
          badge={<StepBadge n={2} accent={accent} />}
        >
          <div className="mx-auto flex aspect-[4/3] w-full max-w-xl items-center justify-center overflow-hidden rounded-3xl border border-line bg-raised-2">
            {current.picId ? (
              <BlobImg id={current.picId} alt={momentLabel(at)} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[7rem] leading-none sm:text-[9rem]" role="img" aria-label={momentLabel(at)}>
                {current.emoji}
              </span>
            )}
          </div>
          <Pager
            index={at}
            count={moments.length}
            onChange={setIndex}
            label={t("st2_lsMomentOf").replace("{n}", String(at + 1)).replace("{total}", String(moments.length))}
            prevLabel={t("st2_lsPrev")}
            nextLabel={t("st2_lsNext")}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st2_lsCapLabel")}</span>
            <input
              value={current.cap ?? ""}
              onChange={(ev) =>
                setMoments((list) =>
                  list.map((m) => (m.id === current.id ? { ...m, cap: ev.target.value.slice(0, 60) } : m))
                )
              }
              maxLength={60}
              lang={lang}
              placeholder={t("st2_lsCapPlaceholder")}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              disabled={at <= 0}
              className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-30"
            >
              <ArrowLeft size={14} strokeWidth={2.5} /> {t("st2_lsEarlier")}
            </button>
            <button
              type="button"
              onClick={() => shift(1)}
              disabled={at >= moments.length - 1}
              className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-30"
            >
              {t("st2_lsLaterMove")} <ArrowRight size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => removeMoment(current)}
              className="pill ml-auto min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-muted hover:text-coral"
            >
              <Trash2 size={14} strokeWidth={2.5} /> {t("st2_lsRemove")}
            </button>
          </div>
        </Section>
      )}

      {/* ---- tell it, and hear it told back ---- */}
      <Section
        title={theirs ? t("st2_lsTellTheirs") : t("st2_lsTellMine")}
        sub={theirs ? t("st2_lsTellTheirsSub") : t("st2_lsTellMineSub")}
        badge={<StepBadge n={3} accent={accent} done={Boolean(telling)} />}
      >
        {!theirs && <RehearsalCallout>{t("st2_lsSoloHonest")}</RehearsalCallout>}
        <RecordPanel
          key={`${who}-tell`}
          lang={lang}
          phase={2}
          activityId={activity.id}
          kind="primary"
          speaker={theirs ? "nurturer" : "me"}
          accent={accent}
          confidential={theirs}
          showConsent={theirs}
          defaultTitle={theirs ? t("st2_lsNameTheirs") : t("st2_lsNameMine")}
          tags={["life-story", who]}
          label={theirs ? t("st2_lsRecordTheirs") : t("st2_lsRecordMine")}
          onSaved={(item) => update((s) => ({ ...s, recs: { ...s.recs, [who]: item.id } }))}
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">{theirs ? t("st2_lsBackTheirs") : t("st2_lsBackMine")}</p>
          <p className="text-xs leading-relaxed text-muted">
            {theirs ? t("st2_lsBackTheirsSub") : t("st2_lsBackMineSub")}
          </p>
          <RecordPanel
            key={`${who}-back`}
            lang={lang}
            phase={2}
            activityId={activity.id}
            kind={theirs ? "retell" : "improved"}
            speaker={theirs ? "me" : "nurturer"}
            accent={accent}
            parentId={telling?.id}
            confidential={theirs}
            showConsent={!theirs}
            defaultTitle={theirs ? t("st2_lsNameTheirsBack") : t("st2_lsNameMineBack")}
            tags={["life-story", who, "retelling"]}
            label={theirs ? t("st2_lsRecordTheirsBack") : t("st2_lsRecordMineBack")}
          />
        </div>
      </Section>

      <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} />
      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
