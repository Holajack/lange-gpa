"use client";

import type { MascotDef } from "@/lib/mascots";

/**
 * Portrait of a LANGE language sibling — renders the pre-generated
 * /mascots/{id}.png (1024×1024, transparent background) with an optional
 * soft drop-shadow glow in the sibling's own color and, when `float` is
 * on, the organic .buddy-bob / .buddy-peek idle motion from globals.css.
 *
 * Every floating sibling moves to its own rhythm: a tiny deterministic
 * hash of the mascot id picks the animation delay (0–2s, applied negative
 * so nobody ever stands still waiting) and duration (3.1–3.9s), so a
 * group never bobs in sync — alive, not metronomic.
 */

function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function MascotImage({
  mascot,
  size,
  float = false,
  glow = false,
  className = "",
}: {
  mascot: MascotDef;
  size: number;
  float?: boolean;
  glow?: boolean;
  className?: string;
}) {
  const glowFilter = glow
    ? `drop-shadow(0 0 ${Math.max(10, Math.round(size * 0.16))}px color-mix(in srgb, ${mascot.color} 55%, transparent))`
    : undefined;

  if (!float) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static public/ asset, no optimization needed
      <img
        src={mascot.image}
        alt={`${mascot.name} — ${mascot.toy}`}
        title={mascot.toy}
        width={size}
        height={size}
        draggable={false}
        className={`select-none ${className}`}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: glowFilter,
        }}
      />
    );
  }

  const h = seed(mascot.id);
  const bobDelay = -((h % 200) / 100); // 0–2s, negative → starts mid-bob
  const bobDuration = 3.1 + ((h >>> 3) % 81) / 100; // 3.1–3.9s
  const peekDelay = -(((h >>> 5) % 200) / 100);
  const peekDuration = 4.8 + ((h >>> 7) % 161) / 100; // 4.8–6.4s

  return (
    <span
      className={`buddy-bob inline-block ${className}`}
      style={{
        width: size,
        height: size,
        animationDelay: `${bobDelay}s`,
        animationDuration: `${bobDuration}s`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static public/ asset, no optimization needed */}
      <img
        src={mascot.image}
        alt={`${mascot.name} — ${mascot.toy}`}
        title={mascot.toy}
        width={size}
        height={size}
        draggable={false}
        className="buddy-peek select-none"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          animationDelay: `${peekDelay}s`,
          animationDuration: `${peekDuration}s`,
          filter: glowFilter,
        }}
      />
    </span>
  );
}
