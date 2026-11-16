import type { ComponentType } from "react";
import type { LangCode, Phase, PhaseActivity } from "@/lib/types";

/** Props every studio tool receives from /studio/[activity]. */
export interface StudioToolProps {
  /** the curriculum activity (English source strings — localize display via t()) */
  activity: PhaseActivity;
  phase: Phase;
  /** the grower's target (host) language — all practice content is in this language */
  lang: LangCode;
}

export type StudioTool = ComponentType<StudioToolProps>;
export type StudioToolMap = Record<string, StudioTool>;

/** Host-language content authored per language. Missing language = no AI/solo content for it. */
export type StudioText = Partial<Record<LangCode, string>>;

/** Host-language text for `lang`, or undefined when none is authored (never falls back to English). */
export function hostText(text: StudioText | undefined, lang: LangCode): string | undefined {
  return text?.[lang];
}

/**
 * Who an activity honestly needs:
 *  - "solo"     the app (or Nuri) can genuinely carry it alone
 *  - "nurturer" it needs a real host-language person; the app is the workbench
 *  - "either"   works alone, better with a person
 */
export type StudioMode = "solo" | "nurturer" | "either";
