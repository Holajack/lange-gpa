"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroBuddy } from "@/components/HeroBuddy";
import { NURTURERS } from "@/lib/nurturers";
import { speak } from "@/lib/tts";
import type { LangCode } from "@/lib/types";

interface FloatChip {
  flag: string;
  word: string;
  lang: LangCode;
  pos: string;
  delay: number;
}

const CHIPS: FloatChip[] = [
  { flag: "🇪🇸", word: "hola", lang: "es", pos: "left-[3%] top-[6%] -rotate-6", delay: 0 },
  { flag: "🇷🇺", word: "привет", lang: "ru", pos: "right-[5%] top-[7%] rotate-3 hidden sm:block", delay: 0.5 },
  { flag: "🇫🇷", word: "salut", lang: "fr", pos: "left-[6%] bottom-[10%] rotate-2 hidden md:block", delay: 1.1 },
  { flag: "🇯🇵", word: "こんにちは", lang: "ja", pos: "right-[2%] bottom-[26%] rotate-6 hidden sm:block", delay: 1.7 },
  { flag: "🇩🇪", word: "hallo", lang: "de", pos: "left-[40%] top-[3%] -rotate-3 hidden lg:block", delay: 2.3 },
  { flag: "🇧🇷", word: "oi", lang: "pt", pos: "right-[30%] bottom-[5%] -rotate-3 hidden md:block", delay: 2.9 },
];

const EASE = [0.2, 0.65, 0.3, 1] as const;

export function Hero() {
  const onlineNow = NURTURERS.filter((n) => n.online).length;

  return (
    <section className="relative overflow-hidden">
      {/* ambient glows */}
      <div className="orb -left-32 -top-40 h-[440px] w-[440px] bg-violet/30" />
      <div className="orb -bottom-44 -right-36 h-[480px] w-[480px] bg-orange/25" />
      <div className="orb right-1/4 top-1/3 hidden h-[260px] w-[260px] bg-lime/15 lg:block" />

      {/* floating greeting chips — click to hear them */}
      {CHIPS.map((c) => (
        <motion.div
          key={c.word}
          className={`absolute z-10 ${c.pos}`}
          initial={{ opacity: 0, scale: 0.4, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.7 + c.delay * 0.16, type: "spring", bounce: 0.5, duration: 0.7 }}
        >
          <button
            type="button"
            onClick={() => void speak(c.word, c.lang)}
            aria-label={`Hear "${c.word}"`}
            className="floaty flex cursor-pointer items-center gap-2 rounded-full border border-line bg-raised/90 px-4 py-2 text-sm font-semibold backdrop-blur transition-[filter] hover:brightness-125"
            style={{ animationDelay: `${c.delay * 0.45}s`, boxShadow: "var(--shadow-pop)" }}
          >
            <span className="text-base">{c.flag}</span>
            <span>{c.word}</span>
          </button>
        </motion.div>
      ))}

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 lg:grid-cols-[7fr_5fr] lg:pb-32 lg:pt-24">
        {/* left — words */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-muted"
          >
            🌱 The Growing Participator Approach — digitized
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
            className="headline mt-6 text-5xl leading-[1.02] sm:text-6xl lg:text-7xl xl:text-[5.4rem]"
          >
            Don’t learn
            <br />
            a language.
            <br />
            <span className="italic text-lime">Grow into it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-muted"
          >
            A real person from your new language — your{" "}
            <span className="font-semibold text-ink">nurturer</span> — meets you with picture
            cards, play, and <span className="font-semibold text-ink">zero translation</span>.
            You understand from minute one and speak only when you’re ready: from your first
            100 hours to truly belonging.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/onboarding"
              className="pill bg-lime px-7 py-3.5 text-base font-bold text-canvas"
              style={{ boxShadow: "0 0 50px -8px rgba(184,240,60,0.5)" }}
            >
              🌱 Start growing
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/onboarding?role=nurturer"
              className="pill border border-line bg-white/5 px-7 py-3.5 text-base font-semibold text-ink"
            >
              🤝 I can nurture
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted"
          >
            <span className="flex items-center gap-2">
              <span className="pulsedot h-2.5 w-2.5 rounded-full bg-mint" />
              {onlineNow} nurturers online right now
            </span>
            <span className="hidden text-muted/50 sm:inline">·</span>
            <span>No textbooks. No grammar drills. No translation — ever.</span>
          </motion.div>
        </div>

        {/* right — Nuri, asymmetric */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: 8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.45, duration: 1, delay: 0.3 }}
          className="relative mx-auto lg:mx-0 lg:translate-y-8 lg:justify-self-end lg:pr-10"
        >
          <div
            className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,138,30,0.28), transparent 70%)" }}
          />
          <div className="-rotate-3">
            <HeroBuddy size={320} />
          </div>
          <div className="absolute -right-4 top-2 rotate-12 text-3xl">✨</div>
        </motion.div>
      </div>
    </section>
  );
}
