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

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useConvex } from "convex/react";
import { useApp } from "@/lib/store";
import { CONVEX_ON } from "@/lib/convexClient";
import { COMMUNITY_EXCHANGE_ON } from "@/lib/featureFlags";
import { langByCode } from "@/lib/languages";
import { MASCOTS, mascotForLang, type MascotDef } from "@/lib/mascots";
import { speak } from "@/lib/tts";
import { Avatar } from "@/components/Avatar";
import { MascotImage } from "@/components/MascotImage";
import { Card, SectionTitle, Tag } from "@/components/ui";
import { NuriGlobe } from "@/components/NuriGlobe";
import type { NuriGlobeHandle, GlobeCapital, GlobePerson } from "@/components/NuriGlobe";
import { useRealPeople } from "@/lib/useRealPeople";
import { useRequests } from "@/lib/requests";
import { useCallActions } from "@/components/CallProvider";
import type { LangCode } from "@/lib/types";

type Spot = { city: string; lat: number; lon: number };

type ReportCategory =
  | "harassment"
  | "hate"
  | "sexual_content"
  | "spam"
  | "impersonation"
  | "dangerous_behavior"
  | "privacy"
  | "underage_safety"
  | "other";

const REPORT_CATEGORIES: ReportCategory[] = [
  "harassment",
  "hate",
  "sexual_content",
  "spam",
  "impersonation",
  "dangerous_behavior",
  "privacy",
  "underage_safety",
  "other",
];

type SafetyActions = {
  block: (profileId: string) => Promise<void>;
  report: (profileId: string, category: ReportCategory, details?: string) => Promise<void>;
};

function useSafetyActionsLive(): SafetyActions {
  const convex = useConvex();
  const block = useCallback(
    async (profileId: string) => {
      await convex.mutation("safety:blockPerson" as never, { profileId } as never);
    },
    [convex]
  );
  const report = useCallback(
    async (profileId: string, category: ReportCategory, details?: string) => {
      await convex.mutation(
        "safety:reportPerson" as never,
        { profileId, category, details: details || undefined } as never
      );
    },
    [convex]
  );
  return { block, report };
}

const SAFETY_STUB: SafetyActions = {
  block: async () => {},
  report: async () => {},
};

const useSafetyActions: () => SafetyActions = CONVEX_ON
  ? useSafetyActionsLive
  : () => SAFETY_STUB;

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

/* ------------------------------------------------------------------ */
/* First-visit place ask — the in-context home of the city/country and
   exchange questions deferred out of onboarding (SPEC-onboarding §1).
   Asked HERE because "kindred voices on the map" is self-evident on this
   page; entirely optional and never asked again once answered or skipped. */
/* ------------------------------------------------------------------ */

const PLACE_ASK_DONE_KEY = "lange.worldPlaceAsk.v1";

/** Best-effort browser prefills: city from the IANA timezone's city segment,
 *  country from the locale region (both freely editable). */
function browserPlaceGuess(uiLang: LangCode): { city: string; country: string } {
  let city = "";
  let country = "";
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const seg = zone.split("/").pop() ?? "";
    if (seg && !/^(UTC|GMT)/i.test(seg)) city = seg.replace(/_/g, " ");
  } catch {}
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    if (region) {
      country = new Intl.DisplayNames([uiLang], { type: "region" }).of(region) ?? "";
    }
  } catch {}
  return { city, country };
}

function PlaceAskCard() {
  const { profile, t, uiLang, updateProfile } = useApp();
  const [done, setDone] = useState(true); // assume answered until the browser says otherwise
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [exchange, setExchange] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(PLACE_ASK_DONE_KEY) === "1";
    } catch {}
    if (dismissed) return;
    const guess = browserPlaceGuess(uiLang);
    setCity((cur) => cur || guess.city);
    setCountry((cur) => cur || guess.country);
    setDone(false);
    // prefill once on mount — uiLang only localizes the country guess
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done || !profile || profile.city || profile.country) return null;

  const markDone = () => {
    try {
      localStorage.setItem(PLACE_ASK_DONE_KEY, "1");
    } catch {}
    setDone(true);
  };

  const save = () => {
    updateProfile({
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      ...(COMMUNITY_EXCHANGE_ON ? { exchange } : {}),
    });
    markDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="orb -right-14 -top-16 h-44 w-44 bg-violet/15" />
        <div className="relative">
          <h2 className="headline text-xl sm:text-2xl">📍 {t("dshOnbPlaceHeadGrow")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("dshOnbPlaceSubGrow")}</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              {t("dshOnbCityLabel")}
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("dshOnbCityPlaceholder")}
                maxLength={40}
                className="mt-1.5 w-full rounded-xl border border-line bg-raised-2 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none placeholder:text-muted/50 focus:border-violet"
              />
            </label>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              {t("dshOnbCountryLabel")}
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={t("dshOnbCountryPlaceholder")}
                maxLength={40}
                className="mt-1.5 w-full rounded-xl border border-line bg-raised-2 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none placeholder:text-muted/50 focus:border-violet"
              />
            </label>
          </div>
          <p className="mt-2 text-[11px] text-muted">🔒 {t("dshOnbCityLevelNote")}</p>

          {COMMUNITY_EXCHANGE_ON && (
            <button
              type="button"
              role="switch"
              aria-checked={exchange}
              onClick={() => setExchange((v) => !v)}
              className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl bg-raised-2 p-3.5 text-left"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">⇄ {t("wldOpenToExchange")}</span>
                <span className="mt-0.5 block text-xs text-muted">{t("dshOnbExchangeSub")}</span>
              </span>
              <span
                className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-300 ${
                  exchange ? "bg-lime" : "bg-white/12"
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-canvas transition-transform duration-300 ${
                    exchange ? "translate-x-[20px]" : ""
                  }`}
                />
              </span>
            </button>
          )}

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={save}
              className="pill justify-center bg-violet px-6 py-3 text-sm font-bold text-white"
              style={{ boxShadow: "var(--shadow-glow-violet)" }}
            >
              ✓ {t("done")}
            </button>
            <button
              type="button"
              onClick={markDone}
              className="pill justify-center bg-white/6 px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
            >
              {t("dshOnbSkipForNow")}
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

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


export default function WorldPage() {
  const { profile, t } = useApp();

  const [selId, setSelId] = useState<string>(() => mascotForLang(profile?.targetLang ?? "es").id);
  const [peopleMode, setPeopleMode] = useState(false);
  const [person, setPerson] = useState<PersonView | null>(null);

  const mascot = MASCOTS.find((m) => m.id === selId) ?? MASCOTS[0];
  const lang = langByCode(mascot.lang);
  const spot = spotOf(mascot.lang);
  const bullets = CULTURE[mascot.lang] ?? [];

  const globeRef = useRef<NuriGlobeHandle>(null);
  const realPeople = useRealPeople();
  const { send: sendRequest, outgoing: outgoingRequests } = useRequests();
  const { startCall: startVideoCall } = useCallActions();
  const { block: blockPerson, report: reportPerson } = useSafetyActions();
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [locallyBlocked, setLocallyBlocked] = useState<Set<string>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<ReportCategory>("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [safetyBusy, setSafetyBusy] = useState<"block" | "report" | null>(null);
  const [safetyFeedback, setSafetyFeedback] = useState<string | null>(null);

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
    .filter((p) => !locallyBlocked.has(p.id))
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
        // Presence is not implemented yet. Never imply that a real person is
        // online merely because their profile appears in the directory.
        online: false,
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

  /** real signed-up people, placed by city; click lookup by id */
  const realPins = realForLang.filter((r) => r.lat != null && r.lng != null);
  const peoplePins = realPins.map((r) => ({ lat: r.lat as number, lng: r.lng as number, view: r.view }));
  const people: GlobePerson[] = realPins.map((r) => ({
    id: r.view.id,
    lat: r.lat as number,
    lng: r.lng as number,
    color: r.view.color,
    name: r.view.name,
    kind: r.view.kind,
    me: r.me,
  }));
  const viewById = new Map(peoplePins.map(({ view }) => [view.id, view] as const));

  /** side-panel lists: real people by their role for this language */
  const nurturerViews: PersonView[] = realForLang
    .filter((r) => r.view.kind === "nurturer")
    .map((r) => r.view);
  const growerViews: PersonView[] = realForLang
    .filter((r) => r.view.kind === "grower")
    .map((r) => r.view);
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

  useEffect(() => {
    setReportOpen(false);
    setReportCategory("harassment");
    setReportDetails("");
    setSafetyBusy(null);
    setSafetyFeedback(null);
  }, [person?.id]);

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

      {/* first-visit in-context ask: city/country for the map + exchange */}
      <PlaceAskCard />

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

                  <Card className="flex items-center gap-3 p-4">
                    <span className="text-2xl">🌍</span>
                    <p className="text-sm text-muted">
                      {lang.nativeName} {t("wldMoreNurturersWide")}
                    </p>
                  </Card>
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
                  <>
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

                    <div className="mt-3 border-t border-line pt-3">
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <button
                          type="button"
                          disabled={safetyBusy !== null}
                          onClick={() => {
                            setSafetyFeedback(null);
                            setReportOpen((open) => !open);
                          }}
                          aria-expanded={reportOpen}
                          className="font-semibold text-muted transition hover:text-ink disabled:opacity-50"
                        >
                          🚩 {t("safReport")}
                        </button>
                        <span className="text-line" aria-hidden>•</span>
                        <button
                          type="button"
                          disabled={safetyBusy !== null}
                          onClick={() => {
                            if (!window.confirm(`${t("safBlockConfirm")} ${person.name}?`)) return;
                            const id = person.id;
                            setSafetyBusy("block");
                            setSafetyFeedback(null);
                            void blockPerson(id)
                              .then(() => {
                                setLocallyBlocked((blocked) => new Set(blocked).add(id));
                                setPerson(null);
                              })
                              .catch(() => setSafetyFeedback(t("safTryAgain")))
                              .finally(() => setSafetyBusy(null));
                          }}
                          className="font-semibold text-orange transition hover:text-orange-soft disabled:opacity-50"
                        >
                          {safetyBusy === "block" ? "…" : "⛔"} {t("safBlock")}
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {reportOpen && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                            onSubmit={(event) => {
                              event.preventDefault();
                              setSafetyBusy("report");
                              setSafetyFeedback(null);
                              void reportPerson(person.id, reportCategory, reportDetails)
                                .then(() => {
                                  setReportOpen(false);
                                  setReportDetails("");
                                  setSafetyFeedback(t("safReportSent"));
                                })
                                .catch(() => setSafetyFeedback(t("safTryAgain")))
                                .finally(() => setSafetyBusy(null));
                            }}
                          >
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                              {t("safReason")}
                              <select
                                value={reportCategory}
                                onChange={(event) => setReportCategory(event.target.value as ReportCategory)}
                                className="mt-1.5 w-full rounded-xl border border-line bg-raised-2 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink"
                              >
                                {REPORT_CATEGORIES.map((category) => (
                                  <option key={category} value={category}>
                                    {t(`safReason_${category}`)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="mt-2.5 block text-[11px] font-bold uppercase tracking-wider text-muted">
                              {t("safDetails")}
                              <textarea
                                value={reportDetails}
                                onChange={(event) => setReportDetails(event.target.value)}
                                maxLength={500}
                                required={reportCategory === "other"}
                                rows={3}
                                className="mt-1.5 w-full resize-none rounded-xl border border-line bg-raised-2 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink"
                              />
                            </label>
                            <p className="mt-1 text-right text-[10px] text-muted">
                              {reportDetails.length}/500
                            </p>
                            <button
                              type="submit"
                              disabled={safetyBusy !== null}
                              className="pill mt-2 flex w-full justify-center bg-orange/15 px-4 py-2.5 text-sm font-semibold text-orange disabled:opacity-50"
                            >
                              {safetyBusy === "report" ? "…" : t("safSendReport")}
                            </button>
                          </motion.form>
                        )}
                      </AnimatePresence>

                      {safetyFeedback && (
                        <p className="mt-2 text-center text-xs text-muted" role="status" aria-live="polite">
                          {safetyFeedback}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
