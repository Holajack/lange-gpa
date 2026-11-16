import { eraseLibrary } from "./library";

/**
 * Remove everything this account saved in this browser: the Listening Library
 * (recordings and pictures), the Word Log, tool work-in-progress, and the
 * profile and progress cache. The device half of "Delete account".
 *
 * Other accounts that have used the same browser keep their own material:
 * - keys namespaced with an owner (`…v1:{owner}` / `…v1:{owner}:{lang}`) are
 *   removed only when the owner is this account;
 * - studio keys that hold one slot per owner (`{owner}|{lang}`, `{owner}:{lang}`,
 *   possibly under `slots`) lose only this account's slots;
 * - everything else under `lange.` is the signed-in account's own cache.
 */

const OWNER_KEY = "lange.profile.owner.v1";

function isOwnSlot(name: string, owner: string): boolean {
  return name === owner || name.startsWith(`${owner}:`) || name.startsWith(`${owner}|`);
}

/** Drop this owner's slots from a slot map (one level, or nested under `slots`). */
function scrubSlots(value: unknown, owner: string, depth = 0): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [name, inner] of Object.entries(value as Record<string, unknown>)) {
    if (isOwnSlot(name, owner)) continue;
    out[name] = depth === 0 && name === "slots" ? scrubSlots(inner, owner, 1) : inner;
  }
  return out;
}

function isEmpty(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.every(([name, inner]) => name === "slots" && isEmpty(inner));
}

export async function wipeDevice(): Promise<void> {
  let owner = "local";
  try {
    owner = localStorage.getItem(OWNER_KEY) || "local";
  } catch {
    // storage blocked — nothing was saved to remove
  }

  // recordings and pictures first: the library finds its database through the owner key
  try {
    await eraseLibrary();
  } catch {
    // an unavailable database holds nothing to erase
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    for (const key of keys) {
      if (key === "nuri.geocode.v1") {
        localStorage.removeItem(key);
        continue;
      }
      if (!key.startsWith("lange.")) continue;

      const colon = key.indexOf(":");
      if (colon >= 0) {
        // namespaced per owner — only this account's
        if (isOwnSlot(key.slice(colon + 1), owner)) localStorage.removeItem(key);
        continue;
      }
      if (key.startsWith("lange.studio.")) {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(localStorage.getItem(key) ?? "null");
        } catch {
          // unreadable — remove it below
        }
        const kept = scrubSlots(parsed, owner);
        if (isEmpty(kept)) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(kept));
        continue;
      }
      localStorage.removeItem(key); // profile, progress, achievements, one-time prompts
    }
  } catch {
    // storage blocked
  }
}
