"use client";

import type { LangCode } from "./types";
import { langByCode } from "./languages";

/**
 * Browser speech synthesis — gives every picture card a voice in the
 * target language, no API keys needed. (Swap for a cloud TTS later.)
 */
export function speak(text: string, lang: LangCode, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const locale = langByCode(lang).tts;
    u.lang = locale;
    u.rate = rate;
    const pick = () => {
      const voices = synth.getVoices();
      const exact = voices.find((v) => v.lang.replace("_", "-") === locale);
      const loose = voices.find((v) => v.lang.replace("_", "-").startsWith(locale.split("-")[0]));
      if (exact || loose) u.voice = (exact ?? loose)!;
    };
    pick();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      resolve();
    };
    // If no voice exists for this language (or the engine stalls), onend never
    // fires — resolve anyway so games keep flowing without audio.
    const watchdog = setTimeout(finish, Math.max(1500, text.length * 90));
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
