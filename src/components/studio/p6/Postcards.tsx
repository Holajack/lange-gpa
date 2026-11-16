"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDay, localIso, newId, type Postcard } from "./model";
import { AccentButton, Panel, RemoveButton, inputCls } from "./ui";

/**
 * Postcards — short notes to carry to a partner: a phrase overheard on the
 * bus, a question, a thing you couldn't say. They live on this device and
 * are written by the grower only. Nuri never writes one and never answers
 * one; they wait for a person.
 */
export function Postcards({
  cards,
  onChange,
  accent,
  sub,
}: {
  cards: Postcard[];
  onChange: (next: Postcard[]) => void;
  accent: string;
  sub?: string;
}) {
  const { t, uiLang } = useApp();
  const [text, setText] = useState("");
  const waiting = cards.filter((c) => !c.done);
  const carried = cards.filter((c) => c.done);

  const add = () => {
    const clean = text.trim().slice(0, 240);
    if (!clean) return;
    onChange([{ id: newId("pc"), text: clean, at: localIso(), done: false }, ...cards]);
    setText("");
  };

  const row = (card: Postcard) => (
    <li key={card.id} className="flex items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-3">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={card.done}
          onChange={(e) => onChange(cards.map((c) => (c.id === card.id ? { ...c, done: e.target.checked } : c)))}
          aria-label={t("st6_p_carried")}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-mint)]"
        />
        <span className="min-w-0">
          <span className={`block break-words text-sm leading-relaxed ${card.done ? "text-muted" : "text-ink"}`}>
            {card.text}
          </span>
          <span className="block text-xs text-muted">
            {fmtDay(card.at, uiLang)}
            {card.done && ` · ${t("st6_p_carried")}`}
          </span>
        </span>
      </label>
      <RemoveButton label={t("st6_remove")} onConfirm={() => onChange(cards.filter((c) => c.id !== card.id))} />
    </li>
  );

  return (
    <Panel title={`✉️ ${t("st6_p_title")}`} sub={sub ?? t("st6_p_sub")}>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={240}
          placeholder={t("st6_p_placeholder")}
          aria-label={t("st6_p_placeholder")}
          className={`${inputCls} flex-1 basis-56`}
        />
        <AccentButton accent={accent} type="submit" disabled={!text.trim()}>
          <Plus size={15} strokeWidth={3} /> {t("st6_p_add")}
        </AccentButton>
      </form>
      {cards.length === 0 ? (
        <p className="text-sm text-muted">{t("st6_p_empty")}</p>
      ) : (
        <>
          {waiting.length > 0 && <ul className="space-y-2">{waiting.map(row)}</ul>}
          {carried.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-muted">
                {t("st6_p_carriedCount").replace("{n}", String(carried.length))}
              </summary>
              <ul className="mt-2 space-y-2">{carried.map(row)}</ul>
            </details>
          )}
        </>
      )}
    </Panel>
  );
}
