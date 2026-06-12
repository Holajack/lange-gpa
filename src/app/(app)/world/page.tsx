"use client";

/**
 * /world — the LANGE planet. Every language sibling stands on its home
 * country; pick one and the globe eases over to it (Bump/Zenly style),
 * its marker swells in the sibling's own color, and the side panel opens
 * that language's world: native hello, cultural-immersion notes, and the
 * nurturers who live there.
 *
 * cobe v2 has no internal animation loop — we drive phi/theta each frame
 * with requestAnimationFrame and lerp toward the selected country.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import createGlobe from "cobe";
import type { Marker } from "cobe";
import { useApp } from "@/lib/store";
import { langByCode } from "@/lib/languages";
import { MASCOTS, mascotForLang, type MascotDef } from "@/lib/mascots";
import { nurturersForLang } from "@/lib/nurturers";
import { speak } from "@/lib/tts";
import { Avatar } from "@/components/Avatar";
import { MascotImage } from "@/components/MascotImage";
import { Card, SectionTitle, Tag } from "@/components/ui";
import type { LangCode } from "@/lib/types";

const TAU = Math.PI * 2;

type Spot = { city: string; lat: number; lon: number };

/** Where each language sibling stands on the planet. */
const SPOTS: Partial<Record<LangCode, Spot>> = {
  en: { city: "London", lat: 51.5, lon: -0.12 },
  es: { city: "Madrid", lat: 40.4, lon: -3.7 },
  fr: { city: "Paris", lat: 48.85, lon: 2.35 },
  de: { city: "Berlin", lat: 52.52, lon: 13.4 },
  it: { city: "Rome", lat: 41.9, lon: 12.5 },
  pt: { city: "Lisbon", lat: 38.72, lon: -9.14 },
  ru: { city: "Moscow", lat: 55.75, lon: 37.62 },
  ja: { city: "Tokyo", lat: 35.68, lon: 139.69 },
  zh: { city: "Beijing", lat: 39.9, lon: 116.4 },
};

const spotOf = (lang: LangCode): Spot => SPOTS[lang] ?? { city: "London", lat: 51.5, lon: -0.12 };

/**
 * What a nurturer might show you — three glimpses of daily life per
 * language. Pure here-and-now culture, GPA style: no translation, just
 * food, streets and family tables carrying the meaning.
 */
const CULTURE: Partial<Record<LangCode, string[]>> = {
  en: [
    "Tea solves everything here — your nurturer puts the kettle on, names milk, mug and biscuit, and you understand before you ever speak.",
    "Rainy-day life is the picture book: wellies by the door, the red-bus queue, a corner shop where everything is somehow lovely.",
    "Sunday roast at a long table — potatoes passed around, gravy poured, family words landing one warm plate at a time.",
  ],
  es: [
    "Churros dipped in thick hot chocolate at a marble counter — your nurturer points, you taste, and the word stays forever.",
    "Nobody leaves the table after lunch: the sobremesa just keeps going, and you keep understanding a little more of it.",
    "An evening paseo through the plaza — neighbors greeting, kids chasing pigeons, every scene a living picture card.",
  ],
  fr: [
    "The morning boulangerie run: still-warm croissants and baguettes named one by one before the city is awake.",
    "Sunday market theatre — a fromager presenting forty cheeses with full ceremony, and no translation needed.",
    "Apéro at six: olives, small glasses, unhurried talk — your nurturer narrates it all while you simply soak.",
  ],
  de: [
    "Saturday-morning bakery quiet: Brötchen, Brezeln and the ritual nod — your nurturer names every roll behind the glass.",
    "Feierabend is sacred — the day officially ends on a park bench with an Apfelschorle and slow, easy talk.",
    "In December the Christmas market glows: nutcracker stalls like Sprossi's own family, and words wrapped in cinnamon.",
  ],
  it: [
    "Espresso standing at the bar — one euro, one minute, and ten new words from the barista's morning banter.",
    "A nonna's kitchen: hands in flour, gnocchi rolling — meaning taught by hands, never by translation.",
    "The evening passeggiata, gelato in hand — the whole neighborhood out walking, life narrated all around you.",
  ],
  pt: [
    "A pastel de nata still warm from the oven, cinnamon offered — sweet first words at the pastelaria counter.",
    "Tram 28 rattling up the hills while your nurturer points: the river, the rooftops, the laundry lines.",
    "Fado drifting from a tiny tavern at night — saudade is a word you will feel long before you can say it.",
  ],
  ru: [
    "Tea from the samovar with jam eaten straight from the spoon — a nurturer's kitchen table is your first classroom.",
    "A matryoshka opens doll by doll, each smaller sister getting her own name — just like Listik's family.",
    "Winter walks with snow squeaking underfoot and a warm pirozhok in your pocket — cold air, warm words.",
  ],
  ja: [
    "A konbini run: onigiri, warm tea in cans — your nurturer names each shelf as the door chimes hello.",
    "Hanami under the cherry trees: a blue picnic sheet, bento boxes, and one word — kirei — on every breath.",
    "Daruma dolls like Futaba: paint one eye when you set your goal, the other when your first words arrive.",
  ],
  zh: [
    "Breakfast at the street stall: a jianbing folded hot off the griddle — point, watch, taste, remember.",
    "A grandmother deals you into the mahjong table — tiles click, and numbers come alive right in your hands.",
    "Dumpling night: flour everywhere, every fold narrated — family words learned around one crowded table.",
  ],
};

const hexToRgb = (hex: string): [number, number, number] => {
  const v = parseInt(hex.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

/** cobe focus angles: rotate the sphere so [lat, lon] faces the camera. */
const anglesOf = (lat: number, lon: number): [number, number] => [
  Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2),
  (lat * Math.PI) / 180,
];

const MARKER_REST = 0.045;
const MARKER_SELECTED = 0.115;

export default function WorldPage() {
  const { profile, t } = useApp();

  const [selId, setSelId] = useState<string>(() => mascotForLang(profile?.targetLang ?? "es").id);
  const mascot = MASCOTS.find((m) => m.id === selId) ?? MASCOTS[0];
  const lang = langByCode(mascot.lang);
  const spot = spotOf(mascot.lang);
  const nurturers = nurturersForLang(mascot.lang);
  const bullets = CULTURE[mascot.lang] ?? [];

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** read by the render loop without re-running the effect */
  const selLangRef = useRef<LangCode>(mascot.lang);
  const focusRef = useRef<[number, number]>(anglesOf(spot.lat, spot.lon));
  const pickedAtRef = useRef(Date.now());
  const sizesRef = useRef<Record<string, number>>({});

  const pick = (m: MascotDef) => {
    setSelId(m.id);
    selLangRef.current = m.lang;
    const s = spotOf(m.lang);
    focusRef.current = anglesOf(s.lat, s.lon);
    pickedAtRef.current = Date.now();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = Math.max(1, wrap.offsetWidth);
    let renderedWidth = width;

    /** markers every frame: the selected one swells toward the sibling's color */
    const buildMarkers = (): Marker[] =>
      MASCOTS.map((m) => {
        const s = spotOf(m.lang);
        const sel = m.lang === selLangRef.current;
        const cur = sizesRef.current[m.id] ?? MARKER_REST;
        const next = cur + ((sel ? MARKER_SELECTED : MARKER_REST) - cur) * 0.12;
        sizesRef.current[m.id] = next;
        return sel
          ? { location: [s.lat, s.lon], size: next, color: hexToRgb(m.color) }
          : { location: [s.lat, s.lon], size: next };
      });

    let [phi, theta] = focusRef.current;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width,
      height: width,
      phi,
      theta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: 5.5,
      mapBaseBrightness: 0.04,
      baseColor: [0.38, 0.32, 0.66],
      markerColor: hexToRgb("#a78bfa"),
      glowColor: [0.24, 0.18, 0.5],
      opacity: 0.92,
      markers: buildMarkers(),
    });

    // idle drift keeps the planet alive; reduced motion = much slower spin
    const autoSpeed = reduced ? 0.0005 : 0.0022;

    let raf = requestAnimationFrame(function frame() {
      if (Date.now() - pickedAtRef.current > 4500) focusRef.current[0] += autoSpeed;
      const [fPhi, fTheta] = focusRef.current;
      // shortest-path lerp around the sphere toward the selected country
      const dPos = (((fPhi - phi) % TAU) + TAU) % TAU;
      const dNeg = (((phi - fPhi) % TAU) + TAU) % TAU;
      phi += dPos <= dNeg ? dPos * 0.07 : -(dNeg * 0.07);
      theta += (fTheta - theta) * 0.07;
      if (width !== renderedWidth) {
        renderedWidth = width;
        globe.update({ phi, theta, width, height: width, markers: buildMarkers() });
      } else {
        globe.update({ phi, theta, markers: buildMarkers() });
      }
      raf = requestAnimationFrame(frame);
    });

    const ro = new ResizeObserver(() => {
      width = Math.max(1, wrap.offsetWidth);
    });
    ro.observe(wrap);
    canvas.style.opacity = "1";

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      globe.destroy();
    };
  }, []);

  if (!profile) return null;

  return (
    <div className="space-y-8">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="headline text-4xl lg:text-5xl">{t("world")}</h1>
          <p className="mt-2 text-sm text-muted">
            🌍 {lang.flag} {lang.name} · {spot.city}
          </p>
        </div>
        <Link href="/schedule" className="pill bg-orange px-6 py-3 font-semibold text-canvas">
          📅 {t("bookSession")}
        </Link>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        {/* LEFT: the planet + sibling rail */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: "easeOut" }}
        >
          <Card className="relative overflow-hidden p-4 sm:p-6">
            <div className="orb left-[-100px] top-[-100px] h-[280px] w-[280px] bg-violet/20" />
            <div
              className="orb bottom-[-80px] right-[-80px] h-[220px] w-[220px]"
              style={{ background: `color-mix(in srgb, ${mascot.color} 14%, transparent)` }}
            />

            <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[560px]">
              <canvas ref={canvasRef} className="h-full w-full opacity-0 transition-opacity duration-1000" />
              {/* pinned city chip, Bump style */}
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                <span className="card flex items-center gap-2 rounded-full bg-raised/80 px-4 py-2 text-xs font-semibold backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full" style={{ background: mascot.color }} />
                  📍 {spot.city} · {lang.nativeName}
                </span>
              </div>
            </div>

            {/* sibling rail — tap a toy to fly there */}
            <div className="relative mt-4 flex gap-1.5 overflow-x-auto pb-1">
              {MASCOTS.map((m, i) => {
                const sel = m.id === mascot.id;
                return (
                  <motion.button
                    key={m.id}
                    type="button"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4, ease: "easeOut" }}
                    onClick={() => pick(m)}
                    title={`${m.name} — ${langByCode(m.lang).name}`}
                    className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2.5 py-2 transition ${sel ? "" : "hover:bg-white/5"}`}
                    style={
                      sel
                        ? {
                            background: `color-mix(in srgb, ${m.color} 12%, transparent)`,
                            boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${m.color} 70%, transparent)`,
                          }
                        : undefined
                    }
                  >
                    <MascotImage mascot={m} size={46} glow={sel} />
                    <span className={`text-[11px] font-semibold ${sel ? "text-ink" : "text-muted"}`}>
                      {langByCode(m.lang).flag} {m.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.section>

        {/* RIGHT: the selected language's world */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.55, ease: "easeOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mascot.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* sibling hero */}
              <div
                className="rounded-[30px] p-[2px]"
                style={{
                  background: `linear-gradient(135deg, ${mascot.color}, ${mascot.accent})`,
                  boxShadow: `0 0 44px -14px color-mix(in srgb, ${mascot.color} 55%, transparent)`,
                }}
              >
                <div className="card relative overflow-hidden p-5" style={{ borderColor: "transparent" }}>
                  <div
                    className="orb right-[-70px] top-[-70px] h-[180px] w-[180px]"
                    style={{ background: `color-mix(in srgb, ${mascot.accent} 15%, transparent)` }}
                  />
                  <div className="relative flex items-center gap-4">
                    <MascotImage mascot={mascot} size={110} float glow />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-2xl font-bold">{mascot.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {mascot.toy} · {lang.flag} {lang.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          void speak(mascot.nativeHello, mascot.lang);
                        }}
                        className="pill mt-3 px-4 py-2 text-sm font-bold text-canvas"
                        style={{
                          background: mascot.accent,
                          boxShadow: `0 0 30px -10px color-mix(in srgb, ${mascot.accent} 70%, transparent)`,
                        }}
                      >
                        🔊 {mascot.nativeHello}
                      </button>
                    </div>
                  </div>

                  {/* what a nurturer might show you */}
                  <ul className="relative mt-5 space-y-2.5">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: mascot.accent }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* nurturers who live there */}
              <SectionTitle sub={`${lang.flag} ${lang.name}`}>{t("availableNurturers")}</SectionTitle>

              {nurturers.length === 0 ? (
                <Card className="flex items-center gap-3 p-4">
                  <span className="text-2xl">🌍</span>
                  <p className="text-sm text-muted">
                    More {lang.name} nurturers are joining soon — meet the wider village meanwhile.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {nurturers.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 * i, duration: 0.4, ease: "easeOut" }}
                    >
                      <Card hover className="flex items-center gap-3 p-4">
                        <Avatar name={n.name} color={n.color} size={48} ring />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-display text-sm font-bold">{n.name}</p>
                            {n.online && (
                              <span
                                className="pulsedot h-2 w-2 shrink-0 rounded-full bg-mint"
                                title={t("online")}
                                aria-label={t("online")}
                              />
                            )}
                          </div>
                          <p className="truncate text-xs text-muted">📍 {n.city}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {n.tags.slice(0, 3).map((tag) => (
                              <Tag key={tag} className="px-2 py-0.5 text-[10px]">
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </div>
                        <Link href="/schedule" className="pill shrink-0 bg-violet px-4 py-2 text-xs font-semibold text-white sm:text-sm">
                          {t("bookSession")}
                        </Link>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  );
}
