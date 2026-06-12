/**
 * Pre-generate flat sticker-style picture-card illustrations for LANGE's
 * GPA vocab decks via the Replicate HTTP API.
 *
 * Run with:
 *   export PATH=~/.nvm/versions/node/v22.22.0/bin:$PATH && \
 *   node --experimental-strip-types scripts/generate-card-images.mjs
 *
 * Flags:
 *   --model flux-schnell | flux-dev | recraft-v3   (default: flux-schnell)
 *   --only apple,dog,ear                           generate only these item ids
 *   --limit 5                                      stop after N new images (test batches)
 *
 * Needs REPLICATE_API_TOKEN in .env at the project root (never printed).
 *
 * Outputs public/cards/{itemId}.webp and maintains public/cards/manifest.json
 * shaped { items: { [itemId]: "/cards/{itemId}.webp" } } — the contract read
 * by src/lib/cards.ts getCardImage().
 *
 * Idempotent: existing non-empty files are skipped (manifest still updated).
 *
 * Card style follows GPA picture-card practice + the research notes:
 * Duolingo's flat 2–4 color illustrations and CapWords' die-cut sticker
 * normalization — ONE unambiguous subject, thick outline, soft shadow,
 * vivid color, zero text, readable at thumbnail size.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VOCAB_DOMAINS } from "../src/lib/vocab.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARDS_DIR = path.join(ROOT, "public", "cards");
const MANIFEST_PATH = path.join(CARDS_DIR, "manifest.json");
const API_BASE = "https://api.replicate.com/v1";
const DELAY_MS = 500; // small pause between predictions — be a polite API citizen
const POLL_MS = 1500;
const POLL_TIMEOUT_MS = 4 * 60 * 1000;

/** Short names → Replicate model slugs. Full owner/name slugs also accepted via --model. */
const MODELS = {
  "flux-schnell": "black-forest-labs/flux-schnell", // cheap + fast default
  "flux-dev": "black-forest-labs/flux-dev",
  "recraft-v3": "recraft-ai/recraft-v3",
};

/**
 * Per-item subject overrides — disambiguation where "a <english word>" alone
 * could mislead the model (body parts need a human close-up, verbs need a
 * person mid-action, text-prone props need "blank/no labels" phrasing, and
 * near-neighbors like bird/chicken need separating detail).
 */
const SUBJECT_OVERRIDES = {
  // body — human close-ups, never animal parts or whole figures
  hand: "one open human hand, palm facing forward, fingers spread",
  eye: "one single open human eye with eyebrow, close-up",
  ear: "one human ear, close-up side view",
  nose: "one human nose, close-up side profile",
  mouth: "one smiling human mouth with lips, close-up",
  foot: "one bare human foot, side view",
  head: "a friendly human head and face, front view, shoulders up",
  tooth: "one single white tooth with roots",
  hair: "wavy hair on top of a human head, close-up",
  heart: "one classic red heart shape",
  // actions — a person caught mid-action
  run: "a person running fast, side view, mid-stride",
  swim: "a person swimming front crawl in blue water",
  jump: "a person jumping high in the air, arms up",
  dance: "a person dancing joyfully, mid-twirl",
  ski: "a person skiing downhill on snow with skis and poles",
  sleep: "a person sleeping peacefully in bed, eyes closed, head on pillow",
  eat: "a person eating a meal with a fork at a plate of food",
  drink: "a person drinking water from a glass, tilted to the lips",
  wash: "a person washing their hands with soap and water bubbles at a faucet",
  cook: "a smiling chef in a white chef hat stirring a pan",
  // people — separable silhouettes for family cards
  mother: "a warm smiling mother gently holding a small child",
  father: "a smiling father carrying a small child on his shoulders",
  baby: "a cute happy baby sitting up in a diaper",
  grandma: "a smiling grandmother with grey hair in a bun and round glasses",
  grandpa: "a smiling grandfather with a grey beard and round glasses",
  boy: "a happy young boy standing and waving",
  girl: "a happy young girl with pigtails standing and waving",
  friends: "two happy friends standing side by side with arms around shoulders",
  doctor: "a friendly doctor in a white coat with a stethoscope",
  teacher: "a friendly teacher holding a pointer stick beside an empty green board",
  farmer: "a farmer in a straw hat holding a pitchfork",
  // text-prone props — force blank surfaces
  book: "one open book with completely blank pages",
  paper: "one blank white sheet of paper",
  map: "a folded paper map with a route line and location pin, no labels",
  ticket: "one blank admission ticket stub with a perforated edge, no writing",
  money: "a neat stack of plain gold coins",
  clock: "one round wall clock with a plain face and two hands, no numerals",
  computer: "one open laptop computer with a blank glowing screen",
  phone: "one smartphone with a blank colorful screen",
  shop: "a small shop storefront with a striped awning and a blank sign",
  hospital: "a hospital building with a red cross symbol on the front",
  medicine: "pill capsules next to a plain medicine bottle, no labels",
  // near-neighbor decks — keep look-alikes apart
  bird: "one small blue songbird perched on a branch",
  chicken: "one white hen with a red comb, standing",
  mouse: "one small grey mouse animal with round ears and a long tail",
  fish: "one whole blue fish, side view",
  // odd emoji ↔ word pairs — trust the word, not the emoji
  water: "one big blue water drop with a small splash",
  cup: "one ceramic cup with gentle steam rising",
  table: "one simple wooden table, four legs",
  lamp: "one desk lamp glowing warmly",
  "tooth-brush": "one toothbrush with a stripe of toothpaste on the bristles",
  ball: "one classic black and white soccer ball",
  basketball: "one orange basketball with black lines",
  tennis: "one tennis racket with a yellow tennis ball",
  rain: "one grey cloud with falling blue raindrops",
  snow: "one large ornate snowflake",
  sea: "rolling blue ocean waves with white foam",
  fire: "one campfire flame on small logs",
  boat: "one small sailboat with a white sail on water",
  road: "one winding asphalt road with a dashed center line vanishing to the horizon",
};

/** Die-cut sticker recipe baked into every prompt. */
const STYLE =
  "flat sticker-style illustration, die-cut sticker, thick clean dark outline, " +
  "soft drop shadow, vivid saturated colors, simple flat shading with 2 to 4 colors, " +
  "solid pale cream background, centered single subject with generous margins, " +
  "bold simple shapes readable at thumbnail size, friendly children's picture-card art";

const NO_TEXT =
  "ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO LABELS, NO CAPTIONS, " +
  "NO WATERMARK, NO SIGNATURE";

function promptFor(domain, item) {
  const subject = SUBJECT_OVERRIDES[item.id] ?? `one single ${item.words.en}`;
  const domainName = domain.names.en ?? domain.id;
  return (
    `${STYLE}. Subject: ${subject} — the meaning of the ${item.emoji} emoji, ` +
    `for a "${domainName}" picture-card deck. Exactly ONE unambiguous subject, ` +
    `nothing else in frame. ${NO_TEXT}.`
  );
}

/** Per-model prediction input. */
function inputFor(modelSlug, prompt) {
  if (modelSlug === MODELS["recraft-v3"]) {
    return { prompt, size: "1024x1024", style: "digital_illustration" };
  }
  const input = {
    prompt,
    aspect_ratio: "1:1",
    num_outputs: 1,
    output_format: "webp",
    output_quality: 90,
  };
  if (modelSlug === MODELS["flux-schnell"]) {
    input.go_fast = true;
    input.megapixels = "1";
  }
  return input;
}

/** Read the token from .env (or the environment) without ever printing it. */
async function readToken() {
  let envText = "";
  try {
    envText = await fs.readFile(path.join(ROOT, ".env"), "utf8");
  } catch {
    /* no .env yet — fall through to process.env */
  }
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*REPLICATE_API_TOKEN\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  return process.env.REPLICATE_API_TOKEN ?? null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(token, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** Create a prediction on an official model, poll until done, return the image URL. */
async function generateImage(token, modelSlug, prompt) {
  const created = await api(token, `${API_BASE}/models/${modelSlug}/predictions`, {
    method: "POST",
    body: JSON.stringify({ input: inputFor(modelSlug, prompt) }),
  });

  const pollUrl = created.urls?.get ?? `${API_BASE}/predictions/${created.id}`;
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let prediction = created;

  while (prediction.status === "starting" || prediction.status === "processing") {
    if (Date.now() > deadline) throw new Error(`timed out polling prediction ${created.id}`);
    await sleep(POLL_MS);
    prediction = await api(token, pollUrl);
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`prediction ${prediction.status}: ${String(prediction.error ?? "no detail")}`);
  }

  // flux models return an array of URLs; recraft returns a single URL
  const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (typeof url !== "string" || !url) throw new Error("prediction succeeded but returned no output URL");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** One retry on 429/5xx, mirroring generate-audio's soft-fail policy. */
async function generateWithRetry(token, modelSlug, prompt) {
  try {
    return await generateImage(token, modelSlug, prompt);
  } catch (err) {
    if (err.status === 429 || (err.status >= 500 && err.status < 600)) {
      console.log(`    retrying after ${err.status}...`);
      await sleep(4000);
      return await generateImage(token, modelSlug, prompt);
    }
    throw err;
  }
}

async function fileExists(p) {
  try {
    const stat = await fs.stat(p);
    return stat.size > 0;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const args = { model: "flux-schnell", only: null, limit: Infinity };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--model") args.model = argv[++i];
    else if (a.startsWith("--model=")) args.model = a.slice("--model=".length);
    else if (a === "--only") args.only = argv[++i];
    else if (a.startsWith("--only=")) args.only = a.slice("--only=".length);
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a.startsWith("--limit=")) args.limit = Number(a.slice("--limit=".length));
    else {
      console.error(`Unknown flag: ${a}`);
      console.error("Usage: node --experimental-strip-types scripts/generate-card-images.mjs " +
        "[--model flux-schnell|flux-dev|recraft-v3] [--only id1,id2] [--limit N]");
      process.exit(1);
    }
  }
  if (args.limit !== Infinity && (!Number.isFinite(args.limit) || args.limit < 1)) {
    console.error("--limit must be a positive number");
    process.exit(1);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  const modelSlug = MODELS[args.model] ?? (args.model.includes("/") ? args.model : null);
  if (!modelSlug) {
    console.error(`Unknown model "${args.model}". Use one of: ${Object.keys(MODELS).join(", ")}`);
    process.exit(1);
  }

  const token = await readToken();
  if (!token) {
    console.log("No REPLICATE_API_TOKEN yet — nothing generated.");
    console.log("Add a line like this to .env at the project root, then re-run:");
    console.log("");
    console.log("  REPLICATE_API_TOKEN=r8_...");
    console.log("");
    console.log("Grab a key at https://replicate.com/account/api-tokens");
    process.exit(1);
  }

  const onlyIds = args.only
    ? new Set(args.only.split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  await fs.mkdir(CARDS_DIR, { recursive: true });

  let manifest = { items: {} };
  try {
    const existing = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
    if (existing && typeof existing.items === "object" && existing.items !== null) manifest = existing;
  } catch {
    /* fresh manifest */
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Model: ${modelSlug}`);

  for (const domain of VOCAB_DOMAINS) {
    for (const item of domain.items) {
      if (onlyIds && !onlyIds.has(item.id)) continue;
      if (!item.words.en) continue;

      const outPath = path.join(CARDS_DIR, `${item.id}.webp`);
      const publicPath = `/cards/${item.id}.webp`;

      if (await fileExists(outPath)) {
        manifest.items[item.id] = publicPath;
        skipped++;
        continue;
      }

      // --limit caps NEW generations; keep scanning so existing files still land in the manifest
      if (generated >= args.limit) continue;

      try {
        const image = await generateWithRetry(token, modelSlug, promptFor(domain, item));
        await fs.writeFile(outPath, image);
        manifest.items[item.id] = publicPath;
        generated++;
        console.log(`  ${domain.id}/${item.id} → ${publicPath}  (${image.length.toLocaleString()} bytes)`);
      } catch (err) {
        failed++;
        console.error(`  FAIL ${domain.id}/${item.id}: ${err.message}`);
      }
      await sleep(DELAY_MS);
    }
  }

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nDone. generated=${generated} skipped=${skipped} failed=${failed}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
