/**
 * Picture-card illustrations — pre-generated flat sticker art for vocab items
 * (see scripts/generate-card-images.mjs → public/cards/{itemId}.webp +
 * public/cards/manifest.json). Meaning stays in the IMAGE, true to GPA:
 * when no illustration exists yet, callers fall back to the item's emoji,
 * so no card is ever blank.
 *
 * SSR-safe: on the server every lookup is null and nothing is fetched.
 * In the browser the manifest is fetched lazily once and cached for the
 * lifetime of the page; a missing/broken manifest degrades to "no images".
 */

type CardManifest = { items: Record<string, string> };

const EMPTY: CardManifest = { items: {} };

let manifest: CardManifest | null = null;
let manifestPromise: Promise<CardManifest> | null = null;

function loadManifest(): Promise<CardManifest> {
  if (typeof window === "undefined") return Promise.resolve(EMPTY);
  if (manifest) return Promise.resolve(manifest);
  if (!manifestPromise) {
    manifestPromise = fetch("/cards/manifest.json")
      .then((res) => (res.ok ? (res.json() as Promise<CardManifest>) : EMPTY))
      .catch(() => EMPTY)
      .then((m) => {
        manifest = m && typeof m === "object" && m.items && typeof m.items === "object" ? m : EMPTY;
        return manifest;
      });
  }
  return manifestPromise;
}

/**
 * Public path of the pre-generated illustration for a vocab item id
 * (e.g. "/cards/apple.webp"), or null when the card has no illustration —
 * including while the manifest fetch is still in flight, and always on SSR.
 * The first browser call kicks off the (cached) manifest fetch; pair with
 * whenCardsReady() to re-render once it lands.
 */
export function getCardImage(itemId: string): string | null {
  if (!manifest) {
    void loadManifest();
    return null;
  }
  return manifest.items[itemId] ?? null;
}

/**
 * Resolves once the card manifest has been fetched (immediately on SSR).
 * Never rejects — a failed fetch resolves with the empty manifest.
 */
export function whenCardsReady(): Promise<void> {
  return loadManifest().then(() => undefined);
}
