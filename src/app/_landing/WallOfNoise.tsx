"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Reveal } from "./Reveal";

/** Scrambled glyph pool — the "wall of noise". All single UTF-16 code units. */
const GLYPHS = "▚▞▟▒▓◆●◢◣ஃ字ŋж҂ʘ∿Ξ§ق∆";

const SEGMENTS: { text: string; cls: string }[] = [
  { text: "First, it’s a ", cls: "text-ink" },
  { text: "wall of noise", cls: "text-coral" },
  { text: ". Then it’s a ", cls: "text-ink" },
  { text: "window into hearts", cls: "text-lime" },
  { text: ".", cls: "text-ink" },
];

const FLAT: { ch: string; cls: string }[] = SEGMENTS.flatMap((s) =>
  s.text.split("").map((ch) => ({ ch, cls: s.cls }))
);

const SENTENCE = SEGMENTS.map((s) => s.text).join("");

export function WallOfNoise() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [revealed, setRevealed] = useState(0);
  const [tick, setTick] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      setTick((t) => t + 1);
      // churn the glyphs for a beat before the decode begins
      if (ticks > 10) {
        setRevealed((prev) => {
          const next = Math.min(FLAT.length, prev + 2);
          if (next >= FLAT.length) window.clearInterval(id);
          return next;
        });
      }
    }, 55);
    return () => window.clearInterval(id);
  }, [inView, run]);

  const done = revealed >= FLAT.length;

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
      <Reveal>
        <div
          ref={ref}
          className="card relative overflow-hidden px-6 py-12 text-center sm:px-12 lg:py-16"
        >
          <div className="orb -left-20 top-0 h-64 w-64 bg-violet/20" />
          <div className="orb -right-16 bottom-0 h-56 w-56 bg-lime/10" />

          <p className="relative text-xs font-bold uppercase tracking-[0.22em] text-muted">
            Every language you don’t speak yet
          </p>

          <p
            aria-label={SENTENCE}
            className="headline relative mx-auto mt-6 max-w-3xl text-3xl leading-snug sm:text-4xl lg:text-5xl"
          >
            {FLAT.map((f, i) => {
              const isOn = i < revealed;
              const glyph = GLYPHS[(i * 13 + tick * 7) % GLYPHS.length];
              return (
                <span
                  key={i}
                  aria-hidden
                  className={isOn ? f.cls : "text-muted/60"}
                >
                  {isOn || f.ch === " " ? f.ch : glyph}
                </span>
              );
            })}
          </p>

          <p className="relative mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted">
            That’s the whole method. Your nurturer never translates the wall away — they open
            a door in it with pictures, objects and play, until the noise resolves into
            people you know. GPA calls you a{" "}
            <span className="font-semibold text-ink">growing participator</span>, because
            that’s what you’re doing: growing into a world.
          </p>

          <button
            type="button"
            onClick={() => {
              setRevealed(0);
              setTick(0);
              setRun((r) => r + 1);
            }}
            className={`pill relative mt-8 border border-line bg-white/5 px-5 py-2.5 text-sm font-semibold text-muted transition-opacity ${
              done ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <RotateCcw size={15} />
            Watch the wall melt again
          </button>
        </div>
      </Reveal>
    </section>
  );
}
