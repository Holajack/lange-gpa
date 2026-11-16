import type { StudioToolMap } from "../types";
import { FeedbackTool } from "./FeedbackTool";
import { HolesTool } from "./HolesTool";
import { LifeStoryTool } from "./LifeStoryTool";
import { ObserveTool } from "./ObserveTool";
import { TwoRecorderTool } from "./TwoRecorderTool";
import { VocabTool } from "./VocabTool";
import { WalkOfLifeTool } from "./WalkOfLifeTool";

/** Phase 4 studio tools, keyed by curriculum activity id. */
export const P4_TOOLS: StudioToolMap = {
  "p4-lifestory": LifeStoryTool,
  "p4-vocab": VocabTool,
  "p4-walkoflife": WalkOfLifeTool,
  "p4-observe": ObserveTool,
  "p4-feedback": FeedbackTool,
  "p4-holes": HolesTool,
  "p4-tworecorder": TwoRecorderTool,
};
