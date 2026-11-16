"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDuration, useLibrary, type LibraryFilter, type LibraryItem } from "@/lib/library";
import { ClarifyPlayer, type GapType } from "../ClarifyPlayer";

/**
 * A recording list scoped by TAGS as well as the usual library filter.
 *
 * Phase 6 threads recordings by discourse track, by reading and by topic
 * (`track:…`, `read:…`, `topic:…` tags), which the shared RecordingList's
 * filter can't express. This composes the same two primitives it does
 * (useLibrary + ClarifyPlayer) and keeps its look.
 */

export const hasTags = (item: LibraryItem, tags: readonly string[]) => {
  const own = item.tags ?? [];
  return tags.every((tag) => own.includes(tag));
};

export function TaggedRecordingList({
  filter,
  tags = [],
  accent,
  title,
  emptyText,
  gapTypes,
  moves,
  allowWords = true,
  renderExtra,
  pick,
}: {
  filter: LibraryFilter;
  /** every one of these must be on the recording */
  tags?: readonly string[];
  /** narrow or reorder the matches (e.g. a "listen before your next meeting" queue) */
  pick?: (items: LibraryItem[]) => LibraryItem[];
  accent: string;
  title: string;
  emptyText?: string;
  gapTypes?: GapType[];
  moves?: string[];
  allowWords?: boolean;
  /** extra controls under an opened recording (a threaded recorder, its takes) */
  renderExtra?: (item: LibraryItem) => ReactNode;
}) {
  const { t } = useApp();
  const { items, all, ready } = useLibrary(filter);
  const [openId, setOpenId] = useState<string | null>(null);
  const matched = items.filter((it) => hasTags(it, tags));
  const shown = pick ? pick(matched) : matched;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {ready && shown.length === 0 && <p className="text-sm text-muted">{emptyText ?? t("stc_noRecordings")}</p>}
      <ul className="space-y-2">
        {shown.map((it) => {
          const open = openId === it.id;
          const openMarks = it.marks.filter((m) => !m.resolved).length;
          const takes = all.filter((x) => x.parentId === it.id).length;
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : it.id)}
                aria-expanded={open}
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-3 text-left hover:bg-raised-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{it.title}</span>
                  <span className="block text-xs text-muted">
                    {t(`stc_kind_${it.kind}`)} · {fmtDuration(it.durationSec)} · {t("stc_plHeard")} {it.relistens.length}{" "}
                    {t("stc_plTimes")}
                    {takes > 0 && ` · ${takes} ${t("stc_takes")}`}
                  </span>
                </span>
                {openMarks > 0 && (
                  <span className="shrink-0 rounded-full bg-coral/20 px-2.5 py-1 text-xs font-bold text-coral">
                    🚩 {openMarks}
                  </span>
                )}
                {it.familiar && <span className="text-xs font-bold text-mint">✓</span>}
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="mt-2 space-y-3">
                  <ClarifyPlayer
                    item={it}
                    accent={accent}
                    gapTypes={gapTypes}
                    moves={moves}
                    allowWords={allowWords}
                    onDeleted={() => setOpenId(null)}
                  />
                  {renderExtra?.(it)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The takes threaded under one recording (an improved version, a retelling…). */
export function TakesUnder({
  parent,
  accent,
  title,
  moves,
}: {
  parent: LibraryItem;
  accent: string;
  title: string;
  moves?: string[];
}) {
  const { items } = useLibrary({ parentId: parent.id });
  if (items.length === 0) return null;
  return <TaggedRecordingList filter={{ parentId: parent.id }} accent={accent} title={title} moves={moves} />;
}
