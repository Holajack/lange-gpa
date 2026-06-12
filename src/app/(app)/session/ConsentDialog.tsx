"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Card, Pill } from "@/components/ui";

/**
 * ConsentDialog — the consent-first gate in front of the session recorder.
 *
 * GPA sessions are intimate: two people, one room, lots of laughter. So
 * nothing records until everyone in the room has explicitly said yes. The
 * dialog spells out WHAT is captured (mic; camera only if switched on),
 * WHY (the talking picture dictionary — re-living the session afterwards),
 * and WHERE it lives (this device only — nothing ever uploads). In human
 * mode both partners must tick "we both agree"; in AI mode the grower's
 * own yes is enough. A yes lasts for the running session only — it is
 * never persisted. Declining simply keeps recording off; the session
 * itself is completely untouched.
 */

export function ConsentDialog({
  open,
  human,
  camera,
  nurturerName,
  growerName,
  onAccept,
  onDecline,
}: {
  open: boolean;
  /** human mode → both partners must explicitly agree */
  human: boolean;
  /** is camera capture currently switched on? */
  camera: boolean;
  nurturerName: string;
  growerName: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [agree, setAgree] = useState(false);

  // a fresh ask every time the dialog opens — consent is never pre-ticked
  useEffect(() => {
    if (open) setAgree(false);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onDecline}
        >
          <motion.div
            initial={{ scale: 0.94, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="p-6">
              <h3 className="headline text-2xl">Record this session? 🎙️</h3>
              <p className="mt-2 text-sm text-muted">
                Consent first — a recording is a gift to your future self, never a requirement.
              </p>

              <div className="mt-5 space-y-2.5">
                {[
                  [
                    "🎙️",
                    "What gets recorded",
                    camera
                      ? "Microphone and camera — you switched the camera on."
                      : "Microphone audio only. The camera stays off unless you switch it on later — this same agreement covers it.",
                  ],
                  [
                    "📖",
                    "Why",
                    "It becomes your talking picture dictionary — replay the session afterwards and re-live every card in the same voice.",
                  ],
                  [
                    "🔒",
                    "Where it lives",
                    "This device only. Nothing uploads, nothing syncs — close the tab and it's gone unless you download it.",
                  ],
                ].map(([emoji, title, body]) => (
                  <div key={title} className="flex items-start gap-3 rounded-2xl bg-white/4 px-4 py-3">
                    <span className="text-xl">{emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {human && (
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/4 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-violet"
                  />
                  <span className="text-sm leading-relaxed">
                    Both of us agree to be recorded —{" "}
                    <span className="font-semibold text-ink">{nurturerName}</span> (nurturer) and{" "}
                    <span className="font-semibold text-ink">{growerName}</span> (grower).
                  </span>
                </label>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <Pill onClick={onDecline} className="bg-white/8 px-5 py-2.5 text-sm font-semibold text-ink">
                  Not now
                </Pill>
                <Pill
                  onClick={onAccept}
                  disabled={human && !agree}
                  className="gap-2 bg-violet px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <ShieldCheck size={15} /> Agree — start recording
                </Pill>
              </div>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
                Declining changes nothing — the session is exactly the same without a recording. A yes lasts this
                session only and is never stored.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
