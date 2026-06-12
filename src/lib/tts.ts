"use client";

import type { LangCode } from "./types";
import { langByCode } from "./languages";

/**
 * Voice for every picture card. Pregenerated ElevenLabs clips (see
 * scripts/generate-audio.mjs → public/audio/manifest.json) play first;
 * anything not in the manifest falls back to browser speech synthesis,
 * so no language is ever silent.
 */

type AudioManifest = Partial<Record<string, Record<string, string>>>;

let manifest: AudioManifest | null = null;
let manifestPromise: Promise<AudioManifest> | null = null;
let currentAudio: HTMLAudioElement | null = null;

function loadManifest(): Promise<AudioManifest> {
  if (manifest) return Promise.resolve(manifest);
  if (!manifestPromise) {
    manifestPromise = fetch("/audio/manifest.json")
      .then((res) => (res.ok ? (res.json() as Promise<AudioManifest>) : {}))
      .catch(() => ({}))
      .then((m) => {
        manifest = m ?? {};
        return manifest;
      });
  }
  return manifestPromise;
}

/** Play a pregenerated clip; resolves on ended/error or a watchdog timeout. */
function playClip(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    currentAudio = audio;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    // If the file 404s or the browser stalls, resolve anyway so games keep flowing.
    const watchdog = setTimeout(finish, 15000);
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  });
}

export async function speak(text: string, lang: LangCode, rate = 0.85): Promise<void> {
  if (typeof window === "undefined") return;
  const m = await loadManifest();
  const src = m[lang]?.[text];
  if (src) {
    stopSpeaking();
    return playClip(src); // real recorded voice — rate param doesn't apply
  }
  return speakWithSynthesis(text, lang, rate);
}

/**
 * Browser speech synthesis fallback — gives every picture card a voice in the
 * target language, no API keys needed.
 */
function speakWithSynthesis(text: string, lang: LangCode, rate: number): Promise<void> {
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
  if (typeof window === "undefined") return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
