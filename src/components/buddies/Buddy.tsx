"use client";

/**
 * The LANGE buddy family — Nuri's nine siblings, all drawn in his exact flat
 * hand-drawn style (see src/components/Mascot.tsx): bold simple silhouettes,
 * flat saturated fills, ONE darker lower-body shading shape + ONE lighter
 * belly/face tone, no outlines, no gradients beyond Nuri's belly shine, and a
 * shared expressive-minimal face (dot eyes with a white highlight, soft smile,
 * blush) under a two-leaf sprout.
 *
 * Public contract (fixed):
 *   export type BuddyId
 *   export const BUDDY_IDS
 *   export function Buddy({ id, size?, animated?, className? })  // null for unknown ids
 *
 * Every buddy lives in viewBox "0 0 200 220" with the face at a consistent
 * height. When animated (default), the whole buddy floats with a deterministic
 * per-id delay so a group never bobs in sync, and exactly one charming
 * micro-motion plays (a waving arm, a curious leaf wiggle, a slow rock).
 *
 * Colours/identities are canon from src/lib/mascots.ts.
 */

import type { ReactNode } from "react";

export type BuddyId =
  | "nuri"
  | "brotito"
  | "brin"
  | "sprossi"
  | "gemma"
  | "broto"
  | "listik"
  | "futaba"
  | "yaya"
  | "tiboujon";

export const BUDDY_IDS: BuddyId[] = [
  "nuri",
  "brotito",
  "brin",
  "sprossi",
  "gemma",
  "broto",
  "listik",
  "futaba",
  "yaya",
  "tiboujon",
];

/* ------------------------------------------------------------------ *
 * Shared facial grammar — ported from Nuri so every sibling matches.  *
 * Nuri (170-box): eyes r5.5, 28 apart, mid-x 84, y75; smile q8 7 16 0 *
 * Scaled into the 200-box family with the face mid-x at 100.          *
 * ------------------------------------------------------------------ */

const SPROUT_GREEN_LIGHT = "#B8F03C";
const SPROUT_GREEN_DARK = "#3DDC84";
const EYE_FILL = "#2A2118"; // warm near-black, like Nuri's visor
const SMILE = "#2A2118";
const BLUSH = "#ff8a8a";

/** Two-leaf sprout + stem, recentred on x (Nuri's exact leaf paths). */
function Sprout({ x = 100, stem = "#3DDC84" }: { x?: number; stem?: string }) {
  const dx = x - 85; // Nuri authored these around x=85
  return (
    <g transform={`translate(${dx},0)`}>
      <path d="M85 30 q-2 -16 -18 -18 q4 16 15 18" fill={SPROUT_GREEN_LIGHT} />
      <path d="M85 30 q4 -14 18 -15 q-3 14 -15 16" fill={SPROUT_GREEN_DARK} />
      <line x1="85" y1="30" x2="85" y2="44" stroke={stem} strokeWidth="6" strokeLinecap="round" />
    </g>
  );
}

/**
 * The shared face: two level dot-eyes with a white highlight, a soft smile,
 * blush. One mouth-read per face — callers that draw a beak/nose instead pass
 * `mouth="none"`. `cx`/`cy` place the eye line; everything is derived from it
 * exactly as Nuri does, so the family reads as one.
 */
function Face({
  cx = 100,
  cy = 92,
  spread = 14,
  r = 5.5,
  mouth = "smile",
  blush = true,
  eye = EYE_FILL,
}: {
  cx?: number;
  cy?: number;
  spread?: number;
  r?: number;
  mouth?: "smile" | "none";
  blush?: boolean;
  eye?: string;
}) {
  const lx = cx - spread;
  const rx = cx + spread;
  const hi = r * 0.34; // highlight dot radius
  return (
    <g>
      {blush && (
        <>
          <ellipse cx={lx - r - 3} cy={cy + r + 2} rx="5.5" ry="3.6" fill={BLUSH} opacity="0.42" />
          <ellipse cx={rx + r + 3} cy={cy + r + 2} rx="5.5" ry="3.6" fill={BLUSH} opacity="0.42" />
        </>
      )}
      <circle cx={lx} cy={cy} r={r} fill={eye} />
      <circle cx={rx} cy={cy} r={r} fill={eye} />
      {/* white highlights, top-left of each eye (Nuri's reading) */}
      <circle cx={lx - r * 0.32} cy={cy - r * 0.36} r={hi} fill="#fff" />
      <circle cx={rx - r * 0.32} cy={cy - r * 0.36} r={hi} fill="#fff" />
      {mouth === "smile" && (
        <path
          d={`M${cx - 9} ${cy + 13} q9 8 18 0`}
          stroke={SMILE}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ *
 * Per-buddy art. Each returns the SVG INSIDE the shared <svg> frame.  *
 * `wave` is the class for the buddy's single micro-motion group.      *
 * ------------------------------------------------------------------ */

type BuddyArt = (wave: string) => ReactNode;

/* nuri (en) — ported faithfully: round orange sprout-bot, wave arm + leaf bob. */
const nuri: BuddyArt = (wave) => (
  <>
    <Sprout x={100} stem="#E5740E" />
    {/* body */}
    <ellipse cx="100" cy="120" rx="64" ry="68" fill="#FF8A1E" />
    {/* one darker lower-body shading shape */}
    <path d="M40 132 a64 68 0 0 0 120 0 a64 50 0 0 1 -120 0 z" fill="#E5740E" opacity="0.55" />
    {/* lighter belly */}
    <ellipse cx="100" cy="132" rx="40" ry="42" fill="#FFB152" opacity="0.5" />
    <Face cx={100} cy={100} spread={14} />
    {/* belly button */}
    <circle cx="100" cy="150" r="11" fill="#FFD234" />
    <circle cx="100" cy="150" r="11" fill="none" stroke="#E5740E" strokeWidth="3" />
    {/* left arm */}
    <path d="M40 128 q-18 7 -20 25 q16 2 27 -11" fill="#FF8A1E" />
    {/* right arm — waves */}
    <g className={wave} style={{ transformOrigin: "150px 124px" }}>
      <path d="M158 122 q24 -11 28 -33 q-22 -4 -35 18" fill="#FF8A1E" />
      <circle cx="184" cy="86" r="9" fill="#FFB52E" />
    </g>
    {/* feet */}
    <ellipse cx="74" cy="190" rx="15" ry="9" fill="#E5740E" />
    <ellipse cx="126" cy="190" rx="15" ry="9" fill="#E5740E" />
  </>
);

/* brotito (es) — piñata egg with 3 scalloped paper-fringe bands. */
const brotito: BuddyArt = (wave) => {
  const scallop = (y: number, fill: string) => {
    let d = `M38 ${y}`;
    for (let i = 0; i < 8; i += 1) d += ` q8 9 16 0`;
    d += ` L${38 + 124} ${y + 9} L38 ${y + 9} Z`;
    return <path d={d} fill={fill} />;
  };
  return (
    <>
      <Sprout x={100} stem="#c43b3b" />
      {/* egg body — wider at the bottom */}
      <path d="M100 50 C58 50 40 96 40 134 C40 174 68 192 100 192 C132 192 160 174 160 134 C160 96 142 50 100 50 Z" fill="#ff4747" />
      {/* darker lower shading */}
      <path d="M44 140 C52 178 74 192 100 192 C126 192 148 178 156 140 C150 168 128 178 100 178 C72 178 50 168 44 140 Z" fill="#d62f2f" opacity="0.6" />
      {/* lighter belly */}
      <ellipse cx="100" cy="108" rx="40" ry="34" fill="#ff6d6d" opacity="0.55" />
      {/* 3 scalloped fringe bands wrapping the lower body */}
      <g transform="translate(0,2)">
        {scallop(150, "#b8f03c")}
        {scallop(138, "#7c5cff")}
        {scallop(126, "#ffd234")}
      </g>
      <Face cx={100} cy={98} spread={14} />
      {/* stub arms; left flicks (micro-motion) */}
      <g className={wave} style={{ transformOrigin: "44px 124px" }}>
        <ellipse cx="36" cy="126" rx="11" ry="8" fill="#ff4747" />
      </g>
      <ellipse cx="164" cy="126" rx="11" ry="8" fill="#ff4747" />
    </>
  );
};

/* brin (fr) — marinière sailor: cream body, navy stripes, red beret. */
const brin: BuddyArt = (wave) => (
  <>
    <Sprout x={100} stem="#2e3a85" />
    {/* red beret with stem */}
    <ellipse cx="100" cy="58" rx="46" ry="20" fill="#e02f26" />
    <ellipse cx="100" cy="52" rx="40" ry="16" fill="#f0463c" />
    <circle cx="100" cy="44" r="4.5" fill="#2e3a85" />
    {/* cream body */}
    <ellipse cx="100" cy="124" rx="60" ry="64" fill="#f2ead8" />
    {/* darker lower shading */}
    <path d="M42 136 a60 64 0 0 0 116 0 a60 46 0 0 1 -116 0 z" fill="#ddd2ba" opacity="0.6" />
    {/* navy stripes following the body curve (drawn over a clip of the body) */}
    <clipPath id="brinBody">
      <ellipse cx="100" cy="124" rx="60" ry="64" />
    </clipPath>
    <g clipPath="url(#brinBody)">
      {[112, 130, 148, 166, 184].map((y, i) => (
        <path
          key={i}
          d={`M30 ${y} Q100 ${y + 12} 170 ${y}`}
          stroke="#2e3a85"
          strokeWidth="9"
          fill="none"
        />
      ))}
    </g>
    <Face cx={100} cy={102} spread={14} />
    {/* navy stub arms; right gives a sailor wave */}
    <ellipse cx="42" cy="132" rx="11" ry="8" fill="#2e3a85" />
    <g className={wave} style={{ transformOrigin: "156px 130px" }}>
      <ellipse cx="160" cy="126" rx="11" ry="8" fill="#2e3a85" />
    </g>
  </>
);

/* sprossi (de) — nutcracker: tall hat + gold band, glasses, beard, buttons, belt. */
const sprossi: BuddyArt = (wave) => (
  <>
    {/* sprout peeks from behind the tall hat */}
    <Sprout x={100} stem="#1f2a52" />
    {/* tall black hat with gold band */}
    <rect x="74" y="22" width="52" height="46" rx="6" fill="#1c1c22" />
    <rect x="70" y="60" width="60" height="12" rx="4" fill="#1c1c22" />
    <rect x="74" y="40" width="52" height="9" fill="#e8b54a" />
    {/* body */}
    <rect x="48" y="80" width="104" height="112" rx="34" fill="#3b5bd2" />
    {/* darker lower shading */}
    <path d="M48 150 v8 a34 34 0 0 0 104 0 v-8 a34 26 0 0 1 -104 0 z" fill="#2f49ab" opacity="0.7" />
    {/* lighter face panel */}
    <ellipse cx="100" cy="104" rx="40" ry="34" fill="#5273e6" opacity="0.5" />
    <Face cx={100} cy={100} spread={15} blush={false} />
    {/* round glasses (thin dark circles) over the eyes */}
    <circle cx="85" cy="100" r="11" fill="none" stroke="#1c1c22" strokeWidth="2.4" />
    <circle cx="115" cy="100" r="11" fill="none" stroke="#1c1c22" strokeWidth="2.4" />
    <line x1="96" y1="100" x2="104" y2="100" stroke="#1c1c22" strokeWidth="2.4" />
    {/* white beard arc UNDER the smile */}
    <path d="M76 122 q24 26 48 0 q-6 22 -24 22 q-18 0 -24 -22 z" fill="#f4f1ea" />
    {/* gold button column */}
    <circle cx="100" cy="150" r="4.5" fill="#e8b54a" />
    <circle cx="100" cy="164" r="4.5" fill="#e8b54a" />
    {/* black belt with gold buckle */}
    <rect x="48" y="176" width="104" height="12" fill="#1c1c22" />
    <rect x="92" y="177" width="16" height="10" rx="2" fill="#e8b54a" />
    {/* arms; right hand salutes */}
    <ellipse cx="44" cy="120" rx="10" ry="13" fill="#3b5bd2" />
    <g className={wave} style={{ transformOrigin: "156px 120px" }}>
      <ellipse cx="156" cy="118" rx="10" ry="13" fill="#3b5bd2" />
    </g>
  </>
);

/* gemma (it) — wooden marionette: grain curves, red cap + lime feather, wood nose, bib. */
const gemma: BuddyArt = (wave) => (
  <>
    <Sprout x={100} stem="#a87838" />
    {/* red cap with lime feather */}
    <path d="M62 62 Q100 30 138 62 Z" fill="#e02f26" />
    <path d="M134 56 q18 -16 26 -6 q-12 4 -20 16" fill="#b8f03c" />
    {/* wooden body */}
    <ellipse cx="100" cy="124" rx="58" ry="64" fill="#cf9d5f" />
    {/* darker lower shading */}
    <path d="M44 136 a58 64 0 0 0 112 0 a58 46 0 0 1 -112 0 z" fill="#b07f43" opacity="0.6" />
    {/* lighter belly */}
    <ellipse cx="100" cy="116" rx="36" ry="34" fill="#e0b87f" opacity="0.5" />
    {/* 2-3 thin darker wood-grain curves */}
    <path d="M58 96 q42 -12 84 0" stroke="#a87838" strokeWidth="2" fill="none" opacity="0.7" />
    <path d="M52 150 q48 14 96 0" stroke="#a87838" strokeWidth="2" fill="none" opacity="0.55" />
    {/* red overall bib with gold buttons */}
    <path d="M78 150 h44 v34 a22 22 0 0 1 -44 0 z" fill="#e02f26" />
    <circle cx="90" cy="160" r="3.6" fill="#e8b54a" />
    <circle cx="110" cy="160" r="3.6" fill="#e8b54a" />
    {/* face: small round wood nose ABOVE the smile (only one mouth) */}
    <Face cx={100} cy={100} spread={14} />
    <circle cx="100" cy="110" r="4.2" fill="#b07f43" />
    {/* jointed arms; right hand waves on its string */}
    <ellipse cx="42" cy="124" rx="9" ry="11" fill="#cf9d5f" />
    <g className={wave} style={{ transformOrigin: "158px 122px" }}>
      <ellipse cx="158" cy="120" rx="9" ry="11" fill="#cf9d5f" />
    </g>
  </>
);

/* broto (pt) — Barcelos rooster: comb, beak-as-mouth, folk dots, tail feathers, gold feet. */
const broto: BuddyArt = (wave) => (
  <>
    {/* 3 flat tail feathers peeking behind, left side */}
    <g className={wave} style={{ transformOrigin: "150px 150px" }}>
      <path d="M150 150 q34 -10 40 -34 q-26 2 -44 22" fill="#e02f26" />
      <path d="M150 156 q38 -2 48 -22 q-28 -4 -48 10" fill="#e8b54a" />
      <path d="M150 162 q36 6 50 -6 q-26 -10 -50 -4" fill="#3DDC84" />
    </g>
    {/* red 3-bump comb between the sprout leaves */}
    <path d="M82 42 q6 -16 12 0 q6 -16 12 0 q6 -16 12 0 l0 8 l-36 0 z" fill="#e02f26" />
    <Sprout x={100} stem="#1f2a48" />
    {/* deep navy body */}
    <ellipse cx="100" cy="122" rx="58" ry="64" fill="#2b3a5e" />
    {/* darker lower shading */}
    <path d="M44 134 a58 64 0 0 0 112 0 a58 46 0 0 1 -112 0 z" fill="#1f2a48" opacity="0.7" />
    {/* lighter chest */}
    <ellipse cx="100" cy="124" rx="36" ry="40" fill="#3a4d76" opacity="0.6" />
    {/* face: eyes + golden-orange triangle beak AS the mouth (no smile) */}
    <Face cx={100} cy={98} spread={13} mouth="none" blush={false} />
    <path d="M93 112 l14 0 l-7 11 z" fill="#f0a030" />
    {/* scattered folk dots on the chest */}
    {[
      ["86", "138", "#e02f26"],
      ["112", "134", "#e8b54a"],
      ["100", "152", "#b8f03c"],
      ["122", "150", "#f4f1ea"],
      ["78", "152", "#e8b54a"],
    ].map(([cx, cy, f], i) => (
      <circle key={i} cx={cx} cy={cy} r="3.6" fill={f} />
    ))}
    {/* golden feet */}
    <path d="M82 188 l0 10 m-6 0 l12 0" stroke="#f0a030" strokeWidth="4" strokeLinecap="round" />
    <path d="M118 188 l0 10 m-6 0 l12 0" stroke="#f0a030" strokeWidth="4" strokeLinecap="round" />
  </>
);

/* listik (ru) — matryoshka: head circle into waisted body, cream face oval + belly, scarf. */
const listik: BuddyArt = (wave) => (
  <>
    {/* armless nesting doll: the whole doll weebles from its base (micro-motion) */}
    <g className={wave} style={{ transformOrigin: "100px 196px" }}>
      <Sprout x={100} stem="#b8241c" />
      {/* nesting-doll silhouette: small head flowing into a wider waisted body */}
      <path
        d="M100 44
           C72 44 64 70 66 88
           C50 96 44 124 44 150
           C44 184 70 196 100 196
           C130 196 156 184 156 150
           C156 124 150 96 134 88
           C136 70 128 44 100 44 Z"
        fill="#e02f26"
      />
      {/* darker lower shading */}
      <path d="M48 150 C50 184 72 196 100 196 C128 196 150 184 152 150 C146 178 126 188 100 188 C74 188 54 178 48 150 Z" fill="#c01f18" opacity="0.65" />
      {/* gold trim line at the neck */}
      <path d="M66 88 Q100 78 134 88" stroke="#e8b54a" strokeWidth="3" fill="none" />
      {/* cream face oval with the face INSIDE it */}
      <ellipse cx="100" cy="76" rx="30" ry="32" fill="#f5e6cf" />
      <Face cx={100} cy={74} spread={12} />
      {/* scarf knot at the chin */}
      <path d="M88 102 q12 12 24 0 q-8 12 -12 12 q-4 0 -12 -12 z" fill="#f5e6cf" />
      {/* cream belly panel with a tiny 5-dot flower */}
      <ellipse cx="100" cy="150" rx="30" ry="32" fill="#f5e6cf" />
      {[
        ["100", "138"],
        ["112", "148"],
        ["108", "162"],
        ["92", "162"],
        ["88", "148"],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.2" fill="#e02f26" />
      ))}
      <circle cx="100" cy="150" r="3.2" fill="#e8b54a" />
    </g>
  </>
);

/* futaba (ja) — daruma: wide roly-poly, cream face patch, gold roundel, sakura. NO arms/feet. */
const futaba: BuddyArt = (wave) => (
  <>
    <Sprout x={100} stem="#d96a8e" />
    {/* almost-circular roly-poly body, sits low */}
    <path d="M100 56 C56 56 36 96 36 134 C36 180 64 198 100 198 C136 198 164 180 164 134 C164 96 144 56 100 56 Z" fill="#ff8fb6" />
    {/* darker lower shading */}
    <path d="M40 142 C46 182 70 198 100 198 C130 198 154 182 160 142 C152 176 128 186 100 186 C72 186 48 176 40 142 Z" fill="#ec6f9c" opacity="0.6" />
    {/* big cream face patch */}
    <ellipse cx="100" cy="108" rx="48" ry="44" fill="#f5e6cf" />
    <Face cx={100} cy={102} spread={15} />
    {/* gold belly roundel */}
    <circle cx="100" cy="166" r="15" fill="#e8b54a" />
    <circle cx="100" cy="166" r="15" fill="none" stroke="#c8922f" strokeWidth="2.4" />
    {/* 5-petal sakura by the head; petals flutter (micro-motion) */}
    <g className={wave} style={{ transformOrigin: "150px 78px" }}>
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse
          key={i}
          cx="150"
          cy="78"
          rx="4.5"
          ry="8"
          fill="#ffd0e0"
          transform={`rotate(${a} 150 78) translate(0 -8)`}
        />
      ))}
      <circle cx="150" cy="78" r="3" fill="#e8b54a" />
    </g>
  </>
);

/* yaya (zh) — panda: white body, black ears + eye patches + stubs, red knot pendant. */
const yaya: BuddyArt = (wave) => (
  <>
    <Sprout x={100} stem="#5b5b5b" />
    {/* black ears */}
    <circle cx="64" cy="64" r="16" fill="#2a2a2a" />
    <circle cx="136" cy="64" r="16" fill="#2a2a2a" />
    {/* white body */}
    <ellipse cx="100" cy="122" rx="60" ry="64" fill="#f5f1e8" />
    {/* darker lower shading (warm grey) */}
    <path d="M44 134 a60 64 0 0 0 112 0 a60 46 0 0 1 -112 0 z" fill="#dcd6c8" opacity="0.6" />
    {/* black eye patches with the standard eyes inside them */}
    <ellipse cx="84" cy="100" rx="13" ry="15" fill="#2a2a2a" transform="rotate(-12 84 100)" />
    <ellipse cx="116" cy="100" rx="13" ry="15" fill="#2a2a2a" transform="rotate(12 116 100)" />
    <Face cx={100} cy={100} spread={16} eye="#1c1c1c" blush={false} />
    {/* tiny black nose above the smile keeps a single mouth-read */}
    <ellipse cx="100" cy="112" rx="4.5" ry="3.4" fill="#2a2a2a" />
    {/* black stub arms + feet */}
    <ellipse cx="44" cy="132" rx="11" ry="14" fill="#2a2a2a" />
    <g className={wave} style={{ transformOrigin: "156px 130px" }}>
      <ellipse cx="156" cy="130" rx="11" ry="14" fill="#2a2a2a" />
    </g>
    <ellipse cx="76" cy="186" rx="14" ry="9" fill="#2a2a2a" />
    <ellipse cx="124" cy="186" rx="14" ry="9" fill="#2a2a2a" />
    {/* tiny red knot pendant at the chest side */}
    <circle cx="128" cy="150" r="5" fill="#e82e2e" />
    <path d="M128 155 l-3 7 m3 -7 l3 7" stroke="#e82e2e" strokeWidth="2.4" strokeLinecap="round" />
  </>
);

/* tiboujon (ht) — tanbou drum: tapered barrel, drumhead, rim, ring, pegs, sticks, 3 feet. */
const tiboujon: BuddyArt = (wave) => (
  <>
    {/* sprout rises from the BACK of the drumhead */}
    <Sprout x={118} stem="#142a8a" />
    {/* gently tapered barrel — narrower at the base */}
    <path d="M52 82 L148 82 L132 192 L68 192 Z" fill="#1a3ab8" />
    {/* darker lower shading */}
    <path d="M62 150 L138 150 L132 192 L68 192 Z" fill="#142a8a" opacity="0.7" />
    {/* lighter face panel */}
    <path d="M70 92 L130 92 L122 150 L78 150 Z" fill="#2f50d6" opacity="0.55" />
    {/* cream drumhead ellipse on top with a red rim */}
    <ellipse cx="100" cy="82" rx="50" ry="15" fill="#d21034" />
    <ellipse cx="100" cy="80" rx="44" ry="12" fill="#f5e6cf" />
    {/* red tuning ring low on the barrel (well below the face) */}
    <path d="M64 166 L136 166" stroke="#d21034" strokeWidth="6" strokeLinecap="round" />
    {/* wooden pegs on the sides */}
    {[96, 116, 136].map((y, i) => (
      <g key={i}>
        <rect x="50" y={y} width="6" height="9" rx="2" fill="#caa86a" />
        <rect x={i === 1 ? 145 : 146} y={y} width="6" height="9" rx="2" fill="#caa86a" />
      </g>
    ))}
    {/* face on the barrel — never crossed by the ring/rim */}
    <Face cx={100} cy={112} spread={13} />
    {/* stub arms holding tiny drumsticks; right taps (micro-motion) */}
    <g style={{ transformOrigin: "48px 128px" }}>
      <ellipse cx="46" cy="130" rx="9" ry="7" fill="#1a3ab8" />
      <line x1="40" y1="128" x2="26" y2="118" stroke="#caa86a" strokeWidth="3.4" strokeLinecap="round" />
    </g>
    <g className={wave} style={{ transformOrigin: "154px 128px" }}>
      <ellipse cx="154" cy="130" rx="9" ry="7" fill="#1a3ab8" />
      <line x1="160" y1="128" x2="174" y2="118" stroke="#caa86a" strokeWidth="3.4" strokeLinecap="round" />
    </g>
    {/* three little feet */}
    <ellipse cx="78" cy="194" rx="9" ry="6" fill="#caa86a" />
    <ellipse cx="100" cy="196" rx="9" ry="6" fill="#caa86a" />
    <ellipse cx="122" cy="194" rx="9" ry="6" fill="#caa86a" />
  </>
);

const ART: Record<BuddyId, BuddyArt> = {
  nuri,
  brotito,
  brin,
  sprossi,
  gemma,
  broto,
  listik,
  futaba,
  yaya,
  tiboujon,
};

const LABEL: Record<BuddyId, string> = {
  nuri: "Nuri",
  brotito: "Brotito",
  brin: "Brin",
  sprossi: "Sprossi",
  gemma: "Gemma",
  broto: "Broto",
  listik: "Listik",
  futaba: "Futaba",
  yaya: "Yaya",
  tiboujon: "Ti Boujon",
};

/** Which micro-motion class each buddy uses for its single charming move. */
const MOTION: Record<BuddyId, string> = {
  nuri: "wavehand",
  brotito: "buddy-peek",
  brin: "wavehand",
  sprossi: "wavehand",
  gemma: "wavehand",
  broto: "buddy-peek",
  listik: "buddy-peek",
  futaba: "buddy-peek",
  yaya: "wavehand",
  tiboujon: "wavehand",
};

/** Deterministic per-id hash → stable float delay, so groups never sync. */
function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function isBuddyId(id: string): id is BuddyId {
  return (BUDDY_IDS as readonly string[]).includes(id);
}

export function Buddy({
  id,
  size = 160,
  animated = true,
  className = "",
}: {
  id: string;
  size?: number;
  animated?: boolean;
  className?: string;
}): ReactNode {
  if (!isBuddyId(id)) return null;

  const h = seed(id);
  const floatDelay = -((h % 200) / 100); // 0–2s, negative → starts mid-float
  const wave = animated ? MOTION[id] : "";

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size}
      role="img"
      aria-label={`${LABEL[id]} the buddy`}
      className={`${animated ? "floaty" : ""} ${className}`.trim()}
      style={animated ? { animationDelay: `${floatDelay}s` } : undefined}
    >
      {ART[id](wave)}
    </svg>
  );
}
