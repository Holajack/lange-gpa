"use client";

/**
 * /review/{lang} — the native-speaker review sheet.
 *
 * Every host-language line the app says aloud, with the clip that says it, in
 * the order a learner meets it. A reviewer plays each line, marks it fine or
 * flags it with a correction, and downloads their notes. Marks rest in this
 * browser only (localStorage) — there is no account and nothing is uploaded.
 *
 * Data: public/review/{lang}.json, written by scripts/export-review.mjs.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Download, Flag, Pause, Play, Search } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LANGUAGES } from "@/lib/languages";

type Row = {
  id: string;
  section: string;
  group: string;
  groupLocal?: string;
  text: string;
  en: string;
  audio: string;
  text2?: string;
  audio2?: string;
};
type Mark = { s?: "ok" | "fix"; note?: string };
type Marks = Record<string, Mark>;
type Filter = "all" | "todo" | "fix";
type Ui = "en" | "ru";

const COPY = {
  en: {
    title: "{language} review",
    intro:
      "Every line Nuri says aloud, in the order a learner meets it. Play each one, then mark it fine — or flag it and write what it should be: a wrong word, unnatural phrasing, wrong stress, odd pronunciation.",
    saved: "Your marks stay in this browser. When you finish, download your notes and send them back.",
    progress: "{done} of {total} checked · {fix} flagged",
    search: "Search",
    all: "All",
    todo: "Not checked",
    flagged: "Flagged",
    ok: "Fine",
    fix: "Flag",
    note: "What should it be? What sounds wrong?",
    play: "Play",
    pause: "Pause",
    question: "Review question",
    download: "Download my notes",
    sheet: "Full sheet (.csv)",
    more: "Show more",
    empty: "Nothing here.",
    loading: "Loading…",
    none: "There is no review sheet for this language yet.",
    sections: { cues: "Session cues", words: "Phase 1 words", commands: "Listen and do" } as Record<string, string>,
    tools: "Phase {n} tools",
  },
  ru: {
    title: "Проверка: {language}",
    intro:
      "Здесь все фразы, которые Nuri произносит вслух, в том порядке, в каком их встречает ученик. Послушайте каждую и отметьте «Хорошо» — или «Исправить» и напишите, как должно быть: не то слово, неестественная фраза, неверное ударение, странное произношение.",
    saved: "Отметки хранятся только в этом браузере. Когда закончите, скачайте заметки и отправьте их нам.",
    progress: "Проверено {done} из {total} · к исправлению: {fix}",
    search: "Поиск",
    all: "Все",
    todo: "Не проверено",
    flagged: "К исправлению",
    ok: "Хорошо",
    fix: "Исправить",
    note: "Как должно быть? Что звучит не так?",
    play: "Слушать",
    pause: "Пауза",
    question: "Вопрос для повторения",
    download: "Скачать мои заметки",
    sheet: "Вся таблица (.csv)",
    more: "Показать ещё",
    empty: "Здесь пусто.",
    loading: "Загрузка…",
    none: "Для этого языка таблицы проверки пока нет.",
    sections: { cues: "Реплики занятия", words: "Слова фазы 1", commands: "Слушай и делай" } as Record<string, string>,
    tools: "Задания фазы {n}",
  },
};
type Copy = (typeof COPY)[Ui];

const PAGE = 120;
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

function sectionName(c: Copy, section: string) {
  const tool = section.match(/^p(\d)$/);
  return tool ? fill(c.tools, { n: tool[1] }) : (c.sections[section] ?? section);
}

/* ------------------------------- one line ------------------------------- */

const ReviewRow = memo(function ReviewRow({
  row,
  n,
  lang,
  mark,
  playing,
  c,
  onPlay,
  onMark,
}: {
  row: Row;
  n: number;
  lang: string;
  mark: Mark | undefined;
  /** the clip of this row that is sounding right now, or "" */
  playing: string;
  c: Copy;
  onPlay: (src: string) => void;
  onMark: (id: string, next: Mark) => void;
}) {
  const [draft, setDraft] = useState(mark?.note ?? "");
  const status = mark?.s;
  const on = playing === row.audio;
  const onQuestion = Boolean(row.audio2) && playing === row.audio2;

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onPlay(row.audio)}
          disabled={!row.audio}
          aria-label={`${on ? c.pause : c.play}: ${row.text}`}
          className="pill h-12 w-12 shrink-0 bg-violet text-white disabled:opacity-30"
        >
          {on ? <Pause size={20} strokeWidth={2.5} aria-hidden /> : <Play size={20} strokeWidth={2.5} aria-hidden />}
        </button>

        <div className="min-w-0 flex-1">
          <p lang={lang} className="text-lg font-semibold leading-snug [overflow-wrap:anywhere]">
            {row.text}
          </p>
          {row.en && <p className="mt-0.5 text-sm text-muted [overflow-wrap:anywhere]">{row.en}</p>}
          {row.text2 && (
            <button
              type="button"
              onClick={() => row.audio2 && onPlay(row.audio2)}
              disabled={!row.audio2}
              aria-label={`${onQuestion ? c.pause : c.play} — ${c.question}: ${row.text2}`}
              className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-full bg-white/6 px-3.5 text-sm font-medium text-ink transition hover:bg-white/10 disabled:opacity-30"
            >
              {onQuestion ? <Pause size={14} strokeWidth={2.5} aria-hidden /> : <Play size={14} strokeWidth={2.5} aria-hidden />}
              <span lang={lang}>{row.text2}</span>
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <span className="text-xs tabular-nums text-muted sm:mr-1">{n}</span>
          <button
            type="button"
            aria-pressed={status === "ok"}
            aria-label={c.ok}
            onClick={() => onMark(row.id, status === "ok" ? { note: mark?.note } : { ...mark, s: "ok" })}
            className={`inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition ${
              status === "ok" ? "bg-mint text-canvas" : "bg-white/6 text-ink hover:bg-white/10"
            }`}
          >
            <Check size={16} strokeWidth={2.75} aria-hidden />
            <span className="hidden sm:inline">{c.ok}</span>
          </button>
          <button
            type="button"
            aria-pressed={status === "fix"}
            aria-label={c.fix}
            onClick={() => onMark(row.id, status === "fix" ? { note: mark?.note } : { ...mark, s: "fix" })}
            className={`inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition ${
              status === "fix" ? "bg-coral text-white" : "bg-white/6 text-ink hover:bg-white/10"
            }`}
          >
            <Flag size={15} strokeWidth={2.5} aria-hidden />
            <span className="hidden sm:inline">{c.fix}</span>
          </button>
        </div>
      </div>

      {status === "fix" && (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== (mark?.note ?? "") && onMark(row.id, { ...mark, note: draft })}
          placeholder={c.note}
          aria-label={c.note}
          rows={2}
          className="mt-3 w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted"
        />
      )}
    </li>
  );
});

/* --------------------------------- page --------------------------------- */

export default function ReviewPage() {
  const { lang = "ru" } = useParams<{ lang: string }>();
  const language = LANGUAGES.find((l) => l.code === lang);
  const storeKey = `nuri.review.${lang}.v1`;

  const [rows, setRows] = useState<Row[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [marks, setMarks] = useState<Marks>({});
  const [ui, setUi] = useState<Ui>("en");
  const [section, setSection] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [playing, setPlaying] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const c = COPY[ui];

  useEffect(() => {
    let live = true;
    fetch(`/review/${lang}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { rows: Row[] }) => {
        if (!live) return;
        setRows(data.rows);
        setSection(data.rows[0]?.section ?? "");
      })
      .catch(() => live && setMissing(true));
    try {
      setMarks(JSON.parse(localStorage.getItem(storeKey) ?? "{}") as Marks);
    } catch {
      // private window or blocked storage — review still works, marks just don't persist
    }
    if (lang === "ru" && navigator.language.toLowerCase().startsWith("ru")) setUi("ru");
    return () => {
      live = false;
      audioRef.current?.pause();
    };
  }, [lang, storeKey]);

  const onMark = useCallback(
    (id: string, next: Mark) => {
      setMarks((prev) => {
        const out = { ...prev };
        if (!next.s && !next.note) delete out[id];
        else out[id] = next;
        try {
          localStorage.setItem(storeKey, JSON.stringify(out));
        } catch {
          // see above
        }
        return out;
      });
    },
    [storeKey]
  );

  const onPlay = useCallback((src: string) => {
    if (!src) return;
    const audio = (audioRef.current ??= new Audio());
    if (!audio.paused && audio.dataset.src === src) {
      audio.pause();
      setPlaying("");
      return;
    }
    audio.pause();
    audio.src = src;
    audio.dataset.src = src;
    audio.onended = () => setPlaying("");
    audio.onerror = () => setPlaying("");
    setPlaying(src);
    void audio.play().catch(() => setPlaying(""));
  }, []);

  const sections = useMemo(() => [...new Set((rows ?? []).map((r) => r.section))], [rows]);
  const numberOf = useMemo(() => new Map((rows ?? []).map((r, i) => [r.id, i + 1])), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      // a search looks across every section; otherwise stay in the open one
      if (q) {
        if (!`${r.text} ${r.en} ${r.text2 ?? ""}`.toLowerCase().includes(q)) return false;
      } else if (r.section !== section) return false;
      const s = marks[r.id]?.s;
      if (filter === "todo") return !s;
      if (filter === "fix") return s === "fix";
      return true;
    });
  }, [rows, query, section, filter, marks]);

  useEffect(() => setLimit(PAGE), [section, filter, query]);

  const total = rows?.length ?? 0;
  const done = (rows ?? []).filter((r) => marks[r.id]?.s).length;
  const flagged = (rows ?? []).filter((r) => marks[r.id]?.s === "fix").length;

  function downloadNotes() {
    const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Row", "Section", "Group", "Text", "English", "Audio", "Status", "Note"].map(cell).join(",")];
    (rows ?? []).forEach((r, i) => {
      const m = marks[r.id];
      if (!m?.s && !m?.note) return;
      lines.push(
        [i + 1, r.section, r.group, r.text, r.en, r.audio ? location.origin + r.audio : "", m.s ?? "", m.note ?? ""]
          .map(cell)
          .join(",")
      );
    });
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `nurilang-${lang}-review-notes.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const chip = (active: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
      active ? "bg-ink text-canvas" : "bg-white/6 text-ink hover:bg-white/10"
    }`;

  let lastGroup = "";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Logo />
        {lang === "ru" && (
          <div className="flex gap-1 rounded-full bg-white/6 p-1" role="group" aria-label="Interface language">
            {(["en", "ru"] as Ui[]).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={ui === code}
                onClick={() => setUi(code)}
                className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition ${
                  ui === code ? "bg-ink text-canvas" : "text-muted hover:text-ink"
                }`}
              >
                {code === "en" ? "English" : "Русский"}
              </button>
            ))}
          </div>
        )}
      </div>

      <header className="card relative mt-6 overflow-hidden p-6 sm:p-8">
        <div className="orb -right-20 -top-24 h-56 w-56 bg-violet/25" />
        <div className="relative">
          <h1 className="headline text-3xl sm:text-4xl">
            {fill(c.title, { language: (ui === "ru" ? language?.nativeName : language?.name) ?? lang })}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{c.intro}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{c.saved}</p>

          {rows && (
            <>
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/8" aria-hidden>
                <div
                  className="h-full rounded-full bg-mint transition-[width] duration-500"
                  style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-semibold tabular-nums" aria-live="polite">
                {fill(c.progress, { done, total, fix: flagged })}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadNotes}
                  disabled={!Object.keys(marks).length}
                  className="pill min-h-11 bg-lime px-5 text-sm text-canvas disabled:opacity-40"
                >
                  <Download size={16} strokeWidth={2.5} aria-hidden /> {c.download}
                </button>
                <a
                  href={`/review/nurilang-${lang}-review.csv`}
                  download
                  className="pill min-h-11 bg-white/8 px-5 text-sm text-ink"
                >
                  <Download size={16} strokeWidth={2.5} aria-hidden /> {c.sheet}
                </a>
              </div>
            </>
          )}
        </div>
      </header>

      {missing && <p className="mt-10 text-center text-muted">{c.none}</p>}
      {!rows && !missing && <p className="mt-10 text-center text-muted">{c.loading}</p>}

      {rows && (
        <>
          <div className="sticky top-0 z-30 -mx-4 mt-6 space-y-3 bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {sections.map((s) => {
                const inSection = rows.filter((r) => r.section === s);
                const checked = inSection.filter((r) => marks[r.id]?.s).length;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={!query && section === s}
                    onClick={() => {
                      setSection(s);
                      setQuery("");
                    }}
                    className={chip(!query && section === s)}
                  >
                    {sectionName(c, s)}
                    <span className="text-xs font-medium tabular-nums opacity-70">
                      {checked}/{inSection.length}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-0 flex-1 basis-56">
                <span className="sr-only">{c.search}</span>
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={c.search}
                  className="h-11 w-full rounded-full border border-line bg-raised pl-11 pr-4 text-sm text-ink placeholder:text-muted"
                />
              </label>
              {(
                [
                  ["all", c.all],
                  ["todo", c.todo],
                  ["fix", c.flagged],
                ] as [Filter, string][]
              ).map(([key, label]) => (
                <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={chip(filter === key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="mt-10 text-center text-muted">{c.empty}</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {visible.slice(0, limit).map((row) => {
                const heading = row.section === "words" && row.group !== lastGroup ? row.group : "";
                if (row.section === "words") lastGroup = row.group;
                return (
                  <FragmentWithHeading
                    key={row.id}
                    heading={heading}
                    local={ui === "ru" ? row.groupLocal : undefined}
                    lang={lang}
                  >
                    <ReviewRow
                      row={row}
                      n={numberOf.get(row.id) ?? 0}
                      lang={lang}
                      mark={marks[row.id]}
                      playing={playing && (playing === row.audio || playing === row.audio2) ? playing : ""}
                      c={c}
                      onPlay={onPlay}
                      onMark={onMark}
                    />
                  </FragmentWithHeading>
                );
              })}
            </ul>
          )}

          {visible.length > limit && (
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setLimit((n) => n + PAGE * 2)} className="pill min-h-11 bg-white/8 px-6 text-sm text-ink">
                {c.more} · {visible.length - limit}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

/** A deck heading above the first word of each picture-card group. */
function FragmentWithHeading({
  heading,
  local,
  lang,
  children,
}: {
  heading: string;
  local?: string;
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {heading && (
        <li className="px-1 pb-0.5 pt-5 text-xs font-semibold uppercase tracking-wider text-muted first:pt-1">
          {local ? <span lang={lang}>{local}</span> : heading}
        </li>
      )}
      {children}
    </>
  );
}
