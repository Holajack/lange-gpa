"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Headphones, Play, ShieldCheck, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PHASES, phaseById } from "@/lib/phases";
import {
  eraseLibrary,
  fmtDuration,
  getRecordingBlob,
  libraryMinutes,
  tonightsQueue,
  useLibrary,
  type LibraryItem,
} from "@/lib/library";
import { useWordLog, type WordEntry } from "@/lib/wordLog";
import { speak } from "@/lib/tts";
import { STUDIO_ACTIVITY_IDS } from "@/lib/studioRoutes";
import { SectionTitle } from "@/components/ui";
import { Mascot } from "@/components/Mascot";
import { ClarifyPlayer } from "@/components/studio/ClarifyPlayer";

/**
 * /library — the Listening Library + Word Log.
 * The home-practice surface for every phase after the first: GPA homework is,
 * overwhelmingly, "listen to your recordings again".
 */

type Tab = "recordings" | "words";

export default function LibraryPage() {
  const { profile, t } = useApp();
  const [tab, setTab] = useState<Tab>("recordings");

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6 pb-16"
    >
      <header className="card relative overflow-hidden p-6 lg:p-8">
        <div className="orb -right-20 -top-20 h-56 w-56 bg-violet/25" />
        <div className="relative flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet/20 text-violet-soft">
            <Headphones size={26} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="headline text-3xl lg:text-4xl">{t("stc_libTitle")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("stc_libSub")}</p>
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-mint">
              <ShieldCheck size={14} strokeWidth={2.5} aria-hidden /> {t("stc_libDeviceOnly")}
            </p>
          </div>
        </div>
      </header>

      <div className="flex gap-2" role="tablist">
        {(["recordings", "words"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`pill px-5 py-2.5 text-sm font-bold ${
              tab === key ? "bg-violet text-white" : "bg-white/6 text-muted hover:text-ink"
            }`}
          >
            {t(key === "recordings" ? "stc_tabRecordings" : "stc_tabWords")}
          </button>
        ))}
      </div>

      {tab === "recordings" ? <RecordingsTab /> : <WordsTab />}
    </motion.div>
  );
}

/* ------------------------------ recordings ------------------------------ */

function RecordingsTab() {
  const { profile, t } = useApp();
  const { items, ready } = useLibrary({ lang: profile?.targetLang });
  const [phaseFilter, setPhaseFilter] = useState<number | "all">("all");
  const [shrink, setShrink] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);

  const queue = useMemo(() => tonightsQueue(items), [items]);
  const shown = items.filter(
    (it) => (phaseFilter === "all" || it.phase === phaseFilter) && (!shrink || !it.familiar)
  );
  const relistens = items.reduce((sum, it) => sum + it.relistens.length, 0);
  const phasesPresent = [...new Set(items.map((it) => it.phase))].sort();

  if (ready && items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 p-10 text-center">
        <Mascot size={120} mood="think" />
        <p className="max-w-md text-sm leading-relaxed text-muted">{t("stc_libEmpty")}</p>
        <Link href="/courses" className="pill bg-violet px-5 py-3 text-sm font-bold text-white">
          {t("courses")} →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: items.length, label: t("stc_libRecordings") },
          { value: libraryMinutes(items), label: t("stc_libMinutes") },
          { value: relistens, label: t("stc_libRelistens") },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="headline text-2xl tabular-nums sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* tonight's queue */}
      {queue.length > 0 && (
        <section className="space-y-3">
          <SectionTitle sub={t("stc_libTonightSub")}>{t("stc_libTonight")}</SectionTitle>
          <div className="grid gap-3 md:grid-cols-3">
            {queue.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  setOpenId(it.id);
                  document.getElementById(`rec-${it.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="card card-hover flex items-center gap-3 p-4 text-left"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-canvas"
                  style={{ background: phaseById(it.phase).color }}
                >
                  <Play size={15} strokeWidth={3} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{it.title}</span>
                  <span className="block text-xs text-muted">
                    {fmtDuration(it.durationSec)} · {t("stc_plHeard")} {it.relistens.length}×
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* all recordings */}
      <section className="space-y-3">
        <SectionTitle>{t("stc_libAll")}</SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPhaseFilter("all")}
            aria-pressed={phaseFilter === "all"}
            className={`pill px-4 py-2 text-xs font-bold ${
              phaseFilter === "all" ? "bg-white/15 text-ink" : "bg-white/5 text-muted"
            }`}
          >
            {t("stc_libAllPhases")}
          </button>
          {phasesPresent.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPhaseFilter(id)}
              aria-pressed={phaseFilter === id}
              className={`pill px-4 py-2 text-xs font-bold ${
                phaseFilter === id ? "bg-white/15 text-ink" : "bg-white/5 text-muted"
              }`}
            >
              {phaseById(id).emoji} {t("phaseWord")} {id}
            </button>
          ))}
          <label
            className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted"
            title={t("stc_libShrinkSub")}
          >
            <input
              type="checkbox"
              checked={shrink}
              onChange={(e) => setShrink(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-mint)]"
            />
            {t("stc_libShrink")}
          </label>
        </div>

        <ul className="space-y-2">
          {shown.map((it) => (
            <RecordingRow key={it.id} item={it} open={openId === it.id} onToggle={() => setOpenId(openId === it.id ? null : it.id)} />
          ))}
        </ul>
      </section>

      {/* erase */}
      <div className="flex justify-end border-t border-line pt-5">
        {confirmErase ? (
          <span className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {t("stc_libEraseConfirm")}
            <button
              type="button"
              onClick={async () => {
                await eraseLibrary();
                setConfirmErase(false);
              }}
              className="pill bg-coral px-4 py-2 text-xs font-bold text-canvas"
            >
              {t("stc_libEraseYes")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmErase(false)}
              className="pill bg-white/6 px-4 py-2 text-xs font-semibold text-ink"
            >
              {t("back")}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmErase(true)}
            className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-coral"
          >
            <Trash2 size={13} strokeWidth={2.5} /> {t("stc_libEraseAll")}
          </button>
        )}
      </div>
    </div>
  );
}

function RecordingRow({ item, open, onToggle }: { item: LibraryItem; open: boolean; onToggle: () => void }) {
  const { t } = useApp();
  const phase = phaseById(item.phase);
  const unresolved = item.marks.filter((m) => !m.resolved).length;
  const hasTool = STUDIO_ACTIVITY_IDS.has(item.activityId);
  const activity = PHASES.flatMap((p) => p.activities).find((a) => a.id === item.activityId);

  return (
    <li id={`rec-${item.id}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-3 text-left hover:bg-raised-2"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
          style={{ background: phase.color + "22" }}
          aria-hidden
        >
          {phase.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
          <span className="block truncate text-xs text-muted">
            {t(`stc_kind_${item.kind}`)} · {fmtDuration(item.durationSec)} ·{" "}
            {new Date(item.createdAt).toLocaleDateString()} · {t("stc_plHeard")} {item.relistens.length}×
          </span>
        </span>
        {unresolved > 0 && (
          <span className="rounded-full bg-coral/20 px-2.5 py-1 text-xs font-bold text-coral">🚩 {unresolved}</span>
        )}
        {item.familiar && <span className="text-xs font-bold text-mint">✓</span>}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <ClarifyPlayer item={item} accent={phase.color} />
          {hasTool && activity && (
            <Link
              href={`/studio/${item.activityId}`}
              className="inline-block text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink"
            >
              {t("stc_openActivity")}: {activity.name} →
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

/* -------------------------------- words --------------------------------- */

function WordsTab() {
  const { profile, t } = useApp();
  const { words, add, remove, review, toggleStrong } = useWordLog(profile?.targetLang);
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const added = add(text, { context });
    if (!added) {
      setMsg(t("stc_wlDup"));
      return;
    }
    setText("");
    setContext("");
    setMsg(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="headline text-2xl tabular-nums sm:text-3xl">{words.length}</p>
          <p className="mt-1 text-xs text-muted">{t("stc_wlCount")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="headline text-2xl tabular-nums sm:text-3xl">{words.filter((w) => w.strong).length}</p>
          <p className="mt-1 text-xs text-muted">{t("stc_wlStrongCount")}</p>
        </div>
      </div>

      <form onSubmit={submit} className="card space-y-3 p-5">
        <p className="text-sm leading-relaxed text-muted">{t("stc_wlSub")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setMsg(null);
            }}
            placeholder={t("stc_wlAddPlaceholder")}
            maxLength={80}
            className="min-w-0 flex-1 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
          />
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t("stc_wlContextPlaceholder")}
            maxLength={160}
            className="min-w-0 flex-1 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
          />
          <button type="submit" className="pill bg-violet px-5 py-2.5 text-sm font-bold text-white">
            {t("stc_wlAdd")}
          </button>
        </div>
        {msg && <p className="text-xs text-amber">{msg}</p>}
      </form>

      {words.length === 0 ? (
        <p className="text-sm text-muted">{t("stc_wlEmpty")}</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {words.map((w) => (
            <WordRow
              key={w.id}
              word={w}
              onHear={() => review(w.id)}
              onStrong={() => toggleStrong(w.id)}
              onRemove={() => remove(w.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function WordRow({
  word,
  onHear,
  onStrong,
  onRemove,
}: {
  word: WordEntry;
  onHear: () => void;
  onStrong: () => void;
  onRemove: () => void;
}) {
  const { t } = useApp();

  /** Prefer the real moment it was heard; fall back to the voice for the bare word. */
  const hear = async () => {
    onHear();
    if (word.sourceId && word.t !== undefined) {
      const blob = await getRecordingBlob(word.sourceId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        const start = Math.max(0, word.t - 1);
        audio.onloadedmetadata = () => {
          try {
            audio.currentTime = start;
          } catch {}
        };
        audio.ontimeupdate = () => {
          if (audio.currentTime > start + 8) audio.pause();
        };
        audio.onpause = audio.onended = () => URL.revokeObjectURL(url);
        audio.play().catch(() => URL.revokeObjectURL(url));
        return;
      }
    }
    speak(word.text, word.lang);
  };

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-3">
      <button
        type="button"
        onClick={hear}
        aria-label={word.sourceId ? t("stc_wlHearMoment") : t("stc_wlHearIt")}
        title={word.sourceId ? t("stc_wlHearMoment") : t("stc_wlHearIt")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet/20 text-violet-soft"
      >
        <Play size={14} strokeWidth={3} />
      </button>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{word.text}</span>
        {word.context && <span className="block truncate text-xs text-muted">{word.context}</span>}
      </span>
      <button
        type="button"
        onClick={onStrong}
        aria-pressed={Boolean(word.strong)}
        className={`pill px-3 py-1.5 text-xs font-bold ${
          word.strong ? "bg-mint text-canvas" : "bg-white/6 text-muted"
        }`}
      >
        {t("stc_wlStrong")}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("stc_recDiscard")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:text-coral"
      >
        <Trash2 size={13} strokeWidth={2.5} />
      </button>
    </li>
  );
}
