/**
 * Studio translation tooling — the studio (Phases 1–6 workbench) strings are
 * authored in English per phase (src/lib/studioStrings/{core,p1…p6}.ts) and
 * translated into every other interface language as JSON:
 *
 *   src/lib/studioStrings/locales/{lang}/{part}.json   { key: "translated" }
 *
 * `core` ships with the app shell; each phase's file is loaded on demand with
 * that phase's tools, for the grower's own interface language only.
 *
 *   node scripts/studio-i18n.mjs export <workDir>            # English → <workDir>/src/{part}.{nn}.json chunks
 *   node scripts/studio-i18n.mjs validate <workDir> <lang>   # check a translator's chunks in <workDir>/out/<lang>/
 *   node scripts/studio-i18n.mjs merge <workDir> [lang…]     # validated chunks → locales/{lang}/{part}.json
 *   node scripts/studio-i18n.mjs status                      # coverage of what is in the repo
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STRINGS_DIR = path.join(ROOT, "src", "lib", "studioStrings");
const LOCALES_DIR = path.join(STRINGS_DIR, "locales");
export const PARTS = ["core", "phase", "p1", "p2", "p3", "p4", "p5", "p6"];
export const LANGS = ["es", "ru", "fr", "de", "pt", "it", "ja", "zh", "ht", "ko", "tr", "uk", "hi", "ar", "vi", "id", "pl", "th"];
const CHUNK = 110;

const EXPORT_NAME = { core: "CORE_STUDIO_STRINGS", phase: "PHASE_STRINGS", p1: "P1_STRINGS", p2: "P2_STRINGS", p3: "P3_STRINGS", p4: "P4_STRINGS", p5: "P5_STRINGS", p6: "P6_STRINGS" };

/** English source for every part: { part: { key: "English" } } */
async function loadEnglish() {
  const entry = PARTS.map(
    (p) => `export { ${EXPORT_NAME[p]} } from ${JSON.stringify(path.join(STRINGS_DIR, `${p}.ts`))};`
  ).join("\n");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "nuri-i18n-"));
  const out = path.join(tmp, "strings.mjs");
  await build({ stdin: { contents: entry, resolveDir: ROOT, loader: "ts" }, bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "silent" });
  const mod = await import(pathToFileURL(out).href);
  await fs.rm(tmp, { recursive: true, force: true });
  const english = {};
  for (const p of PARTS) {
    english[p] = Object.fromEntries(Object.entries(mod[EXPORT_NAME[p]]).map(([k, v]) => [k, v.en]));
  }
  return english;
}

const placeholders = (s) => (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort().join(",");

/** problems with one translated value, or [] */
function problems(key, en, tr) {
  const out = [];
  if (typeof tr !== "string" || !tr.trim()) return [`${key}: empty`];
  if (placeholders(en) !== placeholders(tr)) out.push(`${key}: placeholders differ (${placeholders(en) || "none"} vs ${placeholders(tr) || "none"})`);
  if (/^\s|\s$/.test(tr) && !/^\s|\s$/.test(en)) out.push(`${key}: stray leading/trailing space`);
  return out;
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function chunksOf(part, english) {
  const keys = Object.keys(english[part]);
  const chunks = [];
  for (let i = 0; i < keys.length; i += CHUNK) chunks.push(keys.slice(i, i + CHUNK));
  return chunks.map((ks, i) => ({ name: `${part}.${String(i + 1).padStart(2, "0")}`, keys: ks }));
}

/** gather a translator's chunk files for one language; returns { part: {key: tr} } + issues */
async function collect(workDir, lang, english) {
  const result = {};
  const issues = [];
  for (const part of PARTS) {
    const merged = {};
    for (const chunk of chunksOf(part, english)) {
      const data = await readJson(path.join(workDir, "out", lang, `${chunk.name}.json`));
      if (!data) {
        issues.push(`${chunk.name}: missing or invalid JSON`);
        continue;
      }
      for (const key of chunk.keys) {
        if (!(key in data)) {
          issues.push(`${chunk.name}: missing key ${key}`);
          continue;
        }
        const bad = problems(key, english[part][key], data[key]);
        if (bad.length) issues.push(...bad.map((b) => `${chunk.name}: ${b}`));
        else merged[key] = data[key];
      }
    }
    result[part] = merged;
  }
  return { result, issues };
}

const [cmd, ...rest] = process.argv.slice(2);
const english = await loadEnglish();

if (cmd === "export") {
  const workDir = path.resolve(rest[0]);
  await fs.mkdir(path.join(workDir, "src"), { recursive: true });
  let files = 0;
  for (const part of PARTS) {
    for (const chunk of chunksOf(part, english)) {
      const body = Object.fromEntries(chunk.keys.map((k) => [k, english[part][k]]));
      await fs.writeFile(path.join(workDir, "src", `${chunk.name}.json`), JSON.stringify(body, null, 1) + "\n");
      files++;
    }
  }
  const total = PARTS.reduce((n, p) => n + Object.keys(english[p]).length, 0);
  console.log(`exported ${total} keys in ${files} chunks`, Object.fromEntries(PARTS.map((p) => [p, Object.keys(english[p]).length])));
} else if (cmd === "validate") {
  const [workDir, lang] = [path.resolve(rest[0]), rest[1]];
  const only = rest[2] ? new Set(rest[2].split(",")) : null;
  const { issues } = await collect(workDir, lang, english);
  const shown = issues.filter((i) => !only || only.has(i.split(".")[0]));
  console.log(shown.length ? shown.slice(0, 60).join("\n") : `${lang}: all chunks valid`);
  if (shown.length > 60) console.log(`… and ${shown.length - 60} more`);
  process.exitCode = shown.length ? 1 : 0;
} else if (cmd === "merge") {
  const workDir = path.resolve(rest[0]);
  const langs = rest.length > 1 ? rest.slice(1) : LANGS;
  for (const lang of langs) {
    const { result, issues } = await collect(workDir, lang, english);
    await fs.mkdir(path.join(LOCALES_DIR, lang), { recursive: true });
    const counts = [];
    for (const part of PARTS) {
      const n = Object.keys(result[part]).length;
      const total = Object.keys(english[part]).length;
      counts.push(`${part} ${n}/${total}`);
      if (n > 0) await fs.writeFile(path.join(LOCALES_DIR, lang, `${part}.json`), JSON.stringify(result[part], null, 0) + "\n");
    }
    console.log(`${lang}: ${counts.join(" · ")}${issues.length ? ` · ${issues.length} issue(s)` : ""}`);
  }
  // the shared chrome ships with the app shell in every language: one combined file
  const core = {};
  for (const lang of LANGS) {
    // `core` (studio chrome) and `phase` (revised curriculum copy) both ship statically
    const data = {
      ...((await readJson(path.join(LOCALES_DIR, lang, "core.json"))) ?? {}),
      ...((await readJson(path.join(LOCALES_DIR, lang, "phase.json"))) ?? {}),
    };
    if (Object.keys(data).length) core[lang] = data;
  }
  await fs.writeFile(path.join(STRINGS_DIR, "coreLocales.json"), JSON.stringify(core, null, 0) + "\n");
  console.log(`coreLocales.json: ${Object.keys(core).length} language(s)`);
} else if (cmd === "status") {
  for (const lang of LANGS) {
    const counts = [];
    for (const part of PARTS) {
      const data = (await readJson(path.join(LOCALES_DIR, lang, `${part}.json`))) ?? {};
      const keys = Object.keys(english[part]);
      const have = keys.filter((k) => typeof data[k] === "string" && data[k].trim() && placeholders(data[k]) === placeholders(english[part][k])).length;
      counts.push(`${part} ${have}/${keys.length}`);
    }
    console.log(`${lang}: ${counts.join(" · ")}`);
  }
} else {
  console.log("usage: studio-i18n.mjs export <workDir> | validate <workDir> <lang> [parts] | merge <workDir> [lang…] | status");
  process.exitCode = 1;
}
