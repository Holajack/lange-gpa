import type { ReactNode } from "react";

/**
 * Code-drawn picture cards — for words where the picture must be EXACT.
 *
 * A generated illustration cannot reliably show "seventeen", "Thursday",
 * "March", "half past" or "triangle", and an emoji cannot tell eleven from
 * twelve (they all share 🔢). These cards are drawn here instead, so each one
 * is unambiguous and identical on every device: numerals, positions in a
 * line, a week strip, a year grid, clock faces, plain geometry, arrows.
 *
 * No host-language text ever appears — only digits and shapes.
 */

const BG = "#fdf6e3"; // the same pale cream the illustrated cards sit on
const INK = "#1f2233";
const SOFT = "#d9d2bf";
const HOT = "#7c5cff";
const WARM = "#ff8a1e";

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" className="block h-full w-full" role="presentation" focusable="false">
      <rect x="0" y="0" width="100" height="100" rx="14" fill={BG} />
      {children}
    </svg>
  );
}

/* ------------------------------ numbers ------------------------------ */

const NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
};

function NumberCard({ n }: { n: number }) {
  const digits = String(n).length;
  const size = digits <= 2 ? 54 : digits === 3 ? 40 : 31;
  const withDots = n >= 1 && n <= 10;
  return (
    <Frame>
      <text
        x="50"
        y={withDots ? 50 : 58}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size}
        fontWeight={800}
        fill={INK}
        fontFamily="ui-rounded, system-ui, sans-serif"
      >
        {n}
      </text>
      {/* small quantities also show the amount itself */}
      {withDots &&
        Array.from({ length: n }, (_, i) => {
          const perRow = 5;
          const row = Math.floor(i / perRow);
          const inRow = Math.min(perRow, n - row * perRow);
          const col = i % perRow;
          const x = 50 + (col - (inRow - 1) / 2) * 11;
          return <circle key={i} cx={x} cy={78 + row * 10} r="3.6" fill={WARM} />;
        })}
    </Frame>
  );
}

/* ------------------------------ ordinals ----------------------------- */

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];

/** Ten in a line; the nth one stands out — "third" is a place, not an amount. */
function OrdinalCard({ n }: { n: number }) {
  return (
    <Frame>
      {Array.from({ length: 10 }, (_, i) => {
        const row = Math.floor(i / 5);
        const x = 16 + (i % 5) * 17;
        const y = 38 + row * 30;
        const on = i + 1 === n;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={on ? 8.5 : 6} fill={on ? HOT : SOFT} />
            {on && (
              <>
                <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight={800} fill="#fff">
                  {n}
                </text>
                <path d={`M ${x - 5} ${y - 21} L ${x + 5} ${y - 21} L ${x} ${y - 12} Z`} fill={WARM} />
              </>
            )}
          </g>
        );
      })}
      {/* the line they stand in, starting from the left */}
      <path d="M 8 20 H 30" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 30 20 l -5 -3.5 v 7 z" fill={INK} />
    </Frame>
  );
}

/* -------------------------------- days -------------------------------- */

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function WeekStrip({ on }: { on: (i: number) => boolean }) {
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={8 + i * 12.2} y={38} width="10.4" height="26" rx="3" fill={on(i) ? HOT : SOFT} />
      ))}
      {/* the weekend sits apart at the end of the week */}
      <path d="M 67.5 70 H 91.5" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
    </>
  );
}

function ThreeDays({ which }: { which: -1 | 0 | 1 }) {
  return (
    <Frame>
      {[-1, 0, 1].map((d) => (
        <rect key={d} x={50 + d * 27 - 11} y={34} width="22" height="30" rx="5" fill={d === which ? HOT : SOFT} />
      ))}
      {/* "now" is always the middle day */}
      <circle cx="50" cy="24" r="4" fill={WARM} />
      <path d="M 50 28 V 33" stroke={WARM} strokeWidth="2.2" strokeLinecap="round" />
      {which !== 0 && (
        <path
          d={which === 1 ? "M 44 76 H 74 M 74 76 l -6 -4.5 M 74 76 l -6 4.5" : "M 56 76 H 26 M 26 76 l 6 -4.5 M 26 76 l 6 4.5"}
          stroke={INK}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </Frame>
  );
}

function DayCard({ name }: { name: string }) {
  const weekday = WEEKDAYS.indexOf(name);
  if (weekday >= 0) return <Frame><WeekStrip on={(i) => i === weekday} /></Frame>;
  if (name === "week") return <Frame><WeekStrip on={() => true} /></Frame>;
  if (name === "weekend") return <Frame><WeekStrip on={(i) => i >= 5} /></Frame>;
  if (name === "today") return <ThreeDays which={0} />;
  if (name === "tomorrow") return <ThreeDays which={1} />;
  if (name === "yesterday") return <ThreeDays which={-1} />;
  if (name === "month") {
    return (
      <Frame>
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={i} x={10 + (i % 7) * 11.6} y={20 + Math.floor(i / 7) * 13} width="9.4" height="10.4" rx="2.4" fill={HOT} />
        ))}
      </Frame>
    );
  }
  if (name === "year") return <YearGrid on={() => true} />;
  return null;
}

/* ------------------------------- months ------------------------------- */

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function YearGrid({ on, label }: { on: (i: number) => boolean; label?: number }) {
  return (
    <Frame>
      {Array.from({ length: 12 }, (_, i) => {
        const x = 11 + (i % 4) * 20;
        const y = 16 + Math.floor(i / 4) * 24;
        const lit = on(i);
        return (
          <g key={i}>
            <rect x={x} y={y} width="17" height="20" rx="4" fill={lit ? HOT : SOFT} />
            {lit && label !== undefined && (
              <text x={x + 8.5} y={y + 11} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight={800} fill="#fff">
                {label}
              </text>
            )}
          </g>
        );
      })}
    </Frame>
  );
}

/* -------------------------------- clock ------------------------------- */

function Clock({ children }: { children: ReactNode }) {
  return (
    <Frame>
      <circle cx="50" cy="50" r="36" fill="#fff" stroke={INK} strokeWidth="3.5" />
      {children}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        const big = i % 3 === 0;
        return (
          <line
            key={i}
            x1={50 + Math.sin(a) * (big ? 27 : 30)}
            y1={50 - Math.cos(a) * (big ? 27 : 30)}
            x2={50 + Math.sin(a) * 33}
            y2={50 - Math.cos(a) * 33}
            stroke={INK}
            strokeWidth={big ? 3 : 1.6}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx="50" cy="50" r="3" fill={INK} />
    </Frame>
  );
}

/** pie wedge from 12 o'clock, clockwise, `turn` in 0..1 of the dial */
function wedge(turn: number, r = 31): string {
  const a = turn * 2 * Math.PI;
  const large = turn > 0.5 ? 1 : 0;
  return `M 50 50 L 50 ${50 - r} A ${r} ${r} 0 ${large} 1 ${50 + Math.sin(a) * r} ${50 - Math.cos(a) * r} Z`;
}

function TimeCard({ name }: { name: string }) {
  if (name === "hour") {
    // the hour hand's journey from one number to the next
    return (
      <Clock>
        <path d={wedge(1 / 12)} fill={HOT} opacity="0.9" />
        <line x1="50" y1="50" x2="50" y2="28" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.sin(Math.PI / 6) * 22} y2={50 - Math.cos(Math.PI / 6) * 22} stroke={INK} strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      </Clock>
    );
  }
  if (name === "minute") {
    // one small tick of the long hand
    return (
      <Clock>
        <path d={wedge(1 / 60)} fill={WARM} />
        <line x1="50" y1="50" x2="50" y2="20" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.sin(Math.PI / 30) * 30} y2={50 - Math.cos(Math.PI / 30) * 30} stroke={WARM} strokeWidth="2.6" strokeLinecap="round" />
      </Clock>
    );
  }
  if (name === "half-past") {
    return (
      <Clock>
        <path d={wedge(0.5)} fill={HOT} opacity="0.85" />
        <line x1="50" y1="50" x2="50" y2="80" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.sin((3.5 * Math.PI) / 6) * 19} y2={50 - Math.cos((3.5 * Math.PI) / 6) * 19} stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
      </Clock>
    );
  }
  return null;
}

/* ------------------------------- shapes ------------------------------- */

const stroke = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function ShapeCard({ name }: { name: string }) {
  switch (name) {
    case "circle":
      return <Frame><circle cx="50" cy="50" r="30" fill={HOT} {...stroke} /></Frame>;
    case "square":
      return <Frame><rect x="22" y="22" width="56" height="56" fill={HOT} {...stroke} /></Frame>;
    case "triangle":
      return <Frame><path d="M 50 18 L 82 78 L 18 78 Z" fill={HOT} {...stroke} /></Frame>;
    case "rectangle":
      return <Frame><rect x="12" y="30" width="76" height="40" fill={HOT} {...stroke} /></Frame>;
    case "oval":
      return <Frame><ellipse cx="50" cy="50" rx="36" ry="23" fill={HOT} {...stroke} /></Frame>;
    case "line":
      return <Frame><path d="M 16 50 H 84" {...stroke} strokeWidth={6} fill="none" /></Frame>;
    case "dot":
      return <Frame><circle cx="50" cy="50" r="9" fill={INK} /></Frame>;
    case "cross":
      return <Frame><path d="M 26 26 L 74 74 M 74 26 L 26 74" {...stroke} strokeWidth={8} fill="none" /></Frame>;
    case "arrow":
      return <Frame><path d="M 16 50 H 78 M 78 50 L 60 34 M 78 50 L 60 66" {...stroke} strokeWidth={7} fill="none" /></Frame>;
    case "straight":
      return (
        <Frame>
          <path d="M 18 34 H 82" {...stroke} strokeWidth={6} stroke={HOT} fill="none" />
          <path d="M 18 68 q 8 -12 16 0 t 16 0 t 16 0 t 16 0" {...stroke} stroke={SOFT} fill="none" />
        </Frame>
      );
    case "crooked":
      return (
        <Frame>
          <path d="M 14 62 L 28 36 L 42 64 L 56 34 L 70 62 L 86 38" {...stroke} strokeWidth={6} stroke={HOT} fill="none" />
        </Frame>
      );
    case "curved":
      return <Frame><path d="M 16 72 C 30 12, 70 12, 84 72" {...stroke} strokeWidth={6} stroke={HOT} fill="none" /></Frame>;
    case "edge":
      // a box seen in 3D: one of its edges picked out
      return (
        <Frame>
          <path d="M 22 38 L 50 24 L 78 38 L 78 68 L 50 82 L 22 68 Z M 22 38 L 50 52 L 78 38 M 50 52 V 82" fill="#fff" {...stroke} strokeWidth={3} />
          <path d="M 50 52 V 82" stroke={WARM} strokeWidth="7" strokeLinecap="round" />
        </Frame>
      );
    case "centre":
      return (
        <Frame>
          <circle cx="50" cy="50" r="32" fill="#fff" {...stroke} strokeWidth={3} />
          <circle cx="50" cy="50" r="7" fill={WARM} />
        </Frame>
      );
    case "side":
      // one whole face of the box
      return (
        <Frame>
          <path d="M 22 38 L 50 24 L 78 38 L 78 68 L 50 82 L 22 68 Z" fill="#fff" {...stroke} strokeWidth={3} />
          <path d="M 50 52 L 78 38 L 78 68 L 50 82 Z" fill={WARM} {...stroke} strokeWidth={3} />
          <path d="M 22 38 L 50 52 V 82" fill="none" {...stroke} strokeWidth={3} />
        </Frame>
      );
    case "tip":
      // the very point of a pencil
      return (
        <Frame>
          <path d="M 30 16 H 70 V 58 L 50 86 L 30 58 Z" fill="#fff" {...stroke} strokeWidth={3} />
          <path d="M 30 58 H 70" {...stroke} strokeWidth={3} fill="none" />
          <path d="M 43.5 77 L 50 86 L 56.5 77 Z" fill={WARM} stroke={WARM} strokeWidth="3" strokeLinejoin="round" />
        </Frame>
      );
    default:
      return null;
  }
}

/* ----------------------------- directions ----------------------------- */

function DirectionCard({ name }: { name: string }) {
  const arrow = (d: string) => (
    <Frame>
      <path d={d} {...stroke} strokeWidth={8} stroke={HOT} fill="none" />
    </Frame>
  );
  switch (name) {
    case "left":
      return arrow("M 82 50 H 20 M 20 50 L 40 32 M 20 50 L 40 68");
    case "right":
      return arrow("M 18 50 H 80 M 80 50 L 60 32 M 80 50 L 60 68");
    case "straight-ahead":
      return arrow("M 50 84 V 20 M 50 20 L 32 40 M 50 20 L 68 40");
    case "backward":
      // a U-turn: out, around, and back the way you came
      return arrow("M 34 84 V 42 a 16 16 0 0 1 32 0 V 78 M 66 78 L 52 62 M 66 78 L 80 62");
    default:
      return null;
  }
}

/* -------------------------------- lookup ------------------------------ */

/** The code-drawn face for a vocab card, or null when the card is illustrated/emoji instead. */
export function drawnCard(itemId: string): ReactNode | null {
  const dash = itemId.indexOf("-");
  if (dash < 0) return null;
  const prefix = itemId.slice(0, dash);
  const name = itemId.slice(dash + 1);
  switch (prefix) {
    case "num":
      return name in NUMBERS ? <NumberCard n={NUMBERS[name]} /> : null;
    case "ord": {
      const n = ORDINALS.indexOf(name) + 1;
      return n > 0 ? <OrdinalCard n={n} /> : null;
    }
    case "day":
      return <DayCard name={name} />;
    case "mon": {
      const m = MONTHS.indexOf(name);
      return m >= 0 ? <YearGrid on={(i) => i === m} label={m + 1} /> : null;
    }
    case "tod":
      return <TimeCard name={name} />;
    case "shape":
      return <ShapeCard name={name} />;
    case "dir":
      return <DirectionCard name={name} />;
    default:
      return null;
  }
}

/** ids this module draws — lets callers skip the illustration lookup entirely */
export function hasDrawnCard(itemId: string): boolean {
  const dash = itemId.indexOf("-");
  if (dash < 0) return false;
  const prefix = itemId.slice(0, dash);
  const name = itemId.slice(dash + 1);
  switch (prefix) {
    case "num":
      return name in NUMBERS;
    case "ord":
      return ORDINALS.includes(name);
    case "day":
      return [...WEEKDAYS, "week", "weekend", "today", "tomorrow", "yesterday", "month", "year"].includes(name);
    case "mon":
      return MONTHS.includes(name);
    case "tod":
      return ["hour", "minute", "half-past"].includes(name);
    case "shape":
      return [
        "circle", "square", "triangle", "rectangle", "oval", "line", "dot", "cross", "arrow",
        "straight", "crooked", "curved", "edge", "centre", "side", "tip",
      ].includes(name);
    case "dir":
      return ["left", "right", "straight-ahead", "backward"].includes(name);
    default:
      return false;
  }
}
