"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, Shuffle } from "lucide-react";
import type { LangCode, PhaseId } from "@/lib/types";
import { useApp } from "@/lib/store";
import type { LibraryItem } from "@/lib/library";
import { ClarifyPlayer } from "../ClarifyPlayer";
import { RecordPanel } from "../RecordPanel";
import {
  FinishBar,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { CARTOON_ASKS, hasP3Content, type CartoonPanel, type CartoonSequence } from "./content";
import { OrderBoard, SoloCartoon, StripView, dealSequence, placedRight, shufflePanels } from "./CartoonParts";
import { useHeard, useStudioState } from "./hooks";
import {
  Disclosure,
  MassageStatus,
  MovesBar,
  NoSoloNote,
  Panel,
  PhraseBank,
  Segmented,
  toPhrases,
  usePlayerMoves,
  type Phrase,
} from "./shared";

/**
 * p3-cartoon — Action Cartoon, with a real information gap. One person sees a
 * wordless action sequence in order and narrates it; the other never sees the
 * order, only the pictures shuffled, and rebuilds the story by ear. Then the
 * roles swap. Solo: Nuri is the one who sees and narrates.
 */

type Mode = "person" | "solo";
type Teller = "nurturer" | "me";
type Stage = "setup" | "handoff" | "narrate" | "cover" | "order" | "reveal";

interface CartoonState {
  mode: Mode;
  /** sequences already dealt, so the next one is new to the listener */
  seen: string[];
}
const EMPTY: CartoonState = { mode: "person", seen: [] };
const MAIN_KINDS = ["primary", "description", "imported"] as const;

/** A full-width "don't look" card between the two views. */
function Cover({ title, body, cta, onGo, accent }: { title: string; body: string; cta: string; onGo: () => void; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-raised-2 px-5 py-10 text-center">
      <EyeOff size={36} strokeWidth={2} className="text-muted" aria-hidden />
      <div>
        <p className="font-display text-lg font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
      </div>
      <button type="button" onClick={onGo} className={`pill min-h-12 px-5 py-3 text-sm font-bold ${textOn(accent)}`} style={{ background: accent }}>
        <Eye size={15} strokeWidth={2.5} aria-hidden /> {cta}
      </button>
    </div>
  );
}

function GapRound({
  lang,
  phaseId,
  activityId,
  accent,
  seen,
  onDealt,
  ask,
  heard,
  markHeard,
  playerMoves,
}: {
  lang: LangCode;
  phaseId: PhaseId;
  activityId: string;
  accent: string;
  seen: string[];
  onDealt: (id: string) => void;
  ask: Phrase[];
  heard: string[];
  markHeard: (id: string) => void;
  playerMoves?: string[];
}) {
  const { t } = useApp();
  const [teller, setTeller] = useState<Teller>("nurturer");
  const [stage, setStage] = useState<Stage>("setup");
  const [seq, setSeq] = useState<CartoonSequence | null>(null);
  const [mixed, setMixed] = useState<CartoonPanel[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [rec, setRec] = useState<LibraryItem | null>(null);

  const deal = (who: Teller) => {
    const next = dealSequence(seen);
    setTeller(who);
    setSeq(next);
    setMixed(shufflePanels(next.panels));
    setOrder([]);
    setRec(null);
    setStage("handoff");
    onDealt(next.id);
  };

  const primary = `pill min-h-12 px-5 py-3 text-sm font-bold ${textOn(accent)}`;
  const nurturerTells = teller === "nurturer";

  if (stage === "setup" || !seq) {
    return (
      <div className="space-y-4">
        <Segmented
          label={t("st3_ctWhoLabel")}
          value={teller}
          onChange={setTeller}
          options={[
            { id: "nurturer", label: t("st3_ctWhoNurturer") },
            { id: "me", label: t("st3_ctWhoMe") },
          ]}
        />
        <p className="text-sm leading-relaxed text-muted">{t(nurturerTells ? "st3_ctSetupNurturer" : "st3_ctSetupMe")}</p>
        {nurturerTells && (
          <PhraseBank title={t("st3_ctAskTitle")} phrases={ask} lang={lang} heard={heard} onHeard={markHeard} />
        )}
        <button type="button" onClick={() => deal(teller)} className={primary} style={{ background: accent }}>
          <Shuffle size={15} strokeWidth={2.5} aria-hidden /> {t("st3_ctDeal")}
        </button>
      </div>
    );
  }

  if (stage === "handoff") {
    return (
      <Cover
        accent={accent}
        title={t(nurturerTells ? "st3_ctHandNurturer" : "st3_ctHandMe")}
        body={t("st3_ctHandBody")}
        cta={t("st3_ctHandGo")}
        onGo={() => setStage("narrate")}
      />
    );
  }

  if (stage === "narrate") {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-coral">
          <Eye size={14} strokeWidth={2.5} aria-hidden /> {t("st3_ctTellerOnly")}
        </p>
        <StripView seq={seq} />
        <p className="text-sm leading-relaxed text-muted">{t("st3_ctTellHint")}</p>
        <RecordPanel
          lang={lang}
          phase={phaseId}
          activityId={activityId}
          kind={nurturerTells ? "primary" : "description"}
          speaker={teller}
          defaultTitle={t(nurturerTells ? "st3_ctLiveName" : "st3_ctMyName")}
          accent={accent}
          tags={["cartoon", seq.id, "live"]}
          showConsent={nurturerTells}
          onSaved={setRec}
        />
        <button type="button" onClick={() => setStage("cover")} className="pill min-h-12 bg-white/10 px-5 py-3 text-sm font-bold text-ink">
          <EyeOff size={15} strokeWidth={2.5} aria-hidden /> {t("st3_ctHide")}
        </button>
      </div>
    );
  }

  if (stage === "cover") {
    return (
      <Cover
        accent={accent}
        title={t("st3_ctCoverTitle")}
        body={t(nurturerTells ? "st3_ctCoverToMe" : "st3_ctCoverToNurturer")}
        cta={t("st3_ctCoverGo")}
        onGo={() => setStage("order")}
      />
    );
  }

  const revealed = stage === "reveal";
  return (
    <div className="space-y-4">
      {revealed ? (
        <>
          <p className="text-sm font-semibold text-ink" role="status">
            {t("st3_ctResult").replace("{n}", String(placedRight(seq, order))).replace("{total}", String(seq.panels.length))}
          </p>
          <StripView seq={seq} order={order} />
          <p className="text-sm leading-relaxed text-muted">{t(rec ? "st3_ctTogether" : "st3_ctTogetherLive")}</p>
        </>
      ) : (
        <OrderBoard panels={mixed} order={order} onChange={setOrder} accent={accent} />
      )}

      {rec ? (
        <ClarifyPlayer item={rec} accent={accent} moves={playerMoves} allowDelete={false} />
      ) : (
        !revealed && <p className="text-sm leading-relaxed text-muted">{t("st3_ctNoRec")}</p>
      )}

      {revealed ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => deal(nurturerTells ? "me" : "nurturer")}
            className={primary}
            style={{ background: accent }}
          >
            <Shuffle size={15} strokeWidth={2.5} aria-hidden /> {t("st3_ctSwap")}
          </button>
          <button
            type="button"
            onClick={() => deal(teller)}
            className="pill min-h-12 border border-line bg-white/6 px-4 py-3 text-sm font-semibold text-ink"
          >
            {t("st3_ctSameRoles")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setStage("reveal")}
          disabled={order.length < seq.panels.length}
          className="pill min-h-11 bg-white/10 px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-40"
        >
          <Check size={14} strokeWidth={3} aria-hidden /> {t("st3_ctCheck")}
        </button>
      )}
    </div>
  );
}

export function ActionCartoon({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<CartoonState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const asks = useMemo(() => toPhrases(CARTOON_ASKS, lang, t), [lang, t]);
  const solo = hasP3Content(lang);
  const mode: Mode = solo ? state.mode : "person";

  const onDealt = (id: string) =>
    setState((s) => ({ ...s, seen: s.seen.includes(id) ? [id] : [...s.seen, id] }));

  const steps: GuideStep[] = [
    { title: t("st3_ctS1"), body: t("st3_ctS1b"), who: "both" },
    { title: t("st3_ctS2"), body: t("st3_ctS2b"), who: "nurturer" },
    { title: t("st3_ctS3"), body: t("st3_ctS3b"), who: "you" },
    { title: t("st3_ctS4"), body: t("st3_ctS4b"), who: "both" },
    { title: t("st3_ctS5"), body: t("st3_ctS5b"), who: "both" },
    { title: t("st3_ctS6"), body: t("st3_ctS6b"), who: "nurturer" },
    { title: t("st3_ctS7"), body: t("st3_ctS7b"), who: "you" },
  ];

  const extras = (it: LibraryItem) =>
    it.speaker === "me" ? null : (
      <>
        <MassageStatus item={it} lang={lang} accent={accent} />
        <Disclosure title={`📼 ${t("st3_ctKeeperTitle")}`}>
          <p className="text-sm leading-relaxed text-muted">{t("st3_ctKeeperHint")}</p>
          <PhraseBank title={t("st3_ctKeeperAsk")} phrases={asks.slice(1)} lang={lang} heard={heard} onHeard={markHeard} />
          <RecordPanel
            lang={lang}
            phase={phase.id}
            activityId={activity.id}
            kind="expansion"
            speaker="nurturer"
            parentId={it.id}
            defaultTitle={`${it.title} · ${t("st3_ctKeeperName")}`}
            accent={accent}
            tags={["cartoon", "keeper"]}
            showConsent
          />
          <RecordingList
            filter={{ parentId: it.id }}
            accent={accent}
            moves={playerMoves}
            title={t("st3_ctKeeperList")}
            emptyText={t("st3_ctKeeperEmpty")}
          />
        </Disclosure>
      </>
    );

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🎬" mode={solo ? "either" : "nurturer"} />
      <StepGuide steps={steps} accent={accent} />

      {solo ? (
        <Segmented
          label={t("st3_modeLabel")}
          value={mode}
          onChange={(m) => setState((s) => ({ ...s, mode: m }))}
          options={[
            { id: "person", label: `🤝 ${t("st3_modePerson")}` },
            { id: "solo", label: `🌱 ${t("st3_modeSolo")}` },
          ]}
        />
      ) : (
        <NoSoloNote />
      )}

      <Panel
        step={1}
        title={t(mode === "solo" ? "st3_ctSoloTitle" : "st3_ctP1")}
        sub={t(mode === "solo" ? "st3_ctSoloSub" : "st3_ctP1b")}
        accent={accent}
      >
        {mode === "solo" ? (
          <SoloCartoon
            lang={lang}
            phaseId={phase.id}
            activityId={activity.id}
            accent={accent}
            seen={state.seen}
            onDealt={onDealt}
          />
        ) : (
          <GapRound
            lang={lang}
            phaseId={phase.id}
            activityId={activity.id}
            accent={accent}
            seen={state.seen}
            onDealt={onDealt}
            ask={asks.slice(0, 1)}
            heard={heard}
            markHeard={markHeard}
            playerMoves={playerMoves}
          />
        )}
      </Panel>

      <Panel step={2} title={t("st3_ctP2")} sub={t("st3_ctP2b")} accent={accent}>
        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
        <RecordingList
          filter={{ activityId: activity.id, lang, kind: [...MAIN_KINDS] }}
          accent={accent}
          moves={playerMoves}
          emptyText={t("st3_ctNoRecordings")}
          renderExtra={extras}
        />
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
