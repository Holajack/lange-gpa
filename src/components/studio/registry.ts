import type { StudioTool, StudioToolMap } from "./types";

/**
 * Every studio workbench, loaded per phase on demand — a Phase 1 grower never
 * downloads the Phase 5 tools. Activity ids are prefixed with their phase
 * ("p3-bridge"), which is all the loader needs.
 */
const LOADERS: Record<string, () => Promise<StudioToolMap>> = {
  p1: () => import("./p1").then((m) => m.P1_TOOLS),
  p2: () => import("./p2").then((m) => m.P2_TOOLS),
  p3: () => import("./p3").then((m) => m.P3_TOOLS),
  p4: () => import("./p4").then((m) => m.P4_TOOLS),
  p5: () => import("./p5").then((m) => m.P5_TOOLS),
  p6: () => import("./p6").then((m) => m.P6_TOOLS),
};

/** The workbench for an activity, or undefined when none is registered. */
export async function loadStudioTool(activityId: string): Promise<StudioTool | undefined> {
  const loader = LOADERS[activityId.split("-")[0]];
  if (!loader) return undefined;
  return (await loader())[activityId];
}
