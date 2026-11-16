"use client";

import { useEffect, useState } from "react";
import { Check, Dices } from "lucide-react";
import { useApp } from "@/lib/store";
import { IcebergToast, Phase1BGuard, ProgressDots, shuffle, type RoundResult } from "@/app/(app)/practice/shared";
import { CardFace } from "@/app/(app)/session/CardFace";
import type { LangCode, PhaseId } from "@/lib/types";
import { RecordPanel } from "../RecordPanel";
import { Callout, NeedsPersonCallout, RecordingList, RehearsalCallout, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import { hostText, type StudioToolProps } from "../types";
import { GAP_PICS, isAuthored, type GapPic } from "./content";
import {
  ActionButton,
  HearButton,
  Panel,
  Segmented,
  WordsFinishBar,
  pickOne,
  seededShuffle,
  useCredited,
  useLater,
  usePersisted,
  useSpeaker,
} from "./shared";

/**
 * Sixteen Pictures (Phase 1B info-gap). Sixteen scenes — every land under
 * every sky — so one clue is never enough and language has to do the work.
 *
 *  • Listen & find: Nuri describes one scene a clue at a time; the grower finds it.
 *  • Describe: the grower describes a scene aloud and records it (rehearsal).
 *  • With a partner: the real barrier game. Two devices, the same sixteen
 *    pictures in different orders, and only talk to make the grids match.
 */

const ROUND = 8;
type Part = "listen" | "describe" | "partner";
type TileLook = "idle" | "selected" | "right" | "wrong";

const SKY_TINT: Record<string, string> = {
  sun: "bg-amber/20",
  moon: "bg-violet/30",
  rain: "bg-white/5",
  snow: "bg-white/15",
};

const LOOK: Record<TileLook, string> = {
  idle: "border-line",
  selected: "border-white ring-2 ring-white/60",
  right: "border-lime ring-2 ring-lime",
  wrong: "border-coral ring-2 ring-coral/70",
};

function GapTile({
  pic,
  label,
  look = "idle",
  onClick,
  pressed,
}: {
  pic: GapPic;
  label: string;
  look?: TileLook;
  onClick?: () => void;
  pressed?: boolean;
}) {
  const face = (
    <>
      <span className={`absolute inset-x-0 top-0 flex h-[40%] items-center justify-center p-0.5 ${SKY_TINT[pic.sky.id] ?? ""}`}>
        <CardFace itemId={pic.sky.id} emoji={pic.sky.emoji} className="text-lg leading-none sm:text-2xl" imgClassName="h-full w-full" />
      </span>
      <span className="absolute inset-x-0 bottom-0 flex h-[60%] items-center justify-center p-0.5">
        <CardFace itemId={pic.land.id} emoji={pic.land.emoji} className="text-2xl leading-none sm:text-4xl" imgClassName="h-full w-full" />
      </span>
      {look === "right" && (
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-lime text-[11px] font-black text-canvas" aria-hidden>
          ✓
        </span>
      )}
    </>
  );
  const frame = `relative block aspect-square w-full overflow-hidden rounded-2xl border-2 bg-raised-2 ${LOOK[look]}`;
  if (!onClick) return <span className={frame} role="img" aria-label={label}>{face}</span>;
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={pressed} className={`${frame} outline-none focus-visible:ring-2 focus-visible:ring-white`}>
      {face}
    </button>
  );
}

export function InfoGap({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { ids: credited, credit } = useCredited();
  const narrated = isAuthored(lang);
  const [part, setPart] = useState<Part>(narrated ? "listen" : "partner");

  const steps: GuideStep[] = [
    { title: t("st1_igStep1T"), body: t("st1_igStep1B"), who: "both" },
    { title: t("st1_igStep2T"), body: t("st1_igStep2B"), who: "nurturer" },
    { title: t("st1_igStep3T"), body: t("st1_igStep3B"), who: "you" },
    { title: t("st1_igStep4T"), body: t("st1_igStep4B"), who: "both" },
    { title: t("st1_igStep5T"), body: t("st1_igStep5B"), who: "nurturer" },
  ];

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="🧩" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      <Segmented
        label={t("st1_igPart")}
        value={part}
        onChange={setPart}
        accent={accent}
        options={[
          { value: "listen", label: t("st1_igListen"), icon: "👂" },
          { value: "describe", label: t("st1_igDescribe"), icon: "🗣️" },
          { value: "partner", label: t("st1_igPartner"), icon: "🤝" },
        ]}
      />

      {part === "listen" &&
        (narrated ? (
          <ListenFind lang={lang} accent={accent} onCredit={credit} />
        ) : (
          <Callout icon="🤝" title={t("st1_noVoiceTitle")} tone="warm">
            <p>{t("st1_noVoiceBody")}</p>
          </Callout>
        ))}

      {/* the talking halves open with 1B */}
      {part === "describe" && (
        <Phase1BGuard>
          <DescribeSolo activityId={activity.id} phaseId={phase.id} lang={lang} accent={accent} />
        </Phase1BGuard>
      )}
      {part === "partner" && (
        <Phase1BGuard>
          <PartnerTable activityId={activity.id} phaseId={phase.id} lang={lang} accent={accent} />
        </Phase1BGuard>
      )}

      {part !== "listen" && (
        <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} allowWords={false} emptyText={t("st1_sampleEmpty")} />
      )}

      <WordsFinishBar timer={timer} accent={accent} wordIds={credited} />
    </div>
  );
}

/* ---------------------------- listen & find ---------------------------- */

function ListenFind({ lang, accent, onCredit }: { lang: LangCode; accent: string; onCredit: (ids: string[]) => void }) {
  const { t } = useApp();
  const { say, busy } = useSpeaker(lang);
  const later = useLater();
  const [grid, setGrid] = useState<GapPic[]>(GAP_PICS);
  const [target, setTarget] = useState<GapPic | null>(null);
  const [landFirst, setLandFirst] = useState(true);
  const [given, setGiven] = useState(1);
  const [status, setStatus] = useState<"idle" | "ask" | "right" | "done">("idle");
  const [seen, setSeen] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);
  const [flash, setFlash] = useState<{ id: string; look: TileLook } | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [toast, setToast] = useState(false);

  // shuffle on the client only, so server and first client render agree
  useEffect(() => setGrid(shuffle(GAP_PICS)), []);

  const cluesFor = (pic: GapPic, first: boolean): string[] => {
    const land = hostText(pic.land.clue, lang) ?? "";
    const sky = hostText(pic.sky.clue, lang) ?? "";
    return first ? [land, sky] : [sky, land];
  };

  const next = (already: string[]) => {
    const left = GAP_PICS.filter((p) => !already.includes(p.id));
    const pic = pickOne(left.length > 0 ? left : GAP_PICS);
    const first = Math.random() < 0.5;
    setTarget(pic);
    setLandFirst(first);
    setGiven(1);
    setMissed(false);
    setFlash(null);
    setStatus("ask");
    void say(cluesFor(pic, first)[0]);
  };

  const start = () => {
    setSeen([]);
    setResults([]);
    setGrid(shuffle(GAP_PICS));
    next([]);
  };

  const more = () => {
    if (!target) return;
    setGiven(2);
    void say(cluesFor(target, landFirst)[1]);
  };

  const tap = (pic: GapPic) => {
    if (status !== "ask" || !target) return;
    if (pic.id === target.id) {
      const done = [...results, missed ? ("missed" as const) : ("correct" as const)];
      const already = [...seen, target.id];
      setResults(done);
      setSeen(already);
      setStatus("right");
      onCredit([target.land.id, target.sky.id]);
      later(() => {
        if (done.length >= ROUND) {
          setStatus("done");
          setTarget(null);
        } else next(already);
      }, 1100);
      return;
    }
    // one clue fits four pictures: a tap that fits the clue so far is not a mistake — it just needs the rest
    const fitsSoFar = given === 1 && (landFirst ? pic.land.id === target.land.id : pic.sky.id === target.sky.id);
    if (!fitsSoFar) {
      setMissed(true);
      setToast(true);
      later(() => setToast(false), 1700);
    }
    setFlash({ id: pic.id, look: fitsSoFar ? "selected" : "wrong" });
    setGiven(2);
    later(() => {
      setFlash(null);
      void say(fitsSoFar ? cluesFor(target, landFirst)[1] : cluesFor(target, landFirst), 500);
    }, 550);
  };

  const live = status === "ask" || status === "right";

  return (
    <Panel title={t("st1_igListenTitle")} sub={t("st1_igListenSub")}>
      <RehearsalCallout>{t("st1_igListenNote")}</RehearsalCallout>
      <div className="flex flex-wrap items-center gap-3">
        {live && target ? (
          <>
            <HearButton
              onClick={() => void say(cluesFor(target, landFirst).slice(0, given), 500)}
              label={t("tryAgain")}
              accent={accent}
              busy={busy}
            />
            {given < 2 && status === "ask" && (
              <ActionButton onClick={more} accent={accent} quiet>
                {t("st1_igMore")}
              </ActionButton>
            )}
            <p className="min-w-0 flex-1 text-sm text-muted" aria-live="polite">
              {status === "right" ? `✓ ${t("correct")}` : t("st1_igFindIt")}
            </p>
          </>
        ) : (
          <>
            <ActionButton onClick={start} accent={accent}>
              {status === "done" ? t("st1_anotherRound") : t("start")}
            </ActionButton>
            {status === "done" && <p className="text-sm text-muted">{t("st1_igRoundDone")}</p>}
          </>
        )}
      </div>

      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {grid.map((pic, i) => (
          <GapTile
            key={pic.id}
            pic={pic}
            label={t("st1_picture").replace("{n}", String(i + 1))}
            look={status === "right" && target?.id === pic.id ? "right" : flash?.id === pic.id ? flash.look : "idle"}
            onClick={() => tap(pic)}
          />
        ))}
      </div>

      {status !== "idle" && <ProgressDots total={ROUND} current={results.length} results={results} accent={accent} />}
      <IcebergToast show={toast} />
    </Panel>
  );
}

/* ------------------------------ describe ------------------------------- */

interface BenchProps {
  activityId: string;
  phaseId: PhaseId;
  lang: LangCode;
  accent: string;
}

function DescribeSolo({ activityId, phaseId, lang, accent }: BenchProps) {
  const { t } = useApp();
  const { say, busy } = useSpeaker(lang);
  const [pic, setPic] = useState<GapPic>(GAP_PICS[0]);
  useEffect(() => setPic(pickOne(GAP_PICS)), []);

  const model = [hostText(pic.land.clue, lang), hostText(pic.sky.clue, lang)];
  const another = () => setPic(pickOne(GAP_PICS.filter((p) => p.id !== pic.id)));

  return (
    <Panel title={t("st1_igDescribeTitle")} sub={t("st1_igDescribeSub")}>
      <RehearsalCallout>{t("st1_igDescribeNote")}</RehearsalCallout>
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {GAP_PICS.map((p, i) => (
          <div key={p.id} className={p.id === pic.id ? "" : "opacity-45"}>
            <GapTile
              pic={p}
              label={p.id === pic.id ? t("st1_igYourPicture") : t("st1_picture").replace("{n}", String(i + 1))}
              look={p.id === pic.id ? "selected" : "idle"}
            />
          </div>
        ))}
      </div>
      <RecordPanel
        key={pic.id}
        lang={lang}
        phase={phaseId}
        activityId={activityId}
        kind="description"
        speaker="me"
        defaultTitle={`${pic.land.emoji}${pic.sky.emoji} ${t("st1_igDescribeName")}`}
        accent={accent}
        label={t("st1_igRecordMe")}
      />
      <div className="flex flex-wrap items-center gap-3">
        {isAuthored(lang) && (
          <>
            <HearButton onClick={() => void say(model, 500)} label={t("st1_igHearNuri")} accent={accent} busy={busy} size={48} />
            <p className="min-w-0 flex-1 text-sm text-muted">{t("st1_igHearNuriSub")}</p>
          </>
        )}
        <ActionButton onClick={another} accent={accent} quiet>
          {t("st1_igAnother")}
        </ActionButton>
      </div>
    </Panel>
  );
}

/* ---------------------------- with a partner --------------------------- */

interface TableState {
  code: string;
  side: "A" | "B";
  /** the arranger's grid, as picture ids */
  mine: string[];
}

const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const orderFor = (code: string, side: "A" | "B") => seededShuffle(GAP_PICS, `${code}#${side}`).map((p) => p.id);
const picById = (id: string) => GAP_PICS.find((p) => p.id === id) ?? GAP_PICS[0];

function PartnerTable({ activityId, phaseId, lang, accent }: BenchProps) {
  const { t } = useApp();
  const [table, setTable] = usePersisted<TableState>(activityId, lang, { code: "", side: "A", mine: [] });
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const ready = table.code.length >= 3;
  const describerOrder = ready ? orderFor(table.code, "A") : [];
  const mine = table.mine.length === GAP_PICS.length ? table.mine : ready ? orderFor(table.code, "B") : [];
  const matches = mine.filter((id, i) => id === describerOrder[i]).length;

  const setCode = (raw: string) => {
    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setTable((prev) => ({ ...prev, code, mine: code.length >= 3 ? orderFor(code, "B") : [] }));
    setSel(null);
    setChecked(false);
  };

  const newCode = () => setCode(Array.from({ length: 4 }, () => pickOne(CODE_LETTERS.split(""))).join(""));

  const tapMine = (i: number) => {
    if (sel === null) {
      setSel(i);
      return;
    }
    if (sel !== i) {
      const nextOrder = [...mine];
      [nextOrder[sel], nextOrder[i]] = [nextOrder[i], nextOrder[sel]];
      setTable((prev) => ({ ...prev, mine: nextOrder }));
      setChecked(false);
    }
    setSel(null);
  };

  return (
    <Panel title={t("st1_igPartnerTitle")} sub={t("st1_igPartnerSub")}>
      <NeedsPersonCallout>{t("st1_igPartnerNeeds")}</NeedsPersonCallout>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{t("st1_igCode")}</span>
          <input
            value={table.code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={4}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder={t("st1_igCodeHint")}
            className="h-11 w-32 rounded-2xl border border-line bg-canvas px-4 text-center font-display text-lg font-bold tracking-[0.3em] text-ink outline-none focus:border-white/30"
          />
        </label>
        <button
          type="button"
          onClick={newCode}
          className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-ink"
        >
          <Dices size={15} strokeWidth={2.5} aria-hidden /> {t("st1_igNewCode")}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted">{t("st1_igCodeSub")}</p>

      {ready && (
        <>
          <Segmented
            label={t("st1_igSide")}
            value={table.side}
            onChange={(side) => {
              setTable((prev) => ({ ...prev, side }));
              setSel(null);
              setChecked(false);
            }}
            accent={accent}
            options={[
              { value: "A", label: t("st1_igSideA"), icon: "🗣️" },
              { value: "B", label: t("st1_igSideB"), icon: "🧩" },
            ]}
          />
          <p className="text-sm leading-relaxed text-muted">{table.side === "A" ? t("st1_igSideAHelp") : t("st1_igSideBHelp")}</p>

          <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
            {table.side === "A"
              ? describerOrder.map((id, i) => (
                  <GapTile key={id} pic={picById(id)} label={t("st1_igSquare").replace("{n}", String(i + 1))} />
                ))
              : mine.map((id, i) => (
                  <GapTile
                    key={id}
                    pic={picById(id)}
                    label={t("st1_igSquare").replace("{n}", String(i + 1))}
                    pressed={sel === i}
                    look={sel === i ? "selected" : checked ? (id === describerOrder[i] ? "right" : "wrong") : "idle"}
                    onClick={() => tapMine(i)}
                  />
                ))}
          </div>

          {table.side === "B" && (
            <div className="flex flex-wrap items-center gap-3">
              <ActionButton onClick={() => setChecked(true)} accent={accent}>
                <Check size={15} strokeWidth={3} aria-hidden /> {t("st1_igCheck")}
              </ActionButton>
              {checked && (
                <p className="text-sm font-semibold text-ink" role="status">
                  {matches === GAP_PICS.length
                    ? t("st1_igAllMatch")
                    : t("st1_igSomeMatch").replace("{n}", String(matches)).replace("{total}", String(GAP_PICS.length))}
                </p>
              )}
            </div>
          )}

          <RecordPanel
            lang={lang}
            phase={phaseId}
            activityId={activityId}
            kind="primary"
            speaker="both"
            defaultTitle={t("st1_igGameName")}
            accent={accent}
            showConsent
          />
        </>
      )}
    </Panel>
  );
}
