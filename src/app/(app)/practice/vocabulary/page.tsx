"use client";

/**
 * /practice/vocabulary — "Rough-and-Ready Dozen"
 * The classic GPA Phase-1 game: the nurturer says a word, the grower
 * points at the picture. Comprehension before production — the written
 * word appears only AFTER the ear has found the meaning.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { VOCAB_DOMAINS, domainById } from "@/lib/vocab";
import { getCardImage, whenCardsReady } from "@/lib/cards";
import { speak, stopSpeaking } from "@/lib/tts";
import type { VocabDomain, VocabItem } from "@/lib/types";
import { useApp } from "@/lib/store";
import {
  FallbackBanner,
  FinishScreen,
  IcebergToast,
  PracticeHeader,
  ProgressDots,
  ReplayButton,
  pickN,
  shuffle,
  useContentLang,
  type ContentLang,
  type RoundResult,
} from "../shared";

const TOTAL_ROUNDS = 12;
const LIME = "var(--color-lime)";

/* ----------------------------- domain chooser ----------------------------- */

function DomainChooser() {
  const { uiLang, t } = useApp();
  return (
    <div>
      <PracticeHeader
        emoji="🃏"
        title={t("prcVocabName")}
        kicker={t("chooseCategory")}
        accent={LIME}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {VOCAB_DOMAINS.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.2, 0.9, 0.3, 1.3] }}
          >
            <Link href={`/practice/vocabulary?domain=${d.id}`} className="group block">
              <div className="card card-hover flex flex-col items-center gap-2 px-4 py-7 text-center">
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `color-mix(in srgb, var(--color-${d.color}) 16%, transparent)` }}
                >
                  {d.emoji}
                </span>
                <span className="font-display text-base font-bold">
                  {d.names[uiLang] ?? d.names.en}
                </span>
                <span className="rounded-full bg-white/6 px-2.5 py-0.5 text-[11px] text-muted">
                  {d.items.length} 🃏
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- game ---------------------------------- */

function buildRounds(domain: VocabDomain): VocabItem[] {
  let pool = shuffle(domain.items);
  while (pool.length < TOTAL_ROUNDS) {
    let next = shuffle(domain.items);
    // avoid the same card twice in a row at the seam
    if (next[0]?.id === pool[pool.length - 1]?.id && next.length > 1) {
      next = [...next.slice(1), next[0]];
    }
    pool = pool.concat(next);
  }
  return pool.slice(0, TOTAL_ROUNDS);
}

function buildChoices(domain: VocabDomain, target: VocabItem, size: number): VocabItem[] {
  const n = Math.min(size, domain.items.length);
  const distractors = pickN(
    domain.items.filter((it) => it.id !== target.id),
    n - 1
  );
  return shuffle([target, ...distractors]);
}

function wordOf(item: VocabItem, lang: ContentLang): string {
  return item.words[lang] ?? "";
}

function Game({ domain }: { domain: VocabDomain }) {
  const { lang, fellBack, uiLang, t } = useContentLang();
  const { completeActivity, profile } = useApp();
  const writtenWordsReady = Boolean(profile && (profile.phase > 1 || profile.hoursLogged >= 40));

  const [rounds] = useState<VocabItem[]>(() => buildRounds(domain));
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [missedThisRound, setMissedThisRound] = useState(false);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [metIds, setMetIds] = useState<Set<string>>(new Set());

  const advanceTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);
  const loggedRef = useRef(false);

  // pre-generated card illustrations load async — tick once the manifest
  // lands so getCardImage() swaps emoji placeholders for real pictures
  const [, setCardsReady] = useState(false);
  useEffect(() => {
    let active = true;
    void whenCardsReady().then(() => {
      if (active) setCardsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const finished = round >= TOTAL_ROUNDS;
  const correctCount = results.filter((r) => r === "correct").length;
  // GPA pacing: the picture field grows as the grower succeeds — 4 → 6 → 9
  const gridSize = correctCount >= 8 ? 9 : correctCount >= 4 ? 6 : 4;

  const target = finished ? null : rounds[round];
  const choices = useMemo(
    () => (target ? buildChoices(domain, target, gridSize) : []),
    [domain, target, gridSize]
  );

  // speak the round's word automatically (ears first, always)
  useEffect(() => {
    if (target) void speak(wordOf(target, lang), lang);
    return () => stopSpeaking();
  }, [target, lang]);

  // log completion exactly once
  useEffect(() => {
    if (finished && !loggedRef.current) {
      loggedRef.current = true;
      completeActivity(
        profile?.phase === 1
          ? metIds.size >= 10
            ? "p1-dozen"
            : "p1-dozen-practice"
          : `maintenance-vocab-${domain.id}`,
        10,
        [...metIds]
      );
    }
  }, [finished, completeActivity, domain.id, metIds, profile?.phase]);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    []
  );

  const handlePick = useCallback(
    (item: VocabItem) => {
      if (!target || revealed) return;
      if (item.id === target.id) {
        // correct → reveal the written word ONLY now, hear it again
        setRevealed(true);
        setMetIds((prev) => new Set(prev).add(target.id));
        void speak(wordOf(target, lang), lang);
        advanceTimer.current = window.setTimeout(() => {
          setResults((prev) => [...prev, missedThisRound ? "missed" : "correct"]);
          setRound((r) => r + 1);
          setRevealed(false);
          setMissedThisRound(false);
          setWrongId(null);
        }, 1700);
      } else {
        // wrong → no failure in GPA, it just sinks into the iceberg
        setMissedThisRound(true);
        setWrongId(item.id);
        setToast(true);
        void speak(wordOf(target, lang), lang);
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(false), 1700);
        window.setTimeout(() => setWrongId(null), 650);
      }
    },
    [target, revealed, missedThisRound, lang]
  );

  const domainName = domain.names[uiLang] ?? domain.names.en ?? domain.id;

  if (finished) {
    return (
      <div>
        <PracticeHeader emoji={domain.emoji} title={t("prcVocabName")} kicker={domainName} accent={LIME} />
        <FinishScreen
          title={t("correct")}
          sub={t("prcVocabFinish")}
          accent={LIME}
          stats={[
            { value: `${correctCount}/${TOTAL_ROUNDS}`, label: t("correct") },
            { value: `${metIds.size}`, label: t("wordsMet") },
          ]}
          actions={[
            { href: "/practice/vocabulary", label: `🌍 ${t("chooseCategory")}`, primary: true },
            { href: "/dashboard", label: t("dashboard") },
          ]}
        />
      </div>
    );
  }

  const cols = choices.length <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <div>
      <PracticeHeader emoji={domain.emoji} title={t("prcVocabName")} kicker={domainName} accent={LIME} />
      <FallbackBanner show={fellBack} />

      <div className="mx-auto max-w-3xl">
        {/* prompt card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="card relative mb-6 overflow-hidden px-6 py-6"
        >
          <div className="orb left-[-60px] top-[-80px] h-[180px] w-[180px] bg-lime/20" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <ReplayButton
              label={t("listen")}
              accent={LIME}
              onClick={() => target && void speak(wordOf(target, lang), lang)}
            />
            <div className="flex-1 text-center">
              <p className="text-sm text-muted">👂 → 👆</p>
              <p className="mt-1 text-xs text-muted/80">
                {round + 1} / {TOTAL_ROUNDS}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <ProgressDots total={TOTAL_ROUNDS} current={round} results={results} accent={LIME} />
            </div>
          </div>
        </motion.div>

        {/* picture cards */}
        <div className={`grid ${cols} gap-4`} key={`${round}-${choices.length}`}>
          {choices.map((item, i) => {
            const isTarget = target !== null && item.id === target.id;
            const correctReveal = revealed && isTarget;
            const showWord = correctReveal && writtenWordsReady;
            const cardImage = getCardImage(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 18, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.38, ease: [0.2, 0.9, 0.3, 1.3] }}
                onClick={() => handlePick(item)}
                disabled={revealed}
                className={[
                  "card card-hover relative flex flex-col items-center justify-center gap-2 px-4 py-8 outline-none",
                  wrongId === item.id ? "shake border-coral/60" : "",
                  correctReveal ? "popin border-lime ring-2 ring-lime" : "",
                  revealed && !isTarget ? "opacity-40" : "",
                ].join(" ")}
                style={correctReveal ? { boxShadow: "0 0 50px -12px rgba(184,240,60,0.7)" } : undefined}
              >
                {cardImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- static public/ asset, no optimization needed
                  <img
                    src={cardImage}
                    alt=""
                    width={96}
                    height={96}
                    draggable={false}
                    className="h-24 w-24 select-none rounded-xl object-contain"
                  />
                ) : (
                  <span className="text-6xl leading-none">{item.emoji}</span>
                )}
                {/* Writing waits until Phase 1B; early success stays image + audio only. */}
                {showWord ? (
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm font-semibold text-lime"
                  >
                    {wordOf(item, lang)}
                  </motion.span>
                ) : (
                  <span className="text-sm text-transparent select-none">·</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <IcebergToast show={toast} />
    </div>
  );
}

/* --------------------------------- page ---------------------------------- */

function VocabularyInner() {
  const params = useSearchParams();
  const domainId = params.get("domain");
  const domain = domainId ? domainById(domainId) : undefined;

  if (!domain) return <DomainChooser />;
  return <Game key={domain.id} domain={domain} />;
}

export default function VocabularyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-lime border-t-transparent" />
        </div>
      }
    >
      <VocabularyInner />
    </Suspense>
  );
}
