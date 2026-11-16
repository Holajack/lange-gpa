"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, type LibraryItem } from "@/lib/library";
import { clearedSec, isComplete, type ClarifyFlow } from "../clarifyFlow";
import { showDay, todayIso, uid } from "../storage";
import { accentBtn, BTN_GHOST, ChoiceChips, Field, INPUT, Panel, RemoveButton } from "../ui";
import {
  CLOSENESS,
  DISCOURSE_TYPES,
  STATUSES,
  type Closeness,
  type DiscourseType,
  type RecRequest,
  type RequestStatus,
} from "./model";

/** Where a request really stands: the last two steps are read from the library, not typed in. */
export function statusOf(
  req: RecRequest,
  items: LibraryItem[],
  flows: Record<string, ClarifyFlow>
): RequestStatus {
  const rec = req.recordingId ? items.find((it) => it.id === req.recordingId) : undefined;
  if (!rec) return req.status;
  const flow = flows[rec.id];
  return flow && isComplete(flow) ? "clarified" : "received";
}

function NewRequestForm({
  lang,
  accent,
  onAdd,
}: {
  lang: LangCode;
  accent: string;
  onAdd: (req: RecRequest) => void;
}) {
  const { t } = useApp();
  const [recorder, setRecorder] = useState("");
  const [withWhom, setWithWhom] = useState("");
  const [type, setType] = useState<DiscourseType>("life");
  const [closeness, setCloseness] = useState<Closeness>("strangers");
  const [topic, setTopic] = useState("");
  const [due, setDue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recorder.trim()) return;
    onAdd({
      id: uid("req"),
      lang,
      recorder: recorder.trim().slice(0, 60),
      withWhom: withWhom.trim().slice(0, 80),
      type,
      closeness,
      topic: topic.trim().slice(0, 100),
      due,
      status: "asked",
      createdAt: new Date().toISOString(),
    });
    setRecorder("");
    setWithWhom("");
    setTopic("");
    setDue("");
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      <ChoiceChips
        label={t("st5_reqType")}
        value={type}
        onChange={setType}
        options={DISCOURSE_TYPES.map((id) => ({ id, label: t(`st5_type_${id}`) }))}
      />
      <p className="text-sm leading-relaxed text-muted">{t(`st5_typeHow_${type}`)}</p>
      <ChoiceChips
        label={t("st5_reqCloseness")}
        value={closeness}
        onChange={setCloseness}
        options={CLOSENESS.map((id) => ({ id, label: t(`st5_close_${id}`) }))}
      />
      <p className="text-sm leading-relaxed text-muted">{t(`st5_closeHow_${closeness}`)}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("st5_reqRecorder")}>
          <input value={recorder} onChange={(e) => setRecorder(e.target.value)} maxLength={60} required className={INPUT} />
        </Field>
        <Field label={t("st5_reqWith")}>
          <input value={withWhom} onChange={(e) => setWithWhom(e.target.value)} maxLength={80} className={INPUT} />
        </Field>
        <Field label={t("st5_reqTopic")}>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={100} className={INPUT} />
        </Field>
        <Field label={t("st5_reqDue")}>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={INPUT} />
        </Field>
      </div>
      <button type="submit" disabled={!recorder.trim()} {...accentBtn(accent)}>
        <Plus size={15} strokeWidth={3} aria-hidden /> {t("st5_reqAdd")}
      </button>
    </form>
  );
}

function StatusRail({ status }: { status: RequestStatus }) {
  const { t } = useApp();
  const at = STATUSES.indexOf(status);
  return (
    <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label={t("st5_reqStatus")}>
      {STATUSES.map((s, i) => {
        const done = i <= at;
        return (
          <li
            key={s}
            aria-current={i === at ? "step" : undefined}
            className={`flex items-center gap-1 font-semibold ${done ? "text-ink" : "text-muted"}`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                done ? "bg-mint text-canvas" : "border border-line"
              }`}
              aria-hidden
            >
              {done ? <Check size={11} strokeWidth={3.5} /> : i + 1}
            </span>
            {t(`st5_status_${s}`)}
          </li>
        );
      })}
    </ol>
  );
}

export function RequestBoard({
  lang,
  accent,
  requests,
  items,
  flows,
  onAdd,
  onPatch,
  onRemove,
  onBringIn,
}: {
  lang: LangCode;
  accent: string;
  requests: RecRequest[];
  items: LibraryItem[];
  flows: Record<string, ClarifyFlow>;
  onAdd: (req: RecRequest) => void;
  onPatch: (id: string, change: Partial<RecRequest>) => void;
  onRemove: (id: string) => void;
  /** open the intake panel for this request */
  onBringIn: (id: string) => void;
}) {
  const { t } = useApp();
  const [adding, setAdding] = useState(false);
  const today = todayIso();
  const mine = requests.filter((r) => r.lang === lang);
  const rank = (r: RecRequest) => STATUSES.indexOf(statusOf(r, items, flows));
  const sorted = [...mine].sort((a, b) => rank(a) - rank(b) || (a.due || "9999").localeCompare(b.due || "9999"));

  return (
    <Panel
      title={t("st5_reqTitle")}
      sub={t("st5_reqSub")}
      right={
        <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} className={BTN_GHOST}>
          <Plus size={15} strokeWidth={2.5} aria-hidden /> {t("st5_reqNew")}
        </button>
      }
    >
      {adding && (
        <NewRequestForm
          lang={lang}
          accent={accent}
          onAdd={(req) => {
            onAdd(req);
            setAdding(false);
          }}
        />
      )}

      {sorted.length === 0 && !adding && <p className="text-sm text-muted">{t("st5_reqEmpty")}</p>}

      <ul className="space-y-3">
        {sorted.map((req) => {
          const status = statusOf(req, items, flows);
          const rec = req.recordingId ? items.find((it) => it.id === req.recordingId) : undefined;
          const flow = rec ? flows[rec.id] : undefined;
          const overdue = Boolean(req.due) && req.due < today && (status === "asked" || status === "recorded");
          return (
            <li key={req.id} className="rounded-3xl border border-line bg-raised-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-ink">
                    {req.topic || t(`st5_type_${req.type}`)}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-muted">
                    {t(`st5_type_${req.type}`)} · {t(`st5_close_${req.closeness}`)} · {req.recorder}
                    {req.withWhom ? ` + ${req.withWhom}` : ""}
                  </p>
                  {req.due && (
                    <p className={`mt-0.5 text-xs ${overdue ? "font-semibold text-amber" : "text-muted"}`}>
                      {overdue ? `${t("st5_reqOverdue")} · ` : `${t("st5_reqDue")}: `}
                      {showDay(req.due)}
                    </p>
                  )}
                </div>
                <RemoveButton onConfirm={() => onRemove(req.id)} label={t("st5_reqRemove")} />
              </div>

              <div className="mt-3">
                <StatusRail status={status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {status === "asked" && (
                  <button type="button" onClick={() => onPatch(req.id, { status: "recorded" })} className={BTN_GHOST}>
                    {t("st5_reqMarkRecorded")}
                  </button>
                )}
                {(status === "asked" || status === "recorded") && (
                  <button type="button" onClick={() => onBringIn(req.id)} {...accentBtn(accent)}>
                    {t("st5_reqBringIn")}
                  </button>
                )}
                {status === "recorded" && (
                  <button type="button" onClick={() => onPatch(req.id, { status: "asked" })} className={BTN_GHOST}>
                    {t("st5_reqNotYet")}
                  </button>
                )}
                {rec && status === "received" && (
                  <>
                    <span className="text-xs tabular-nums text-muted">
                      {flow ? fmtDuration(clearedSec(flow)) : "0:00"} / {fmtDuration(rec.durationSec)} {t("st5_reqClearSoFar")}
                    </span>
                    <Link href="/studio/p5-tensteps" className={BTN_GHOST}>
                      {t("st5_reqClarify")} →
                    </Link>
                  </>
                )}
                {status === "clarified" && (
                  <Link href="/studio/p5-library" className={BTN_GHOST}>
                    {t("st5_reqRelisten")} →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
