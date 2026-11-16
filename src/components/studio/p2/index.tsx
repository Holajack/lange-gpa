import type { StudioToolMap } from "../types";
import { BusyTool } from "./BusyTool";
import { ClarifyTool } from "./ClarifyTool";
import { DescribeTool } from "./DescribeTool";
import { LifeStoryTool } from "./LifeStoryTool";
import { ProcessTool } from "./ProcessTool";
import { SmallTalkTool } from "./SmallTalkTool";
import { StoryBuildTool } from "./StoryBuildTool";
import { WswTool } from "./WswTool";

/** Phase 2 studio tools, keyed by curriculum activity id. */
export const P2_TOOLS: StudioToolMap = {
  "p2-describe": DescribeTool,
  "p2-storybuild": StoryBuildTool,
  "p2-clarify": ClarifyTool,
  "p2-wsw": WswTool,
  "p2-busy": BusyTool,
  "p2-process": ProcessTool,
  "p2-smalltalk": SmallTalkTool,
  "p2-lifestory": LifeStoryTool,
};
