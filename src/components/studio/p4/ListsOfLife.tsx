"use client";

import { Trash2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode } from "@/lib/types";
import { P4_LIST_MOVES } from "./content";
import { AddLine, INPUT, SUB, SayLines, uid } from "./shared";

/**
 * A "list of life": things of one kind that everyone in this walk of life
 * knows (the breaks in a shift, the kinds of bread, the places in a workshop).
 * The grower builds it live by reading the list back and asking "anything
 * else?", then asks what the whole set is called. Written by the grower in
 * the host language; the app adds nothing to it.
 */
export interface LifeList {
  id: string;
  personId: string;
  /** what the mentor calls the whole set, once asked */
  name: string;
  items: string[];
}

export function ListsOfLife({
  personId,
  lists,
  onLists,
  lang,
  accent,
}: {
  personId: string;
  lists: LifeList[];
  onLists: (fn: (prev: LifeList[]) => LifeList[]) => void;
  lang: LangCode;
  accent: string;
}) {
  const { t } = useApp();
  const mine = lists.filter((l) => l.personId === personId);
  const patch = (id: string, fn: (list: LifeList) => LifeList) =>
    onLists((prev) => prev.map((l) => (l.id === id ? fn(l) : l)));

  return (
    <div className="space-y-3">
      <SayLines lines={P4_LIST_MOVES} lang={lang} />

      {mine.map((list) => (
        <div key={list.id} className={SUB}>
          <div className="flex items-start gap-2">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-semibold text-muted">{t("st4_wl_listName")}</span>
              <input
                value={list.name}
                onChange={(e) => patch(list.id, (l) => ({ ...l, name: e.target.value }))}
                placeholder={t("st4_wl_listNamePlaceholder")}
                maxLength={60}
                lang={lang}
                className={`${INPUT} w-full`}
              />
            </label>
            <button
              type="button"
              onClick={() => onLists((prev) => prev.filter((l) => l.id !== list.id))}
              aria-label={t("st4_remove")}
              className="pill mt-5 h-11 w-11 shrink-0 justify-center bg-white/5 p-0 text-muted hover:text-coral"
            >
              <Trash2 size={14} strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          {list.items.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {list.items.map((item, i) => (
                <li key={`${item}-${i}`} className="flex max-w-full items-center gap-1 rounded-2xl border border-line bg-raised py-1 pl-3 pr-1">
                  <span lang={lang} className="min-w-0 break-words text-sm text-ink">
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => patch(list.id, (l) => ({ ...l, items: l.items.filter((_, j) => j !== i) }))}
                    aria-label={`${t("st4_remove")}: ${item}`}
                    className="pill h-10 w-10 shrink-0 justify-center p-0 text-muted hover:text-coral"
                  >
                    <X size={14} strokeWidth={2.5} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <AddLine
            placeholder={t("st4_wl_listItemPlaceholder")}
            button={t("st4_wl_listItemAdd")}
            onAdd={(text) => patch(list.id, (l) => ({ ...l, items: [...l.items, text] }))}
            accent={accent}
            maxLength={60}
            inputLang={lang}
          />
          <p className="text-xs leading-relaxed text-muted">
            {t("st4_wl_listCount").replace("{n}", String(list.items.length))}
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onLists((prev) => [...prev, { id: uid("ll"), personId, name: "", items: [] }])}
        className="pill min-h-10 border border-dashed border-white/20 bg-white/4 px-4 py-2 text-sm font-semibold text-ink"
      >
        + {t("st4_wl_listNew")}
      </button>
    </div>
  );
}
