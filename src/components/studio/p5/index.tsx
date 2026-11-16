import type { StudioToolMap } from "../types";
import { CommunityTool } from "./CommunityTool";
import { EpicTool } from "./EpicTool";
import { LibraryTool } from "./LibraryTool";
import { MediaTool } from "./MediaTool";
import { RecordTool } from "./RecordTool";
import { RetellTool } from "./RetellTool";
import { TenStepsTool } from "./TenStepsTool";

/** Phase 5 studio tools, keyed by curriculum activity id. */
export const P5_TOOLS: StudioToolMap = {
  "p5-record": RecordTool,
  "p5-tensteps": TenStepsTool,
  "p5-retell": RetellTool,
  "p5-library": LibraryTool,
  "p5-media": MediaTool,
  "p5-epic": EpicTool,
  "p5-community": CommunityTool,
};
