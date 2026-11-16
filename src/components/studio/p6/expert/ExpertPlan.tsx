"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { starterQuestions } from "../content";
import { newId, type ExpertTopic, type PersonStatus } from "../model";
import { AccentButton, Chips, Panel, RemoveButton, inputCls } from "../ui";

const STATUSES: PersonStatus[] = ["toask", "agreed", "met"];
const STATUS_MARK: Record<PersonStatus, string> = { toask: "○", agreed: "◐", met: "●" };

type Patch = (fn: (topic: ExpertTopic) => ExpertTopic) => void;

/** Who knows this subject, and where each conversation stands. */
export function PeoplePlan({ topic, accent, onPatch }: { topic: ExpertTopic; accent: string; onPatch: Patch }) {
  const { t } = useApp();
  const [name, setName] = useState("");

  const add = () => {
    const clean = name.trim().slice(0, 100);
    if (!clean) return;
    onPatch((tp) => ({ ...tp, people: [...tp.people, { id: newId("per"), name: clean, status: "toask" }] }));
    setName("");
  };

  return (
    <Panel title={t("st6_e_peopleTitle")} sub={t("st6_e_peopleSub")}>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder={t("st6_e_personPlaceholder")}
          aria-label={t("st6_e_personLabel")}
          className={`${inputCls} flex-1 basis-56`}
        />
        <AccentButton accent={accent} type="submit" disabled={!name.trim()}>
          <Plus size={15} strokeWidth={3} /> {t("st6_e_personAdd")}
        </AccentButton>
      </form>
      {topic.people.length === 0 ? (
        <p className="text-sm text-muted">{t("st6_e_peopleEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {topic.people.map((p) => (
            <li key={p.id} className="space-y-2 rounded-2xl border border-line bg-raised-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-semibold text-ink">{p.name}</p>
                <RemoveButton
                  label={t("st6_remove")}
                  onConfirm={() => onPatch((tp) => ({ ...tp, people: tp.people.filter((x) => x.id !== p.id) }))}
                />
              </div>
              <Chips
                label={p.name}
                options={STATUSES.map((s) => ({ id: s, label: `${STATUS_MARK[s]} ${t(`st6_e_status_${s}`)}` }))}
                value={[p.status]}
                onToggle={(s) =>
                  onPatch((tp) => ({ ...tp, people: tp.people.map((x) => (x.id === p.id ? { ...x, status: s } : x)) }))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/**
 * The question bank. Questions are written in the host language by the
 * grower. Where starter questions are authored for the language they can be
 * tapped in as raw material to rework with a host friend.
 */
export function QuestionBank({
  topic,
  lang,
  accent,
  onPatch,
}: {
  topic: ExpertTopic;
  lang: LangCode;
  accent: string;
  onPatch: Patch;
}) {
  const { t } = useApp();
  const [text, setText] = useState("");
  const have = new Set(topic.questions.map((q) => q.text));
  const starters = starterQuestions(lang).filter((q) => !have.has(q));
  const asked = topic.questions.filter((q) => q.asked).length;

  const add = (raw: string) => {
    const clean = raw.trim().slice(0, 200);
    if (!clean || have.has(clean)) return;
    onPatch((tp) => ({ ...tp, questions: [...tp.questions, { id: newId("q"), text: clean, asked: false }] }));
  };

  return (
    <Panel
      title={t("st6_e_bankTitle")}
      sub={t("st6_e_bankSub")}
      right={
        topic.questions.length > 0 ? (
          <span className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-semibold tabular-nums text-muted">
            {t("st6_e_bankAsked").replace("{a}", String(asked)).replace("{n}", String(topic.questions.length))}
          </span>
        ) : undefined
      }
    >
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(text);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          lang={lang}
          placeholder={t("st6_e_questionPlaceholder")}
          aria-label={t("st6_e_questionLabel")}
          className={`${inputCls} flex-1 basis-56`}
        />
        <AccentButton accent={accent} type="submit" disabled={!text.trim()}>
          <Plus size={15} strokeWidth={3} /> {t("st6_e_questionAdd")}
        </AccentButton>
      </form>

      {starters.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-muted">{t("st6_e_startersLabel")}</p>
          <ul className="space-y-2">
            {starters.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => add(q)}
                  lang={lang}
                  className="flex min-h-10 w-full items-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/4 px-4 py-2.5 text-left text-sm leading-relaxed text-muted hover:text-ink"
                >
                  <Plus size={13} strokeWidth={3} className="shrink-0" aria-hidden />
                  {q}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-muted">{t("st6_e_startersNote")}</p>
        </div>
      )}

      {topic.questions.length === 0 ? (
        <p className="text-sm text-muted">{t("st6_e_bankEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {topic.questions.map((q) => (
            <li key={q.id} className="flex items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-2.5">
              <label className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={q.asked}
                  onChange={(e) =>
                    onPatch((tp) => ({
                      ...tp,
                      questions: tp.questions.map((x) => (x.id === q.id ? { ...x, asked: e.target.checked } : x)),
                    }))
                  }
                  aria-label={t("st6_e_questionAsked")}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-mint)]"
                />
                <span lang={lang} className={`break-words text-sm leading-relaxed ${q.asked ? "text-muted" : "text-ink"}`}>
                  {q.text}
                  {q.asked && <span className="ml-2 text-xs">· {t("st6_e_questionAsked")}</span>}
                </span>
              </label>
              <RemoveButton
                label={t("st6_remove")}
                onConfirm={() => onPatch((tp) => ({ ...tp, questions: tp.questions.filter((x) => x.id !== q.id) }))}
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
