"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LangCode, Profile, SessionBooking } from "./types";
import { makeT } from "./i18n";

const KEY = "lange.profile.v1";

const DEFAULT_WEEK = [35, 20, 45, 30, 55, 0, 0];

export function blankProfile(): Profile {
  return {
    name: "",
    role: "grower",
    knownLangs: ["en"],
    targetLang: "es",
    nurtureLangs: [],
    immersion: true,
    phase: 1,
    hoursLogged: 12,
    wordsMet: 138,
    streak: 5,
    completed: [],
    bookings: [],
    week: DEFAULT_WEEK,
    createdAt: new Date().toISOString(),
    interests: [],
    exchange: false,
  };
}

interface Store {
  profile: Profile | null;
  ready: boolean;
  /** UI language: target language when immersion is on, else first known language */
  uiLang: LangCode;
  t: (key: string) => string;
  saveProfile: (p: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  toggleImmersion: () => void;
  completeActivity: (id: string, minutes?: number, words?: number) => void;
  addBooking: (b: Omit<SessionBooking, "id">) => void;
  removeBooking: (id: string) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // corrupted storage — start fresh
    }
    setReady(true);
  }, []);

  const persist = useCallback((p: Profile | null) => {
    setProfile(p);
    try {
      if (p) localStorage.setItem(KEY, JSON.stringify(p));
      else localStorage.removeItem(KEY);
    } catch {
      // private mode etc. — in-memory only
    }
  }, []);

  const saveProfile = useCallback((p: Profile) => persist(p), [persist]);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
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
      const next = { ...prev, immersion: !prev.immersion };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const completeActivity = useCallback((id: string, minutes = 10, words = 0) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const day = (new Date().getDay() + 6) % 7; // Mon = 0
      const week = [...prev.week];
      week[day] = (week[day] ?? 0) + minutes;
      const next: Profile = {
        ...prev,
        completed: prev.completed.includes(id) ? prev.completed : [...prev.completed, id],
        hoursLogged: Math.round((prev.hoursLogged + minutes / 60) * 10) / 10,
        wordsMet: prev.wordsMet + words,
        week,
      };
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
      const next = { ...prev, bookings: [...prev.bookings, booking] };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeBooking = useCallback((id: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, bookings: prev.bookings.filter((x) => x.id !== id) };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetAll = useCallback(() => persist(null), [persist]);

  const uiLang: LangCode = profile
    ? profile.immersion && profile.role !== "nurturer"
      ? profile.targetLang
      : profile.knownLangs[0] ?? "en"
    : "en";

  const t = useMemo(() => makeT(uiLang), [uiLang]);

  const value: Store = {
    profile,
    ready,
    uiLang,
    t,
    saveProfile,
    updateProfile,
    toggleImmersion,
    completeActivity,
    addBooking,
    removeBooking,
    resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
