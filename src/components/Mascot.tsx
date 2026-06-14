"use client";

/**
 * Nuri — the Nuri mascot (from "nurturer"). A round orange sprout-bot
 * with a friendly visor face, hand-drawn as inline SVG so it can wave,
 * float and cheer without any image assets.
 */
export function Mascot({
  size = 160,
  mood = "wave",
  float = true,
  className = "",
}: {
  size?: number;
  mood?: "wave" | "happy" | "think" | "cheer";
  float?: boolean;
  className?: string;
}) {
  const eyes =
    mood === "cheer" ? (
      <>
        <path d="M64 76 q6 -8 12 0" stroke="#FFD234" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M92 76 q6 -8 12 0" stroke="#FFD234" strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    ) : mood === "think" ? (
      <>
        <circle cx="70" cy="76" r="5" fill="#FFD234" />
        <circle cx="98" cy="72" r="5" fill="#FFD234" />
      </>
    ) : (
      <>
        <circle cx="70" cy="75" r="5.5" fill="#FFD234" />
        <circle cx="98" cy="75" r="5.5" fill="#FFD234" />
      </>
    );

  return (
    <svg
      viewBox="0 0 170 170"
      width={size}
      height={size}
      className={`${float ? "floaty" : ""} ${className}`}
      role="img"
      aria-label="Nuri the mascot"
    >
      {/* sprout */}
      <path d="M85 22 q-2 -14 -16 -16 q4 14 13 16" fill="#B8F03C" />
      <path d="M85 22 q4 -12 16 -13 q-3 12 -13 14" fill="#3DDC84" />
      <line x1="85" y1="22" x2="85" y2="34" stroke="#E5740E" strokeWidth="5" strokeLinecap="round" />

      {/* body */}
      <ellipse cx="85" cy="96" rx="56" ry="60" fill="#FF8A1E" />
      <ellipse cx="85" cy="96" rx="56" ry="60" fill="url(#nuriShine)" />

      {/* visor */}
      <rect x="48" y="56" width="74" height="40" rx="20" fill="#2A2118" />
      {eyes}
      {/* smile inside visor */}
      {mood !== "think" && (
        <path d="M76 87 q8 7 16 0" stroke="#FFD234" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}

      {/* belly button */}
      <circle cx="85" cy="124" r="11" fill="#FFD234" />
      <circle cx="85" cy="124" r="11" fill="none" stroke="#E5740E" strokeWidth="3" />

      {/* left arm */}
      <path d="M34 100 q-16 6 -18 22 q14 2 24 -10" fill="#FF8A1E" />

      {/* right arm — waves */}
      <g className={mood === "wave" || mood === "cheer" ? "wavehand" : ""}>
        <path d="M136 96 q22 -10 26 -30 q-20 -4 -32 16" fill="#FF8A1E" />
        <circle cx="160" cy="64" r="9" fill="#FFB52E" />
      </g>

      {/* feet */}
      <ellipse cx="62" cy="156" rx="14" ry="8" fill="#E5740E" />
      <ellipse cx="108" cy="156" rx="14" ry="8" fill="#E5740E" />

      <defs>
        <radialGradient id="nuriShine" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#FFC46B" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#FF8A1E" stopOpacity="0" />
          <stop offset="100%" stopColor="#C75E00" stopOpacity="0.35" />
        </radialGradient>
      </defs>
    </svg>
  );
}
