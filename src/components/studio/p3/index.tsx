import type { StudioToolMap } from "../types";
import { ActionCartoon } from "./ActionCartoon";
import { BridgeStory } from "./BridgeStory";
import { DiscussProp } from "./DiscussProp";
import { HostStories } from "./HostStories";
import { InputFlood } from "./InputFlood";
import { MassageLoop } from "./MassageLoop";
import { ScriptsOfLife } from "./ScriptsOfLife";
import { SharedExperience } from "./SharedExperience";

/** Phase 3 studio tools, keyed by curriculum activity id. */
export const P3_TOOLS: StudioToolMap = {
  "p3-bridge": BridgeStory,
  "p3-script": ScriptsOfLife,
  "p3-cartoon": ActionCartoon,
  "p3-massage": MassageLoop,
  "p3-shared": SharedExperience,
  "p3-prop": DiscussProp,
  "p3-flood": InputFlood,
  "p3-host": HostStories,
};
