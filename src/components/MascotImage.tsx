"use client";

import type { MascotDef } from "@/lib/mascots";
import { Buddy, BUDDY_IDS } from "@/components/buddies/Buddy";

/**
 * Portrait of a Nuri language sibling — flat hand-drawn SVG art in the
 * same style as the hero Nuri (the 3D renders live on in docs/, but the
 * app is flat-vector everywhere). Falls back to the rendered PNG for any
 * future buddy whose SVG hasn't been drawn yet.
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

  const hasSvg = (BUDDY_IDS as readonly string[]).includes(mascot.id);
  const art = hasSvg ? (
    <Buddy id={mascot.id} size={size} animated={float} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- static public/ asset fallback for buddies without SVG art yet
    <img
      src={mascot.image}
      alt={`${mascot.name} — ${mascot.toy}`}
      title={mascot.toy}
      width={size}
      height={size}
      draggable={false}
      className="select-none"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );

  if (!float) {
    return (
      <span
        role="img"
        aria-label={`${mascot.name} — ${mascot.toy}`}
        title={mascot.toy}
        className={`inline-block select-none ${className}`}
        style={{ width: size, height: size, filter: glowFilter }}
      >
        {art}
      </span>
    );
  }

  const h = seed(mascot.id);
  const bobDelay = -((h % 200) / 100); // 0–2s, negative → starts mid-bob
  const bobDuration = 3.1 + ((h >>> 3) % 81) / 100; // 3.1–3.9s

  return (
    <span
      role="img"
      aria-label={`${mascot.name} — ${mascot.toy}`}
      title={mascot.toy}
      className={`buddy-bob inline-block select-none ${className}`}
      style={{
        width: size,
        height: size,
        animationDelay: `${bobDelay}s`,
        animationDuration: `${bobDuration}s`,
        filter: glowFilter,
      }}
    >
      {art}
    </span>
  );
}
