/**
 * Native-speaker review sheet — every host-language line the app says aloud,
 * with the clip that says it, in the order a learner meets it.
 *
 *   export PATH=~/.nvm/versions/node/v22.22.0/bin:$PATH
 *   node scripts/export-review.mjs ru
 *
 * Writes:
 *   public/review/{lang}.json                    rows for the /review/{lang} page
 *   public/review/nurilang-{lang}-review.csv     the same rows as a spreadsheet (UTF-8 with BOM)
 *
 * Sources: the mascot's session cues, Phase 1 picture-card words + their "Where is …?" review question,
 * the listen-and-do commands, and each phase's studio narration
 * (P{N}_AUDIO_LINES). Clips come from public/audio/manifest.json, keyed by the
 * exact text. Re-run after adding content or voice.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://nurilang.app";
const lang = process.argv[2] ?? "ru";
const src = (...p) => path.join(ROOT, "src", ...p);

const entry = [
  `export { VOCAB_DOMAINS, TPR_COMMANDS, isThingCard } from ${JSON.stringify(src("lib", "vocab.ts"))};`,
  `export { questionFor, CUES } from ${JSON.stringify(src("lib", "sessionFlow.ts"))};`,
  ...[1, 2, 3, 4, 5, 6].map(
    (n) => `export { P${n}_AUDIO_LINES } from ${JSON.stringify(src("components", "studio", `p${n}`, "content.ts"))};`
  ),
].join("\n");

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "nuri-review-"));
const bundle = path.join(tmp, "review.mjs");
await build({
  stdin: { contents: entry, resolveDir: ROOT, loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundle,
  logLevel: "silent",
  alias: { "@": path.join(ROOT, "src") },
  external: ["react", "react-dom", "next", "next/*", "framer-motion", "lucide-react"],
});
const mod = await import(pathToFileURL(bundle).href);
await fs.rm(tmp, { recursive: true, force: true });

const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "public", "audio", "manifest.json"), "utf8"))[lang] ?? {};
const used = new Set();
const clip = (text) => {
  const file = manifest[text];
  if (file) used.add(text);
  return file ?? "";
};

/** rows: { id, section, group, text, en, audio, text2?, audio2? } */
const rows = [];
const seen = new Set();

/* ---- what the mascot says to run a session ---- */
for (const [key, text] of Object.entries(mod.CUES[lang] ?? {})) {
  rows.push({ id: `q:${key}`, section: "cues", group: "Session cues", text, en: mod.CUES.en?.[key] ?? "", audio: clip(text) });
}

/* ---- Phase 1 words, with the review question that asks for each ---- */
for (const domain of mod.VOCAB_DOMAINS) {
  for (const item of domain.items) {
    const text = item.words[lang];
    if (!text || seen.has(text)) continue;
    seen.add(text);
    const row = {
      id: `w:${item.id}`,
      section: "words",
      group: domain.names.en,
      groupLocal: domain.names[lang] ?? "",
      text,
      en: item.words.en ?? "",
      audio: clip(text),
    };
    if (mod.isThingCard(domain.id, item.id)) {
      row.text2 = mod.questionFor(lang, text);
      row.audio2 = clip(row.text2);
    }
    rows.push(row);
  }
}

/* ---- listen-and-do commands ---- */
for (const cmd of mod.TPR_COMMANDS) {
  const text = cmd.words[lang];
  if (!text) continue;
  rows.push({ id: `c:${cmd.id}`, section: "commands", group: "Listen and do", text, en: cmd.words.en ?? "", audio: clip(text) });
}

/* ---- studio narration, phase by phase, in authored order ---- */
for (const n of [1, 2, 3, 4, 5, 6]) {
  const lines = mod[`P${n}_AUDIO_LINES`]?.[lang] ?? [];
  const english = mod[`P${n}_AUDIO_LINES`]?.en ?? [];
  // the English list is only a faithful gloss when it was built by the same walk
  const paired = english.length === lines.length;
  lines.forEach((text, i) => {
    if (typeof text !== "string" || !text.trim()) return;
    // a bare card word a tool repeats is already reviewed above
    if (seen.has(text)) return;
    seen.add(text);
    rows.push({
      id: `p${n}:${i}`,
      section: `p${n}`,
      group: `Phase ${n} tools`,
      text,
      en: paired ? english[i] ?? "" : "",
      audio: clip(text),
    });
  });
}

/* clips nothing above claims are retired takes the app no longer plays — not reviewed */
const orphans = Object.keys(manifest).filter((t) => !used.has(t) && !seen.has(t));

const outDir = path.join(ROOT, "public", "review");
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, `${lang}.json`), JSON.stringify({ lang, rows }) + "\n");

const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const url = (file) => (file ? SITE + file : "");
const header = ["Row", "Section", "Group", "Text", "English", "Audio", "Review question", "Question audio", "OK? (yes / fix)", "Correction or note"];
const csv = [header.map(cell).join(",")]
  .concat(
    rows.map((r, i) =>
      [i + 1, r.section, r.group, r.text, r.en, url(r.audio), r.text2 ?? "", url(r.audio2), "", ""].map(cell).join(",")
    )
  )
  .join("\r\n");
await fs.writeFile(path.join(outDir, `nurilang-${lang}-review.csv`), "﻿" + csv + "\r\n");

const by = {};
for (const r of rows) by[r.section] = (by[r.section] ?? 0) + 1;
const silent = rows.filter((r) => !r.audio).length;
const silentQ = rows.filter((r) => r.text2 && !r.audio2).length;
console.log(`${lang}: ${rows.length} rows`, by);
console.log(`no clip: ${silent} lines, ${silentQ} questions · unclaimed clips: ${orphans.length}`);
for (const n of [1, 2, 3, 4, 5, 6]) {
  const a = mod[`P${n}_AUDIO_LINES`];
  console.log(`  p${n}: ${lang} ${a?.[lang]?.length ?? 0} / en ${a?.en?.length ?? 0}`);
}
