"use client";

/**
 * /world — the LANGE planet. Every language sibling stands on its home
 * country; pick one and the globe eases over to it (Bump/Zenly style),
 * its marker swells in the sibling's own color, and the side panel opens
 * that language's world: native hello, cultural-immersion notes, and the
 * nurturers who live there.
 *
 * The planet is hands-on: drag to spin it, scroll/pinch (or the +/−
 * buttons) to fly closer. Zoom in far enough and the capitals give way
 * to PEOPLE — nurturers (orange) and growers (violet) pinned at city
 * level only, never an exact location. Tap a dot or a panel row to meet
 * someone.
 *
 * cobe v2 has no internal animation loop — we drive phi/theta/scale each
 * frame with requestAnimationFrame and lerp toward the targets. Marker
 * hit-testing mirrors cobe's marker vertex shader: markers sit at radius
 * 0.8 + markerElevation(0.05) and project orthographically after the
 * phi/theta rotation, so screen = center + l.xy * 0.85 * scale * w/2.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import createGlobe from "cobe";
import type { Marker } from "cobe";
import { useApp } from "@/lib/store";
import { langByCode } from "@/lib/languages";
import { MASCOTS, mascotForLang, type MascotDef } from "@/lib/mascots";
import { nurturersForLang } from "@/lib/nurturers";
import {
  NURTURER_COORDS,
  NURTURER_COUNTRIES,
  participantsForLang,
  type Participant,
} from "@/lib/participants";
import { speak } from "@/lib/tts";
import { Avatar } from "@/components/Avatar";
import { MascotImage } from "@/components/MascotImage";
import { Card, SectionTitle, Tag } from "@/components/ui";
import type { LangCode, Nurturer } from "@/lib/types";

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
const PERSON_MARKER = 0.06;

const ZOOM_MIN = 1;
const ZOOM_MAX = 2.4;
/** at this zoom the capitals give way to people */
const PEOPLE_ZOOM = 1.5;

const NURTURER_DOT = "#ff8a1e"; // orange
const GROWER_DOT = "#7c5cff"; // violet
const NURTURER_RGB = hexToRgb(NURTURER_DOT);
const GROWER_RGB = hexToRgb(GROWER_DOT);

/** One card-able human, whichever side of the session they sit on. */
type PersonView = {
  kind: "nurturer" | "grower";
  id: string;
  name: string;
  color: string;
  city: string;
  country?: string;
  online: boolean;
  bio: string;
  tags: string[];
  /** the language they are growing into (growers only) */
  growing?: LangCode;
  /** languages they already live in */
  speaks: LangCode[];
  phase?: number;
  /** role "both" — they nurture back, open to exchange */
  exchange: boolean;
};

const nurturerView = (n: Nurturer): PersonView => ({
  kind: "nurturer",
  id: n.id,
  name: n.name,
  color: n.color,
  city: n.city,
  country: NURTURER_COUNTRIES[n.id],
  online: n.online,
  bio: n.bio,
  tags: n.tags,
  speaks: n.langs,
  exchange: false,
});

const participantView = (p: Participant): PersonView => ({
  kind: "grower",
  id: p.id,
  name: p.name,
  color: p.color,
  city: p.city,
  country: p.country,
  online: p.online,
  bio: p.bio,
  tags: p.tags,
  growing: p.growingLang,
  speaks: p.knownLangs,
  phase: p.phase,
  exchange: p.role === "both",
});

/** Everyone pinned on the planet for a language — city coords + card data. */
const peopleOnGlobe = (lang: LangCode): { lat: number; lng: number; view: PersonView }[] => [
  ...nurturersForLang(lang).flatMap((n) => {
    const c = NURTURER_COORDS[n.id];
    return c ? [{ lat: c.lat, lng: c.lng, view: nurturerView(n) }] : [];
  }),
  ...participantsForLang(lang).map((p) => ({ lat: p.lat, lng: p.lng, view: participantView(p) })),
];

export default function WorldPage() {
  const { profile, t } = useApp();

  const [selId, setSelId] = useState<string>(() => mascotForLang(profile?.targetLang ?? "es").id);
  const [peopleMode, setPeopleMode] = useState(false);
  const [person, setPerson] = useState<PersonView | null>(null);

  const mascot = MASCOTS.find((m) => m.id === selId) ?? MASCOTS[0];
  const lang = langByCode(mascot.lang);
  const spot = spotOf(mascot.lang);
  const nurturers = nurturersForLang(mascot.lang);
  const growers = participantsForLang(mascot.lang);
  const bullets = CULTURE[mascot.lang] ?? [];

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** read by the render loop without re-running the effect */
  const selLangRef = useRef<LangCode>(mascot.lang);
  const focusRef = useRef<[number, number]>(anglesOf(spot.lat, spot.lon));
  const pickedAtRef = useRef(Date.now());
  const sizesRef = useRef<Record<string, number>>({});
  /** zoom target (wheel / pinch / buttons lerp toward it) */
  const zoomRef = useRef(1);
  const peopleModeRef = useRef(false);
  const draggingRef = useRef(false);
  /** what cobe actually rendered this frame — used for marker hit-tests */
  const renderRef = useRef({ phi: focusRef.current[0], theta: focusRef.current[1], scale: 1 });

  const pick = (m: MascotDef) => {
    setSelId(m.id);
    selLangRef.current = m.lang;
    const s = spotOf(m.lang);
    focusRef.current = anglesOf(s.lat, s.lon);
    pickedAtRef.current = Date.now();
  };

  /** Clamp + apply a zoom level; crossing PEOPLE_ZOOM swaps the marker world. */
  const applyZoom = useCallback((z: number) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
    zoomRef.current = next;
    const people = next >= PEOPLE_ZOOM;
    if (people !== peopleModeRef.current) {
      peopleModeRef.current = people;
      if (!people) {
        // forget people marker sizes so they pop back in next visit
        for (const key of Object.keys(sizesRef.current)) {
          if (key.startsWith("n-") || key.startsWith("p-")) delete sizesRef.current[key];
        }
      }
      setPeopleMode(people);
    }
  }, []);

  const zoomBy = (delta: number) => {
    applyZoom(zoomRef.current + delta);
    pickedAtRef.current = Date.now();
  };

  // close the person card with Escape
  useEffect(() => {
    if (!person) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPerson(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [person]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = Math.max(1, wrap.offsetWidth);
    let renderedWidth = width;

    /** size easing per marker key — selected mascots swell, people pop in */
    const easeSize = (key: string, target: number, start: number) => {
      const cur = sizesRef.current[key] ?? start;
      const next = cur + (target - cur) * 0.12;
      sizesRef.current[key] = next;
      return next;
    };

    /** markers every frame: capitals when far out, people when zoomed in */
    const buildMarkers = (): Marker[] => {
      if (peopleModeRef.current) {
        const lang = selLangRef.current;
        const out: Marker[] = [];
        for (const n of nurturersForLang(lang)) {
          const c = NURTURER_COORDS[n.id];
          if (!c) continue;
          out.push({ location: [c.lat, c.lng], size: easeSize(`n-${n.id}`, PERSON_MARKER, 0.004), color: NURTURER_RGB });
        }
        for (const p of participantsForLang(lang)) {
          out.push({ location: [p.lat, p.lng], size: easeSize(`p-${p.id}`, PERSON_MARKER, 0.004), color: GROWER_RGB });
        }
        return out;
      }
      return MASCOTS.map((m) => {
        const s = spotOf(m.lang);
        const sel = m.lang === selLangRef.current;
        const size = easeSize(m.id, sel ? MARKER_SELECTED : MARKER_REST, MARKER_REST);
        return sel
          ? { location: [s.lat, s.lon], size, color: hexToRgb(m.color) }
          : { location: [s.lat, s.lon], size };
      });
    };

    let [phi, theta] = focusRef.current;
    let scale = zoomRef.current;

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
      scale,
      markers: buildMarkers(),
    });

    // idle drift keeps the planet alive; reduced motion = much slower spin
    const autoSpeed = reduced ? 0.0005 : 0.0022;

    let raf = requestAnimationFrame(function frame() {
      // pause while dragging and for ~4s after any touch; drift slower when zoomed
      if (Date.now() - pickedAtRef.current > 4500) {
        focusRef.current[0] += autoSpeed / (scale * scale);
      }
      const [fPhi, fTheta] = focusRef.current;
      // shortest-path lerp around the sphere toward the target; snappier under the finger
      const k = draggingRef.current ? 0.22 : 0.07;
      const dPos = (((fPhi - phi) % TAU) + TAU) % TAU;
      const dNeg = (((phi - fPhi) % TAU) + TAU) % TAU;
      phi += dPos <= dNeg ? dPos * k : -(dNeg * k);
      theta += (fTheta - theta) * k;
      scale += (zoomRef.current - scale) * 0.1;
      renderRef.current = { phi, theta, scale };
      if (width !== renderedWidth) {
        renderedWidth = width;
        globe.update({ phi, theta, scale, width, height: width, markers: buildMarkers() });
      } else {
        globe.update({ phi, theta, scale, markers: buildMarkers() });
      }
      raf = requestAnimationFrame(frame);
    });

    /* ---- hands on the planet: drag to spin, pinch/wheel to zoom ---- */

    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinchDist = 0;

    /**
     * Mirror of cobe's marker vertex shader: rotate the city's unit vector
     * by phi (Y) then theta (X); markers sit at radius 0.8+0.05 and project
     * orthographically. Returns the nearest front-facing person to (px,py).
     */
    const personAt = (px: number, py: number, w: number): PersonView | null => {
      const { phi: rPhi, theta: rTheta, scale: rScale } = renderRef.current;
      const R = 0.85 * rScale;
      const cp = Math.cos(rPhi);
      const sp = Math.sin(rPhi);
      const ct = Math.cos(rTheta);
      const st = Math.sin(rTheta);
      let best: { view: PersonView; d: number } | null = null;
      for (const { lat, lng, view } of peopleOnGlobe(selLangRef.current)) {
        const lam = (lng * Math.PI) / 180 - Math.PI;
        const la = (lat * Math.PI) / 180;
        const ux = -Math.cos(la) * Math.cos(lam);
        const uy = Math.sin(la);
        const uz = Math.cos(la) * Math.sin(lam);
        const lx = cp * ux + sp * uz;
        const ly = sp * st * ux + ct * uy - cp * st * uz;
        const lz = -sp * ct * ux + st * uy + cp * ct * uz;
        if (lz <= 0.05) continue; // back of the planet
        const sx = ((1 + lx * R) * w) / 2;
        const sy = ((1 - ly * R) * w) / 2;
        const d = Math.hypot(sx - px, sy - py);
        if (d < 26 && (!best || d < best.d)) best = { view, d };
      }
      return best?.view ?? null;
    };

    const onPointerDown = (e: PointerEvent) => {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic or already-released pointers can't be captured — fine */
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        moved = 0;
        draggingRef.current = true;
        canvas.style.cursor = "grabbing";
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
      pickedAtRef.current = Date.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size >= 2) {
        // pinch: zoom by the change in finger distance
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) applyZoom(zoomRef.current * (d / pinchDist));
        pinchDist = d;
        pickedAtRef.current = Date.now();
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      focusRef.current[0] += dx * 0.005;
      focusRef.current[1] = Math.max(-1.25, Math.min(1.25, focusRef.current[1] + dy * 0.005));
      pickedAtRef.current = Date.now();
    };

    const endPointer = (e: PointerEvent, allowClick: boolean) => {
      const had = pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) {
        draggingRef.current = false;
        canvas.style.cursor = "grab";
        pickedAtRef.current = Date.now(); // keep auto-spin paused ~4s after
        if (allowClick && had && moved < 6 && peopleModeRef.current) {
          const rect = canvas.getBoundingClientRect();
          const hit = personAt(e.clientX - rect.left, e.clientY - rect.top, rect.width);
          if (hit) setPerson(hit);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => endPointer(e, true);
    const onPointerCancel = (e: PointerEvent) => endPointer(e, false);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(zoomRef.current * Math.exp(-e.deltaY * 0.0016));
      pickedAtRef.current = Date.now();
    };

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      width = Math.max(1, wrap.offsetWidth);
    });
    ro.observe(wrap);
    canvas.style.opacity = "1";

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("wheel", onWheel);
      ro.disconnect();
      globe.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) return null;

  const langChips = (p: PersonView) => (
    <div className="flex flex-wrap gap-1.5">
      {p.growing && (
        <Tag className="px-2.5 py-1 text-[11px]">
          🌱 growing {langByCode(p.growing).flag} {langByCode(p.growing).name}
        </Tag>
      )}
      {p.speaks.map((code) => (
        <Tag key={code} className="px-2.5 py-1 text-[11px]">
          💬 speaks {langByCode(code).flag} {langByCode(code).name}
        </Tag>
      ))}
    </div>
  );

  const personRow = (view: PersonView, i: number, context?: string) => (
    <motion.div
      key={`${view.kind}-${view.id}`}
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * i, duration: 0.4, ease: "easeOut" }}
    >
      <button type="button" onClick={() => setPerson(view)} className="w-full text-left">
        <Card hover className="flex items-center gap-3 p-3.5">
          <Avatar name={view.name} color={view.color} size={44} ring />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-display text-sm font-bold">{view.name}</p>
              {view.online && (
                <span className="pulsedot h-2 w-2 shrink-0 rounded-full bg-mint" title={t("online")} aria-label={t("online")} />
              )}
              {view.exchange && (
                <span className="shrink-0 rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-semibold text-lime">⇄</span>
              )}
            </div>
            <p className="truncate text-xs text-muted">
              📍 {view.city}
              {view.country ? `, ${view.country}` : ""}
              {context ? ` · ${context}` : ""}
            </p>
          </div>
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: view.kind === "nurturer" ? NURTURER_DOT : GROWER_DOT }}
            aria-hidden
          />
        </Card>
      </button>
    </motion.div>
  );

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

              {/* zoom controls */}
              <div className="absolute right-1 top-1 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => zoomBy(0.35)}
                  className="card flex h-9 w-9 items-center justify-center rounded-full bg-raised/80 text-lg font-bold backdrop-blur-md transition hover:bg-white/10"
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => zoomBy(-0.35)}
                  className="card flex h-9 w-9 items-center justify-center rounded-full bg-raised/80 text-lg font-bold backdrop-blur-md transition hover:bg-white/10"
                >
                  −
                </button>
              </div>

              {/* mode hint — discover the people by flying closer */}
              <div className="pointer-events-none absolute left-1 top-1 z-10">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={peopleMode ? "people" : "capitals"}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="card inline-flex items-center gap-1.5 rounded-full bg-raised/80 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-md"
                  >
                    {peopleMode ? (
                      <>
                        👋 the people of {lang.name}
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: NURTURER_DOT }} />
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: GROWER_DOT }} />
                      </>
                    ) : (
                      <>🔭 drag to spin · zoom in to meet people</>
                    )}
                  </motion.span>
                </AnimatePresence>
              </div>

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

            {/* persistent privacy promise */}
            <p className="relative mt-3 text-center text-[11px] text-muted">
              🔒 Everyone appears at city level only — never an exact location.
            </p>
          </Card>
        </motion.section>

        {/* RIGHT: the selected language's world — culture far out, people up close */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.55, ease: "easeOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mascot.id}-${peopleMode ? "people" : "culture"}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="space-y-6"
            >
              {peopleMode ? (
                <>
                  {/* PEOPLE VIEW — who actually lives in this language */}
                  <div className="card flex items-center gap-4 p-4">
                    <MascotImage mascot={mascot} size={64} float />
                    <div className="min-w-0">
                      <p className="font-display text-lg font-bold">
                        {lang.flag} People of {lang.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Tap a dot on the planet or a row below to say hello. City level only — never an exact location.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: NURTURER_DOT }} />
                      Nurturers — they live the language
                    </p>
                    {nurturers.length === 0 ? (
                      <Card className="p-4 text-sm text-muted">More {lang.name} nurturers are joining soon.</Card>
                    ) : (
                      nurturers.map((n, i) => personRow(nurturerView(n), i))
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: GROWER_DOT }} />
                      Growers — growing into it, near and far
                    </p>
                    {growers.length === 0 ? (
                      <Card className="p-4 text-sm text-muted">No growers here yet — you could be the first.</Card>
                    ) : (
                      growers.map((p, i) =>
                        personRow(
                          participantView(p),
                          i,
                          p.growingLang === mascot.lang
                            ? `growing ${lang.flag}`
                            : `speaks ${lang.flag} · growing ${langByCode(p.growingLang).flag}`,
                        ),
                      )
                    )}
                  </div>
                </>
              ) : (
                <>
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
                            <button
                              type="button"
                              onClick={() => setPerson(nurturerView(n))}
                              className="min-w-0 flex-1 text-left"
                            >
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
                            </button>
                            <Link href="/schedule" className="pill shrink-0 bg-violet px-4 py-2 text-xs font-semibold text-white sm:text-sm">
                              {t("bookSession")}
                            </Link>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.section>
      </div>

      {/* person profile card */}
      <AnimatePresence>
        {person && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setPerson(null)}
            role="dialog"
            aria-modal="true"
            aria-label={person.name}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="card relative w-full max-w-sm overflow-hidden p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="orb right-[-60px] top-[-60px] h-[160px] w-[160px]"
                style={{ background: `color-mix(in srgb, ${person.color} 16%, transparent)` }}
              />
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPerson(null)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-ink"
              >
                ✕
              </button>

              <div className="relative flex items-center gap-4">
                <Avatar name={person.name} color={person.color} size={64} ring />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-xl font-bold">{person.name}</p>
                    {person.online && (
                      <span className="pulsedot h-2 w-2 shrink-0 rounded-full bg-mint" title={t("online")} aria-label={t("online")} />
                    )}
                  </div>
                  <p
                    className="mt-0.5 text-xs font-semibold"
                    style={{ color: person.kind === "nurturer" ? NURTURER_DOT : GROWER_DOT }}
                  >
                    {person.kind === "nurturer" ? "Nurturer" : "Grower"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    📍 {person.city}
                    {person.country ? `, ${person.country}` : ""}
                  </p>
                  <p className="text-[10px] text-muted/80">city shown, never exact location</p>
                </div>
              </div>

              <div className="relative mt-4 space-y-3">
                {langChips(person)}

                <div className="flex flex-wrap items-center gap-1.5">
                  {person.phase !== undefined && (
                    <span className="rounded-full bg-violet/15 px-2.5 py-1 text-[11px] font-semibold text-violet">
                      🌱 Phase {person.phase}
                    </span>
                  )}
                  {person.kind === "grower" && (person.exchange || profile?.exchange) && (
                    <span className="rounded-full bg-lime/15 px-2.5 py-1 text-[11px] font-semibold text-lime">
                      ⇄ Open to language exchange
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-muted">{person.bio}</p>

                <div className="flex flex-wrap gap-1.5">
                  {person.tags.map((tag) => (
                    <Tag key={tag} className="px-2 py-0.5 text-[10px]">
                      {tag}
                    </Tag>
                  ))}
                </div>

                {person.kind === "nurturer" ? (
                  <Link
                    href="/schedule"
                    className="pill mt-1 flex justify-center bg-orange px-5 py-2.5 text-sm font-semibold text-canvas"
                  >
                    📅 {t("bookSession")}
                  </Link>
                ) : (
                  <Link
                    href="/forum"
                    className="pill mt-1 flex justify-center bg-violet px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    👋 Wave hello in the Village
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
