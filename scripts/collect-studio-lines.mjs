/**
 * Collect every host-language line the studio tools speak aloud.
 *
 * Each phase's `src/components/studio/p{N}/content.ts` exports
 * `P{N}_AUDIO_LINES: Partial<Record<LangCode, string[]>>` — the exact strings
 * passed to speak(). This bundles those modules and writes one JSON array per
 * language so a voice script can pregenerate clips for them:
 *
 *   node scripts/collect-studio-lines.mjs ru          # → scripts/.studio-lines-ru.json
 *   node scripts/collect-studio-lines.mjs ru 2,3      # only Phases 2 and 3
 *   node --experimental-strip-types scripts/generate-audio-ru.mjs --lines scripts/.studio-lines-ru.json --dry
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lang = process.argv[2] ?? "ru";
/** optional: only these phases, e.g. `2,3,4` */
const only = process.argv[3] ? new Set(process.argv[3].split(",").map(Number)) : null;

const phases = [];
for (const n of [1, 2, 3, 4, 5, 6].filter((x) => !only || only.has(x))) {
  const file = path.join(ROOT, "src", "components", "studio", `p${n}`, "content.ts");
  try {
    const src = await fs.readFile(file, "utf8");
    if (src.includes(`P${n}_AUDIO_LINES`)) phases.push({ n, file });
  } catch {
    // phase has no content file
  }
}

const entry = phases
  .map(({ n, file }) => `export { P${n}_AUDIO_LINES } from ${JSON.stringify(file)};`)
  .join("\n");

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "nuri-lines-"));
const out = path.join(tmp, "lines.mjs");
await build({
  stdin: { contents: entry, resolveDir: ROOT, loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: out,
  logLevel: "silent",
  alias: { "@": path.join(ROOT, "src") },
  // content modules are data-only; anything React-ish they might touch stays external
  external: ["react", "react-dom", "next", "next/*", "framer-motion", "lucide-react"],
});

const mod = await import(pathToFileURL(out).href);
const lines = new Set();
const perPhase = {};
for (const { n } of phases) {
  const list = mod[`P${n}_AUDIO_LINES`]?.[lang] ?? [];
  perPhase[`p${n}`] = list.length;
  for (const line of list) if (typeof line === "string" && line.trim()) lines.add(line);
}
await fs.rm(tmp, { recursive: true, force: true });

const target = path.join(ROOT, "scripts", `.studio-lines-${lang}.json`);
await fs.writeFile(target, JSON.stringify([...lines], null, 2) + "\n");
const chars = [...lines].reduce((sum, l) => sum + l.length, 0);
console.log(`${lang}: ${lines.size} unique lines, ${chars} characters`, perPhase);
console.log(`→ ${path.relative(ROOT, target)}`);
