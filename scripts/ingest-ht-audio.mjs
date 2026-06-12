/**
 * Turn a continuous native Haitian-Creole recording into LANGE's per-clip
 * audio set. Reads the phrase order straight from src/lib/vocab.ts (same
 * order as docs/HT-RECORDING-SCRIPT.md / public/ht-recording.html), splits
 * the recording on the ~1s pauses with ffmpeg, loudness-normalizes each
 * segment, and writes public/audio/ht/{file}.mp3 + updates the manifest.
 *
 * Usage:
 *   export PATH=~/.nvm/versions/node/v22.22.0/bin:$PATH
 *   # 1) Dry run — just detect how many segments the splitter finds:
 *   node --experimental-strip-types scripts/ingest-ht-audio.mjs --in recording.m4a --dry
 *   # 2) If the count matches the expected total, write the clips:
 *   node --experimental-strip-types scripts/ingest-ht-audio.mjs --in recording.m4a
 *
 * Tuning when the detected count is off (too few = pauses too quiet/short):
 *   --silence -38   (dB threshold for "silence"; more negative = stricter)
 *   --mindur 0.5    (min pause length in seconds to count as a split)
 *
 * Two voices: pass --voice m to stage a male pass under public/audio/ht/m/
 * (kept for a future "different nurturer" toggle; the default primary set
 * powers the app today).
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { VOCAB_DOMAINS, TPR_COMMANDS } from "../src/lib/vocab.ts";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const MANIFEST_PATH = path.join(AUDIO_DIR, "manifest.json");

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (flag, def) => {
    const i = a.indexOf(flag);
    return i >= 0 && a[i + 1] ? a[i + 1] : def;
  };
  return {
    input: get("--in", null),
    dry: a.includes("--dry"),
    silenceDb: Number(get("--silence", "-35")),
    minDur: Number(get("--mindur", "0.6")),
    voice: get("--voice", "primary"),
  };
}

/** The exact ordered clip list — must match the recording script 1:1. */
function orderedClips() {
  const rows = [];
  const cues = [
    ["cue-greeting", "Bonjou! Mwen rele Ti Boujon."],
    ["cue-listen", "Koute."],
    ["cue-again", "Ankò."],
    ["cue-point", "Montre m."],
    ["cue-praise", "Bravo! Ou fè sa byen!"],
    ["cue-begin", "Ann kòmanse!"],
  ];
  for (const [id, text] of cues) rows.push({ file: `${id}.mp3`, text });
  for (const d of VOCAB_DOMAINS) {
    for (const it of d.items) {
      const w = it.words.ht;
      if (!w) continue;
      rows.push({ file: `${it.id}.mp3`, text: w });
      rows.push({ file: `${it.id}-q.mp3`, text: `Kote ${w}?` });
    }
  }
  for (const c of TPR_COMMANDS) {
    const w = c.words.ht;
    if (!w) continue;
    rows.push({ file: `tpr-${c.id}.mp3`, text: w });
  }
  return rows;
}

/** ffmpeg silencedetect → list of {start,end} speech segments. */
async function detectSegments(input, silenceDb, minDur) {
  let stderr = "";
  try {
    await run("ffmpeg", [
      "-i", input,
      "-af", `silencedetect=noise=${silenceDb}dB:d=${minDur}`,
      "-f", "null", "-",
    ]);
  } catch (e) {
    stderr = String(e.stderr || e.stdout || "");
  }
  // duration
  const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  const duration = durMatch
    ? Number(durMatch[1]) * 3600 + Number(durMatch[2]) * 60 + Number(durMatch[3])
    : 0;
  const starts = [...stderr.matchAll(/silence_start:\s*(-?\d+\.?\d*)/g)].map((m) => Number(m[1]));
  const ends = [...stderr.matchAll(/silence_end:\s*(-?\d+\.?\d*)/g)].map((m) => Number(m[1]));
  // speech = the gaps between silences. Build silence intervals, invert them.
  const silences = [];
  for (let i = 0; i < starts.length; i++) {
    silences.push({ s: starts[i], e: i < ends.length ? ends[i] : duration });
  }
  const segs = [];
  let cursor = 0;
  for (const sil of silences) {
    if (sil.s - cursor > 0.15) segs.push({ start: cursor, end: sil.s });
    cursor = Math.max(cursor, sil.e);
  }
  if (duration - cursor > 0.15) segs.push({ start: cursor, end: duration });
  return { segs, duration };
}

async function main() {
  const args = parseArgs();
  if (!args.input) {
    console.error("Pass --in <recording-file>. See header for usage.");
    process.exit(1);
  }
  if (!existsSync(args.input)) {
    console.error(`Input not found: ${args.input}`);
    process.exit(1);
  }

  const clips = orderedClips();
  const { segs, duration } = await detectSegments(args.input, args.silenceDb, args.minDur);

  console.log(`Recording: ${duration.toFixed(1)}s`);
  console.log(`Expected clips: ${clips.length}`);
  console.log(`Detected speech segments: ${segs.length}`);

  if (segs.length !== clips.length) {
    console.log(
      `\n⚠️  Count mismatch (${segs.length} vs ${clips.length}). Adjust and re-run --dry:\n` +
        `   too FEW segments → pauses merged: try --mindur 0.45 or --silence -40\n` +
        `   too MANY segments → noise split words: try --mindur 0.8 or --silence -30\n`
    );
    if (!args.dry) {
      console.log("Refusing to write on a mismatch. Re-run with --dry while tuning.");
      process.exit(1);
    }
  }
  if (args.dry) {
    console.log("\nDry run — no files written.");
    return;
  }

  const outDir = args.voice === "primary" ? path.join(AUDIO_DIR, "ht") : path.join(AUDIO_DIR, "ht", args.voice);
  await fs.mkdir(outDir, { recursive: true });

  let manifest = {};
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  } catch {
    /* fresh */
  }
  manifest.ht ??= {};

  for (let i = 0; i < clips.length; i++) {
    const { start, end } = segs[i];
    const out = path.join(outDir, clips[i].file);
    // trim 60ms of head/tail pause, normalize loudness, 128k mono mp3 to match the deck
    await run("ffmpeg", [
      "-y", "-i", args.input,
      "-ss", String(Math.max(0, start - 0.05)),
      "-to", String(end + 0.05),
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,dynaudnorm",
      "-ac", "1", "-b:a", "128k",
      out,
    ]);
    if (args.voice === "primary") {
      manifest.ht[clips[i].text] = `/audio/ht/${clips[i].file}`;
    }
    process.stdout.write(`\r  wrote ${i + 1}/${clips.length}`);
  }
  process.stdout.write("\n");

  if (args.voice === "primary") {
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Manifest updated with ${clips.length} ht entries.`);
  } else {
    console.log(`Staged ${clips.length} clips for voice "${args.voice}" (not wired into the manifest yet).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
