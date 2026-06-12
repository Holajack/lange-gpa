/**
 * Pre-generate ElevenLabs voice clips for LANGE's GPA practice content.
 *
 * Run with:
 *   export PATH=~/.nvm/versions/node/v22.22.0/bin:$PATH && \
 *   node --experimental-strip-types scripts/generate-audio.mjs
 *
 * Outputs public/audio/{lang}/{file}.mp3 and maintains
 * public/audio/manifest.json shaped { [lang]: { [exactText]: "/audio/{lang}/{file}.mp3" } }.
 *
 * Idempotent: existing non-empty files are skipped (manifest is still updated).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VOCAB_DOMAINS, TPR_COMMANDS } from "../src/lib/vocab.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const MANIFEST_PATH = path.join(AUDIO_DIR, "manifest.json");
const MODEL_ID = "eleven_multilingual_v2";
const DELAY_MS = 300;

/** AUDIO CUE CONTRACT — exact strings shared with the session flow. */
const LANGS = {
  ru: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    question: (word) => `Где ${word}?`,
    cues: {
      greeting: "Привет! Я Листик.",
      listen: "Слушай.",
      again: "Ещё раз.",
      point: "Покажи.",
      praise: "Молодец!",
      begin: "Начнём!",
    },
  },
  en: {
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    question: (word) => `Where is the ${word}?`,
    cues: {
      greeting: "Hi! I'm Nuri.",
      listen: "Listen.",
      again: "One more time.",
      point: "Point to it.",
      praise: "Well done!",
      begin: "Let's begin!",
    },
  },
  // Haitian Creole — NO native ElevenLabs model exists for Kreyòl ayisyen;
  // multilingual_v2 reads it through its French-leaning engine, so it stays
  // OFF (commented) until native-speaker recordings land in public/audio/ht/.
  // ht: { ... } — see scripts/ingest-ht-audio.mjs + docs/HT-RECORDING-SCRIPT.md
  //
  // Japanese — fully supported by multilingual_v2 (accurate native
  // pronunciation). Voice: Bella (warm/bright) for Futaba the daruma.
  ja: {
    voiceId: "hpp4J3VqNfWAUOO0d1Us",
    question: (word) => `${word}はどこ？`,
    cues: {
      greeting: "こんにちは！ふたばだよ。",
      listen: "聞いて。",
      again: "もう一回。",
      point: "指さして。",
      praise: "上手！",
      begin: "はじめよう！",
    },
  },
};

async function readApiKey() {
  const envText = await fs.readFile(path.join(ROOT, ".env"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("ELEVENLABS_API_KEY not found in .env");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ttsRequest(apiKey, voiceId, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({ text, model_id: MODEL_ID }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
}

/** One retry on 429/5xx, per the soft-fail policy. */
async function ttsWithRetry(apiKey, voiceId, text) {
  try {
    return await ttsRequest(apiKey, voiceId, text);
  } catch (err) {
    if (err.status === 429 || (err.status >= 500 && err.status < 600)) {
      console.log(`    retrying after ${err.status}...`);
      await sleep(2000);
      return await ttsRequest(apiKey, voiceId, text);
    }
    throw err;
  }
}

/** Build the full task list for one language: vocab words, questions, TPR, cues. */
function tasksForLang(lang) {
  const def = LANGS[lang];
  const tasks = [];
  for (const domain of VOCAB_DOMAINS) {
    for (const item of domain.items) {
      const word = item.words[lang];
      if (!word) continue;
      tasks.push({ file: `${item.id}.mp3`, text: word });
      tasks.push({ file: `${item.id}-q.mp3`, text: def.question(word) });
    }
  }
  for (const cmd of TPR_COMMANDS) {
    const text = cmd.words[lang];
    if (!text) continue;
    tasks.push({ file: `tpr-${cmd.id}.mp3`, text });
  }
  for (const [key, text] of Object.entries(def.cues)) {
    tasks.push({ file: `cue-${key}.mp3`, text });
  }
  return tasks;
}

async function fileExists(p) {
  try {
    const stat = await fs.stat(p);
    return stat.size > 0;
  } catch {
    return false;
  }
}

async function main() {
  const apiKey = await readApiKey();

  let manifest = {};
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  } catch {
    /* fresh manifest */
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let chars = 0;

  for (const lang of Object.keys(LANGS)) {
    const def = LANGS[lang];
    const dir = path.join(AUDIO_DIR, lang);
    await fs.mkdir(dir, { recursive: true });
    manifest[lang] ??= {};

    const tasks = tasksForLang(lang);
    console.log(`\n=== ${lang}: ${tasks.length} clips ===`);

    for (const task of tasks) {
      const outPath = path.join(dir, task.file);
      const publicPath = `/audio/${lang}/${task.file}`;

      if (await fileExists(outPath)) {
        manifest[lang][task.text] = publicPath;
        skipped++;
        continue;
      }

      try {
        const audio = await ttsWithRetry(apiKey, def.voiceId, task.text);
        await fs.writeFile(outPath, audio);
        manifest[lang][task.text] = publicPath;
        generated++;
        chars += task.text.length;
        console.log(`  ${lang}/${task.file}  "${task.text}"  (chars so far: ${chars})`);
      } catch (err) {
        failed++;
        console.error(`  FAIL ${lang}/${task.file}  "${task.text}": ${err.message}`);
      }
      await sleep(DELAY_MS);
    }
  }

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nDone. generated=${generated} skipped=${skipped} failed=${failed} chars=${chars}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
