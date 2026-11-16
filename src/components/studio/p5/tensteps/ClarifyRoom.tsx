"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, type LibraryItem } from "@/lib/library";
import { RecordPanel } from "../../RecordPanel";
import {
  clearedThisSitting,
  currentStretch,
  isComplete,
  type ClarifyAction,
  type ClarifyFlow,
} from "../clarifyFlow";
import {
  CLARIFY_MOVES,
  DISCUSS_SPEECH,
  DISCUSS_STORY,
  DISCUSS_TALK,
  ELABORATE_MOVES,
  hasHostLines,
  LIFE_MOVES,
  type HostLine,
} from "../content";
import { TAG, tagValue } from "../discourse";
import { addMark, MarkList, marksIn } from "../MarkList";
import { RangePlayer, type SeekRequest } from "../RangePlayer";
import { accentBtn, BTN_GHOST, ChoiceChips, Disclosure, HostPhrases } from "../ui";

type TalkKind = "story" | "talk" | "speech";

const DISCUSS: Record<TalkKind, HostLine[]> = { story: DISCUSS_STORY, talk: DISCUSS_TALK, speech: DISCUSS_SPEECH };

const defaultTalkKind = (item: LibraryItem): TalkKind => {
  const type = tagValue(item, "type");
  return type === "life" ? "story" : type === "public" ? "speech" : "talk";
};

/**
 * The Clarifying Room: steps 5–9 on one stretch at a time.
 * Hear the stretch through together, go back to its start, and work it bit
 * by bit: flag the second the thread is lost, stop, talk it over with the
 * mentor, note what it was, log the word, record the talk about it. When
 * nothing in the stretch is in the way any more, it is clear.
 */
export function ClarifyRoom({
  item,
  flow,
  dispatch,
  accent,
  lang,
  activityId,
}: {
  item: LibraryItem;
  flow: ClarifyFlow;
  dispatch: (action: ClarifyAction) => void;
  accent: string;
  lang: LangCode;
  activityId: string;
}) {
  const { t } = useApp();
  const [seek, setSeek] = useState<SeekRequest | null>(null);
  const [confirmCarry, setConfirmCarry] = useState(false);
  const [talkKind, setTalkKind] = useState<TalkKind>(() => defaultTalkKind(item));

  const stretch = currentStretch(flow);
  if (!stretch) return null;

  const now = () => Date.now();
  const jump = (to: number) => setSeek((prev) => ({ t: to, n: (prev?.n ?? 0) + 1 }));
  const inStretch = marksIn(item, stretch.start, stretch.end);
  const openMarks = inStretch.filter((m) => !m.resolved).length;
  const hearing = flow.pass === "hear" && !stretch.clearedAt;
  const clearedToday = clearedThisSitting(flow).length;
  const allClear = isComplete(flow);

  const clear = () => {
    setConfirmCarry(false);
    dispatch({ type: "clear", now: now(), openMarks });
  };

  return (
    <div className="space-y-4">
      {/* the stretches of this recording */}
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">{t("st5_roomStretches")}</p>
        <ol className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {flow.stretches.map((s) => {
            const on = s.index === stretch.index;
            return (
              <li key={s.index} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmCarry(false);
                    dispatch({ type: "select", now: now(), index: s.index });
                  }}
                  aria-current={on ? "step" : undefined}
                  aria-label={`${t("st5_stretch")} ${s.index + 1}, ${fmtDuration(s.start)}–${fmtDuration(s.end)}${
                    s.clearedAt ? `, ${t("st5_roomCleared")}` : ""
                  }`}
                  className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-2xl border px-3 text-sm font-bold tabular-nums ${
                    on ? "border-white/60 bg-white/15 text-ink" : "border-line bg-white/5 text-muted"
                  }`}
                >
                  {s.clearedAt && <Check size={13} strokeWidth={3.5} className="text-mint" aria-hidden />}
                  {s.index + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-3xl border border-line bg-raised p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-ink">
            {t("st5_stretch")} {stretch.index + 1} / {flow.stretches.length}
          </h3>
          <p className="text-xs tabular-nums text-muted">
            {fmtDuration(stretch.start)}–{stretch.end > stretch.start ? fmtDuration(stretch.end) : "…"}
          </p>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {stretch.clearedAt
            ? `${t("st5_roomClearedOn")} ${new Date(stretch.clearedAt).toLocaleDateString()}`
            : hearing
              ? t("st5_roomHear")
              : t("st5_roomWork")}
        </p>

        <div className="mt-4">
          <RangePlayer
            item={item}
            start={stretch.start}
            end={stretch.end}
            accent={accent}
            marks={item.marks}
            onFlag={(at) => void addMark(item.id, at)}
            flagLabel={t("st5_roomFlag")}
            pauseOnFlag={!hearing}
            onRangeEnd={() => {
              if (hearing) dispatch({ type: "heard", now: now() });
            }}
            seekRequest={seek}
          />
        </div>

        {hearing && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "heard", now: now() });
                jump(stretch.start);
              }}
              className={BTN_GHOST}
            >
              <RotateCcw size={14} strokeWidth={2.5} aria-hidden /> {t("st5_roomHeardGoBack")}
            </button>
          </div>
        )}

        {!hearing && (
          <div className="mt-4">
            <HostPhrases title={t("st5_roomSay")} lines={CLARIFY_MOVES} lang={lang} />
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold text-muted">
            {t("st5_roomMarks")}
            {inStretch.length > 0 && ` · ${inStretch.length - openMarks}/${inStretch.length}`}
          </p>
          <MarkList
            item={item}
            start={stretch.start}
            end={stretch.end}
            accent={accent}
            lang={lang}
            activityId={activityId}
            onJump={jump}
            emptyText={t("st5_roomNoMarks")}
          />
        </div>

        {/* clear / reopen */}
        <div className="mt-5 border-t border-line pt-4">
          {stretch.clearedAt ? (
            <button
              type="button"
              onClick={() => dispatch({ type: "reopen", now: now(), index: stretch.index })}
              className={BTN_GHOST}
            >
              {t("st5_roomReopen")}
            </button>
          ) : confirmCarry ? (
            <div className="space-y-3" role="alert">
              <p className="text-sm text-ink">{t("st5_roomCarryAsk").replace("{n}", String(openMarks))}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={clear} {...accentBtn(accent)}>
                  {t("st5_roomCarryYes")}
                </button>
                <button type="button" onClick={() => setConfirmCarry(false)} className={BTN_GHOST}>
                  {t("st5_roomCarryNo")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (openMarks > 0 ? setConfirmCarry(true) : clear())}
              {...accentBtn(accent)}
            >
              <Check size={15} strokeWidth={3} aria-hidden /> {t("st5_roomClear")}
            </button>
          )}
        </div>
      </div>

      {/* steps 6–9: more to draw out of the mentor */}
      {hasHostLines(ELABORATE_MOVES, lang) && (
        <Disclosure title={t("st5_roomMoreWord")}>
          <p className="text-sm leading-relaxed text-muted">{t("st5_roomMoreWordBody")}</p>
          <HostPhrases title={t("st5_sayIt")} lines={ELABORATE_MOVES} lang={lang} />
        </Disclosure>
      )}

      <Disclosure title={t("st5_roomLife")}>
        <p className="text-sm leading-relaxed text-muted">{t("st5_roomLifeBody")}</p>
        <HostPhrases title={t("st5_sayIt")} lines={LIFE_MOVES} lang={lang} />
        <RecordPanel
          lang={lang}
          phase={5}
          activityId={activityId}
          kind="expansion"
          defaultTitle={`${t("st5_roomLifeRecTitle")}: ${item.title}`.slice(0, 80)}
          accent={accent}
          speaker="nurturer"
          parentId={item.id}
          tags={[TAG.mentorTelling]}
          showConsent
          label={t("st5_roomLifeRec")}
        />
      </Disclosure>

      {hasHostLines(DISCUSS[talkKind], lang) && (
        <Disclosure title={t("st5_roomDiscuss")}>
          <p className="text-sm leading-relaxed text-muted">{t("st5_roomDiscussBody")}</p>
          <ChoiceChips
            label={t("st5_roomDiscussKind")}
            value={talkKind}
            onChange={setTalkKind}
            options={(["story", "talk", "speech"] as const).map((id) => ({ id, label: t(`st5_talk_${id}`) }))}
          />
          <HostPhrases title={t("st5_sayIt")} lines={DISCUSS[talkKind]} lang={lang} />
        </Disclosure>
      )}

      {/* leaving the loop */}
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-raised-2 p-4">
        <p className="min-w-0 flex-1 basis-56 text-sm text-muted">
          {allClear
            ? t("st5_roomAllClear")
            : t("st5_roomClearedToday").replace("{n}", String(clearedToday))}
        </p>
        <button type="button" onClick={() => dispatch({ type: "next", now: now() })} className={BTN_GHOST}>
          {clearedToday > 0 ? t("st5_roomToClean") : t("st5_roomToWrap")} →
        </button>
      </div>
    </div>
  );
}
