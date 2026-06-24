"use client";

/**
 * /world — the Nuri planet. Every language sibling stands on its home
 * country; pick one and the globe eases over to it (fly-to), its marker
 * swells in the sibling's own color, and the side panel opens that
 * language's world: native hello, cultural-immersion notes, and the
 * nurturers who live there.
 *
 * The planet is a realistic textured 3D Earth (see src/components/NuriGlobe):
 * drag to spin it, scroll/pinch (or the +/− buttons) to fly closer. Zoom in
 * far enough and the capitals give way to PEOPLE — nurturers (orange) and
 * growers (violet) pinned at city level only, never an exact location. Tap a
 * dot or a panel row to meet someone.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { langByCode } from "@/lib/languages";
import { MASCOTS, mascotForLang, type MascotDef } from "@/lib/mascots";
import { nurturersForLang } from "@/lib/nurturers";
import { localizedNurturer, tagKey } from "@/lib/nurturerI18n";
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
import { NuriGlobe } from "@/components/NuriGlobe";
import type { NuriGlobeHandle, GlobeCapital, GlobePerson } from "@/components/NuriGlobe";
import { useRealPeople } from "@/lib/useRealPeople";
import { useRequests } from "@/lib/requests";
import { useCallActions } from "@/components/CallProvider";
import type { LangCode, Nurturer } from "@/lib/types";

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
  ht: { city: "Port-au-Prince", lat: 18.5944, lon: -72.3074 },
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
  ht: [
    "On January 1 every table holds soup joumou — the freedom soup first tasted the morning of 1804, now UNESCO heritage. Your nurturer ladles slowly and names what floats past: joumou, diri, bannann, epis.",
    "Life runs through the mache — machann under bright umbrellas, mangoes and sugarcane in pyramids, prices settled by cheerful argument. Point at anything and the whole market becomes your picture-card deck, tasting allowed.",
    "A story opens with Krik? — and waits for your Krak! Then come the kont, the riddles, and the proverb that carries the country: dèyè mòn gen mòn, behind mountains there are more mountains.",
  ],
};

const NURTURER_DOT = "#ff8a1e"; // orange
const GROWER_DOT = "#7c5cff"; // violet

/** Demo growers/nurturers are hidden — the map shows only real signed-up people. */
const SHOW_DEMO_PEOPLE: boolean = false;

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
  /** the signed-in user themselves (hide "request" on your own pin) */
  me?: boolean;
  /* ---- Tandem profile (Stage B) ---- */
  hoursLogged?: number;
  photoUrl?: string;
  idealPartner?: string;
  goals?: string;
  certificates?: string[];
};

const nurturerView = (raw: Nurturer, t: (key: string) => string): PersonView => {
  const n = localizedNurturer(raw, t);
  return {
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
  };
};

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
const peopleOnGlobe = (
  lang: LangCode,
  t: (key: string) => string,
): { lat: number; lng: number; view: PersonView }[] => [
  ...nurturersForLang(lang).flatMap((n) => {
    const c = NURTURER_COORDS[n.id];
    return c ? [{ lat: c.lat, lng: c.lng, view: nurturerView(n, t) }] : [];
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
  // demo people off — show only real signed-up growers/nurturers
  const nurturers = SHOW_DEMO_PEOPLE ? nurturersForLang(mascot.lang) : [];
  const growers = SHOW_DEMO_PEOPLE ? participantsForLang(mascot.lang) : [];
  const bullets = CULTURE[mascot.lang] ?? [];

  const globeRef = useRef<NuriGlobeHandle>(null);
  const realPeople = useRealPeople();
  const { send: sendRequest, outgoing: outgoingRequests } = useRequests();
  const { startCall: startVideoCall } = useCallActions();
  const [requested, setRequested] = useState<Set<string>>(new Set());

  /** every language's capital as a globe pin, recolored for the selected one */
  const capitals: GlobeCapital[] = MASCOTS.map((m) => {
    const s = spotOf(m.lang);
    return {
      id: m.id,
      lat: s.lat,
      lng: s.lon,
      color: m.color,
      emoji: langByCode(m.lang).flag,
      label: s.city,
      selected: m.lang === mascot.lang,
    };
  });

  /** Real signed-up people tied to this language: growing into it (grower) or
   *  speaking/nurturing it (nurturer). City-level pins, with `me` highlighted. */
  const realForLang = realPeople
    .filter(
      (p) =>
        p.targetLang === mascot.lang ||
        p.knownLangs.includes(mascot.lang) ||
        p.nurtureLangs.includes(mascot.lang),
    )
    .map((p) => {
      const kind: "grower" | "nurturer" = p.targetLang === mascot.lang ? "grower" : "nurturer";
      const view: PersonView = {
        kind,
        id: p.id,
        name: p.name,
        color: kind === "nurturer" ? NURTURER_DOT : GROWER_DOT,
        city: p.city ?? "",
        country: p.country,
        online: true,
        bio: p.bio ?? "",
        tags: p.interests,
        growing: kind === "grower" ? p.targetLang : undefined,
        speaks: p.knownLangs,
        phase: p.phase,
        exchange: p.exchange,
        me: p.me,
        hoursLogged: p.hoursLogged,
        photoUrl: p.photoUrl,
        idealPartner: p.idealPartner,
        goals: p.goals,
        certificates: p.certificates,
      };
      return { view, lat: p.lat, lng: p.lng, me: p.me };
    });

  /** demo (off) + real, merged for the globe pins and click lookup */
  const demoPins = SHOW_DEMO_PEOPLE ? peopleOnGlobe(mascot.lang, t) : [];
  const realPins = realForLang.filter((r) => r.lat != null && r.lng != null);
  const peoplePins = [
    ...demoPins,
    ...realPins.map((r) => ({ lat: r.lat as number, lng: r.lng as number, view: r.view })),
  ];
  const people: GlobePerson[] = [
    ...demoPins.map(({ lat, lng, view }) => ({
      id: view.id,
      lat,
      lng,
      color: view.color,
      name: view.name,
      kind: view.kind,
    })),
    ...realPins.map((r) => ({
      id: r.view.id,
      lat: r.lat as number,
      lng: r.lng as number,
      color: r.view.color,
      name: r.view.name,
      kind: r.view.kind,
      me: r.me,
    })),
  ];
  const viewById = new Map(peoplePins.map(({ view }) => [view.id, view] as const));

  /** side-panel lists: demo + real, by their role for this language */
  const nurturerViews: PersonView[] = [
    ...nurturers.map((n) => nurturerView(n, t)),
    ...realForLang.filter((r) => r.view.kind === "nurturer").map((r) => r.view),
  ];
  const growerViews: PersonView[] = [
    ...growers.map((p) => participantView(p)),
    ...realForLang.filter((r) => r.view.kind === "grower").map((r) => r.view),
  ];
  const growerContext = (v: PersonView) =>
    v.growing === mascot.lang
      ? `${t("wldGrowing")} ${lang.flag}`
      : v.growing
        ? `${t("wldSpeaks")} ${lang.flag} · ${t("wldGrowing")} ${langByCode(v.growing).flag}`
        : `${t("wldSpeaks")} ${lang.flag}`;

  const pick = (m: MascotDef) => setSelId(m.id);

  // close the person card with Escape
  useEffect(() => {
    if (!person) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPerson(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [person]);

  if (!profile) return null;

  const langChips = (p: PersonView) => (
    <div className="flex flex-wrap gap-1.5">
      {p.growing && (
        <Tag className="px-2.5 py-1 text-[11px]">
          🌱 {t("wldGrowing")} {langByCode(p.growing).flag} {langByCode(p.growing).nativeName}
        </Tag>
      )}
      {p.speaks.map((code) => (
        <Tag key={code} className="px-2.5 py-1 text-[11px]">
          💬 {t("wldSpeaks")} {langByCode(code).flag} {langByCode(code).nativeName}
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
            🌍 {lang.flag} {lang.nativeName} · {spot.city}
          </p>
        </div>
        <Link href="/schedule" className="pill bg-orange px-6 py-3 font-semibold text-canvas">
          📅 {t("bookSession")}
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        {/* LEFT: the planet + sibling rail */}
        <motion.section
          className="min-w-0"
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

            <div className="relative mx-auto aspect-square w-full max-w-[560px]">
              <NuriGlobe
                ref={globeRef}
                capitals={capitals}
                people={people}
                focusLat={spot.lat}
                focusLng={spot.lon}
                onPeopleModeChange={setPeopleMode}
                onPersonClick={(id) => {
                  const v = viewById.get(id);
                  if (v) setPerson(v);
                }}
                onCapitalClick={(id) => setSelId(id)}
              />

              {/* zoom controls */}
              <div className="absolute right-1 top-1 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-label={t("wld2ZoomIn")}
                  onClick={() => globeRef.current?.zoomBy(0.6)}
                  className="card flex h-9 w-9 items-center justify-center rounded-full bg-raised/80 text-lg font-bold backdrop-blur-md transition hover:bg-white/10"
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label={t("wld2ZoomOut")}
                  onClick={() => globeRef.current?.zoomBy(1.6)}
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
                        👋 {t("wldPeopleOf")} {lang.nativeName}
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: NURTURER_DOT }} />
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: GROWER_DOT }} />
                      </>
                    ) : (
                      <>🔭 {t("wldSpinHint")}</>
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
                    title={`${m.name} — ${langByCode(m.lang).nativeName}`}
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
              🔒 {t("wldPrivacyPromise")}
            </p>
          </Card>
        </motion.section>

        {/* RIGHT: the selected language's world — culture far out, people up close */}
        <motion.section
          className="min-w-0"
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
                        {lang.flag} {t("wldPeopleOf")} {lang.nativeName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t("wldPeopleSub")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: NURTURER_DOT }} />
                      {t("wldNurturersLabel")}
                    </p>
                    {nurturerViews.length === 0 ? (
                      <Card className="p-4 text-sm text-muted">{lang.nativeName} {t("wldMoreNurturers")}</Card>
                    ) : (
                      nurturerViews.map((v, i) => personRow(v, i))
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: GROWER_DOT }} />
                      {t("wldGrowersLabel")}
                    </p>
                    {growerViews.length === 0 ? (
                      <Card className="p-4 text-sm text-muted">{t("wldNoGrowers")}</Card>
                    ) : (
                      growerViews.map((v, i) => personRow(v, i, growerContext(v)))
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
                            {t(`masc_${mascot.id}_toy`)} · {lang.flag} {lang.nativeName}
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
                        {bullets.map((_, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: mascot.accent }} />
                            <span>{t(`wldCul_${mascot.lang}_${i}`)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* nurturers who live there */}
                  <SectionTitle sub={`${lang.flag} ${lang.nativeName}`}>{t("availableNurturers")}</SectionTitle>

                  {nurturers.length === 0 ? (
                    <Card className="flex items-center gap-3 p-4">
                      <span className="text-2xl">🌍</span>
                      <p className="text-sm text-muted">
                        {lang.nativeName} {t("wldMoreNurturersWide")}
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
                              onClick={() => setPerson(nurturerView(n, t))}
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
                                    {t(tagKey(tag))}
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
                aria-label={t("wld2Close")}
                onClick={() => setPerson(null)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-ink"
              >
                ✕
              </button>

              <div className="relative flex items-center gap-4">
                <Avatar name={person.name} color={person.color} size={64} ring src={person.photoUrl} />
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
                    {person.kind === "nurturer" ? t("nurturerWord") : t("student")}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    📍 {person.city}
                    {person.country ? `, ${person.country}` : ""}
                  </p>
                  <p className="text-[10px] text-muted/80">{t("wldCityOnly")}</p>
                </div>
              </div>

              <div className="relative mt-4 space-y-3">
                {langChips(person)}

                <div className="flex flex-wrap items-center gap-1.5">
                  {person.phase !== undefined && (
                    <span className="rounded-full bg-violet/15 px-2.5 py-1 text-[11px] font-semibold text-violet">
                      🌱 {t("phaseWord")} {person.phase}
                      {person.hoursLogged ? ` · ${Math.round(person.hoursLogged)} ${t("hours")}` : ""}
                    </span>
                  )}
                  {person.kind === "grower" && (person.exchange || profile?.exchange) && (
                    <span className="rounded-full bg-lime/15 px-2.5 py-1 text-[11px] font-semibold text-lime">
                      ⇄ {t("wldOpenToExchange")}
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

                {(person.goals || person.idealPartner || (person.certificates?.length ?? 0) > 0) && (
                  <div className="space-y-2.5 border-t border-line pt-3">
                    {person.goals && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">🎯 {t("prfbGoals")}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-ink">{person.goals}</p>
                      </div>
                    )}
                    {person.idealPartner && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">🤝 {t("prfbIdealPartner")}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-ink">{person.idealPartner}</p>
                      </div>
                    )}
                    {person.certificates && person.certificates.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">🏅 {t("prfbCertificates")}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {person.certificates.map((c) => (
                            <Tag key={c} className="px-2 py-0.5 text-[10px]">
                              {c}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {person.me ? (
                  <p className="pill mt-1 flex justify-center bg-white/5 px-5 py-2.5 text-sm font-semibold text-muted">
                    ⭐ {t("reqThisIsYou")}
                  </p>
                ) : requested.has(person.id) ||
                  outgoingRequests.some((o) => o.toName === person.name && o.status === "pending") ? (
                  <p className="pill mt-1 flex justify-center bg-lime/15 px-5 py-2.5 text-sm font-semibold text-lime">
                    ✓ {t("reqRequested")}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const id = person.id;
                      setRequested((s) => new Set(s).add(id));
                      void sendRequest(id, mascot.lang).catch(() =>
                        setRequested((s) => {
                          const n = new Set(s);
                          n.delete(id);
                          return n;
                        }),
                      );
                    }}
                    className="pill mt-1 flex w-full justify-center bg-violet px-5 py-2.5 text-sm font-semibold text-white"
                    style={{ boxShadow: "var(--shadow-glow-violet)" }}
                  >
                    📨 {t("reqRequestSession")}
                  </button>
                )}

                {!person.me && (
                  <div className="mt-2 flex gap-2">
                    <Link
                      href={`/messages?with=${person.id}`}
                      className="pill flex flex-1 items-center justify-center gap-1.5 bg-raised-2 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/10"
                    >
                      💬 {t("msgMessage")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        const id = person.id;
                        const name = person.name;
                        setPerson(null);
                        startVideoCall(id, name);
                      }}
                      className="pill flex flex-1 items-center justify-center gap-1.5 bg-violet/15 px-5 py-2.5 text-sm font-semibold text-violet-soft hover:bg-violet/25"
                    >
                      📹 {t("callVideo")}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
