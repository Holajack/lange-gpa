import type { StudioToolMap } from "../types";
import { CopTool } from "./CopTool";
import { ExpertTool } from "./ExpertTool";
import { HoursTool } from "./HoursTool";
import { NeedsTool } from "./NeedsTool";
import { RareTool } from "./RareTool";
import { ReadTool } from "./ReadTool";
import { RemedialTool } from "./RemedialTool";

/**
 * Phase 6 studio tools, keyed by curriculum activity id.
 * (`p6-nurture` is not here on purpose: it links to onboarding.)
 */
export const P6_TOOLS: StudioToolMap = {
  "p6-hours": HoursTool,
  "p6-cop": CopTool,
  "p6-read": ReadTool,
  "p6-needs": NeedsTool,
  "p6-rare": RareTool,
  "p6-expert": ExpertTool,
  "p6-remedial": RemedialTool,
};
