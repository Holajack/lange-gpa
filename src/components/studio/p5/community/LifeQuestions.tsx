"use client";

import Link from "next/link";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { BTN_GHOST, Panel } from "../ui";
import { openQuestions, useCommunityStore } from "./model";

/**
 * What went over the grower's head out in their communities this week:
 * shown in the clarifying room so those questions reach the mentor too.
 * Renders nothing when there are none.
 */
export function LifeQuestions({ lang }: { lang: LangCode }) {
  const { t } = useApp();
  const [store] = useCommunityStore(lang);
  const open = openQuestions(store.communities, lang);
  if (open.length === 0) return null;
  return (
    <Panel title={`${t("st5_lqTitle")} · ${open.length}`} sub={t("st5_lqSub")}>
      <ul className="space-y-1 text-sm text-ink">
        {open.slice(0, 5).map(({ community, missed }) => (
          <li key={missed.id} className="flex gap-2">
            <span className="shrink-0 text-muted">{community.name}:</span>
            <span className="min-w-0 break-words">{missed.text}</span>
          </li>
        ))}
        {open.length > 5 && <li className="text-xs text-muted">+{open.length - 5}</li>}
      </ul>
      <Link href="/studio/p5-community" className={BTN_GHOST}>
        {t("st5_lqGo")} →
      </Link>
    </Panel>
  );
}
