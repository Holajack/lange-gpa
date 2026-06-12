"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";

/**
 * The hero welcome buddy — the 3D toy Nuri waving, rendered in Blender as a
 * transparent VP9 loop. Browsers without webm-alpha support (Safari) get the
 * original waving SVG Nuri, so the hero never breaks.
 */
export function HeroBuddy({ size = 320 }: { size?: number }) {
  const [canWebm, setCanWebm] = useState<boolean | null>(null);

  useEffect(() => {
    const v = document.createElement("video");
    setCanWebm(v.canPlayType('video/webm; codecs="vp9"') !== "");
  }, []);

  if (canWebm === null) {
    // SSR / first paint placeholder keeps layout stable
    return <div style={{ width: size, height: size }} aria-hidden />;
  }

  if (!canWebm) {
    return <Mascot mood="wave" size={Math.round(size * 0.7)} />;
  }

  return (
    <video
      src="/mascots/nuri-wave.webm"
      width={size}
      height={size}
      autoPlay
      loop
      muted
      playsInline
      aria-label="Nuri, your sprout buddy, waving hello"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
