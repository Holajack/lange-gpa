"use client";

import type { MascotDef } from "@/lib/mascots";

/**
 * Portrait of a LANGE language sibling — renders the pre-generated
 * /mascots/{id}.png (1024×1024, transparent background) with an optional
 * soft drop-shadow glow in the sibling's own color and the shared
 * .floaty idle animation from globals.css.
 */
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
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static public/ asset, no optimization needed
    <img
      src={mascot.image}
      alt={`${mascot.name} — ${mascot.toy}`}
      width={size}
      height={size}
      draggable={false}
      className={`select-none ${float ? "floaty" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        filter: glow
          ? `drop-shadow(0 0 ${Math.max(10, Math.round(size * 0.16))}px color-mix(in srgb, ${mascot.color} 55%, transparent))`
          : undefined,
      }}
    />
  );
}
