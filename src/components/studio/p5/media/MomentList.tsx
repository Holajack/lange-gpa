"use client";

import { useEffect, useState } from "react";
import { Check, Pause, Play, Plus } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useWordLog } from "@/lib/wordLog";
import { fmtClock, parseTimecode, uid } from "../storage";
import { accentBtn, BTN_GHOST, ChoiceChips, DraftInput, Field, INPUT, RemoveButton } from "../ui";
import { MOMENT_KINDS, type MediaTitle, type Moment, type MomentKind } from "./model";

/**
 * A clock to run alongside the video. The video is not in the app, so the
 * grower starts this when they press play over there, and "I'm lost here"
 * stamps the timecode. Typing a timecode by hand always works too.
 */
function useWatchClock() {
  const [base, setBase] = useState(0);
  const [since, setSince] = useState<number | null>(null);
  const [, force] = useState(0);
  useEffect(() => {
    if (since === null) return;
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [since]);
  const read = () => base + (since === null ? 0 : (Date.now() - since) / 1000);
  return {
    running: since !== null,
    read,
    start: () => setSince(Date.now()),
    pause: () => {
      setBase(read());
      setSince(null);
    },
    setTo: (sec: number) => {
      setBase(Math.max(0, sec));
      if (since !== null) setSince(Date.now());
    },
  };
}

/** Add a moment: from the running clock, or with a typed timecode. */
export function MomentAdder({ accent, onAdd }: { accent: string; onAdd: (moment: Moment) => void }) {
  const { t } = useApp();
  const clock = useWatchClock();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<MomentKind>("heard");
  const [scene, setScene] = useState("");
  const [bad, setBad] = useState(false);

  const add = (at: number) => {
    onAdd({
      id: uid("mom"),
      at: Math.max(0, Math.round(at)),
      kind,
      scene: scene.trim().slice(0, 80),
      mine: "",
      told: "",
      understood: false,
      words: [],
      createdAt: new Date().toISOString(),
    });
    setScene("");
    setCode("");
    setBad(false);
  };

  const addTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const at = parseTimecode(code);
    if (at === null) {
      setBad(true);
      return;
    }
    add(at);
  };

  const syncClock = () => {
    const at = parseTimecode(code);
    if (at === null) {
      setBad(true);
      return;
    }
    clock.setTo(at);
    setBad(false);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      <ChoiceChips
        label={t("st5_mdKind")}
        value={kind}
        onChange={setKind}
        options={MOMENT_KINDS.map((id) => ({ id, label: t(`st5_mdKind_${id}`) }))}
      />
      <Field label={t("st5_mdScene")}>
        <input value={scene} onChange={(e) => setScene(e.target.value)} maxLength={80} className={INPUT} />
      </Field>

      {/* watch-along clock */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="headline text-3xl tabular-nums text-ink" aria-label={t("st5_mdClock")}>
          {fmtClock(clock.read())}
        </p>
        <button
          type="button"
          onClick={clock.running ? clock.pause : clock.start}
          aria-pressed={clock.running}
          className={BTN_GHOST}
        >
          {clock.running ? <Pause size={14} strokeWidth={2.5} aria-hidden /> : <Play size={14} strokeWidth={2.5} aria-hidden />}
          {clock.running ? t("st5_mdClockPause") : t("st5_mdClockStart")}
        </button>
        <button type="button" onClick={() => add(clock.read() - 3)} {...accentBtn(accent)}>
          {t("st5_mdLostHere")}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted">{t("st5_mdClockHint")}</p>

      {/* typed timecode */}
      <form onSubmit={addTyped} className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-44">
          <Field label={t("st5_mdTimecode")}>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setBad(false);
              }}
              placeholder="0:12:34"
              inputMode="numeric"
              aria-invalid={bad}
              className={INPUT}
            />
          </Field>
        </div>
        <button type="submit" className={BTN_GHOST}>
          <Plus size={14} strokeWidth={2.5} aria-hidden /> {t("st5_mdAddAt")}
        </button>
        <button type="button" onClick={syncClock} className={BTN_GHOST}>
          {t("st5_mdClockSet")}
        </button>
      </form>
      {bad && (
        <p className="text-xs text-amber" role="alert">
          {t("st5_mdTimecodeBad")}
        </p>
      )}
    </div>
  );
}

/** The moments of one title, in running order. */
export function MomentList({
  title,
  lang,
  onPatch,
  onRemove,
}: {
  title: MediaTitle;
  lang: LangCode;
  onPatch: (momentId: string, change: Partial<Moment>) => void;
  onRemove: (momentId: string) => void;
}) {
  const { t } = useApp();
  const words = useWordLog(lang);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [wordFor, setWordFor] = useState<string | null>(null);
  const [wordText, setWordText] = useState("");
  const [wordMsg, setWordMsg] = useState<string | null>(null);

  const sorted = [...title.moments].sort((a, b) => a.at - b.at);
  const open = sorted.filter((m) => !m.understood);
  const shown = onlyOpen ? open : sorted;

  const logWord = (m: Moment) => {
    const context = `${title.title}${title.episode ? ` · ${title.episode}` : ""} · ${fmtClock(m.at)}`;
    const added = words.add(wordText, { phase: 5, context });
    if (!added) {
      setWordMsg(wordText.trim() ? t("stc_wlDup") : null);
      return;
    }
    onPatch(m.id, { words: [...m.words, added.text] });
    setWordText("");
    setWordFor(null);
    setWordMsg(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted">
          {t("st5_mdOpenCount").replace("{open}", String(open.length)).replace("{all}", String(sorted.length))}
        </p>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-mint)]"
          />
          {t("st5_mdOnlyOpen")}
        </label>
      </div>

      {shown.length === 0 && (
        <p className="text-sm text-muted">{sorted.length === 0 ? t("st5_mdNoMoments") : t("st5_mdAllUnderstood")}</p>
      )}

      <ul className="space-y-2">
        {shown.map((m) => (
          <li key={m.id} className="space-y-2 rounded-2xl border border-line bg-canvas p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-bold tabular-nums text-ink">
                {fmtClock(m.at)}
              </span>
              <span className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-semibold text-muted">
                {t(`st5_mdKind_${m.kind}`)}
              </span>
              {m.scene && <span className="min-w-0 break-words text-sm text-ink">{m.scene}</span>}
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPatch(m.id, { understood: !m.understood })}
                  aria-pressed={m.understood}
                  className={`pill min-h-10 px-3 py-2 text-xs font-bold ${
                    m.understood ? "bg-mint text-canvas" : "bg-white/8 text-muted"
                  }`}
                >
                  {m.understood && <Check size={12} strokeWidth={3} aria-hidden />}
                  {m.understood ? t("stc_plClarified") : t("stc_plOpen")}
                </button>
                <RemoveButton onConfirm={() => onRemove(m.id)} label={t("st5_markRemove")} />
              </span>
            </div>
            <DraftInput
              multiline
              value={m.mine}
              label={t("st5_mdMine")}
              maxLength={400}
              onCommit={(mine) => onPatch(m.id, { mine: mine.trim() })}
            />
            <DraftInput
              multiline
              value={m.told}
              label={t("st5_mdTold")}
              maxLength={400}
              onCommit={(told) => onPatch(m.id, { told: told.trim() })}
            />
            <div className="flex flex-wrap items-center gap-2">
              {m.words.map((w) => (
                <span key={w} className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink">
                  {w}
                </span>
              ))}
              {wordFor === m.id ? (
                <form
                  className="flex min-w-0 flex-1 basis-56 flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    logWord(m);
                  }}
                >
                  <input
                    autoFocus
                    value={wordText}
                    onChange={(e) => {
                      setWordText(e.target.value);
                      setWordMsg(null);
                    }}
                    placeholder={t("stc_wlAddPlaceholder")}
                    aria-label={t("stc_wlAddPlaceholder")}
                    maxLength={80}
                    className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-ink outline-none focus:border-white/30"
                  />
                  <button type="submit" className="pill min-h-10 bg-white/15 px-3 py-2 text-xs font-bold text-ink">
                    {t("stc_wlAdd")}
                  </button>
                  {wordMsg && <span className="text-xs text-amber">{wordMsg}</span>}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setWordFor(m.id);
                    setWordText("");
                    setWordMsg(null);
                  }}
                  className="pill min-h-10 bg-white/6 px-3 py-2 text-xs font-semibold text-ink"
                >
                  <Plus size={12} strokeWidth={3} aria-hidden /> {t("stc_plAddWord")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
