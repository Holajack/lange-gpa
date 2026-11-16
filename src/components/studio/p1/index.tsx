import type { StudioToolMap } from "../types";
import { Bubbles } from "./Bubbles";
import { InfoGap } from "./InfoGap";
import { Ladder } from "./Ladder";
import { MakeTrue } from "./MakeTrue";
import { Market } from "./Market";
import { Photos } from "./Photos";
import { Sounds } from "./Sounds";

/** Phase 1 studio tools, keyed by curriculum activity id. */
export const P1_TOOLS: StudioToolMap = {
  "p1-make-true": MakeTrue,
  "p1-photos": Photos,
  "p1-lexicarry": Bubbles,
  "p1-sounds": Sounds,
  "p1-ladder": Ladder,
  "p1-infogap": InfoGap,
  "p1-market": Market,
};
