"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/tts";
import { RecordPanel } from "../../RecordPanel";
import { RehearsalCallout } from "../../StudioShell";
import { hostText } from "../../types";
import { scriptsFor } from "../content";
import type { Track } from "../model";
import { AccentButton, Chips, GhostButton } from "../ui";
import type { StageCtx } from "./Stages";

/**
 * Solo role-play warm-up. Nuri plays the CUSTOMER (or the guest at the
 * table); the grower plays the professional (or gives the toast) and records
 * that side, because the professional register is what the track is growing.
 *
 * Nuri only supplies the authored prompt lines. It never shows how a host
 * person would answer and never says how the grower did. The take is for a
 * host friend. With no authored lines for the host language, this renders
 * nothing and the real role-play recorder stands alone.
 */
export function Rehearsal({
  ctx,
  track,
  onPatch,
}: {
  ctx: StageCtx;
  track: Track;
  onPatch: (fn: (track: Track) => Track) => void;
}) {
  const { t } = useApp();
  const scripts = scriptsFor(ctx.lang);
  const script =
    scripts.find((s) => s.id === track.script) ??
    scripts.find((s) => Boolean(track.seed) && s.seeds.includes(track.seed ?? "")) ??
    scripts[0];

  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState<number[]>([]);
  const [showWords, setShowWords] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const alive = useRef(true);
  const playToken = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopSpeaking();
    };
  }, []);

  if (!script) return null;

  const total = script.lines.length;
  const line = hostText(script.lines[index], ctx.lang) ?? "";
  const lineHeard = heard.includes(index);

  const play = async () => {
    if (!line) return;
    const token = ++playToken.current;
    const playedIndex = index;
    setSpeaking(true);
    await speak(line, ctx.lang, 0.95);
    // a line that was cut off (next line, other script, unmount) was not heard
    if (!alive.current || token !== playToken.current) return;
    setSpeaking(false);
    setHeard((h) => (h.includes(playedIndex) ? h : [...h, playedIndex]));
  };

  const halt = () => {
    playToken.current += 1;
    stopSpeaking();
    setSpeaking(false);
  };

  const go = (to: number) => {
    halt();
    setIndex(Math.max(0, Math.min(total - 1, to)));
  };

  const choose = (id: string) => {
    halt();
    setIndex(0);
    setHeard([]);
    setShowWords(false);
    onPatch((tr) => ({ ...tr, script: id }));
  };

  return (
    <div className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      <RehearsalCallout>{t("st6_d_rehBody")}</RehearsalCallout>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted">{t("st6_d_rehPick")}</p>
        <Chips
          label={t("st6_d_rehPick")}
          options={scripts.map((s) => ({ id: s.id, label: t(`st6_d_scr_${s.id}`), icon: s.icon }))}
          value={[script.id]}
          onToggle={choose}
        />
        <p className="mt-2 text-sm leading-relaxed text-muted">{t(`st6_d_scr_${script.id}_scene`)}</p>
      </div>

      <div className="rounded-2xl border border-line bg-canvas p-4">
        <p className="text-xs font-semibold text-muted">
          {t("st6_d_rehLine").replace("{n}", String(index + 1)).replace("{t}", String(total))}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AccentButton accent={ctx.accent} onClick={play} disabled={speaking}>
            <Volume2 size={16} strokeWidth={2.5} /> {lineHeard ? t("st6_d_rehAgain") : t("st6_d_rehHear")}
          </AccentButton>
          {lineHeard && (
            <GhostButton onClick={() => setShowWords((v) => !v)} pressed={showWords}>
              {showWords ? t("st6_d_rehHideWords") : t("st6_d_rehShowWords")}
            </GhostButton>
          )}
        </div>
        {showWords && lineHeard && (
          <p lang={ctx.lang} className="mt-3 text-lg leading-relaxed text-ink">
            {line}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("st6_d_rehYourTurn")}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <GhostButton onClick={() => go(index - 1)} disabled={index === 0} label={t("st6_d_rehPrev")}>
            <ChevronLeft size={16} strokeWidth={2.5} />
          </GhostButton>
          <GhostButton onClick={() => go(index + 1)} disabled={index >= total - 1}>
            {t("st6_d_rehNext")} <ChevronRight size={16} strokeWidth={2.5} />
          </GhostButton>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted">{t("st6_d_rehHow")}</p>
      <RecordPanel
        lang={ctx.lang}
        phase={ctx.phaseId}
        activityId={ctx.activityId}
        kind="feedback"
        speaker="me"
        tags={[ctx.trackTag, "stage:roleplay", "rehearsal"]}
        defaultTitle={`${t("st6_d_rehName")} · ${t(`st6_d_scr_${script.id}`)}`.slice(0, 80)}
        accent={ctx.accent}
        label={t("st6_d_rehRecord")}
      />
      <p className="text-xs leading-relaxed text-muted">{t("st6_d_rehAfter")}</p>
    </div>
  );
}
