"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Poll a Convex read on an interval. The app talks to Convex imperatively by
 * string name (no reactive useQuery), so every data hook had hand-rolled the
 * same useState + useEffect + setInterval + try/catch + cleanup scaffold —
 * this is that scaffold, once.
 *
 *  - `fetcher` runs immediately on mount and then every `intervalMs` (omit
 *    `intervalMs` to fetch once, like the world roster).
 *  - errors are swallowed so a transient blip keeps the last good data.
 *  - `refresh()` re-runs on demand (call it after a mutation).
 *  - the effect re-subscribes when `enabled` flips or any `deps` change
 *    (e.g. the open conversation's id).
 *  - a ref holds the latest `fetcher`, so the polled call always sees current
 *    props even though the caller passes a fresh closure each render — no
 *    stale-closure bug, no need to memoize the fetcher.
 */
export function usePolledQuery<T>(
  fetcher: () => Promise<T>,
  initial: T,
  opts: { intervalMs?: number; enabled?: boolean; deps?: ReadonlyArray<unknown> } = {}
): { data: T; refresh: () => void } {
  const { intervalMs, enabled = true, deps = [] } = opts;
  const [data, setData] = useState<T>(initial);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      try {
        const r = await fetcherRef.current();
        if (!cancelled) setData(r);
      } catch {
        /* offline / transient — keep the last good data */
      }
    };
    void run();
    const id = intervalMs ? window.setInterval(run, intervalMs) : undefined;
    return () => {
      cancelled = true;
      if (id) window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, enabled, intervalMs, ...deps]);

  return { data, refresh };
}
