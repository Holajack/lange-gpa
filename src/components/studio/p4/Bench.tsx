"use client";

import { useState } from "react";
import { Check, Mic, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode, PhaseId } from "@/lib/types";
import { useLibrary, type LibraryItem } from "@/lib/library";
import { ClarifyPlayer } from "../ClarifyPlayer";
import { RecordPanel } from "../RecordPanel";
import { RecordingList } from "../StudioShell";
import { P4_CLARIFY_MOVES, P4_EXPAND_MOVES, P4_RETELL_OPENER } from "./content";
import {
  AddLine,
  AnonymizeNote,
  ROW,
  SMALL_BTN,
  SUB,
  SayLines,
  hostLines,
  personTag,
  uid,
  useGapTypes,
  type P4Person,
} from "./shared";

/**
 * A follow-up question that grew out of a recording: the "parts to expand"
 * row of the guide's tracking form. It may only come from something the
 * person already mentioned.
 */
export interface FollowUp {
  id: string;
  personId: string;
  /** the recording it grew out of */
  sourceId: string;
  text: string;
  /** a new story to hear, or something to have explained in full */
  kind: "story" | "concept";
  status: "open" | "later" | "answered";
}

/**
 * The working surface for one recorded telling (a life-story chapter or a
 * walk-of-life conversation): clear up the gaps, turn threads into follow-up
 * questions, record the answers under it, then tell it back.
 */
export function ChapterBench({
  item,
  person,
  activityId,
  phaseId,
  lang,
  accent,
  followUps,
  onFollowUps,
  onDeleted,
}: {
  item: LibraryItem;
  person: P4Person;
  activityId: string;
  phaseId: PhaseId;
  lang: LangCode;
  accent: string;
  followUps: FollowUp[];
  onFollowUps: (fn: (prev: FollowUp[]) => FollowUp[]) => void;
  onDeleted: () => void;
}) {
  const { t } = useApp();
  const gapTypes = useGapTypes();
  const { all } = useLibrary();
  const live = all.find((it) => it.id === item.id) ?? item;
  const [recFor, setRecFor] = useState<string | null>(null);

  const moves = hostLines(P4_CLARIFY_MOVES, lang);
  const tags = [personTag(person.id)];
  const mine = followUps.filter((f) => f.sourceId === item.id);
  // flagged moments with a note are ready-made threads: one tap turns them into a question
  const candidates = live.marks.filter(
    (m) => m.note?.trim() && !mine.some((f) => f.id === `fu-${m.id}`)
  );

  const add = (text: string, id = uid("fu")) =>
    onFollowUps((prev) => [
      ...prev,
      { id, personId: person.id, sourceId: item.id, text, kind: "story", status: "open" },
    ]);
  const patch = (id: string, change: Partial<FollowUp>) =>
    onFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, ...change } : f)));

  return (
    <div className="space-y-5">
      {/* steps 2–3: clear up the gaps, log the words */}
      <ClarifyPlayer
        item={live}
        accent={accent}
        gapTypes={gapTypes}
        moves={moves.length > 0 ? moves : undefined}
        onDeleted={onDeleted}
      />

      {/* steps 4–6: what to ask more about */}
      <section className={SUB}>
        <div>
          <h3 className="text-sm font-semibold text-ink">{t("st4_fuTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("st4_fuRule")}</p>
        </div>

        {candidates.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st4_fuFromFlags")}</p>
            <div className="flex flex-wrap gap-2">
              {candidates.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => add((m.note ?? "").trim(), `fu-${m.id}`)}
                  className={`${SMALL_BTN} max-w-full`}
                >
                  <span className="min-w-0 truncate">+ {m.note}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <AddLine placeholder={t("st4_fuPlaceholder")} button={t("st4_fuAdd")} onAdd={(text) => add(text)} accent={accent} />

        {mine.length === 0 ? (
          <p className="text-sm text-muted">{t("st4_fuEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {mine.map((f) => (
              <li key={f.id} className={ROW}>
                <div className="flex flex-wrap items-start gap-2">
                  <p className="min-w-0 flex-1 break-words text-sm text-ink">
                    {f.status === "answered" && (
                      <span className="mr-2 inline-flex items-center gap-1 text-xs font-bold text-mint">
                        <Check size={12} strokeWidth={3} aria-hidden /> {t("st4_fuAnswered")}
                      </span>
                    )}
                    {f.status === "later" && (
                      <span className="mr-2 text-xs font-bold text-amber">{t("st4_fuParked")}</span>
                    )}
                    {f.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => onFollowUps((prev) => prev.filter((x) => x.id !== f.id))}
                    aria-label={t("st4_remove")}
                    className="pill h-10 w-10 shrink-0 justify-center bg-white/5 p-0 text-muted hover:text-coral"
                  >
                    <Trash2 size={14} strokeWidth={2.5} aria-hidden />
                  </button>
                </div>

                {f.status !== "answered" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex gap-1" role="group" aria-label={t("st4_fuKind")}>
                      {(["story", "concept"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => patch(f.id, { kind: k })}
                          aria-pressed={f.kind === k}
                          className={`pill min-h-10 px-3 py-2 text-xs font-bold ${
                            f.kind === k ? "bg-white/15 text-ink" : "bg-white/5 text-muted"
                          }`}
                        >
                          {t(`st4_fuKind_${k}`)}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecFor(recFor === f.id ? null : f.id)}
                      aria-expanded={recFor === f.id}
                      className={SMALL_BTN}
                    >
                      <Mic size={13} strokeWidth={2.5} aria-hidden /> {t("st4_fuRecord")}
                    </button>
                    <button
                      type="button"
                      onClick={() => patch(f.id, { status: f.status === "later" ? "open" : "later" })}
                      aria-pressed={f.status === "later"}
                      className={SMALL_BTN}
                    >
                      {t(f.status === "later" ? "st4_fuUnpark" : "st4_fuPark")}
                    </button>
                  </div>
                )}

                {recFor === f.id && f.status !== "answered" && (
                  <div className="mt-3">
                    <RecordPanel
                      lang={lang}
                      phase={phaseId}
                      activityId={activityId}
                      kind="expansion"
                      speaker="native"
                      parentId={item.id}
                      confidential
                      showConsent
                      tags={tags}
                      accent={accent}
                      defaultTitle={f.text.slice(0, 70)}
                      label={t("st4_fuRecordLabel")}
                      onSaved={() => {
                        patch(f.id, { status: "answered" });
                        setRecFor(null);
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <SayLines lines={P4_EXPAND_MOVES} lang={lang} />
      </section>

      {/* step 7: each answer is a new recording to clear up and mine again */}
      <RecordingList
        filter={{ parentId: item.id, kind: "expansion" }}
        accent={accent}
        gapTypes={gapTypes}
        moves={moves.length > 0 ? moves : undefined}
        title={t("st4_expansionsTitle")}
        emptyText={t("st4_expansionsEmpty")}
      />

      {/* step 8: tell it back */}
      <section className={SUB}>
        <div>
          <h3 className="text-sm font-semibold text-ink">{t("st4_retellTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("st4_retellBody")}</p>
        </div>
        <SayLines lines={P4_RETELL_OPENER} lang={lang} />
        <RecordPanel
          lang={lang}
          phase={phaseId}
          activityId={activityId}
          kind="retell"
          speaker="me"
          parentId={item.id}
          confidential
          tags={tags}
          accent={accent}
          defaultTitle={`${t("st4_retellPrefix")} · ${live.title}`.slice(0, 80)}
          label={t("st4_retellRecord")}
        />
        <AnonymizeNote />
        <RecordingList
          filter={{ parentId: item.id, kind: "retell" }}
          accent={accent}
          allowWords={false}
          title={t("st4_retellList")}
          emptyText={t("st4_retellEmpty")}
        />
      </section>
    </div>
  );
}
