"use client";

/**
 * The credit system, local-first.
 *
 * Two currencies live in one wallet:
 *   • exchangeHours — free "growing hours". Earn one by nurturing an hour in
 *     your language; spend one to be grown an hour in another. lifetimeEarned
 *     and lifetimeSpent stay visible so a fair grower nets toward zero.
 *   • paidHours — bought hours (PPP-scaled) for the paid marketplace.
 *
 * localStorage ("lange.wallet.v1") is the source of truth and works with no
 * backend at all; fresh growers start at all zeroes. Totals are recomputed
 * from the ledger on every read, so the stored totals can never drift. Each
 * change fires a window CustomEvent("lange:wallet") so any open page refreshes.
 *
 * When NEXT_PUBLIC_CONVEX_URL is set we ALSO mirror each new entry to Convex
 * by string name ("credits:recordEntry") via ConvexHttpClient — best-effort,
 * fire-and-forget, never blocking local state (mirrors waitlist:join and
 * ProfileSync). SSR-safe: nothing touches `window` on the server.
 */

import { useCallback, useEffect, useState } from "react";
import { ConvexHttpClient } from "convex/browser";

/* ------------------------------- public types ------------------------------ */

export type LedgerEntry = {
  id: string;
  kind: "earned" | "spent" | "purchased";
  currency: "exchange" | "paid";
  amount: number;
  partner?: string;
  lang?: string;
  minutes?: number;
  note?: string;
  ts: number;
};

export type Wallet = {
  exchangeHours: number;
  paidHours: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  ledger: LedgerEntry[];
  ready: boolean;
};

/* --------------------------------- plumbing -------------------------------- */

const KEY = "lange.wallet.v1";
const DEVICE_KEY = "lange.wallet.device.v1";
const EVENT = "lange:wallet";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

type StoredWallet = {
  exchangeHours: number;
  paidHours: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  ledger: LedgerEntry[];
};

const EMPTY: StoredWallet = {
  exchangeHours: 0,
  paidHours: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
  ledger: [],
};

/** A wallet whose totals are recomputed from its ledger — the only truth. */
function recompute(ledger: LedgerEntry[]): StoredWallet {
  let exchangeHours = 0;
  let paidHours = 0;
  let lifetimeEarned = 0;
  let lifetimeSpent = 0;
  for (const e of ledger) {
    if (e.kind === "earned") {
      exchangeHours += e.amount;
      lifetimeEarned += e.amount;
    } else if (e.kind === "spent") {
      exchangeHours -= e.amount;
      lifetimeSpent += e.amount;
    } else if (e.kind === "purchased") {
      paidHours += e.amount;
    }
  }
  return { exchangeHours, paidHours, lifetimeEarned, lifetimeSpent, ledger };
}

/** Read + heal the wallet from localStorage. SSR-safe (returns EMPTY). */
function read(): StoredWallet {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoredWallet>;
    const ledger = Array.isArray(parsed.ledger) ? (parsed.ledger as LedgerEntry[]) : [];
    return recompute(ledger);
  } catch {
    return EMPTY;
  }
}

function write(next: StoredWallet) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode) — keep working in-memory this session */
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* no CustomEvent support — pages just won't auto-refresh */
  }
}

/**
 * A stable per-device id used only to key the Convex mirror's wallet row.
 * Clerk's user id isn't reachable from here, so a device id is the closest
 * local-first equivalent; the cloud copy is a best-effort convenience, not
 * the source of truth.
 */
function deviceId(): string {
  if (typeof window === "undefined") return "anon";
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Fire-and-forget mirror of one entry to Convex; swallows every failure. */
function mirror(entry: LedgerEntry) {
  if (!CONVEX_URL || typeof window === "undefined") return;
  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    // By string name so this file never imports convex/_generated.
    const mutate = client.mutation as unknown as (
      name: string,
      args: Record<string, unknown>
    ) => Promise<unknown>;
    void mutate("credits:recordEntry", {
      clerkId: deviceId(),
      kind: entry.kind,
      currency: entry.currency,
      amount: entry.amount,
      partner: entry.partner,
      lang: entry.lang,
      minutes: entry.minutes,
      note: entry.note,
    }).catch(() => {
      /* backend unreachable — local stays the truth */
    });
  } catch {
    /* never let the cloud mirror break a local credit movement */
  }
}

function newId(): string {
  return `led_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** Append one entry to local storage, mirror it, and notify listeners. */
function append(partial: Omit<LedgerEntry, "id" | "ts">) {
  const entry: LedgerEntry = { ...partial, id: newId(), ts: Date.now() };
  const current = read();
  const next = recompute([...current.ledger, entry]);
  write(next);
  mirror(entry);
}

/* ----------------------------------- hook ---------------------------------- */

export function useWallet(): Wallet & {
  earn(o: { amount?: number; partner?: string; lang?: string; minutes?: number; note?: string }): void;
  spend(o: { amount?: number; partner?: string; lang?: string; minutes?: number; note?: string }): void;
  purchase(o: { amount: number; note?: string }): void;
} {
  // Start from EMPTY so server and first client render agree, then hydrate.
  const [state, setState] = useState<StoredWallet>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setState(read());
    refresh();
    setReady(true);

    // Same-tab writes fire our CustomEvent; other tabs fire `storage`.
    const onWallet = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh();
    };
    window.addEventListener(EVENT, onWallet);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onWallet);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const earn = useCallback(
    (o: { amount?: number; partner?: string; lang?: string; minutes?: number; note?: string }) => {
      append({
        kind: "earned",
        currency: "exchange",
        amount: o.amount ?? 1,
        partner: o.partner,
        lang: o.lang,
        minutes: o.minutes,
        note: o.note,
      });
    },
    []
  );

  const spend = useCallback(
    (o: { amount?: number; partner?: string; lang?: string; minutes?: number; note?: string }) => {
      append({
        kind: "spent",
        currency: "exchange",
        amount: o.amount ?? 1,
        partner: o.partner,
        lang: o.lang,
        minutes: o.minutes,
        note: o.note,
      });
    },
    []
  );

  const purchase = useCallback((o: { amount: number; note?: string }) => {
    append({
      kind: "purchased",
      currency: "paid",
      amount: o.amount,
      note: o.note,
    });
  }, []);

  return {
    exchangeHours: state.exchangeHours,
    paidHours: state.paidHours,
    lifetimeEarned: state.lifetimeEarned,
    lifetimeSpent: state.lifetimeSpent,
    ledger: state.ledger,
    ready,
    earn,
    spend,
    purchase,
  };
}
