"use client";

/**
 * /messages — 1:1 conversations (Stage D, text layer). Inbox on the left,
 * the open thread on the right. Open a person from /world ("Message") and it
 * lands here as ?with=<profileId>.
 */

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useApp } from "@/lib/store";
import { useConversation, useConversations } from "@/lib/messages";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui";

function MessagesInner() {
  const { profile, t } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const withId = params.get("with");

  const convos = useConversations();
  const { other, messages, send } = useConversation(withId);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!profile) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const txt = draft.trim();
    if (!txt) return;
    setDraft("");
    void send(txt);
  };

  return (
    <div className="space-y-6">
      <h1 className="headline text-4xl lg:text-5xl">{t("messages")}</h1>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* inbox */}
        <Card className="max-h-[72vh] overflow-y-auto p-2">
          {convos.length === 0 ? (
            <p className="p-4 text-sm text-muted">{t("msgNoConvos")}</p>
          ) : (
            <div className="space-y-1">
              {convos.map((c) => {
                const active = c.otherProfileId === withId;
                return (
                  <button
                    key={c.otherProfileId}
                    type="button"
                    onClick={() => router.push(`/messages?with=${c.otherProfileId}`)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${active ? "bg-violet/15" : "hover:bg-white/5"}`}
                  >
                    <Avatar name={c.otherName} color="#7c5cff" size={42} ring src={c.otherPhoto} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.otherName}</p>
                      <p className="truncate text-xs text-muted">
                        {c.lastMine ? `${t("msgYou")} ` : ""}
                        {c.lastText}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-violet px-2 py-0.5 text-[11px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* thread */}
        <Card className="flex h-[72vh] flex-col p-0">
          {!withId || !other ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted">
              {t("msgPickSomeone")}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line p-4">
                <Avatar name={other.name} color="#7c5cff" size={40} ring src={other.photo} />
                <p className="font-display text-base font-bold">{other.name}</p>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">{t("msgSayHi")}</p>
                ) : (
                  messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                    >
                      <span
                        className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          m.mine ? "rounded-br-md bg-violet text-white" : "rounded-bl-md bg-raised-2 text-ink"
                        }`}
                      >
                        {m.text}
                      </span>
                    </motion.div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={submit} className="flex items-center gap-2 border-t border-line p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("msgPlaceholder")}
                  maxLength={2000}
                  className="flex-1 rounded-full border border-line bg-white/5 px-4 py-2.5 text-sm text-ink caret-violet outline-none transition-colors placeholder:text-white/25 focus:border-violet"
                />
                <button
                  type="submit"
                  aria-label={t("msgSend")}
                  disabled={!draft.trim()}
                  className="pill flex h-10 w-10 shrink-0 items-center justify-center bg-violet text-white disabled:opacity-40"
                  style={{ boxShadow: "var(--shadow-glow-violet)" }}
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      }
    >
      <MessagesInner />
    </Suspense>
  );
}
