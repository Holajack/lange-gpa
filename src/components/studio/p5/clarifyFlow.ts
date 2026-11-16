/**
 * clarifyFlow — the Phase 5 pacing engine: one native-to-native recording,
 * worked through with a mentor over as many sittings as it takes.
 *
 * The sibling of sessionFlow.ts, but nothing here is a card. The unit of work
 * is a STRETCH: a timestamped span of real audio (the guide's 5–10 minute
 * segment). A stretch is heard straight through, then worked bit by bit until
 * it is clear; flagged moments themselves live on the recording in the
 * Listening Library, so this file only knows spans, stages and time.
 *
 * Pure data + pure transitions. Every action carries `now` (epoch ms), so the
 * machine owns the session clock and the room can be closed and resumed
 * without losing an 80–90 minute session.
 */

export type Stage =
  | "arrive" // small talk; pick up from last time
  | "listen" // step 2: once straight through, how much do you think you got?
  | "summary" // steps 3–4: tell the mentor what you think you understood; record the reply
  | "clarify" // steps 5–9: the stretch loop
  | "clean" // listen cleanly to everything cleared today
  | "wrap" // step 10 scheduled: tomorrow's retelling
  | "closed"; // between sittings

export const STAGE_ORDER: Stage[] = ["arrive", "listen", "summary", "clarify", "clean", "wrap", "closed"];

/** Guide targets, in seconds: [comfortable, upper]. */
export const STAGE_TARGETS: Partial<Record<Stage, [number, number]>> = {
  arrive: [5 * 60, 10 * 60],
  clarify: [80 * 60, 90 * 60],
};

/** About three hours of work clear one hour of recording. */
export const WORK_PER_RECORDED = 3;
/** Stretch lengths on offer, seconds. The guide works in 5–10 minute segments. */
export const STRETCH_CHOICES = [180, 300, 420, 600];
export const DEFAULT_STRETCH = 300;
/** A silent gap longer than this is a break, not session time. */
export const MAX_GAP_SEC = 300;

export interface Stretch {
  index: number;
  /** seconds from the start of the recording */
  start: number;
  /** seconds; 0 when the recording's length is unknown (= to the end) */
  end: number;
  /** heard straight through before being worked */
  heardAt?: string;
  clearedAt?: string;
  /** flagged moments still open when it was cleared: questions carried forward */
  carried?: number;
  sittingId?: string;
}

export interface Sitting {
  id: string;
  startedAt: string;
  endedAt?: string;
  /** seconds spent in each stage during this sitting */
  seconds: Record<Stage, number>;
  /** indexes of the stretches cleared in this sitting */
  cleared: number[];
  cleanListen?: "done" | "tonight";
  /** local day (yyyy-mm-dd) the retelling is planned for */
  retellOn?: string;
}

export interface ClarifyFlow {
  v: 1;
  recordingId: string;
  durationSec: number;
  stretchLen: number;
  stretches: Stretch[];
  stage: Stage;
  /** the stretch on the table */
  cursor: number;
  /** inside clarify: hear the stretch through, then go back and work it */
  pass: "hear" | "work";
  /** step 2: 0 (a wall of noise) … 4 (nearly all of it) */
  firstListen?: { at: string; grasp: number };
  /** steps 3–4 */
  summary?: { at: string; responseId?: string };
  sittings: Sitting[];
  /** epoch ms the clock last banked at; null while paused */
  clockAt: number | null;
  /** epoch ms of the last moment the clock counted */
  lastAt?: number;
}

export type ClarifyAction =
  | { type: "sit"; now: number }
  | { type: "tick"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "next"; now: number }
  | { type: "back"; now: number }
  | { type: "grasp"; now: number; grasp: number }
  | { type: "summarized"; now: number; responseId?: string }
  | { type: "heard"; now: number }
  | { type: "clear"; now: number; openMarks: number }
  | { type: "reopen"; now: number; index: number }
  | { type: "select"; now: number; index: number }
  | { type: "resize"; now: number; stretchLen: number }
  | { type: "cleanListen"; now: number; how: "done" | "tonight" }
  | { type: "retellOn"; now: number; day: string }
  | { type: "close"; now: number }
  | { type: "closeStale" };

/* ------------------------------ building ------------------------------ */

const iso = (ms: number) => new Date(ms).toISOString();

const zeroSeconds = (): Record<Stage, number> => ({
  arrive: 0,
  listen: 0,
  summary: 0,
  clarify: 0,
  clean: 0,
  wrap: 0,
  closed: 0,
});

/** Cut a recording into stretches. A short tail is folded into the last one. */
export function sliceStretches(durationSec: number, stretchLen: number): Stretch[] {
  const total = Math.max(0, Math.round(durationSec));
  const len = Math.max(30, Math.round(stretchLen));
  if (total === 0) return [{ index: 0, start: 0, end: 0 }];
  const out: Stretch[] = [];
  for (let start = 0; start < total; start += len) {
    out.push({ index: out.length, start, end: Math.min(total, start + len) });
  }
  const last = out[out.length - 1];
  if (out.length > 1 && last.end - last.start < Math.min(60, len / 3)) {
    out.pop();
    out[out.length - 1] = { ...out[out.length - 1], end: total };
  }
  return out;
}

export function createFlow(recordingId: string, durationSec: number, stretchLen = DEFAULT_STRETCH): ClarifyFlow {
  return {
    v: 1,
    recordingId,
    durationSec: Math.max(0, Math.round(durationSec)),
    stretchLen,
    stretches: sliceStretches(durationSec, stretchLen),
    stage: "closed",
    cursor: 0,
    pass: "hear",
    sittings: [],
    clockAt: null,
  };
}

/* ------------------------------ selectors ----------------------------- */

export function openSitting(flow: ClarifyFlow): Sitting | null {
  const last = flow.sittings[flow.sittings.length - 1];
  return last && !last.endedAt ? last : null;
}

export function lastClosedSitting(flow: ClarifyFlow): Sitting | null {
  for (let i = flow.sittings.length - 1; i >= 0; i--) {
    if (flow.sittings[i].endedAt) return flow.sittings[i];
  }
  return null;
}

export const stretchSeconds = (s: Stretch) => Math.max(0, s.end - s.start);

export const clearedStretches = (flow: ClarifyFlow) => flow.stretches.filter((s) => s.clearedAt);

/** seconds of recording that are now clear */
export const clearedSec = (flow: ClarifyFlow) =>
  clearedStretches(flow).reduce((sum, s) => sum + stretchSeconds(s), 0);

export const remainingSec = (flow: ClarifyFlow) => Math.max(0, flow.durationSec - clearedSec(flow));

export const isComplete = (flow: ClarifyFlow) =>
  flow.stretches.length > 0 && flow.stretches.every((s) => s.clearedAt);

/** seconds spent in the clarify stage across every sitting */
export const clarifyWorkSec = (flow: ClarifyFlow) =>
  flow.sittings.reduce((sum, s) => sum + s.seconds.clarify, 0);

/** every second the room was open for this recording */
export const totalWorkSec = (flow: ClarifyFlow) =>
  flow.sittings.reduce(
    (sum, s) => sum + STAGE_ORDER.reduce((inner, stage) => inner + s.seconds[stage], 0),
    0
  );

/** minutes of work per minute of recording cleared so far (the guide expects about 3) */
export function workRatio(flow: ClarifyFlow): number | null {
  const cleared = clearedSec(flow);
  if (cleared < 60) return null;
  return totalWorkSec(flow) / cleared;
}

/** The next stretch still to clear at or after `from`, wrapping round; -1 when none. */
export function nextPending(flow: ClarifyFlow, from: number): number {
  const n = flow.stretches.length;
  for (let step = 0; step < n; step++) {
    const i = (from + step) % n;
    if (!flow.stretches[i].clearedAt) return i;
  }
  return -1;
}

export const currentStretch = (flow: ClarifyFlow): Stretch | undefined => flow.stretches[flow.cursor];

/** Stretches cleared in the sitting that is open now. */
export function clearedThisSitting(flow: ClarifyFlow): Stretch[] {
  const sitting = openSitting(flow);
  if (!sitting) return [];
  return sitting.cleared.map((i) => flow.stretches[i]).filter((s): s is Stretch => Boolean(s));
}

/** Seconds in a stage of the open sitting, including the part not yet banked. */
export function liveSeconds(flow: ClarifyFlow, stage: Stage, now: number): number {
  const sitting = openSitting(flow);
  if (!sitting) return 0;
  const banked = sitting.seconds[stage];
  if (flow.stage !== stage || flow.clockAt === null) return banked;
  return banked + Math.max(0, Math.min((now - flow.clockAt) / 1000, MAX_GAP_SEC));
}

/** Seconds since the open sitting began to count, across all its stages. */
export function liveSittingSeconds(flow: ClarifyFlow, now: number): number {
  return STAGE_ORDER.reduce((sum, stage) => sum + liveSeconds(flow, stage, now), 0);
}

export type ClockAdvice = "smalltalkOver" | "clarifyTarget" | "clarifyLong" | null;

/** What the clock would say out loud, if it could. */
export function clockAdvice(flow: ClarifyFlow, now: number): ClockAdvice {
  if (flow.stage === "arrive" && liveSeconds(flow, "arrive", now) >= (STAGE_TARGETS.arrive?.[1] ?? Infinity)) {
    return "smalltalkOver";
  }
  if (flow.stage === "clarify") {
    const spent = liveSeconds(flow, "clarify", now);
    const [low, high] = STAGE_TARGETS.clarify ?? [Infinity, Infinity];
    if (spent >= high) return "clarifyLong";
    if (spent >= low) return "clarifyTarget";
  }
  return null;
}

/** The stage `next` would move to from here. */
export function stageAfter(flow: ClarifyFlow): Stage {
  switch (flow.stage) {
    case "arrive":
      return !flow.firstListen ? "listen" : !flow.summary ? "summary" : "clarify";
    case "listen":
      return !flow.summary ? "summary" : "clarify";
    case "summary":
      return "clarify";
    case "clarify":
      return clearedThisSitting(flow).length > 0 ? "clean" : "wrap";
    case "clean":
      return "wrap";
    case "wrap":
    case "closed":
      return "closed";
  }
}

export type NextBlock = "needGrasp" | null;

/** Why `next` is refused right now, if it is. */
export function nextBlocked(flow: ClarifyFlow): NextBlock {
  if (flow.stage === "listen" && !flow.firstListen) return "needGrasp";
  return null;
}

/* ------------------------------ transitions --------------------------- */

function bank(flow: ClarifyFlow, now: number): ClarifyFlow {
  const sitting = openSitting(flow);
  if (!sitting || flow.clockAt === null) return flow;
  const delta = Math.max(0, Math.min((now - flow.clockAt) / 1000, MAX_GAP_SEC));
  return {
    ...flow,
    clockAt: now,
    lastAt: flow.clockAt + delta * 1000,
    sittings: flow.sittings.map((s) =>
      s.id === sitting.id ? { ...s, seconds: { ...s.seconds, [flow.stage]: s.seconds[flow.stage] + delta } } : s
    ),
  };
}

function patchSitting(flow: ClarifyFlow, patch: (s: Sitting) => Sitting): ClarifyFlow {
  const sitting = openSitting(flow);
  if (!sitting) return flow;
  return { ...flow, sittings: flow.sittings.map((s) => (s.id === sitting.id ? patch(s) : s)) };
}

function endSitting(flow: ClarifyFlow, endedMs: number): ClarifyFlow {
  return {
    ...patchSitting(flow, (s) => ({ ...s, endedAt: iso(endedMs) })),
    stage: "closed",
    clockAt: null,
  };
}

/** Put the cursor on the next stretch to clear and decide whether it still needs its first hearing. */
function landOn(flow: ClarifyFlow, index: number): ClarifyFlow {
  const target = flow.stretches[index];
  if (!target) return flow;
  return { ...flow, cursor: index, pass: target.heardAt || target.clearedAt ? "work" : "hear" };
}

export function clarifyReducer(flow: ClarifyFlow, action: ClarifyAction): ClarifyFlow {
  if (action.type === "closeStale") {
    const sitting = openSitting(flow);
    if (!sitting) return flow;
    return endSitting(flow, flow.lastAt ?? Date.parse(sitting.startedAt));
  }

  const { now } = action;

  if (action.type === "resume") {
    // never banks: whatever happened while the room was closed is not session time
    return openSitting(flow) ? { ...flow, clockAt: now } : flow;
  }

  const f = bank(flow, now);

  switch (action.type) {
    case "tick":
      return f;

    case "pause":
      return { ...f, clockAt: null };

    case "sit": {
      const closed = openSitting(f) ? endSitting(f, now) : f;
      const sitting: Sitting = {
        id: `sit-${now.toString(36)}`,
        startedAt: iso(now),
        seconds: zeroSeconds(),
        cleared: [],
      };
      const pending = nextPending(closed, closed.cursor);
      return landOn(
        { ...closed, sittings: [...closed.sittings, sitting], stage: "arrive", clockAt: now, lastAt: now },
        pending === -1 ? closed.cursor : pending
      );
    }

    case "next": {
      if (!openSitting(f) || nextBlocked(f)) return f;
      const to = stageAfter(f);
      if (to === "closed") return endSitting(f, now);
      if (to === "clarify") {
        const pending = nextPending(f, f.cursor);
        return landOn({ ...f, stage: "clarify" }, pending === -1 ? f.cursor : pending);
      }
      return { ...f, stage: to };
    }

    case "back": {
      if (!openSitting(f)) return f;
      const order: Stage[] = ["arrive", "listen", "summary", "clarify", "clean", "wrap"];
      const at = order.indexOf(f.stage);
      return at > 0 ? { ...f, stage: order[at - 1] } : f;
    }

    case "grasp":
      return { ...f, firstListen: { at: iso(now), grasp: Math.max(0, Math.min(4, Math.round(action.grasp))) } };

    case "summarized":
      return { ...f, summary: { at: iso(now), responseId: action.responseId ?? f.summary?.responseId } };

    case "heard": {
      if (f.stage !== "clarify") return f;
      return {
        ...f,
        pass: "work",
        stretches: f.stretches.map((s) => (s.index === f.cursor ? { ...s, heardAt: s.heardAt ?? iso(now) } : s)),
      };
    }

    case "clear": {
      const sitting = openSitting(f);
      const target = f.stretches[f.cursor];
      if (f.stage !== "clarify" || !sitting || !target || target.clearedAt) return f;
      const cleared: ClarifyFlow = patchSitting(
        {
          ...f,
          stretches: f.stretches.map((s) =>
            s.index === target.index
              ? {
                  ...s,
                  heardAt: s.heardAt ?? iso(now),
                  clearedAt: iso(now),
                  carried: Math.max(0, Math.round(action.openMarks)),
                  sittingId: sitting.id,
                }
              : s
          ),
        },
        (s) => ({ ...s, cleared: s.cleared.includes(target.index) ? s.cleared : [...s.cleared, target.index] })
      );
      const pending = nextPending(cleared, target.index + 1);
      // nothing left: stay on the last stretch; the room offers the clean listen
      return pending === -1 ? cleared : landOn(cleared, pending);
    }

    case "reopen": {
      const target = f.stretches[action.index];
      if (!target?.clearedAt) return f;
      const reopened: ClarifyFlow = {
        ...f,
        stretches: f.stretches.map((s) =>
          s.index === action.index ? { ...s, clearedAt: undefined, carried: undefined, sittingId: undefined } : s
        ),
        sittings: f.sittings.map((s) => ({ ...s, cleared: s.cleared.filter((i) => i !== action.index) })),
      };
      return f.stage === "clarify" ? { ...reopened, cursor: action.index, pass: "work" } : reopened;
    }

    case "select":
      return f.stage === "clarify" ? landOn(f, action.index) : f;

    case "resize": {
      // re-cutting is only honest before any stretch has been cleared
      if (clearedStretches(f).length > 0 || !STRETCH_CHOICES.includes(action.stretchLen)) return f;
      return {
        ...f,
        stretchLen: action.stretchLen,
        stretches: sliceStretches(f.durationSec, action.stretchLen),
        cursor: 0,
        pass: "hear",
      };
    }

    case "cleanListen":
      return patchSitting(f, (s) => ({ ...s, cleanListen: action.how }));

    case "retellOn":
      return patchSitting(f, (s) => ({ ...s, retellOn: action.day }));

    case "close":
      return openSitting(f) ? endSitting(f, now) : f;
  }
}
