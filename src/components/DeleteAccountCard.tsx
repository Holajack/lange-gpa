"use client";

/**
 * Delete account — the last card on /profile.
 *
 * A real deletion, not a deactivation: the account's rows are removed from
 * the backend (convex/account.ts), then the sign-in itself (Clerk), then
 * everything this account saved in this browser. Nothing is kept and there is
 * no grace period, so the card says so plainly and makes the person tick a
 * box before the button works.
 *
 * In a keyless demo build there is no backend account: the same button just
 * wipes this browser.
 */

import { useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { CONVEX_ON } from "@/lib/convexClient";
import { deleteClerkAccount } from "@/lib/accountActions";
import { wipeDevice } from "@/lib/wipeDevice";
import { Card } from "@/components/ui";

type Deleter = () => Promise<void>;

/** Backend rows → sign-in → this browser. Each step only runs if the one before succeeded. */
function useDeleterLive(): Deleter {
  const convex = useConvex();
  const clerk = useClerk();
  return async () => {
    // the backend removes a bounded batch per call and says when nothing is left
    let done = false;
    for (let pass = 0; pass < 80 && !done; pass++) {
      const result = (await convex.mutation("account:deleteMyAccount" as never, {} as never)) as { done: boolean };
      done = result.done;
    }
    if (!done) throw new Error("Account data could not be fully removed");
    const { ok } = await deleteClerkAccount();
    if (!ok) throw new Error("Sign-in could not be removed");
    await wipeDevice();
    try {
      await clerk.signOut();
    } catch {
      // the sign-in no longer exists — there is nothing left to sign out of
    }
  };
}

function useDeleterLocal(): Deleter {
  return wipeDevice;
}

// fixed for a deployment, so the hook identity never changes between renders
const useDeleter: () => Deleter = CONVEX_ON ? useDeleterLive : useDeleterLocal;

const LEGAL_LINKS = [
  { href: "/legal/terms", key: "lglTerms" },
  { href: "/legal/privacy", key: "lglPrivacy" },
  { href: "/legal/conduct", key: "lglConduct" },
  { href: "/legal/recording-consent", key: "lglRecording" },
];

export function DeleteAccountCard() {
  const { t, resetAll } = useApp();
  const remove = useDeleter();
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await remove();
      resetAll();
      // a full load, so nothing of the old account survives in memory
      window.location.replace("/");
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="headline text-xl">{t("acctDeleteTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("acctDeleteSub")}</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pill flex min-h-11 items-center gap-2 border border-coral/40 bg-coral/10 px-4 text-sm font-semibold text-coral"
          >
            <Trash2 size={15} aria-hidden /> {t("acctDeleteTitle")}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 rounded-2xl border border-coral/30 bg-coral/5 p-4 sm:p-5">
          <p className="text-sm leading-relaxed text-ink">{t("acctDeleteWarn")}</p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={agreed}
              disabled={busy}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-coral)]"
            />
            <span>{t("acctDeleteCheck")}</span>
          </label>
          {failed && (
            <p role="alert" className="mt-3 text-sm font-semibold text-coral">
              {t("acctDeleteError")}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={!agreed || busy}
              className="pill min-h-11 bg-coral px-5 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Trash2 size={15} aria-hidden /> {busy ? t("acctDeleting") : t("acctDeleteConfirm")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setAgreed(false);
                setFailed(false);
              }}
              className="pill min-h-11 bg-white/8 px-5 text-sm font-semibold text-ink disabled:opacity-40"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      <nav aria-label="Legal" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-muted">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="underline-offset-4 hover:text-ink hover:underline">
            {t(link.key)}
          </Link>
        ))}
      </nav>
    </Card>
  );
}
