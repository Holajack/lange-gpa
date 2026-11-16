import type { StudioToolMap } from "../types";
import { ActionCartoon } from "./ActionCartoon";
import { BridgeStory } from "./BridgeStory";
import { DiscussProp } from "./DiscussProp";
import { Expository } from "./Expository";
import { HostStories } from "./HostStories";
import { InputFlood } from "./InputFlood";
import { MassageLoop } from "./MassageLoop";
import { NativeSample } from "./NativeSample";
import { Reading } from "./Reading";
import { ScriptsOfLife } from "./ScriptsOfLife";
import { SharedExperience } from "./SharedExperience";
import { TalkMore } from "./TalkMore";

/**
 * Phase 3 studio tools, keyed by curriculum activity id.
 *   3A (stories we both know): bridge, script, cartoon, massage, shared, prop, flood
 *   3B (their stories):        host
 *   3C (beyond stories):       expository, talkmore, sample, reading
 */
export const P3_TOOLS: StudioToolMap = {
  "p3-bridge": BridgeStory,
  "p3-script": ScriptsOfLife,
  "p3-cartoon": ActionCartoon,
  "p3-massage": MassageLoop,
  "p3-shared": SharedExperience,
  "p3-prop": DiscussProp,
  "p3-flood": InputFlood,
  "p3-host": HostStories,
  "p3-expository": Expository,
  "p3-talkmore": TalkMore,
  "p3-sample": NativeSample,
  "p3-reading": Reading,
};
