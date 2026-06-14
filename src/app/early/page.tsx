"use client";

/**
 * /early — the pre-signup page.
 *
 * Public and profile-free: a short pitch in the house voice, the buddy
 * family floating about, a three-card taste of onboarding, and an email
 * capture. Submission goes to Convex when NEXT_PUBLIC_CONVEX_URL is set —
 * via ConvexHttpClient calling "waitlist:join" by string name, so nothing
 * here imports convex/_generated (that folder stays out of the Next build).
 * Without the env var (or if the call fails) the entry rests on this
 * device under `lange.waitlist.v1` and the success note says so, softly.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail, Volume2 } from "lucide-react";
import { ConvexHttpClient } from "convex/browser";
import { Logo } from "@/components/Logo";
import { MascotImage } from "@/components/MascotImage";
import { Reveal } from "../_landing/Reveal";
import { MASCOTS, mascotForLang } from "@/lib/mascots";
import { LANGUAGES } from "@/lib/languages";
import type { LangCode } from "@/lib/types";

/* --------------------------------- plumbing -------------------------------- */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const LOCAL_KEY = "lange.waitlist.v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistEntry = {
  email: string;
  name?: string;
  langInterest?: string;
  source: string;
  ts: number;
};

/** "synced" → it reached Convex; "local" → it's resting on this device. */
async function submitEntry(entry: WaitlistEntry): Promise<"synced" | "local"> {
  if (CONVEX_URL) {
    try {
      const client = new ConvexHttpClient(CONVEX_URL);
      // By string name so the page never imports convex/_generated.
      const mutate = client.mutation as unknown as (
        name: string,
        args: Record<string, unknown>
      ) => Promise<unknown>;
      await mutate("waitlist:join", {
        email: entry.email,
        name: entry.name,
        langInterest: entry.langInterest,
        source: entry.source,
      });
      return "synced";
    } catch {
      // backend unreachable — tuck it away locally instead
    }
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const list: WaitlistEntry[] = raw ? (JSON.parse(raw) as WaitlistEntry[]) : [];
    const next = [...list.filter((e) => e.email !== entry.email), entry];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode) — still celebrate the signup
  }
  return "local";
}

const EASE = [0.2, 0.65, 0.3, 1] as const;

/* ----------------------------- confetti (light) ---------------------------- */

const CONFETTI_COLORS = ["#7c5cff", "#ff8a1e", "#b8f03c", "#ffd234", "#3ddc84", "#ff5d5d"];

function ConfettiBurst() {
  const pieces = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 70 + (i % 3) * 26;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.8 - 18,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 5) * 0.04,
      r: i % 2 === 0 ? 5 : 3.5,
    };
  });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: p.r * 2, height: p.r * 2, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.15 + p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ------------------------- taste-of-onboarding cards ------------------------ */

function StepCard({
  step,
  accent,
  title,
  children,
  delay,
}: {
  step: string;
  accent: string;
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="card card-hover flex h-full flex-col p-6">
        <span className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: accent }}>
          {step}
        </span>
        <h3 className="headline mt-2 text-2xl">{title}</h3>
        <div className="mt-5 flex flex-1 items-center justify-center">{children}</div>
      </div>
    </Reveal>
  );
}

/** Mini step 1 — picking a world (static mock of the real onboarding chips). */
function PickLanguageMini() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <span className="pill border border-transparent bg-violet px-4 py-2 text-sm font-semibold text-white" style={{ boxShadow: "var(--shadow-glow-violet)" }}>
        <span className="text-lg leading-none">🇪🇸</span> Español <Check size={14} strokeWidth={3} />
      </span>
      <span className="pill border border-line bg-white/5 px-4 py-2 text-sm font-semibold text-ink">
        <span className="text-lg leading-none">🇷🇺</span> Русский
      </span>
      <span className="pill border border-line bg-white/5 px-4 py-2 text-sm font-semibold text-ink">
        <span className="text-lg leading-none">🇯🇵</span> 日本語
      </span>
    </div>
  );
}

/** Mini step 2 — your buddy says hello (no translation, of course). */
function MeetBuddyMini() {
  const buddy = mascotForLang("es");
  return (
    <div className="flex items-end gap-3">
      <MascotImage mascot={buddy} size={88} float glow />
      <div className="rounded-2xl rounded-bl-md border border-line bg-raised-2/80 px-4 py-2.5">
        <p className="headline text-xl">{buddy.nativeHello}</p>
        <p className="mt-0.5 text-[11px] text-muted">{buddy.name} · your {buddy.toy.toLowerCase()}</p>
      </div>
    </div>
  );
}

/** Mini step 3 — first listening: a picture, a voice, your finger pointing. */
function FirstListeningMini() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="card flex flex-col items-center gap-1.5 border-lime/30 bg-raised-2/60 px-8 pb-4 pt-5"
        style={{ boxShadow: "0 0 40px -14px rgba(184,240,60,0.4)" }}
      >
        <span className="text-5xl">🍎</span>
        <span className="font-display text-base font-bold text-lime">la manzana</span>
      </div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Volume2 size={13} className="text-lime" /> a picture and a voice — no English between them
      </p>
    </div>
  );
}

/* ----------------------------------- page ---------------------------------- */

export default function EarlyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [langInterest, setLangInterest] = useState<"" | LangCode>("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | "synced" | "local">(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const firstName = name.trim().split(/\s+/)[0] ?? "";

  const successBuddy = useMemo(
    () => (langInterest ? mascotForLang(langInterest) : MASCOTS[0]),
    [langInterest]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || submitting) return;
    setSubmitting(true);
    const result = await submitEntry({
      email: email.trim().toLowerCase(),
      name: name.trim() || undefined,
      langInterest: langInterest || undefined,
      source: "early",
      ts: Date.now(),
    });
    setSubmitting(false);
    setDone(result);
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ───────────────────────── header ───────────────────────── */}
      <header className="border-b border-line bg-canvas/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <Logo />
          <a href="#join" className="pill bg-lime px-5 py-2.5 text-sm font-bold text-canvas">
            🌱 Save my seat
          </a>
        </nav>
      </header>

      {/* ───────────────────────── hero ───────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="orb -left-32 -top-40 h-[420px] w-[420px] bg-violet/30" />
        <div className="orb -bottom-40 -right-32 h-[440px] w-[440px] bg-orange/20" />

        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-14 text-center sm:pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.45, duration: 0.9 }}
            className="mx-auto w-fit"
          >
            <MascotImage mascot={MASCOTS[0]} size={132} float glow />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-muted"
          >
            🌱 Before the doors open — the early growers list
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: EASE }}
            className="headline mt-6 text-4xl leading-[1.04] sm:text-6xl"
          >
            Grow into a language
            <br />
            with a <span className="italic text-lime">real person</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted"
          >
            Nuri meets you with picture cards, play, and{" "}
            <span className="font-semibold text-ink">zero translation</span> — you understand
            from minute one and speak only when you&rsquo;re ready. Comprehension first.
            Friendship always.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42, ease: EASE }}
            className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted"
          >
            <span className="font-semibold text-ink">Born on the mission field,</span> where a
            language is how you love your neighbors — Nuri is built with pen-pal warmth: a real
            voice on the other side, waiting to meet you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.52, ease: EASE }}
            className="mt-9 flex justify-center"
          >
            <a
              href="#join"
              className="pill bg-lime px-8 py-3.5 text-base font-bold text-canvas"
              style={{ boxShadow: "0 0 50px -8px rgba(184,240,60,0.5)" }}
            >
              🌱 Be first through the gate
              <ArrowRight size={18} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ───────────────────── buddies, already waiting ───────────────────── */}
      <section className="relative border-y border-line bg-raised/30 py-12">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
              Already waiting for you
            </p>
          </Reveal>
          <div className="mt-7 flex flex-wrap items-end justify-center gap-x-3 gap-y-5 sm:gap-x-5">
            {MASCOTS.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 22, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 280, damping: 20, delay: i * 0.06 }}
              >
                <MascotImage
                  mascot={m}
                  size={84}
                  float
                  glow
                  className="h-16! w-16! sm:h-[84px]! sm:w-[84px]!"
                />
              </motion.div>
            ))}
          </div>
          <Reveal delay={0.2} className="mt-6 text-center">
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
              Every language here comes with its own little buddy. You&rsquo;ll meet yours on
              day one — we won&rsquo;t spoil the introductions.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────── a taste of day one ───────────────────── */}
      <section className="relative mx-auto max-w-5xl px-5 py-20">
        <div className="orb -left-36 top-16 h-[320px] w-[320px] bg-violet/15" />
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">A taste of day one</p>
          <h2 className="headline mt-3 text-3xl sm:text-5xl">Three small steps in</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted">
            No placement test, no grammar quiz. This is how your first minutes will feel.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <StepCard step="01 — Pick your language" accent="var(--color-violet-soft)" title="Choose a world" delay={0}>
            <PickLanguageMini />
          </StepCard>
          <StepCard step="02 — Meet your buddy" accent="var(--color-orange)" title="Hear your first hello" delay={0.1}>
            <MeetBuddyMini />
          </StepCard>
          <StepCard step="03 — Your first listening" accent="var(--color-lime)" title="Point, listen, smile" delay={0.2}>
            <FirstListeningMini />
          </StepCard>
        </div>
      </section>

      {/* ───────────────────────── email capture ───────────────────────── */}
      <section id="join" className="relative scroll-mt-16 px-5 pb-24">
        <div className="orb left-1/2 top-10 h-[380px] w-[560px] -translate-x-1/2 bg-lime/10" />
        <div className="relative mx-auto max-w-xl">
          {done === null ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: EASE }}
                className="card relative overflow-hidden p-7 sm:p-10"
              >
                <div className="orb -right-20 -top-20 h-56 w-56 bg-violet/20" />
                <div className="relative">
                  <h2 className="headline text-3xl sm:text-4xl">Save your seat in the garden</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Leave your email and we&rsquo;ll write the moment the doors open — a hello,
                    not a drip campaign. No streaks, no guilt, ever.
                  </p>

                  <form onSubmit={onSubmit} className="mt-7 grid gap-4">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted">
                        Name <span className="font-medium normal-case tracking-normal">(optional)</span>
                      </span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="What should we call you?"
                        maxLength={40}
                        autoComplete="name"
                        className="mt-2 w-full rounded-xl border border-line bg-white/5 px-4 py-3 text-ink caret-violet outline-none transition-colors placeholder:text-white/20 focus:border-violet"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted">Email</span>
                      <div className="relative mt-2">
                        <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@somewhere.kind"
                          maxLength={80}
                          autoComplete="email"
                          className="w-full rounded-xl border border-line bg-white/5 py-3 pl-11 pr-4 text-ink caret-violet outline-none transition-colors placeholder:text-white/20 focus:border-violet"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted">
                        Which world is calling you?{" "}
                        <span className="font-medium normal-case tracking-normal">(optional)</span>
                      </span>
                      <select
                        value={langInterest}
                        onChange={(e) => setLangInterest(e.target.value as "" | LangCode)}
                        style={{ colorScheme: "dark" }}
                        className="mt-2 w-full cursor-pointer rounded-xl border border-line bg-white/5 px-4 py-3 text-ink outline-none transition-colors focus:border-violet"
                      >
                        <option value="">I&rsquo;m still wandering the map…</option>
                        {LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.flag} {l.nativeName} — {l.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="submit"
                      disabled={!emailValid || submitting}
                      className="pill mt-2 bg-lime px-7 py-3.5 text-base font-bold text-canvas disabled:pointer-events-none disabled:opacity-35"
                      style={emailValid ? { boxShadow: "0 0 50px -10px rgba(184,240,60,0.5)" } : undefined}
                    >
                      {submitting ? "Planting…" : "🌱 Keep me posted"}
                      {!submitting && <ArrowRight size={18} />}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.7 }}
                className="card relative overflow-hidden p-8 text-center sm:p-12"
              >
                <div className="orb -left-20 -top-20 h-56 w-56 bg-lime/15" />
                <div className="relative">
                  <div className="relative mx-auto w-fit">
                    <ConfettiBurst />
                    <MascotImage mascot={successBuddy} size={140} float glow />
                  </div>
                  <h2 className="headline mt-6 text-3xl sm:text-4xl">
                    {firstName ? `You're in, ${firstName}!` : "You're in!"} 🌱
                  </h2>
                  <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
                    {successBuddy.name} heard the news and hasn&rsquo;t stopped bobbing since.
                    We&rsquo;ll write the moment the doors open.
                  </p>
                  {done === "local" && (
                    <p className="mx-auto mt-4 max-w-sm rounded-2xl border border-line bg-white/4 px-4 py-3 text-xs leading-relaxed text-muted">
                      Your spot is saved on this device for now — it&rsquo;ll join the list
                      automatically when our backend goes live.
                    </p>
                  )}
                  <div className="mt-8 flex justify-center">
                    <Link
                      href="/"
                      className="pill border border-line bg-white/5 px-6 py-3 text-sm font-semibold text-ink"
                    >
                      Wander the garden while you wait
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
        </div>
      </section>

      {/* ───────────────────────── footer ───────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-7 text-sm text-muted sm:flex-row">
          <p>
            Built on the{" "}
            <a
              href="https://www.growingparticipation.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
            >
              Growing Participator Approach
            </a>
          </p>
          <Link href="/" className="text-xs font-semibold transition-colors hover:text-ink">
            ← Back to Nuri
          </Link>
        </div>
      </footer>
    </div>
  );
}
