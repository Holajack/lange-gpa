"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { Callout } from "../../StudioShell";
import {
  P6,
  PICKUP_PACE,
  clampInt,
  fmtDay,
  fmtHours,
  localIso,
  newId,
  type ExpertSession,
  type ExpertSessionKind,
  type ExpertTopic,
} from "../model";
import { AccentButton, Chips, Field, Panel, RemoveButton, Stat, inputCls } from "../ui";

const KINDS: ExpertSessionKind[] = ["interview", "course", "other"];

/**
 * A subject is learned over many sittings. This keeps the ledger: time with
 * people who know it, new words met, and the plain words-per-hour rate the
 * guide watches (interviews alone often bring few new words).
 */
export function TopicSessions({
  topic,
  accent,
  onPatch,
}: {
  topic: ExpertTopic;
  accent: string;
  onPatch: (fn: (topic: ExpertTopic) => ExpertTopic) => void;
}) {
  const { t, uiLang } = useApp();
  const [date, setDate] = useState(localIso());
  const [minutes, setMinutes] = useState("60");
  const [kind, setKind] = useState<ExpertSessionKind>("interview");
  const [words, setWords] = useState("");
  const [note, setNote] = useState("");

  const totalMinutes = topic.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const totalWords = topic.sessions.reduce((sum, s) => sum + s.words, 0);
  const pace = totalMinutes >= 30 ? Math.round((totalWords / (totalMinutes / 60)) * 10) / 10 : null;

  const log = () => {
    const session: ExpertSession = {
      id: newId("es"),
      date: date || localIso(),
      minutes: clampInt(Number(minutes), 1, 600),
      kind,
      words: clampInt(Number(words), 0, 500),
      note: note.trim().slice(0, 200),
    };
    onPatch((tp) => ({ ...tp, sessions: [session, ...tp.sessions] }));
    setWords("");
    setNote("");
  };

  return (
    <Panel title={t("st6_e_sessionsTitle")} sub={t("st6_e_sessionsSub")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat value={fmtHours(totalMinutes)} label={t("st6_e_statHours")} />
        <Stat value={topic.sessions.length} label={t("st6_e_statSittings")} />
        <Stat
          value={pace === null ? "–" : pace}
          label={t("st6_e_statPace")}
          sub={t("st6_e_statPaceSub").replace("{n}", String(PICKUP_PACE))}
        />
      </div>

      {pace !== null && totalMinutes >= 120 && pace < 7 && (
        <Callout icon="🧩" title={t("st6_e_spliceTitle")}>
          <p>{t("st6_e_spliceBody")}</p>
          <Link
            href={`/studio/${P6.remedial}`}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4"
          >
            {t("st6_e_spliceLink")} <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </Callout>
      )}

      <form
        className="space-y-3 rounded-2xl border border-line bg-raised-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          log();
        }}
      >
        <p className="text-sm font-semibold text-ink">{t("st6_e_logTitle")}</p>
        <Chips
          label={t("st6_e_logKind")}
          options={KINDS.map((k) => ({ id: k, label: t(`st6_e_kind_${k}`) }))}
          value={[kind]}
          onToggle={setKind}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={t("st6_e_logDate")}>
            <input
              type="date"
              value={date}
              max={localIso()}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t("st6_e_logMinutes")}>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t("st6_e_logWords")}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={500}
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label={t("st6_e_logNote")}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder={t("st6_e_logNotePlaceholder")}
            className={inputCls}
          />
        </Field>
        <AccentButton accent={accent} type="submit">
          {t("st6_e_logSave")}
        </AccentButton>
      </form>

      {topic.sessions.length > 0 && (
        <ul className="space-y-2">
          {topic.sessions.map((s) => (
            <li key={s.id} className="flex items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-2.5">
              <span className="min-w-0 flex-1 text-sm">
                <span className="block font-semibold text-ink">
                  {fmtDay(s.date, uiLang)} · {t(`st6_e_kind_${s.kind}`)} ·{" "}
                  {t("st6_e_rowMinutes").replace("{n}", String(s.minutes))}
                </span>
                <span className="block break-words text-xs text-muted">
                  {t("st6_e_rowWords").replace("{n}", String(s.words))}
                  {s.note && ` · ${s.note}`}
                </span>
              </span>
              <RemoveButton
                label={t("st6_remove")}
                onConfirm={() => onPatch((tp) => ({ ...tp, sessions: tp.sessions.filter((x) => x.id !== s.id) }))}
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
