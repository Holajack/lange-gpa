/**
 * Russian voice set — ONE consistent native voice for every Phase 1 word.
 *
 * Voice: "Larisa Actrisa" (native Russian) on eleven_v3 — the combination the
 * owner approved and that passed a speech-to-text round trip on the first 245
 * words. This script fills in every vocab word that still has no clip, one
 * word per request (a clean isolated clip per card), and can verify each clip
 * by transcribing it back and comparing with the intended word.
 *
 *   export PATH=~/.nvm/versions/node/v22.22.0/bin:$PATH
 *   node --experimental-strip-types scripts/generate-audio-ru.mjs --dry          # what's missing + character cost
 *   node --experimental-strip-types scripts/generate-audio-ru.mjs --limit 5      # small test batch
 *   node --experimental-strip-types scripts/generate-audio-ru.mjs                # everything missing
 *   node --experimental-strip-types scripts/generate-audio-ru.mjs --verify       # STT round-trip of clips made by this script
 *   node --experimental-strip-types scripts/generate-audio-ru.mjs --redo id1,id2 # regenerate specific ids
 *   --questions    also voice the "Где …?" review question for every nameable thing
 *   --lines FILE   also voice extra sentences: JSON array of exact strings (studio narration)
 *
 * Output: public/audio/ru/{itemId}.mp3 + public/audio/manifest.json
 * ({ ru: { [exactText]: "/audio/ru/{file}.mp3" } }). Idempotent: anything
 * already in the manifest with a non-empty file is skipped.
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VOCAB_DOMAINS, isThingCard } from "../src/lib/vocab.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio", "ru");
const MANIFEST_PATH = path.join(ROOT, "public", "audio", "manifest.json");
const REPORT_PATH = path.join(ROOT, "scripts", ".audio-ru-report.json");

const VOICE_ID = "AB9XsbSA4eLG12t2myjN"; // Larisa Actrisa — Confident and Clear
const MODEL_ID = "eleven_v3";
const OUTPUT_FORMAT = "mp3_44100_128";
const DELAY_MS = 350;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readApiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const envText = await fs.readFile(path.join(ROOT, ".env"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("ELEVENLABS_API_KEY not found in .env");
}

async function exists(p) {
  try {
    return (await fs.stat(p)).size > 0;
  } catch {
    return false;
  }
}

async function tts(apiKey, text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL_ID, language_code: "ru" }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
}

async function ttsWithRetry(apiKey, text) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await tts(apiKey, text);
    } catch (err) {
      const retryable = err.status === 429 || (err.status >= 500 && err.status < 600);
      if (!retryable || attempt >= 2) throw err;
      await sleep(2500 * (attempt + 1));
    }
  }
}

/**
 * Batched speech-to-text. One request per clip is billed with a per-request
 * minimum (~9 credits each); joining ~40 clips with silence between them into
 * one file costs a fraction of that and returns word timestamps, which map
 * each heard word back to the clip it came from.
 */
const GAP_SEC = 0.9;

function clipDuration(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" }
  );
  return Number(out.trim()) || 0;
}

async function sttBatch(apiKey, files) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "nuri-stt-"));
  try {
    const silence = path.join(tmp, "sil.wav");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(GAP_SEC), silence]);
    const list = [];
    const starts = [];
    let at = 0;
    for (const [i, file] of files.entries()) {
      // decode each clip to wav so offsets are exact (mp3 concat drifts)
      const wav = path.join(tmp, `c${i}.wav`);
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-ar", "44100", "-ac", "1", wav]);
      starts.push(at);
      at += clipDuration(wav) + GAP_SEC;
      list.push(`file '${wav}'`, `file '${silence}'`);
    }
    const listPath = path.join(tmp, "list.txt");
    await fs.writeFile(listPath, list.join("\n") + "\n");
    const batch = path.join(tmp, "batch.mp3");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c:a", "libmp3lame", "-b:a", "96k", batch]);

    const form = new FormData();
    form.append("model_id", "scribe_v1");
    form.append("language_code", "ru");
    form.append("timestamps_granularity", "word");
    form.append("file", new Blob([await fs.readFile(batch)], { type: "audio/mpeg" }), "batch.mp3");
    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
    });
    if (!res.ok) throw new Error(`STT HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const words = ((await res.json()).words ?? []).filter((w) => w.type === "word");

    // a word belongs to the last clip that started (minus a little slack) before it
    const heard = files.map(() => []);
    for (const w of words) {
      let idx = 0;
      for (let i = 0; i < starts.length; i++) if (w.start >= starts[i] - 0.25) idx = i;
      heard[idx].push(w.text);
    }
    return heard.map((parts) => parts.join(" "));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

/** a transcriber writes "сорок" as "40" — spell common numbers back out before comparing */
const NUMBER_WORDS = {
  0: "ноль", 1: "один", 2: "два", 3: "три", 4: "четыре", 5: "пять", 6: "шесть", 7: "семь", 8: "восемь",
  9: "девять", 10: "десять", 11: "одиннадцать", 12: "двенадцать", 13: "тринадцать", 14: "четырнадцать",
  15: "пятнадцать", 16: "шестнадцать", 17: "семнадцать", 18: "восемнадцать", 19: "девятнадцать",
  20: "двадцать", 30: "тридцать", 40: "сорок", 50: "пятьдесят", 60: "шестьдесят", 70: "семьдесят",
  80: "восемьдесят", 90: "девяносто", 100: "сто", 1000: "тысяча",
};

/** compare ignoring case, punctuation, ё/е and spacing */
const norm = (s) =>
  s
    .replace(/\d+/g, (d) => NUMBER_WORDS[Number(d)] ?? d)
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function levenshtein(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = keep;
    }
  }
  return prev[b.length];
}

/**
 * Did the clip say what it was meant to? Single words must match exactly.
 * Sentences allow a little slack: a transcriber writes numbers as digits and
 * drops particles, which is not a mispronunciation.
 */
function sameSpeech(want, heard) {
  const a = norm(want);
  const b = norm(heard);
  if (a === b) return true;
  if (a.split(" ").length < 3) return false;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length) >= 0.9;
}

/** Every vocab word (text → file), in meeting order so early meetings are voiced first. */
function vocabTasks(withQuestions = false) {
  const seen = new Set();
  const tasks = [];
  for (const domain of VOCAB_DOMAINS) {
    for (const item of domain.items) {
      const text = item.words.ru;
      if (!text || seen.has(text)) continue;
      seen.add(text);
      tasks.push({ id: item.id, file: `${item.id}.mp3`, text, meeting: item.meeting ?? domain.meeting ?? 0 });
      // the review question, in the same voice — only for nameable things
      // (the session says the bare word for actions/qualities/phrases)
      if (withQuestions && isThingCard(domain.id, item.id)) {
        tasks.push({
          id: `${item.id}-q`,
          file: `${item.id}-q.mp3`,
          text: `Где ${text}?`,
          meeting: item.meeting ?? domain.meeting ?? 0,
        });
      }
    }
  }
  return tasks.sort((a, b) => a.meeting - b.meeting);
}

/** Extra sentences (studio narration): stable file name from a hash of the text. */
async function lineTasks(file) {
  const lines = JSON.parse(await fs.readFile(path.resolve(file), "utf8"));
  return [...new Set(lines)].map((text) => {
    const hash = crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
    return { id: `line-${hash}`, file: `line-${hash}.mp3`, text, meeting: 99 };
  });
}

async function main() {
  const apiKey = await readApiKey();
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  manifest.ru ??= {};
  await fs.mkdir(AUDIO_DIR, { recursive: true });

  let report = { generated: {}, verified: {}, failedVerify: {} };
  try {
    report = { ...report, ...JSON.parse(await fs.readFile(REPORT_PATH, "utf8")) };
  } catch {}
  const saveReport = () => fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  const saveManifest = () => fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  let tasks = vocabTasks(flag("questions"));
  if (opt("lines")) tasks = tasks.concat(await lineTasks(opt("lines")));

  /* ---------- verify mode: transcribe clips back and compare ---------- */
  if (flag("verify")) {
    const todo = tasks.filter((t) => report.generated[t.id] && !report.verified[t.id]);
    const max = Number(opt("limit") ?? todo.length);
    console.log(`verifying ${Math.min(max, todo.length)} of ${todo.length} unverified clips`);
    let ok = 0;
    let bad = 0;
    const queue = todo.slice(0, max);
    const BATCH = 40;
    for (let i = 0; i < queue.length; i += BATCH) {
      const group = queue.slice(i, i + BATCH);
      try {
        const heard = await sttBatch(apiKey, group.map((t) => path.join(AUDIO_DIR, t.file)));
        group.forEach((task, k) => {
          if (sameSpeech(task.text, heard[k])) {
            report.verified[task.id] = true;
            delete report.failedVerify[task.id];
            ok++;
          } else {
            report.failedVerify[task.id] = { want: task.text, heard: heard[k] };
            bad++;
            console.log(`  MISMATCH ${task.id}: want "${task.text}" heard "${heard[k]}"`);
          }
        });
        await saveReport();
      } catch (err) {
        console.error(`  STT error (batch ${i / BATCH + 1}): ${err.message}`);
        if (/401|402|403|quota/i.test(err.message)) break;
      }
      await sleep(300);
    }
    await saveReport();
    console.log(`verify done. ok=${ok} mismatch=${bad}`);
    return;
  }

  /* ---------------------------- generate ----------------------------- */
  const redo = new Set((opt("redo") ?? "").split(",").filter(Boolean));
  const missing = [];
  for (const task of tasks) {
    const onDisk = await exists(path.join(AUDIO_DIR, task.file));
    const inManifest = Boolean(manifest.ru[task.text]);
    if (redo.has(task.id) || !inManifest || !onDisk) {
      // a clip made earlier under another id for the same text still counts
      if (!redo.has(task.id) && inManifest && (await exists(path.join(ROOT, "public", manifest.ru[task.text])))) continue;
      missing.push(task);
    }
  }
  const chars = missing.reduce((n, t) => n + t.text.length, 0);
  console.log(`ru: ${tasks.length} texts, ${missing.length} to generate, ${chars} characters`);
  if (flag("dry")) return;

  const max = Number(opt("limit") ?? missing.length);
  let done = 0;
  let failed = 0;
  let spent = 0;
  for (const task of missing.slice(0, max)) {
    try {
      const audio = await ttsWithRetry(apiKey, task.text);
      await fs.writeFile(path.join(AUDIO_DIR, task.file), audio);
      manifest.ru[task.text] = `/audio/ru/${task.file}`;
      report.generated[task.id] = true;
      delete report.verified[task.id];
      done++;
      spent += task.text.length;
      if (done % 25 === 0) {
        await saveManifest();
        await saveReport();
        console.log(`  ${done}/${Math.min(max, missing.length)}  (${spent} chars)`);
      }
    } catch (err) {
      failed++;
      console.error(`  FAIL ${task.id} "${task.text}": ${err.message}`);
      if (err.status === 401 || err.status === 402 || /quota|credits/i.test(err.message)) {
        console.error("  stopping: the account is out of credits or the key was rejected");
        break;
      }
    }
    await sleep(DELAY_MS);
  }
  await saveManifest();
  await saveReport();
  console.log(`done. generated=${done} failed=${failed} chars=${spent}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
