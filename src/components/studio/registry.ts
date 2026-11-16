import type { LangCode } from "@/lib/types";
import { registerLocale, registerStrings } from "@/lib/i18n";
import type { StudioDict } from "@/lib/studioStrings/core";
import type { StudioTool, StudioToolMap } from "./types";

/**
 * Every studio workbench, loaded per phase on demand — a Phase 1 grower never
 * downloads the Phase 5 tools or their strings. Activity ids are prefixed
 * with their phase ("p3-bridge"), which is all the loader needs.
 */
type PhaseKey = "p1" | "p2" | "p3" | "p4" | "p5" | "p6";

const TOOL_LOADERS: Record<PhaseKey, () => Promise<StudioToolMap>> = {
  p1: () => import("./p1").then((m) => m.P1_TOOLS),
  p2: () => import("./p2").then((m) => m.P2_TOOLS),
  p3: () => import("./p3").then((m) => m.P3_TOOLS),
  p4: () => import("./p4").then((m) => m.P4_TOOLS),
  p5: () => import("./p5").then((m) => m.P5_TOOLS),
  p6: () => import("./p6").then((m) => m.P6_TOOLS),
};

/** English source strings for each phase's tools. */
const STRING_LOADERS: Record<PhaseKey, () => Promise<StudioDict>> = {
  p1: () => import("@/lib/studioStrings/p1").then((m) => m.P1_STRINGS),
  p2: () => import("@/lib/studioStrings/p2").then((m) => m.P2_STRINGS),
  p3: () => import("@/lib/studioStrings/p3").then((m) => m.P3_STRINGS),
  p4: () => import("@/lib/studioStrings/p4").then((m) => m.P4_STRINGS),
  p5: () => import("@/lib/studioStrings/p5").then((m) => m.P5_STRINGS),
  p6: () => import("@/lib/studioStrings/p6").then((m) => m.P6_STRINGS),
};

const registered = new Set<string>();

/** Register a phase's strings: English always, plus each requested language's translation file. */
async function loadPhaseStrings(phase: PhaseKey, langs: LangCode[]): Promise<void> {
  const jobs: Promise<void>[] = [];
  if (!registered.has(`${phase}:en`)) {
    jobs.push(
      STRING_LOADERS[phase]().then((dict) => {
        registerStrings(dict);
        registered.add(`${phase}:en`);
      })
    );
  }
  for (const lang of new Set(langs)) {
    const tag = `${phase}:${lang}`;
    if (lang === "en" || registered.has(tag)) continue;
    jobs.push(
      import(`@/lib/studioStrings/locales/${lang}/${phase}.json`)
        .then((mod: { default: Record<string, string> }) => {
          registerLocale(lang, mod.default);
          registered.add(tag);
        })
        // no translation file for this language yet — English stays the fallback
        .catch(() => undefined)
    );
  }
  await Promise.all(jobs);
}

/**
 * The workbench for an activity (undefined when none is registered), with its
 * strings registered for `langs` before it resolves — so the tool's first
 * render already speaks the grower's language.
 */
export async function loadStudioTool(
  activityId: string,
  langs: LangCode[]
): Promise<StudioTool | undefined> {
  const phase = activityId.split("-")[0] as PhaseKey;
  const loader = TOOL_LOADERS[phase];
  if (!loader) return undefined;
  const [tools] = await Promise.all([loader(), loadPhaseStrings(phase, langs)]);
  return tools[activityId];
}
