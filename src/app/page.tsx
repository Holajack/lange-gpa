"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Volume2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { Avatar } from "@/components/Avatar";
import { useApp } from "@/lib/store";
import { speak } from "@/lib/tts";
import { PHASES, TOTAL_HOURS } from "@/lib/phases";
import { MASCOTS } from "@/lib/mascots";
import { langByCode } from "@/lib/languages";
import { Hero } from "./_landing/Hero";
import { WallOfNoise } from "./_landing/WallOfNoise";
import { Reveal } from "./_landing/Reveal";

/* ---------------------------------- data --------------------------------- */

const GREETINGS: { flag: string; word: string }[] = [
  { flag: "🇪🇸", word: "hola" },
  { flag: "🇫🇷", word: "bonjour" },
  { flag: "🇷🇺", word: "привет" },
  { flag: "🇩🇪", word: "hallo" },
  { flag: "🇧🇷", word: "olá" },
  { flag: "🇮🇹", word: "ciao" },
  { flag: "🇯🇵", word: "こんにちは" },
  { flag: "🇨🇳", word: "你好" },
  { flag: "🇰🇷", word: "안녕하세요" },
  { flag: "🇹🇷", word: "merhaba" },
  { flag: "🇺🇦", word: "привіт" },
  { flag: "🇮🇳", word: "नमस्ते" },
  { flag: "🇲🇦", word: "مرحبا" },
  { flag: "🇬🇧", word: "hello" },
];

const DEMO_NURTURERS: { name: string; color: string; who: string; from: string }[] = [
  { name: "Lucía Ferrer", color: "#ff8a1e", who: "Retired baker", from: "Valencia" },
  { name: "Anya Sokolova", color: "#b8f03c", who: "Nurse, mother of two", from: "Tbilisi" },
  { name: "Karim Haddad", color: "#ff5d5d", who: "Fishmonger at the old port", from: "Marseille" },
];

const DEMO_CARDS: { id: string; emoji: string; word: string }[] = [
  { id: "perro", emoji: "🐕", word: "el perro" },
  { id: "manzana", emoji: "🍎", word: "la manzana" },
  { id: "luna", emoji: "🌙", word: "la luna" },
  { id: "llave", emoji: "🔑", word: "la llave" },
];

const TESTIMONIALS: {
  name: string;
  color: string;
  meta: string;
  quote: string;
}[] = [
  {
    name: "Sofía M.",
    color: "#7c5cff",
    meta: "Phase 1 · Russian 🇷🇺",
    quote:
      "Six weeks in, my nurturer made a joke about the cat picture card — and I laughed before I realized I'd understood it. No translation. It just landed.",
  },
  {
    name: "Yuki T.",
    color: "#ff8a1e",
    meta: "Phase 2 · Spanish 🇪🇸",
    quote:
      "Lucía's picture cards are photos of her own kitchen in Valencia. I didn't learn 'la cuchara' from a list — I met it in a real kitchen, held by a real grandmother.",
  },
  {
    name: "Marcus W.",
    color: "#3ddc84",
    meta: "Phase 1 · French 🇫🇷",
    quote:
      "For two months I never said a word of French. I pointed, I acted, I laughed. Then one day I asked Camille for the watering can — out loud. It was just… there.",
  },
];

/* --------------------------------- pieces -------------------------------- */

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{eyebrow}</p>
      <h2 className="headline mt-3 text-4xl sm:text-5xl">{title}</h2>
      {sub && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">{sub}</p>}
    </Reveal>
  );
}

function Iceberg() {
  return (
    <svg viewBox="0 0 360 300" className="mx-auto w-full max-w-sm" role="img" aria-label="Iceberg: a small tip of speaking above the waterline, a huge mass of understanding below it">
      <defs>
        <linearGradient id="berg-below" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="berg-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* water */}
      <rect x="0" y="112" width="360" height="188" fill="url(#berg-water)" rx="18" />

      {/* iceberg below the waterline — the understanding */}
      <polygon
        points="118,112 244,112 268,168 224,242 162,266 118,224 90,160"
        fill="url(#berg-below)"
      />
      {/* iceberg tip — the speaking */}
      <polygon points="150,58 196,82 244,112 118,112" fill="#eaf4ff" />
      <polygon points="150,58 196,82 178,112 150,112" fill="#c9defa" />

      {/* waterline on top of the berg */}
      <line x1="14" y1="112" x2="346" y2="112" stroke="#9aa3ff" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="7 7" />

      {/* labels */}
      <text x="262" y="76" fill="#eaf4ff" fontSize="13" fontWeight="700" fontFamily="inherit">
        what you say
      </text>
      <line x1="258" y1="80" x2="206" y2="88" stroke="#eaf4ff" strokeOpacity="0.5" strokeWidth="1.5" />
      <text x="36" y="206" fill="#b9aaff" fontSize="13" fontWeight="700" fontFamily="inherit">
        what you
      </text>
      <text x="36" y="222" fill="#b9aaff" fontSize="13" fontWeight="700" fontFamily="inherit">
        understand
      </text>
      <line x1="100" y1="210" x2="132" y2="196" stroke="#b9aaff" strokeOpacity="0.5" strokeWidth="1.5" />
      <text x="288" y="132" fill="#9aa3ff" fontSize="11" fontWeight="600" fontFamily="inherit" opacity="0.8">
        waterline
      </text>
    </svg>
  );
}

/* ---------------------------------- page --------------------------------- */

export default function LandingPage() {
  const { profile, ready } = useApp();
  const [met, setMet] = useState<Record<string, boolean>>({});
  const metAny = Object.values(met).some(Boolean);

  // smooth scrolling for the anchor nav (html element lives in the layout)
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "smooth";
    return () => {
      el.style.scrollBehavior = prev;
    };
  }, []);

  const hasProfile = ready && profile !== null;

  const meetCard = (id: string, word: string) => {
    setMet((m) => ({ ...m, [id]: true }));
    void speak(word, "es");
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ───────────────────────── nav ───────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-semibold text-muted md:flex">
            <a href="#how" className="transition-colors hover:text-ink">How it works</a>
            <a href="#phases" className="transition-colors hover:text-ink">The six phases</a>
            <a href="#community" className="transition-colors hover:text-ink">Community</a>
          </div>
          {hasProfile ? (
            <Link href="/dashboard" className="pill bg-violet px-5 py-2.5 text-sm font-bold text-white">
              Continue growing
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link href="/onboarding" className="pill bg-lime px-5 py-2.5 text-sm font-bold text-canvas">
              Start growing
            </Link>
          )}
        </nav>
      </header>

      {/* ───────────────────────── hero ───────────────────────── */}
      <Hero />

      {/* ─────────────── wall of noise (the metaphor) ─────────────── */}
      <WallOfNoise />

      {/* ───────────────────── greetings marquee ───────────────────── */}
      <div className="relative border-y border-line bg-raised/40 py-4" aria-label="Greetings in many languages">
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="marquee flex w-max hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex w-max" aria-hidden={copy === 1}>
                {GREETINGS.map((g, i) => (
                  <span
                    key={`${copy}-${i}`}
                    className="mx-3 flex items-center gap-2.5 whitespace-nowrap rounded-full border border-line bg-raised px-5 py-2 text-sm font-semibold"
                  >
                    <span className="text-lg leading-none">{g.flag}</span>
                    <span>{g.word}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ───────────────────────── how it works ───────────────────────── */}
      <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-24 lg:py-32">
        <div className="orb -left-40 top-24 h-[380px] w-[380px] bg-violet/20" />
        <SectionHead
          eyebrow="How it works"
          title="Grown, not taught"
          sub="Three ideas from the Growing Participator Approach turn 'studying a language' into growing into a world."
        />

        <div className="mt-14 space-y-8">
          {/* (a) a person, not a textbook */}
          <Reveal>
            <div className="card card-hover relative overflow-hidden p-8 sm:p-12">
              <div className="orb -right-24 -top-24 h-72 w-72 bg-orange/15" />
              <div className="relative grid items-center gap-10 lg:grid-cols-[5fr_6fr]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-orange">01 — Your nurturer</span>
                  <h3 className="headline mt-3 text-3xl sm:text-4xl">A person, not a textbook</h3>
                  <p className="mt-4 leading-relaxed text-muted">
                    Nurturers aren&rsquo;t teachers — and that&rsquo;s the point. They&rsquo;re bakers,
                    nurses, fishmongers: ordinary people who grew up inside the language. They
                    don&rsquo;t lecture you about it. They welcome you into it, with picture cards,
                    objects and play — the way a family welcomes a new member.
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    No lesson plans to invent, either — LANGE guides every minute of every session.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {DEMO_NURTURERS.map((n, i) => (
                    <Reveal key={n.name} delay={0.1 + i * 0.1}>
                      <div className="card flex h-full flex-col items-center gap-3 border-white/10 bg-raised-2/60 p-5 text-center">
                        <Avatar name={n.name} color={n.color} size={64} ring />
                        <div>
                          <p className="font-display text-sm font-bold">{n.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted">{n.who}</p>
                          <p className="text-xs text-muted">{n.from}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* (b) pictures, not translations — interactive */}
          <Reveal>
            <div className="card card-hover relative overflow-hidden p-8 sm:p-12">
              <div className="orb -left-24 -bottom-24 h-72 w-72 bg-lime/10" />
              <div className="relative">
                <div className="mx-auto max-w-2xl text-center">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-lime">02 — Zero translation</span>
                  <h3 className="headline mt-3 text-3xl sm:text-4xl">Pictures, not translations</h3>
                  <p className="mt-4 leading-relaxed text-muted">
                    Meaning never passes through English. A picture, a voice, your finger pointing —
                    that&rsquo;s the whole bridge. Try it yourself: tap a card.
                  </p>
                </div>

                <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
                  {DEMO_CARDS.map((c) => {
                    const revealed = met[c.id] === true;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => meetCard(c.id, c.word)}
                        aria-label={revealed ? `Hear "${c.word}" again` : "Tap to meet a Spanish word"}
                        className={`card card-hover group flex cursor-pointer flex-col items-center gap-2 border-white/10 bg-raised-2/60 px-4 pb-4 pt-6 transition-all ${
                          revealed ? "border-lime/40" : ""
                        }`}
                        style={revealed ? { boxShadow: "0 0 40px -14px rgba(184,240,60,0.45)" } : undefined}
                      >
                        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
                          {c.emoji}
                        </span>
                        <span className="flex h-7 items-center">
                          {revealed ? (
                            <span className="popin font-display text-base font-bold text-lime">{c.word}</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                              <Volume2 size={13} /> tap
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p
                  aria-hidden={!metAny}
                  className={`mt-7 text-center text-sm font-semibold transition-all duration-700 ${
                    metAny ? "translate-y-0 text-lime opacity-100" : "translate-y-2 opacity-0"
                  }`}
                >
                  🌱 You just met Spanish words. No English involved.
                </p>
              </div>
            </div>
          </Reveal>

          {/* (c) listen first, speak when ready */}
          <Reveal>
            <div className="card card-hover relative overflow-hidden p-8 sm:p-12">
              <div className="orb -right-28 bottom-0 h-72 w-72 bg-violet/20" />
              <div className="relative grid items-center gap-10 lg:grid-cols-[6fr_5fr]">
                <div className="order-2 lg:order-1">
                  <Iceberg />
                  <p className="mt-2 text-center font-display text-sm font-bold text-violet-soft">
                    &ldquo;It&rsquo;s in your iceberg.&rdquo;
                  </p>
                </div>
                <div className="order-1 lg:order-2">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-violet-soft">03 — Comprehension first</span>
                  <h3 className="headline mt-3 text-3xl sm:text-4xl">Listen first, speak when ready</h3>
                  <p className="mt-4 leading-relaxed text-muted">
                    In your first hundred hours you don&rsquo;t speak at all — you point, act and
                    laugh while ~1,000 words sink in by ear. Speech isn&rsquo;t forced; it{" "}
                    <span className="font-semibold text-ink">emerges</span>, like a child&rsquo;s
                    first words, on top of everything you already understand.
                  </p>
                  <p className="mt-3 leading-relaxed text-muted">
                    And when a word won&rsquo;t come back? It isn&rsquo;t gone. It&rsquo;s below the
                    waterline — in your iceberg — waiting for the next encounter to lift it into
                    view. Forgetting isn&rsquo;t failure here. It&rsquo;s the method working.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── six phases ───────────────────────── */}
      <section id="phases" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-24 lg:py-32">
        <div className="orb -right-40 top-10 h-[420px] w-[420px] bg-orange/15" />
        <SectionHead
          eyebrow="The six phases"
          title="From first words to belonging"
          sub="GPA's phases aren't test levels — they're how host people experience you: from 'a special connection' to 'one of us'."
        />

        {/* the journey bar — phases connected in proportion */}
        <Reveal className="mt-14">
          <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full">
            {PHASES.map((p) => (
              <div
                key={p.id}
                title={`Phase ${p.id} — ${p.name}`}
                className="h-full rounded-full transition-transform hover:scale-y-150"
                style={{ background: p.color, width: `${(p.hours / (TOTAL_HOURS + 500)) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted">
            <span>hour 0</span>
            <span>hour {TOTAL_HOURS.toLocaleString("en-US")} →</span>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PHASES.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.07}>
              <div className="card card-hover relative h-full overflow-hidden p-7">
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${p.color}, transparent)` }}
                />
                <div className="flex items-start justify-between gap-3">
                  <span className="text-4xl">{p.emoji}</span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: `${p.color}22`, color: p.color }}
                  >
                    {p.hours}h
                  </span>
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted">
                  Phase {p.id}
                </p>
                <h3 className="headline mt-1.5 text-2xl">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.tagline}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="mt-10">
          <p className="mx-auto max-w-2xl text-center text-base leading-relaxed text-muted">
            <span className="font-display font-bold text-ink">
              ~1,500 hours from first words to belonging.
            </span>{" "}
            A journey, not a 7-day hack — and every hour is a relationship, not a drill.
          </p>
        </Reveal>
      </section>

      {/* ───────────────────────── meet the family ───────────────────────── */}
      <section id="family" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-24 lg:py-32">
        <div className="orb -left-40 top-24 h-[400px] w-[400px] bg-violet/15" />
        <SectionHead
          eyebrow="Meet the family"
          title="Nine languages. Nine little nurturers."
          sub="Every language's guide is that country's most beloved toy, sprouted to life — a piñata, a matryoshka, a daruma. Tap a hello and they'll greet you in their own words. No translation. Of course."
        />

        <div className="relative mt-14 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {MASCOTS.map((m, i) => {
            const lang = langByCode(m.lang);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.82, y: 26 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: i * 0.06 }}
                whileHover={{ y: -8 }}
                className="card card-hover flex h-full flex-col items-center p-6 text-center sm:p-7"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.image}
                  alt={`${m.name} — ${m.toy}`}
                  loading="lazy"
                  className="h-28 w-28 object-contain sm:h-36 sm:w-36"
                  style={{ filter: `drop-shadow(0 0 26px ${m.color}88)` }}
                />
                <p className="mt-5 font-display text-lg font-bold">{m.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{m.toy}</p>
                <p className="mt-2 text-xs font-semibold text-muted">
                  <span className="mr-1.5" aria-hidden>{lang.flag}</span>
                  {lang.name}
                </p>
                <button
                  type="button"
                  onClick={() => void speak(m.nativeHello, m.lang)}
                  aria-label={`Hear ${m.name} say hello in ${lang.name}`}
                  className="pill mt-4 cursor-pointer px-4 py-1.5 text-sm font-bold"
                  style={{
                    background: `${m.color}26`,
                    border: `1px solid ${m.accent}40`,
                    color: m.accent,
                  }}
                >
                  <Volume2 size={14} />
                  {m.nativeHello}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────── for nurturers ───────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[28px] p-8 sm:p-14"
            style={{ background: "linear-gradient(115deg, #ff8a1e, #ffd234)" }}
          >
            <div className="absolute -right-10 -top-12 rotate-12 text-[150px] opacity-15" aria-hidden>
              🤝
            </div>
            <div className="relative max-w-2xl text-canvas">
              <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-80">For nurturers</p>
              <h2 className="headline mt-3 text-3xl sm:text-5xl">
                You already speak the most needed language on earth — yours.
              </h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-relaxed opacity-90">
                No teaching degree. No grammar explanations. No lesson prep. If you can show a
                picture, name what&rsquo;s in it and play, you can nurture someone into your world —
                LANGE guides every session, card by card, minute by minute.
              </p>
              <Link
                href="/onboarding?role=nurturer"
                className="pill mt-8 inline-flex bg-canvas px-7 py-3.5 text-base font-bold text-ink"
              >
                🤝 Become a nurturer
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────────────────────── community ───────────────────────── */}
      <section id="community" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-24 lg:py-32">
        <div className="orb -left-36 bottom-10 h-[360px] w-[360px] bg-lime/10" />
        <SectionHead
          eyebrow="Community"
          title="Growers, growing"
          sub="Small moments from the village — the kind no flashcard app can give you."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((tm, i) => (
            <Reveal key={tm.name} delay={i * 0.1}>
              <div className="card card-hover flex h-full flex-col p-7">
                <p className="text-2xl" aria-hidden>&ldquo;</p>
                <p className="flex-1 text-[15px] leading-relaxed text-ink/90">{tm.quote}</p>
                <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <Avatar name={tm.name} color={tm.color} size={40} />
                  <div>
                    <p className="font-display text-sm font-bold">{tm.name}</p>
                    <p className="text-xs text-muted">{tm.meta}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────────────── final CTA ───────────────────────── */}
      <section className="relative overflow-hidden px-5 pb-10 pt-10">
        <div className="orb left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 bg-violet/25" />
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto w-fit">
            <Mascot mood="cheer" size={150} />
          </div>
          <h2 className="headline mt-8 text-4xl sm:text-6xl">
            The wall of noise is waiting
            <br />
            to become a <span className="italic text-lime">window</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted">
            Pick a language, meet a nurturer, point at your first picture card. You&rsquo;ll
            understand from minute one.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href="/onboarding"
              className="pill bg-lime px-9 py-4 text-lg font-bold text-canvas"
              style={{ boxShadow: "0 0 60px -8px rgba(184,240,60,0.55)" }}
            >
              🌱 Start growing
              <ArrowRight size={20} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ───────────────────────── footer ───────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row">
          <p>
            Built on the{" "}
            <a
              href="https://www.growingparticipation.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
            >
              Growing Participator Approach
            </a>{" "}
            by Greg &amp; Angela Thomson
          </p>
          <div className="flex items-center gap-5 text-xs font-semibold">
            <Link href="/courses" className="transition-colors hover:text-ink">Courses</Link>
            <Link href="/forum" className="transition-colors hover:text-ink">Forum</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
