"use client";

/**
 * Incoming session-request inbox — shown at the top of the dashboard so a
 * grower/nurturer sees when someone has asked to practice with them and can
 * accept or decline. Renders nothing when there are no pending requests.
 */

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useRequests } from "@/lib/requests";
import { langByCode } from "@/lib/languages";
import { Avatar } from "@/components/Avatar";
import type { LangCode } from "@/lib/types";

export function SessionRequests() {
  const { t } = useApp();
  const { incoming, respond } = useRequests();
  const pending = incoming.filter((r) => r.status === "pending");
  if (pending.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <h2 className="headline mb-3 flex items-center gap-2 text-lg">
        📨 {t("reqInboxTitle")}
        <span className="rounded-full bg-violet/20 px-2 py-0.5 text-xs font-bold text-violet-soft">{pending.length}</span>
      </h2>
      <div className="space-y-2.5">
        {pending.map((r) => {
          const lang = langByCode(r.lang as LangCode);
          return (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 p-3">
              <Avatar name={r.fromName} color="#7c5cff" size={40} ring />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{r.fromName}</p>
                <p className="text-xs text-muted">
                  {t("reqWantsToPractice")} · {lang.flag} {lang.nativeName}
                </p>
                {r.message && <p className="mt-0.5 text-xs italic text-muted">“{r.message}”</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void respond(r.id, true)}
                  className="pill bg-lime px-4 py-1.5 text-xs font-bold text-canvas"
                >
                  {t("reqAccept")}
                </button>
                <button
                  type="button"
                  onClick={() => void respond(r.id, false)}
                  className="pill bg-white/8 px-4 py-1.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  {t("reqDecline")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
