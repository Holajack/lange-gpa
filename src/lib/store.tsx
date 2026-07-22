"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { LangCode, LanguageJourney, Profile, SessionBooking } from "./types";
import { makeBlendedT, makeT } from "./i18n";
import { LANGUAGES, langByCode } from "./languages";
import {
  ACHIEVEMENT_EVENT,
  AWARD_REQUEST_EVENT,
  achievementById,
  eligibleAchievementIds,
} from "./achievements";
import { CONVEX_ON } from "./convexClient";
import { phaseForHours } from "./phases";
import { meetingForHours } from "./sessionFlow";

const KEY = "lange.profile.v1";
const USER_CACHE_KEYS = [
  KEY,
  "lange.profile.owner.v1",
  "lange.achievements.v1",
  "lange.wallet.v1",
  "lange.wallet.device.v1",
];

/**
 * GRADUATED IMMERSION — the system slowly stops speaking your language.
 *
 * Phase 1 growers see the whole app in their own language. Every phase after
 * that flips one more tier of UI strings into the target language — nav tabs
 * and greetings first, then buttons, then section labels, until by Phase 5
 * the chrome speaks only the host language. Faking fluency gets harder every
 * phase: the app itself becomes part of the host world, the GPA wall of
 * noise quietly turning into a window. The manual immersion toggle still
 * forces the full target-language UI at any stage.
 *
 *   P1 → 0 (native UI) · P2 → 1 · P3 → 2 · P4 → 3 · P5+ → 4 (full target)
 */
export function getImmersionStage(profile: Profile): 0 | 1 | 2 | 3 | 4 {
  if (profile.phase >= 5) return 4;
  return (profile.phase - 1) as 0 | 1 | 2 | 3;
}

/** A brand-new grower starts at the wall of noise: a clean, zeroed week. */
const FRESH_WEEK = [0, 0, 0, 0, 0, 0, 0];

function weekStartIso(date = new Date()): string {
  const monday = new Date(date);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - daysSinceMonday);
  return monday.toISOString().slice(0, 10);
}

function emptyJourney(lang: LangCode): LanguageJourney {
  return {
    lang,
    phase: 1,
    meetingProgress: 0,
    hoursLogged: 0,
    minutesLogged: 0,
    wordsMet: 0,
    wordIds: [],
    completed: [],
    activityLog: [],
    achievements: {},
    week: [...FRESH_WEEK],
    weekStartedAt: weekStartIso(),
    startedAt: new Date().toISOString(),
  };
}

function activeJourneySnapshot(profile: Profile): LanguageJourney {
  return {
    lang: profile.targetLang,
    phase: profile.phase,
    meetingProgress: profile.meetingProgress,
    hoursLogged: profile.hoursLogged,
    minutesLogged: profile.minutesLogged ?? Math.round(profile.hoursLogged * 60),
    wordsMet: profile.wordsMet,
    wordIds: [...(profile.wordIds ?? [])],
    completed: [...profile.completed],
    activityLog: [...(profile.activityLog ?? [])],
    achievements: { ...(profile.achievements ?? {}) },
    week: [...(profile.week ?? FRESH_WEEK)],
    weekStartedAt: profile.weekStartedAt ?? weekStartIso(),
    startedAt:
      profile.journeys?.find((journey) => journey.lang === profile.targetLang)?.startedAt ??
      profile.createdAt,
  };
}

function syncActiveJourney(profile: Profile): Profile {
  const snapshot = activeJourneySnapshot(profile);
  const journeys = [...(profile.journeys ?? [])];
  const index = journeys.findIndex((journey) => journey.lang === snapshot.lang);
  if (index >= 0) journeys[index] = snapshot;
  else journeys.push(snapshot);
  return { ...profile, journeys };
}

/** Save the current journey, then load or create an independent target journey. */
export function switchLanguageJourney(profile: Profile, lang: LangCode): Profile {
  const synced = syncActiveJourney(profile);
  if (synced.targetLang === lang) return synced;
  const found = synced.journeys?.find((journey) => journey.lang === lang) ?? emptyJourney(lang);
  const journeys = synced.journeys?.some((journey) => journey.lang === lang)
    ? synced.journeys
    : [...(synced.journeys ?? []), found];
  return {
    ...synced,
    targetLang: lang,
    journeys,
    phase: found.phase,
    // journeys saved before the meeting spine existed carry undefined here —
    // the meetingProgress self-heal below then re-derives it from THIS
    // journey's hours instead of leaking the previous language's progress
    meetingProgress: found.meetingProgress,
    hoursLogged: found.hoursLogged,
    minutesLogged: found.minutesLogged,
    wordsMet: found.wordsMet,
    wordIds: [...found.wordIds],
    completed: [...found.completed],
    activityLog: [...found.activityLog],
    achievements: { ...found.achievements },
    week: [...found.week],
    weekStartedAt: found.weekStartedAt,
  };
}

export function blankProfile(): Profile {
  return {
    name: "",
    role: "grower",
    knownLangs: ["en"],
    targetLang: "es",
    nurtureLangs: [],
    journeys: [],
    immersion: false,
    phase: 1,
    meetingProgress: 0,
    hoursLogged: 0,
    minutesLogged: 0,
    wordsMet: 0,
    wordIds: [],
    streak: 0,
    completed: [],
    activityLog: [],
    achievements: {},
    bookings: [],
    week: FRESH_WEEK,
    weekStartedAt: weekStartIso(),
    createdAt: new Date().toISOString(),
    interests: [],
    exchange: false,
  };
}

interface Store {
  profile: Profile | null;
  ready: boolean;
  /**
   * Cloud-account sync state (set by CloudProfileBridge when Clerk is configured):
   * "off"     — keyless/anonymous build, no cloud account
   * "loading" — signed in, fetching the account from Convex
   * "ready"   — account fetched (profile hydrated, or confirmed none yet)
   * The app shell waits for "ready" before deciding onboarding-vs-app.
   */
  cloudState: "off" | "loading" | "ready";
  setCloudState: (s: "off" | "loading" | "ready") => void;
  /** UI language: target language when immersion is on, else first known language */
  uiLang: LangCode;
  t: (key: string) => string;
  saveProfile: (p: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  toggleImmersion: () => void;
  switchJourney: (lang: LangCode) => void;
  awardAchievement: (id: string) => void;
  completeActivity: (id: string, minutes?: number, words?: number | string[]) => void;
  addBooking: (b: Omit<SessionBooking, "id">) => void;
  removeBooking: (id: string) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [cloudState, setCloudState] = useState<"off" | "loading" | "ready">(
    CONVEX_ON ? "loading" : "off"
  );
  const [guestLang, setGuestLang] = useState<LangCode>("en");

  useEffect(() => {
    // In an account-backed build, never hydrate an unverified browser cache.
    // CloudProfileBridge first validates the signed-in Clerk owner and then
    // hydrates the correct account. Keyless demo builds remain local-first.
    if (!CONVEX_ON) {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setProfile(syncActiveJourney(JSON.parse(raw) as Profile));
      } catch {
        // corrupted storage — start fresh
      }
    }
    const supported = new Set(LANGUAGES.map((language) => language.code));
    const detected = (navigator.languages ?? [navigator.language])
      .map((tag) => tag.slice(0, 2).toLowerCase() as LangCode)
      .find((code) => supported.has(code));
    if (detected) setGuestLang(detected);
    setReady(true);
  }, []);

  const persist = useCallback((p: Profile | null) => {
    const normalized = p ? syncActiveJourney(p) : null;
    setProfile(normalized);
    try {
      if (normalized) localStorage.setItem(KEY, JSON.stringify(normalized));
      else USER_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // private mode etc. — in-memory only
    }
  }, []);

  const saveProfile = useCallback((p: Profile) => persist(p), [persist]);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const next = syncActiveJourney({ ...prev, ...patch });
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const toggleImmersion = useCallback(() => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = syncActiveJourney({ ...prev, immersion: !prev.immersion });
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const switchJourney = useCallback((lang: LangCode) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = switchLanguageJourney(prev, lang);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const completeActivity = useCallback((id: string, minutes = 10, words: number | string[] = 0) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.min(minutes, 240)) : 0;
      const currentWeek = weekStartIso();
      const day = (new Date().getDay() + 6) % 7; // Mon = 0
      const week = prev.weekStartedAt === currentWeek ? [...(prev.week ?? FRESH_WEEK)] : [...FRESH_WEEK];
      week[day] = (week[day] ?? 0) + safeMinutes;

      const wordIds = new Set(prev.wordIds ?? []);
      let wordsAdded = 0;
      if (Array.isArray(words)) {
        for (const wordId of words) {
          if (!wordIds.has(wordId)) {
            wordIds.add(wordId);
            wordsAdded += 1;
          }
        }
      } else if (Number.isFinite(words)) {
        wordsAdded = Math.max(0, Math.floor(words));
      }

      const minutesLogged = (prev.minutesLogged ?? Math.round(prev.hoursLogged * 60)) + safeMinutes;
      const completedAt = new Date().toISOString();
      const next = syncActiveJourney({
        ...prev,
        completed: prev.completed.includes(id) ? prev.completed : [...prev.completed, id],
        activityLog: [
          ...(prev.activityLog ?? []),
          {
            id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            activityId: id,
            completedAt,
            minutes: safeMinutes,
            wordsAdded,
          },
        ],
        minutesLogged,
        hoursLogged: Math.round((minutesLogged / 60) * 10) / 10,
        wordIds: [...wordIds],
        wordsMet: prev.wordsMet + wordsAdded,
        week,
        weekStartedAt: currentWeek,
      });
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const addBooking = useCallback((b: Omit<SessionBooking, "id">) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const booking: SessionBooking = { ...b, id: `bk-${prev.bookings.length + 1}-${b.date}-${b.time}` };
      const next = syncActiveJourney({ ...prev, bookings: [...prev.bookings, booking] });
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeBooking = useCallback((id: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = syncActiveJourney({ ...prev, bookings: prev.bookings.filter((x) => x.id !== id) });
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetAll = useCallback(() => persist(null), [persist]);

  const pendingAchievementEvents = useRef<Set<string>>(new Set());
  const awardAchievement = useCallback((id: string) => {
    if (!achievementById(id)) return;
    setProfile((prev) => {
      if (!prev || prev.achievements?.[id]) return prev;
      const achievements = { ...(prev.achievements ?? {}), [id]: new Date().toISOString() };
      const next = syncActiveJourney({ ...prev, achievements });
      pendingAchievementEvents.current.add(id);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (!profile || pendingAchievementEvents.current.size === 0) return;
    const ids = [...pendingAchievementEvents.current];
    pendingAchievementEvents.current.clear();
    ids.forEach((id) => {
      window.dispatchEvent(new CustomEvent(ACHIEVEMENT_EVENT, { detail: { id } }));
    });
  }, [profile]);

  /* ---- achievements: re-check after every profile change (hours,
     completions, bookings) + detect the first real role switch ---- */
  const lastRole = useRef<Profile["role"] | null>(null);
  useEffect(() => {
    if (!profile) {
      // Reset account-scoped comparison state on sign-out/reset so the next
      // person cannot earn a role-switch badge from a previous account.
      lastRole.current = null;
      return;
    }
    if (lastRole.current !== null && lastRole.current !== profile.role) {
      awardAchievement("first-role-switch");
    }
    lastRole.current = profile.role;
    eligibleAchievementIds(profile).forEach(awardAchievement);
  }, [profile, awardAchievement]);

  /* ---- phase never regresses but must keep pace with hoursLogged: it's
     only ever SET once, at onboarding placement, so anyone who logs enough
     hours to cross a boundary (including via a cloud profile hydration that
     carries a stale phase) would otherwise be stuck at their placement
     phase forever — freezing graduated immersion and the /courses "current"
     marker. Self-heal after every profile change rather than only inside
     completeActivity, so this covers every path that can move hoursLogged. */
  useEffect(() => {
    if (!profile) return;
    const due = phaseForHours(profile.hoursLogged);
    if (due > profile.phase) updateProfile({ phase: due });
  }, [profile, updateProfile]);

  /* ---- meetingProgress self-heal: profiles saved before the sequential
     live-session meeting spine existed carry no meetingProgress. Don't reset
     them to Meeting 1 — treat the meeting the old hours-proxy said they were
     ON as their NEXT meeting (i.e. one less than it is "completed"). Runs
     once per legacy profile; from then on only finishing a live /session
     meeting advances it (never solo /practice — see Profile.meetingProgress). */
  useEffect(() => {
    if (!profile || profile.meetingProgress !== undefined) return;
    updateProfile({ meetingProgress: Math.max(0, meetingForHours(profile.hoursLogged) - 1) });
  }, [profile, updateProfile]);

  /* ---- self-report bridge: pages dispatch `lange:award` to grant manual
     badges (first recording saved, first joke understood…) ---- */
  useEffect(() => {
    const onAward = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (id) awardAchievement(id);
    };
    window.addEventListener(AWARD_REQUEST_EVENT, onAward);
    return () => window.removeEventListener(AWARD_REQUEST_EVENT, onAward);
  }, [awardAchievement]);

  const uiLang: LangCode = profile
    ? profile.immersion && profile.role !== "nurturer"
      ? profile.targetLang
      : profile.knownLangs[0] ?? "en"
    : guestLang;

  // Reflect the UI language onto <html> — drives lang attr + right-to-left
  // layout for Arabic and any future RTL interface language.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    el.lang = uiLang;
    el.dir = langByCode(uiLang).rtl ? "rtl" : "ltr";
  }, [uiLang]);

  const t = useMemo(() => {
    if (!profile) return makeT(guestLang);
    const native = profile.knownLangs[0] ?? "en";
    if (profile.role === "nurturer") return makeT(native);
    // manual immersion ON keeps today's behavior: the full target-language UI
    if (profile.immersion) return makeT(profile.targetLang);
    // otherwise the UI flips per-key, tier by tier, as the phases pass
    const stage = getImmersionStage(profile);
    return stage > 0 ? makeBlendedT(native, profile.targetLang, stage) : makeT(native);
  }, [profile, guestLang]);

  const value: Store = {
    profile,
    ready,
    cloudState,
    setCloudState,
    uiLang,
    t,
    saveProfile,
    updateProfile,
    toggleImmersion,
    switchJourney,
    awardAchievement,
    completeActivity,
    addBooking,
    removeBooking,
    resetAll,
  };

  return (
    <Ctx.Provider value={value}>{children}</Ctx.Provider>
  );
}

export function useApp(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
