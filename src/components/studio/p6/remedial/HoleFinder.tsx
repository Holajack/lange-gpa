"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import type { LangCode, PhaseId } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, useLibrary } from "@/lib/library";
import type { GapType } from "../../ClarifyPlayer";
import { RecordPanel } from "../../RecordPanel";
import { NeedsPersonCallout } from "../../StudioShell";
import { hostMoves } from "../content";
import { HOLE_CARDS } from "../model";
import { TaggedRecordingList, hasTags } from "../Recordings";
import { Chips, GhostButton, Panel } from "../ui";

const HOLE_KINDS = ["word", "build", "view", "unsure"] as const;
type CardId = (typeof HOLE_CARDS)[number]["id"];

/**
 * Hole-finding studio. The finding half is genuinely solo: take a card, talk
 * it through out loud while recording, then play it back and flag every
 * place you stalled. The filling half is not: the flagged holes become a
 * list to carry to a host friend. Nuri never supplies the missing words.
 */
export function HoleFinder({
  lang,
  phaseId,
  activityId,
  accent,
}: {
  lang: LangCode;
  phaseId: PhaseId;
  activityId: string;
  accent: string;
}) {
  const { t } = useApp();
  const [cardId, setCardId] = useState<CardId>(HOLE_CARDS[0].id);
  const card = HOLE_CARDS.find((c) => c.id === cardId) ?? HOLE_CARDS[0];
  const { items } = useLibrary({ activityId, lang, kind: "feedback" });

  const takes = items.filter((it) => hasTags(it, ["holes"]));
  const open = takes.flatMap((it) => it.marks.filter((m) => !m.resolved).map((m) => ({ item: it, mark: m })));
  const filled = takes.reduce((sum, it) => sum + it.marks.filter((m) => m.resolved).length, 0);
  const holeKinds: GapType[] = HOLE_KINDS.map((id) => ({ id, label: t(`st6_m_hole_${id}`) }));

  const another = () => {
    const rest = HOLE_CARDS.filter((c) => c.id !== cardId);
    const next = rest[Math.floor(Math.random() * rest.length)];
    if (next) setCardId(next.id);
  };

  return (
    <div id="p6-holes" className="scroll-mt-24">
      <Panel title={t("st6_m_holesTitle")} sub={t("st6_m_holesSub")}>
        {/* the card */}
        <div className="rounded-3xl border border-line bg-raised-2 p-5">
          <div className="flex items-start gap-4">
            <span className="text-4xl" aria-hidden>
              {card.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
                {t(`st6_m_cardT_${card.id}`)}
              </p>
              <p className="mt-1 text-base font-semibold leading-relaxed text-ink">{t(`st6_m_card_${card.id}`)}</p>
            </div>
          </div>
          <div className="mt-4">
            <GhostButton onClick={another}>
              <Shuffle size={15} strokeWidth={2.5} /> {t("st6_m_cardAnother")}
            </GhostButton>
          </div>
        </div>
        <details>
          <summary className="cursor-pointer text-xs font-semibold text-muted">{t("st6_m_cardAll")}</summary>
          <div className="mt-3">
            <Chips
              label={t("st6_m_cardAll")}
              options={HOLE_CARDS.map((c) => ({ id: c.id, label: t(`st6_m_cardT_${c.id}`), icon: c.icon }))}
              value={[cardId]}
              onToggle={setCardId}
            />
          </div>
        </details>

        {/* 1 · talk it through */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">
            <span className="mr-2 text-muted">1.</span>
            {t("st6_m_holes_s1")}
          </p>
          <p className="text-sm leading-relaxed text-muted">{t("st6_m_holes_s1B")}</p>
          <RecordPanel
            lang={lang}
            phase={phaseId}
            activityId={activityId}
            kind="feedback"
            speaker="me"
            tags={["holes", `card:${card.id}`]}
            defaultTitle={`${t("st6_m_holeName")} · ${t(`st6_m_cardT_${card.id}`)}`.slice(0, 80)}
            accent={accent}
            label={t("st6_m_holeRecord")}
          />
        </div>

        {/* 2 · mark the holes */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">
            <span className="mr-2 text-muted">2.</span>
            {t("st6_m_holes_s2")}
          </p>
          <p className="text-sm leading-relaxed text-muted">{t("st6_m_holes_s2B")}</p>
          <TaggedRecordingList
            filter={{ activityId, lang, kind: "feedback" }}
            tags={["holes"]}
            accent={accent}
            gapTypes={holeKinds}
            moves={hostMoves("feedback", lang)}
            title={t("st6_m_holeList")}
            emptyText={t("st6_m_holeEmpty")}
          />
        </div>

        {/* 3 · bring them to a person */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">
            <span className="mr-2 text-muted">3.</span>
            {t("st6_m_holes_s3")}
          </p>
          <NeedsPersonCallout>{t("st6_m_holes_s3B")}</NeedsPersonCallout>
          {open.length === 0 ? (
            <p className="text-sm text-muted">{t("st6_m_bringEmpty")}</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-muted">
                {t("st6_m_bringCount").replace("{n}", String(open.length)).replace("{f}", String(filled))}
              </p>
              <ul className="space-y-2">
                {open.map(({ item, mark }) => (
                  <li key={mark.id} className="rounded-2xl border border-line bg-raised-2 px-4 py-2.5 text-sm">
                    <span className="block break-words text-ink">{mark.note?.trim() || t("st6_m_bringNoNote")}</span>
                    <span className="block text-xs text-muted">
                      {item.title} · {fmtDuration(mark.t)}
                      {mark.gap && HOLE_KINDS.includes(mark.gap as (typeof HOLE_KINDS)[number])
                        ? ` · ${t(`st6_m_hole_${mark.gap}`)}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
