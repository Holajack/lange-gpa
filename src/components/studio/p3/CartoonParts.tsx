"use client";

import { useState } from "react";
import { Check, Play, Shuffle, Square } from "lucide-react";
import type { LangCode, PhaseId } from "@/lib/types";
import { useApp } from "@/lib/store";
import { RecordPanel } from "../RecordPanel";
import { RehearsalCallout, textOn } from "../StudioShell";
import { hostText } from "../types";
import { CARTOONS, type CartoonPanel, type CartoonSequence } from "./content";
import { shuffled, useNarrator } from "./hooks";
import { PicStrip } from "./shared";

/** A sequence the listener hasn't been dealt yet (starts over once all are used). */
export function dealSequence(seen: string[]): CartoonSequence {
  const fresh = CARTOONS.filter((c) => !seen.includes(c.id));
  const pool = fresh.length > 0 ? fresh : CARTOONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** The panels in an order that is never the true one. */
export function shufflePanels(panels: CartoonPanel[]): CartoonPanel[] {
  for (let i = 0; i < 8; i++) {
    const mixed = shuffled(panels);
    if (mixed.some((p, ix) => p.id !== panels[ix].id)) return mixed;
  }
  return [...panels].reverse();
}

/** How many pictures the listener put in the right place. */
export function placedRight(seq: CartoonSequence, order: string[]): number {
  return seq.panels.filter((p, i) => order[i] === p.id).length;
}

/** The pictures in their true order: the narrator's view, and the reveal. */
export function StripView({
  seq,
  order,
  active,
}: {
  seq: CartoonSequence;
  /** the listener's order, to show which pictures landed in place */
  order?: string[];
  /** index being narrated right now */
  active?: number | null;
}) {
  const { t } = useApp();
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {seq.panels.map((p, i) => {
        const guessed = order ? order.indexOf(p.id) : -1;
        const right = guessed === i;
        return (
          <li
            key={p.id}
            className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 bg-raised-2 px-2 py-4 ${
              active === i ? "border-white" : "border-transparent"
            }`}
          >
            <span className="absolute left-3 top-2 text-xs font-extrabold tabular-nums text-muted">{i + 1}</span>
            <PicStrip pic={p.art} className="text-3xl sm:text-4xl" />
            {order && (
              <span className={`text-[11px] font-bold ${right ? "text-mint" : "text-muted"}`}>
                {right ? `✓ ${t("st3_ctInPlace")}` : t("st3_ctYouPut").replace("{n}", String(guessed + 1))}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The listener's view: shuffled pictures, tapped into the order they were told in. */
export function OrderBoard({
  panels,
  order,
  onChange,
  accent,
}: {
  panels: CartoonPanel[];
  order: string[];
  onChange: (order: string[]) => void;
  accent: string;
}) {
  const { t } = useApp();
  return (
    <div>
      <p className="mb-2 text-xs leading-relaxed text-muted">{t("st3_ctOrderHint")}</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {panels.map((p, i) => {
          const at = order.indexOf(p.id);
          const picked = at >= 0;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onChange(picked ? order.filter((id) => id !== p.id) : [...order, p.id])}
                aria-pressed={picked}
                aria-label={
                  picked
                    ? t("st3_ctTilePlaced").replace("{k}", String(i + 1)).replace("{n}", String(at + 1))
                    : t("st3_ctTile").replace("{k}", String(i + 1))
                }
                className={`relative flex min-h-28 w-full items-center justify-center rounded-3xl border-2 bg-raised-2 px-2 py-4 ${
                  picked ? "border-white" : "border-transparent hover:bg-white/8"
                }`}
              >
                {picked && (
                  <span
                    className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold tabular-nums ${textOn(accent)}`}
                    style={{ background: accent }}
                  >
                    {at + 1}
                  </span>
                )}
                <PicStrip pic={p.art} className="text-3xl sm:text-4xl" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Solo rehearsal. Nuri holds the true order and narrates it; the grower only
 * ever sees the pictures shuffled and rebuilds the order by ear.
 */
export function SoloCartoon({
  lang,
  phaseId,
  activityId,
  accent,
  seen,
  onDealt,
}: {
  lang: LangCode;
  phaseId: PhaseId;
  activityId: string;
  accent: string;
  seen: string[];
  onDealt: (id: string) => void;
}) {
  const { t } = useApp();
  const narrator = useNarrator(lang);
  const [seq, setSeq] = useState<CartoonSequence | null>(null);
  const [mixed, setMixed] = useState<CartoonPanel[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [heard, setHeard] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const deal = () => {
    narrator.stop();
    const next = dealSequence(seen);
    setSeq(next);
    setMixed(shufflePanels(next.panels));
    setOrder([]);
    setHeard(false);
    setRevealed(false);
    setActive(null);
    onDealt(next.id);
  };

  const narrate = async (withPictures: boolean) => {
    if (!seq) return;
    const lines = seq.panels.map((p) => hostText(p.line, lang) ?? "");
    const whole = await narrator.say(lines, {
      id: "story",
      gap: 500,
      onStart: (i) => setActive(withPictures ? i : null),
    });
    setActive(null);
    if (whole) setHeard(true);
  };

  const primary = `pill min-h-12 px-5 py-3 text-sm font-bold ${textOn(accent)}`;
  const telling = narrator.playing === "story";

  return (
    <div className="space-y-4">
      <RehearsalCallout>{t("st3_ctSoloNote")}</RehearsalCallout>

      {!seq ? (
        <button type="button" onClick={deal} className={primary} style={{ background: accent }}>
          <Shuffle size={15} strokeWidth={2.5} aria-hidden /> {t("st3_ctDeal")}
        </button>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {telling ? (
              <button type="button" onClick={narrator.stop} className="pill min-h-12 bg-coral px-5 py-3 text-sm font-bold text-canvas">
                <Square size={14} strokeWidth={3} aria-hidden /> {t("st3_trStop")}
              </button>
            ) : (
              <button type="button" onClick={() => narrate(revealed)} className={primary} style={{ background: accent }}>
                <Play size={15} strokeWidth={3} aria-hidden />
                {t(revealed ? "st3_ctHearWith" : heard ? "st3_ctHearAgain" : "st3_ctHear")}
              </button>
            )}
            <button
              type="button"
              onClick={deal}
              className="pill min-h-12 border border-line bg-white/6 px-4 py-3 text-sm font-semibold text-ink"
            >
              <Shuffle size={14} strokeWidth={2.5} aria-hidden /> {t("st3_ctDealAnother")}
            </button>
          </div>

          {!revealed ? (
            <>
              <OrderBoard panels={mixed} order={order} onChange={setOrder} accent={accent} />
              <button
                type="button"
                onClick={() => setRevealed(true)}
                disabled={!heard || order.length < seq.panels.length}
                className="pill min-h-11 bg-white/10 px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-40"
              >
                <Check size={14} strokeWidth={3} aria-hidden /> {t("st3_ctCheck")}
              </button>
              {!heard && <p className="text-xs text-muted">{t("st3_ctListenFirst")}</p>}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink" role="status">
                {t("st3_ctResult")
                  .replace("{n}", String(placedRight(seq, order)))
                  .replace("{total}", String(seq.panels.length))}
              </p>
              <StripView seq={seq} order={order} active={active} />
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">🎙️ {t("st3_ctYourTurn")}</p>
                <p className="mb-3 text-xs leading-relaxed text-muted">{t("st3_ctYourTurnHint")}</p>
                <RecordPanel
                  lang={lang}
                  phase={phaseId}
                  activityId={activityId}
                  kind="description"
                  speaker="me"
                  defaultTitle={t("st3_ctMyName")}
                  accent={accent}
                  tags={["cartoon", seq.id, "rehearsal"]}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
