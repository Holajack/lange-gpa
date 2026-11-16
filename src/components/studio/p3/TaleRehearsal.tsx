"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Flag, Play, Plus, Square, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useWordLog } from "@/lib/wordLog";
import { textOn } from "../StudioShell";
import { hostText } from "../types";
import { TALES, type Tale } from "./content";
import { useNarrator } from "./hooks";
import { Disclosure, PicStrip } from "./shared";

/**
 * Bridge-story rehearsal. Nuri tells an authored folk tale the grower already
 * knows; the grower flags the sentences they lose and works through them with
 * host-language-only help (hear it again, a simpler wording, a picture, a
 * word explained). Written words stay hidden until that sentence was heard.
 */

export interface TaleProgress {
  /** sentence indexes heard to the end at least once */
  heard: number[];
  /** sentence indexes currently flagged "I lost that one" */
  flags: number[];
  /** uninterrupted start-to-finish listens */
  passes: number;
}

const EMPTY_PROGRESS: TaleProgress = { heard: [], flags: [], passes: 0 };

interface Shown {
  simpler: boolean;
  pic: boolean;
  text: boolean;
  /** hard word currently open, and whether its explanation has been heard */
  word: string | null;
  wordHeard: boolean;
  logged: "added" | "dup" | null;
}
const NOTHING: Shown = { simpler: false, pic: false, text: false, word: null, wordHeard: false, logged: null };

export function TaleRehearsal({
  lang,
  accent,
  progress,
  onProgress,
}: {
  lang: LangCode;
  accent: string;
  progress: Record<string, TaleProgress>;
  onProgress: (taleId: string, fn: (prev: TaleProgress) => TaleProgress) => void;
}) {
  const { t } = useApp();
  const [taleId, setTaleId] = useState<string | null>(null);
  const tale = TALES.find((x) => x.id === taleId);

  if (tale) {
    return (
      <TalePlayer
        key={tale.id}
        tale={tale}
        lang={lang}
        accent={accent}
        progress={progress[tale.id] ?? EMPTY_PROGRESS}
        onProgress={(fn) => onProgress(tale.id, fn)}
        onBack={() => setTaleId(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">{t("st3_trPick")}</p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {TALES.map((x) => {
          const p = progress[x.id] ?? EMPTY_PROGRESS;
          return (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => setTaleId(x.id)}
                className="flex h-full w-full flex-col items-start gap-2 rounded-3xl border border-line bg-raised-2 p-4 text-left hover:bg-white/8"
              >
                <span className="text-3xl" aria-hidden>
                  {x.emoji}
                </span>
                <span className="text-sm font-semibold text-ink">{t(x.titleKey)}</span>
                <PicStrip pic={x.cast} className="justify-start text-xl" />
                <span className="text-xs text-muted">
                  {t("st3_trSentences").replace("{n}", String(x.sentences.length))}
                  {p.passes > 0 && ` · ${t("st3_trPasses").replace("{n}", String(p.passes))}`}
                  {p.flags.length > 0 && ` · ${t("st3_trFlagged").replace("{n}", String(p.flags.length))}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TalePlayer({
  tale,
  lang,
  accent,
  progress,
  onProgress,
  onBack,
}: {
  tale: Tale;
  lang: LangCode;
  accent: string;
  progress: TaleProgress;
  onProgress: (fn: (prev: TaleProgress) => TaleProgress) => void;
  onBack: () => void;
}) {
  const { t } = useApp();
  const narrator = useNarrator(lang);
  const log = useWordLog(lang);
  const [cur, setCur] = useState(0);
  const [shown, setShown] = useState<Shown>(NOTHING);

  const lines = useMemo(() => tale.sentences.map((s) => hostText(s.text, lang) ?? ""), [tale, lang]);
  const n = lines.length;
  const sentence = tale.sentences[cur];
  const isHeard = progress.heard.includes(cur);
  const isFlagged = progress.flags.includes(cur);
  const understood = progress.heard.length >= n && progress.flags.length === 0;
  const tellingAll = narrator.playing === "all";

  const go = (i: number) => {
    setCur(i);
    setShown(NOTHING);
  };
  const markHeard = (i: number) =>
    onProgress((p) => (p.heard.includes(i) ? p : { ...p, heard: [...p.heard, i] }));

  const playOne = (i: number) => {
    go(i);
    void narrator.say([lines[i]], { id: "one", onEnd: () => markHeard(i) });
  };
  const playAll = async () => {
    const whole = await narrator.say(lines, { id: "all", gap: 350, onStart: go, onEnd: markHeard });
    if (whole) onProgress((p) => ({ ...p, passes: p.passes + 1 }));
  };
  const toggleFlag = () =>
    onProgress((p) => ({
      ...p,
      flags: p.flags.includes(cur) ? p.flags.filter((x) => x !== cur) : [...p.flags, cur].sort((a, b) => a - b),
    }));
  const nextFlag = () => {
    const next = progress.flags.find((i) => i > cur) ?? progress.flags[0];
    if (next !== undefined) playOne(next);
  };

  const simpler = hostText(sentence.simpler, lang);
  const hardWords = (sentence.words ?? []).map((id) => ({ id, ...tale.words[id] }));
  const openWord = hardWords.find((w) => w.id === shown.word);

  const hearSimpler = async () => {
    if (!simpler) return;
    if (await narrator.say([simpler], { id: "simpler" })) setShown((s) => ({ ...s, simpler: true }));
  };
  const hearWord = async (id: string) => {
    const explain = hostText(tale.words[id].explain, lang);
    if (!explain) return;
    setShown((s) => ({ ...s, word: id, wordHeard: false, logged: null }));
    if (await narrator.say([explain], { id: `word-${id}` })) setShown((s) => ({ ...s, wordHeard: true }));
  };
  const logWord = (id: string) => {
    const word = hostText(tale.words[id].word, lang);
    if (!word) return;
    const added = log.add(word, { phase: 3, context: lines[cur] });
    setShown((s) => ({ ...s, logged: added ? "added" : "dup" }));
  };

  const helpBtn = "pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="pill min-h-10 bg-white/6 px-3.5 py-2 text-xs font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={13} strokeWidth={2.5} aria-hidden /> {t("st3_trOtherTale")}
        </button>
        <p className="text-sm font-semibold text-ink">
          <span aria-hidden>{tale.emoji}</span> {t(tale.titleKey)}
        </p>
      </div>

      {/* where you are: heard = filled, flagged = diamond, current = wide */}
      <div className="rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5" aria-hidden>
          {lines.map((_, i) => {
            const flagged = progress.flags.includes(i);
            const heard = progress.heard.includes(i);
            return (
              <span
                key={i}
                className={`h-2.5 transition-all ${i === cur ? "w-6 rounded-full" : flagged ? "w-2.5 rotate-45" : "w-2.5 rounded-full"} ${
                  !heard && !flagged && i !== cur ? "border border-white/25" : ""
                }`}
                style={{
                  background:
                    i === cur ? accent : flagged ? "var(--color-coral)" : heard ? "rgba(255,255,255,0.35)" : undefined,
                }}
              />
            );
          })}
        </div>
        <p className="mt-3 text-sm font-semibold text-ink" aria-live="polite">
          {t("st3_trSentenceOf").replace("{i}", String(cur + 1)).replace("{n}", String(n))}
          {isFlagged && <span className="ml-2 text-coral">🚩 {t("st3_trLost")}</span>}
        </p>
        <p className="mt-1 text-xs text-muted">
          {t("st3_trTally")
            .replace("{heard}", String(progress.heard.length))
            .replace("{n}", String(n))
            .replace("{flags}", String(progress.flags.length))
            .replace("{passes}", String(progress.passes))}
        </p>

        {/* the telling */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tellingAll ? (
            <button
              type="button"
              onClick={narrator.stop}
              className="pill min-h-12 bg-coral px-5 py-3 text-sm font-bold text-canvas"
            >
              <Square size={14} strokeWidth={3} aria-hidden /> {t("st3_trStop")}
            </button>
          ) : (
            <button
              type="button"
              onClick={playAll}
              className={`pill min-h-12 px-5 py-3 text-sm font-bold ${textOn(accent)}`}
              style={{ background: accent }}
            >
              <Play size={15} strokeWidth={3} aria-hidden /> {t("st3_trWhole")}
            </button>
          )}
          <button
            type="button"
            onClick={toggleFlag}
            aria-pressed={isFlagged}
            className={`pill min-h-12 px-4 py-3 text-sm font-bold ${
              isFlagged ? "bg-coral text-canvas" : "border border-coral/50 bg-coral/10 text-ink"
            }`}
          >
            <Flag size={15} strokeWidth={2.5} aria-hidden /> {isFlagged ? t("st3_trLost") : t("st3_trFlag")}
          </button>
        </div>

        {/* sentence by sentence */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => playOne(Math.max(0, cur - 1))}
            disabled={cur === 0 || tellingAll}
            aria-label={t("st3_trPrev")}
            className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => playOne(cur)}
            disabled={tellingAll}
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-40"
          >
            <Volume2 size={15} strokeWidth={2.5} aria-hidden /> {t("st3_trThis")}
          </button>
          <button
            type="button"
            onClick={() => playOne(Math.min(n - 1, cur + 1))}
            disabled={cur === n - 1 || tellingAll}
            aria-label={t("st3_trNext")}
            className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
          {progress.flags.length > 0 && !tellingAll && (
            <button type="button" onClick={nextFlag} className={helpBtn}>
              🚩 {t("st3_trNextFlag")}
            </button>
          )}
        </div>
      </div>

      {/* help for a flagged sentence: host language and pictures only */}
      {isFlagged && !tellingAll && (
        <div className="space-y-3 rounded-3xl border border-coral/30 bg-raised-2 p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink">{t("st3_trHelpTitle")}</p>
          {!isHeard ? (
            <p className="text-sm text-muted">{t("st3_trHearFirst")}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => playOne(cur)} className={helpBtn}>
                  🔁 {t("st3_trAgain")}
                </button>
                {simpler && (
                  <button type="button" onClick={hearSimpler} className={helpBtn}>
                    🪶 {t("st3_trSimpler")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShown((s) => ({ ...s, pic: !s.pic }))}
                  aria-pressed={shown.pic}
                  className={helpBtn}
                >
                  🖼️ {t("st3_trPicture")}
                </button>
              </div>

              {shown.pic && (
                <div className="flex justify-center rounded-2xl bg-canvas px-4 py-6">
                  <PicStrip pic={sentence.pic} className="text-5xl" />
                </div>
              )}
              {shown.simpler && simpler && (
                <p lang={lang} className="rounded-2xl bg-canvas px-4 py-3 text-base leading-relaxed text-ink">
                  {simpler}
                </p>
              )}

              {hardWords.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted">{t("st3_trWords")}</p>
                  <div className="flex flex-wrap gap-2">
                    {hardWords.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => hearWord(w.id)}
                        aria-pressed={shown.word === w.id}
                        lang={lang}
                        className={`pill min-h-11 px-4 py-2.5 text-sm font-semibold ${
                          shown.word === w.id ? "bg-white/15 text-ink" : "border border-line bg-white/6 text-ink"
                        }`}
                      >
                        <Volume2 size={14} strokeWidth={2.5} aria-hidden /> {hostText(w.word, lang)}
                      </button>
                    ))}
                  </div>
                  {openWord && (
                    <div className="mt-3 space-y-3 rounded-2xl bg-canvas p-4">
                      <div className="flex justify-center">
                        <PicStrip pic={openWord.pic} className="text-5xl" />
                      </div>
                      {shown.wordHeard && (
                        <p lang={lang} className="text-sm leading-relaxed text-ink">
                          {hostText(openWord.explain, lang)}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logWord(openWord.id)}
                          className="pill min-h-10 bg-white/8 px-3.5 py-2 text-xs font-bold text-ink"
                        >
                          <Plus size={12} strokeWidth={3} aria-hidden /> {t("st3_trLogWord")}
                        </button>
                        {shown.logged && (
                          <span className="text-xs text-muted" role="status">
                            {t(shown.logged === "added" ? "st3_trLogged" : "stc_wlDup")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShown((s) => ({ ...s, text: !s.text }))}
                  aria-pressed={shown.text}
                  className={helpBtn}
                >
                  🔤 {t("st3_trShowWords")}
                </button>
                <button type="button" onClick={toggleFlag} className="pill min-h-11 bg-mint px-4 py-2.5 text-sm font-bold text-canvas">
                  <Check size={14} strokeWidth={3} aria-hidden /> {t("st3_trGotIt")}
                </button>
              </div>
              {shown.text && (
                <p lang={lang} className="rounded-2xl bg-canvas px-4 py-3 text-base leading-relaxed text-ink">
                  {lines[cur]}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* what to do next, and reading once it is all understood */}
      <p className="text-sm leading-relaxed text-muted">
        {progress.passes === 0 && progress.heard.length < n
          ? t("st3_trNextFirst")
          : progress.flags.length > 0
            ? t("st3_trNextMassage")
            : t("st3_trNextClean")}
      </p>
      {understood && (
        <Disclosure title={`📖 ${t("st3_trRead")}`}>
          <p className="text-xs leading-relaxed text-muted">{t("st3_trReadHint")}</p>
          <ol lang={lang} className="space-y-2 rounded-2xl bg-raised-2 p-4 text-base leading-relaxed text-ink">
            {lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </Disclosure>
      )}
    </div>
  );
}
