"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import type { LangCode, PhaseId } from "@/lib/types";
import { useApp } from "@/lib/store";
import type { LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import { RehearsalCallout } from "../StudioShell";
import { SAY_STRIPS } from "./content";
import { Disclosure, PhraseBank, PicStrip, type Phrase } from "./shared";

/** The five ways of talking more that the guide's late Phase 3 offers. */
export type TalkWay = "retell" | "life" | "epic" | "day" | "say";

export interface TalkThreadData {
  id: string;
  way: TalkWay;
  title: string;
  /** retell: the massaged recording being told back */
  sourceId?: string;
  /** say: which wordless situation strip */
  strip?: string;
  /** the grower's own recorded telling */
  mineId?: string;
  /** the nurturer's telling of it (or, for "say", the recorded summary) */
  theirsId?: string;
  /** times the grower has told it again to someone else */
  toldTo: number;
}

const OPENER: Record<TalkWay, string> = {
  retell: "tm-check",
  life: "tm-life",
  epic: "tm-next",
  day: "tm-day",
  say: "tm-else",
};

function Saved({ rec }: { rec: LibraryItem }) {
  const { t } = useApp();
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm">
      <Check size={14} strokeWidth={3} className="shrink-0 text-mint" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-semibold text-ink">{rec.title}</span>
      <span className="text-xs text-muted">{t("st3_tmSavedBelow")}</span>
    </p>
  );
}

/** One story being told: the grower's telling, the nurturer's telling of it, and re-tellings. */
export function TalkThread({
  thread,
  mine,
  theirs,
  lang,
  phaseId,
  activityId,
  accent,
  asks,
  prompts,
  heard,
  markHeard,
  onPatch,
  onRemove,
}: {
  thread: TalkThreadData;
  mine?: LibraryItem;
  theirs?: LibraryItem;
  lang: LangCode;
  phaseId: PhaseId;
  activityId: string;
  accent: string;
  /** TALK_ASKS resolved for this language */
  asks: Phrase[];
  /** NURI_PROMPTS resolved for this language (empty text when unauthored) */
  prompts: Phrase[];
  heard: string[];
  markHeard: (id: string) => void;
  onPatch: (patch: Partial<TalkThreadData>) => void;
  onRemove: () => void;
}) {
  const { t } = useApp();
  const tags = ["talk", thread.way, `talk:${thread.id}`];
  const pick = (...ids: string[]) => asks.filter((p) => ids.includes(p.id));
  const heading = "text-xs font-bold uppercase tracking-wide text-muted";
  const strip = SAY_STRIPS.find((s) => s.id === thread.strip);
  const canRehearse = prompts.some((p) => p.text);

  const remove = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onRemove}
        className="flex min-h-10 items-center gap-1.5 text-xs font-semibold text-muted hover:text-coral"
      >
        <Trash2 size={12} strokeWidth={2.5} aria-hidden /> {t("st3_tmRemove")}
      </button>
    </div>
  );

  if (thread.way === "say") {
    return (
      <div className="space-y-4">
        {strip && (
          <ol className="grid grid-cols-3 gap-2">
            {strip.frames.map((frame, i) => (
              <li
                key={i}
                className="relative flex min-h-24 items-center justify-center rounded-3xl bg-canvas px-2 py-4"
              >
                <span className="absolute left-3 top-2 text-xs font-extrabold tabular-nums text-muted">{i + 1}</span>
                <PicStrip pic={frame} className="text-2xl sm:text-3xl" />
              </li>
            ))}
          </ol>
        )}
        <p className="text-sm leading-relaxed text-muted">{t("st3_tmSayHint")}</p>
        <PhraseBank title={t("st3_tmSayAsk")} phrases={pick("tm-else")} lang={lang} heard={heard} onHeard={markHeard} />
        {theirs ? (
          <Saved rec={theirs} />
        ) : (
          <RecordPanel
            lang={lang}
            phase={phaseId}
            activityId={activityId}
            kind="primary"
            speaker="both"
            defaultTitle={thread.title}
            accent={accent}
            tags={tags}
            showConsent
            label={t("st3_tmSayRecord")}
            onSaved={(item) => onPatch({ theirsId: item.id })}
          />
        )}
        {remove}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1 — the grower tells it */}
      <div className="space-y-3">
        <p className={heading}>{t("st3_tmStep1")}</p>
        <p className="text-sm leading-relaxed text-muted">{t(`st3_tmTell_${thread.way}`)}</p>
        <PhraseBank
          title={t("st3_tmOpenTitle")}
          phrases={pick(OPENER[thread.way], "tm-howsay")}
          lang={lang}
          heard={heard}
          onHeard={markHeard}
        />
        {mine ? (
          <Saved rec={mine} />
        ) : (
          <RecordPanel
            lang={lang}
            phase={phaseId}
            activityId={activityId}
            kind={thread.way === "retell" ? "retell" : "journal"}
            speaker="me"
            parentId={thread.way === "retell" ? thread.sourceId : undefined}
            defaultTitle={`${thread.title} · ${t("st3_tmMineName")}`.slice(0, 80)}
            accent={accent}
            tags={tags}
            label={t("st3_tmMineRecord")}
            onSaved={(item) => onPatch({ mineId: item.id })}
          />
        )}
        {canRehearse && (
          <Disclosure title={`🌱 ${t("st3_tmSoloTitle")}`}>
            <RehearsalCallout>{t("st3_tmSoloNote")}</RehearsalCallout>
            <PhraseBank
              title={t("st3_tmSoloPrompts")}
              hint={t("st3_tmSoloPromptsHint")}
              phrases={prompts}
              lang={lang}
              heard={heard}
              onHeard={markHeard}
            />
          </Disclosure>
        )}
      </div>

      {/* 2 — the nurturer tells it back, and THAT is what gets massaged */}
      <div className="space-y-3">
        <p className={heading}>{t("st3_tmStep2")}</p>
        <p className="text-sm leading-relaxed text-muted">{t("st3_tmTheirsHint")}</p>
        <PhraseBank title={t("st3_tmTheirsAsk")} phrases={pick("tm-retell")} lang={lang} heard={heard} onHeard={markHeard} />
        {theirs ? (
          <Saved rec={theirs} />
        ) : (
          <RecordPanel
            lang={lang}
            phase={phaseId}
            activityId={activityId}
            kind="improved"
            speaker="nurturer"
            parentId={mine?.id ?? thread.sourceId}
            defaultTitle={thread.title}
            accent={accent}
            tags={tags}
            showConsent
            label={t("st3_tmTheirsRecord")}
            onSaved={(item) => onPatch({ theirsId: item.id })}
          />
        )}
      </div>

      {/* 3 — tell it again, to someone else */}
      <div className="space-y-3">
        <p className={heading}>{t("st3_tmStep3")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onPatch({ toldTo: thread.toldTo + 1 })}
            className="pill min-h-11 bg-white/10 px-4 py-2.5 text-sm font-bold text-ink"
          >
            <Plus size={14} strokeWidth={3} aria-hidden /> {t("st3_tmToldAgain")}
          </button>
          <p className="text-sm tabular-nums text-ink" aria-live="polite">
            {t("st3_tmToldCount").replace("{n}", String(thread.toldTo))}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted">{t("st3_tmToldHint")}</p>
      </div>
      {remove}
    </div>
  );
}
