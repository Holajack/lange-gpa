"use client";

import { useEffect, useRef, useState } from "react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/tts";
import { Mascot } from "@/components/Mascot";
import { RecordPanel } from "../../RecordPanel";
import { RehearsalCallout } from "../../StudioShell";
import { hostText } from "../../types";
import { EPIC_CLOSE, EPIC_NUDGES, EPIC_OPEN, hostLines } from "../content";
import { TAG } from "../discourse";
import { BTN_GHOST } from "../ui";

/**
 * Nuri as a rehearsal audience. It listens, and when the grower is stuck it
 * says one of a handful of plain listener's prompts. It does not follow the
 * story and never comments on the language: that belongs to real listeners.
 * Renders nothing for a language with no authored lines.
 */
export function RehearsalAudience({
  lang,
  accent,
  activityId,
  title,
  tags,
}: {
  lang: LangCode;
  accent: string;
  activityId: string;
  /** default name for a rehearsal take */
  title: string;
  tags: string[];
}) {
  const { t } = useApp();
  const [said, setSaid] = useState<string | null>(null);
  const nudgeAt = useRef(0);
  const open = hostText(EPIC_OPEN.text, lang);
  const close = hostText(EPIC_CLOSE.text, lang);
  const nudges = hostLines(EPIC_NUDGES, lang);

  useEffect(() => () => stopSpeaking(), []);

  if (!open || !close || nudges.length === 0) return null;

  const say = (text: string) => {
    setSaid(text);
    void speak(text, lang);
  };

  return (
    <div className="space-y-4">
      <RehearsalCallout>{t("st5_epRehearsalBody")}</RehearsalCallout>
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-raised-2 p-4 sm:flex-row sm:items-start sm:p-5">
        <Mascot size={96} mood={said ? "happy" : "think"} />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="min-h-6 text-sm font-semibold text-ink" aria-live="polite">
            {said ? `“${said}”` : t("st5_epRehearsalIdle")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => say(open)} className={BTN_GHOST}>
              {t("st5_epRehearsalOpen")}
            </button>
            <button
              type="button"
              onClick={() => {
                const next = nudges[nudgeAt.current % nudges.length];
                nudgeAt.current += 1;
                say(next.text);
              }}
              className={BTN_GHOST}
            >
              {t("st5_epRehearsalNudge")}
            </button>
            <button type="button" onClick={() => say(close)} className={BTN_GHOST}>
              {t("st5_epRehearsalClose")}
            </button>
          </div>
          <RecordPanel
            lang={lang}
            phase={5}
            activityId={activityId}
            kind="feedback"
            defaultTitle={title}
            accent={accent}
            speaker="me"
            tags={[...tags, TAG.rehearsal]}
            label={t("st5_epRehearsalRec")}
          />
        </div>
      </div>
    </div>
  );
}
