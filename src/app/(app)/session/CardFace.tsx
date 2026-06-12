"use client";

import { useEffect, useState } from "react";
import { getCardImage } from "@/lib/cards";

/**
 * CardFace — the text-free face of a picture card.
 *
 * Renders the real illustration from /cards/ when one exists, the emoji
 * otherwise — emoji stays the universal fallback so every deck works even
 * before a single illustration ships. getCardImage (src/lib/cards) lazily
 * fetches /cards/manifest.json and caches it, so the very first paint can
 * land before the manifest does: we probe a few times client-side and
 * settle on whatever the manifest says, never blocking the tile and never
 * showing the written word to the grower.
 */

const PROBE_MS = 400;
const PROBE_MAX = 10; // give the manifest ~4s to arrive, then trust the emoji

export function CardFace({
  itemId,
  emoji,
  className = "",
  imgClassName = "",
}: {
  itemId: string;
  emoji: string;
  /** classes for the emoji fallback span */
  className?: string;
  /** classes for the illustration img */
  imgClassName?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  // client-only: kicks the lazy manifest fetch and re-checks until it lands
  useEffect(() => {
    let alive = true;
    let timer: number | null = null;
    let tries = 0;
    const probe = () => {
      if (!alive) return;
      const found = getCardImage(itemId);
      if (found) {
        setUrl(found);
        return;
      }
      tries += 1;
      if (tries < PROBE_MAX) timer = window.setTimeout(probe, PROBE_MS);
    };
    setUrl(null);
    probe();
    return () => {
      alive = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [itemId]);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static public/ asset, no optimization needed
      <img
        src={url}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setUrl(null)} // broken file → emoji takes back over
        className={`pointer-events-none select-none object-contain ${imgClassName}`}
      />
    );
  }

  return (
    <span aria-hidden className={className}>
      {emoji}
    </span>
  );
}
