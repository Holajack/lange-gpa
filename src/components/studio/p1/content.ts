import type { LangCode } from "@/lib/types";
import { VOCAB_DOMAINS } from "@/lib/vocab";
import { effMeeting } from "@/lib/sessionFlow";
import type { StudioText } from "../types";

/**
 * Phase 1 studio content — everything the grower HEARS in the host language.
 * Nothing here is ever shown in writing (Phase 1 is ears-first), and nothing
 * is translated: meaning comes from the picture, the scene, or the situation.
 *
 * Authored for ru / en / es. Any other target language gets the picture
 * boards + recorder (nurturer-led), plus whatever can be voiced from that
 * language's own vocab deck — never English standing in for it.
 */

export type AuthoredLang = "ru" | "en" | "es";
export const AUTHORED_LANGS: AuthoredLang[] = ["ru", "en", "es"];

export function isAuthored(lang: LangCode): lang is AuthoredLang {
  return lang === "ru" || lang === "en" || lang === "es";
}

/* ------------------------------ vocab access ----------------------------- */

export interface P1Card {
  id: string;
  emoji: string;
  /** the word in the host language — spoken, never displayed */
  word: string;
  domainId: string;
  meeting: number;
}

const ITEMS = new Map<string, { emoji: string; words: Partial<Record<LangCode, string>>; domainId: string; meeting: number }>();
for (const d of VOCAB_DOMAINS) {
  for (const it of d.items) {
    ITEMS.set(it.id, { emoji: it.emoji, words: it.words, domainId: d.id, meeting: effMeeting(d.id, it, d.meeting) });
  }
}

export function vocabWord(id: string, lang: LangCode): string | undefined {
  return ITEMS.get(id)?.words[lang];
}

export function cardById(id: string, lang: LangCode): P1Card | undefined {
  const it = ITEMS.get(id);
  const word = it?.words[lang];
  if (!it || !word) return undefined;
  return { id, emoji: it.emoji, word, domainId: it.domainId, meeting: it.meeting };
}

/** A card for its PICTURE alone — usable even where the deck has no word in `lang` (the word is then empty). */
export function pictureCard(id: string, lang: LangCode): P1Card | undefined {
  const it = ITEMS.get(id);
  if (!it) return undefined;
  return { id, emoji: it.emoji, word: it.words[lang] ?? "", domainId: it.domainId, meeting: it.meeting };
}

const LOCALE: Record<AuthoredLang, string> = { ru: "ru-RU", en: "en-US", es: "es-ES" };

function cap(text: string, lang: AuthoredLang): string {
  return text.charAt(0).toLocaleUpperCase(LOCALE[lang]) + text.slice(1);
}

/* ============================ 1. MAKE IT TRUE ============================ */

export type MtSlotId =
  | "on-table"
  | "under-table"
  | "beside-table"
  | "front-table"
  | "between"
  | "in-house"
  | "behind-house"
  | "front-house"
  | "beside-house";

export interface MtSlot {
  id: MtSlotId;
  /** centre of the slot, in % of the scene box */
  x: number;
  y: number;
  /** drawn behind the house so the thing peeks out from behind it */
  behind?: boolean;
  /** vocab ids this slot exercises (the preposition + its landmarks) */
  vocabIds: string[];
  /** what is said after the thing's name */
  tail: Record<AuthoredLang, string>;
}

export const MT_SLOTS: MtSlot[] = [
  {
    id: "on-table", x: 32, y: 37, vocabIds: ["prep-on", "table"],
    tail: { ru: "на столе", en: "is on the table", es: "está encima de la mesa" },
  },
  {
    id: "under-table", x: 32, y: 64, vocabIds: ["prep-under", "table"],
    tail: { ru: "под столом", en: "is under the table", es: "está debajo de la mesa" },
  },
  {
    id: "beside-table", x: 8.5, y: 66, vocabIds: ["prep-beside", "table"],
    tail: { ru: "рядом со столом", en: "is beside the table", es: "está al lado de la mesa" },
  },
  {
    id: "front-table", x: 32, y: 89, vocabIds: ["prep-infront", "table"],
    tail: { ru: "перед столом", en: "is in front of the table", es: "está delante de la mesa" },
  },
  {
    id: "between", x: 51, y: 66, vocabIds: ["prep-between", "table", "house"],
    tail: { ru: "между столом и домом", en: "is between the table and the house", es: "está entre la mesa y la casa" },
  },
  {
    id: "in-house", x: 70, y: 63, vocabIds: ["prep-in", "house"],
    tail: { ru: "в доме", en: "is in the house", es: "está dentro de la casa" },
  },
  {
    id: "behind-house", x: 83, y: 38, behind: true, vocabIds: ["prep-behind", "house"],
    tail: { ru: "за домом", en: "is behind the house", es: "está detrás de la casa" },
  },
  {
    id: "front-house", x: 70, y: 89, vocabIds: ["prep-infront", "house"],
    tail: { ru: "перед домом", en: "is in front of the house", es: "está delante de la casa" },
  },
  {
    id: "beside-house", x: 91.5, y: 66, vocabIds: ["prep-beside", "house"],
    tail: { ru: "рядом с домом", en: "is beside the house", es: "está al lado de la casa" },
  },
];

/** Small things and animals a nurturer would really pick up and move around. */
export const MT_OBJECT_IDS = [
  "apple", "bread", "egg", "banana", "cup", "key", "book", "phone",
  "ball", "dog", "cat", "mouse", "frog", "animal-duck",
];

/** "The apple is under the table." — one statement that isn't true yet. */
export function mtSentence(lang: LangCode, objectId: string, slot: MtSlot): string | undefined {
  if (!isAuthored(lang)) return undefined;
  const word = vocabWord(objectId, lang);
  if (!word) return undefined;
  if (lang === "en") return `The ${word} ${slot.tail.en}.`;
  return `${cap(word, lang)} ${slot.tail[lang]}.`;
}

/* ========================== 2. CARTOON BUBBLES =========================== */

/** One wordless panel: two figures, maybe a prop between them, maybe bubbles. */
export interface StripPanel {
  /** small scene marker in the corner (place / time of day) */
  scene?: string;
  l?: string;
  r?: string;
  mid?: string;
  /** figures stand apart instead of together */
  apart?: boolean;
  /** id of the utterance in the left / right figure's bubble */
  bubbleL?: string;
  bubbleR?: string;
  /** an empty bubble that is drawn but never asked about */
  quietL?: boolean;
  quietR?: boolean;
}

export interface Strip {
  id: string;
  panels: StripPanel[];
}

export interface Bubble {
  id: string;
  strip: string;
  line: Record<AuthoredLang, string>;
  /** the matching card in the vocab deck, when there is one (credits the word, plays its recorded clip) */
  vocabId?: string;
}

/**
 * Original situation strips, drawn from emoji. The functions are the everyday
 * ones any phrase-carrying picture set covers (greeting, thanking, apologizing,
 * asking the price…); the drawings and the wording are ours.
 */
export const STRIPS: Strip[] = [
  { id: "meet", panels: [
    { scene: "🌳", l: "👩", r: "🧑", apart: true },
    { scene: "🌳", l: "👩👋", r: "👋🧑", bubbleL: "greet", quietR: true },
  ] },
  { id: "meet-elder", panels: [
    { scene: "🌅", l: "🧑", r: "👵", apart: true },
    { scene: "🌅", l: "🧑👋", r: "👵", bubbleL: "greet-elder", quietR: true },
  ] },
  { id: "part", panels: [
    { scene: "🌙", l: "👩", r: "🧑" },
    { scene: "🌙", l: "👩👋", r: "🎒🚶", apart: true, bubbleL: "bye" },
  ] },
  { id: "part-elder", panels: [
    { scene: "🚪", l: "🧑", r: "👴" },
    { scene: "🚪", l: "🎒🧑👋", r: "👴", apart: true, bubbleL: "bye-elder", quietR: true },
  ] },
  { id: "gift", panels: [
    { l: "👩🎁", r: "🧑" },
    { l: "👩", r: "🎁🧑", bubbleR: "thanks" },
    { l: "👩", r: "🧑", bubbleL: "welcome" },
  ] },
  { id: "bump", panels: [
    { l: "🏃", mid: "💥", r: "🧍" },
    { l: "🙇", r: "🧑", bubbleL: "sorry" },
    { l: "🙇", r: "🙂", bubbleR: "thats-ok" },
  ] },
  { id: "sneeze", panels: [
    { l: "🤧", r: "🧑" },
    { l: "🤧", r: "🧑", bubbleR: "bless" },
  ] },
  { id: "time", panels: [
    { scene: "🚌", l: "🧑", mid: "🕐❓", r: "👨⌚", apart: true },
    { scene: "🚌", l: "🧑", r: "👨⌚", bubbleL: "time" },
  ] },
  { id: "door", panels: [
    { scene: "🏠", l: "🚪", r: "✊👫" },
    { scene: "🏠", l: "👩🚪", r: "👫", bubbleL: "come-in" },
  ] },
  { id: "spill", panels: [
    { scene: "🛍️", l: "😩", mid: "🍎🍊" },
    { scene: "🛍️", l: "😩", mid: "🍎🍊", r: "🧑", bubbleL: "help-me" },
  ] },
  { id: "heavy", panels: [
    { l: "🧑", r: "📦📦😓", apart: true },
    { l: "🧑", r: "📦📦😓", bubbleL: "offer-help" },
  ] },
  { id: "danger", panels: [
    { l: "🚶📱", mid: "➡️", r: "🕳️" },
    { l: "🧑", r: "🚶📱🕳️", apart: true, bubbleL: "careful" },
  ] },
  { id: "snack-yes", panels: [
    { l: "👩🍰", r: "🧑", bubbleL: "offer-food" },
    { l: "👩🍰", r: "😋", bubbleR: "yes-please" },
  ] },
  { id: "snack-no", panels: [
    { l: "👩🍰", r: "🧑", quietL: true },
    { l: "👩🍰", r: "🙅", bubbleR: "no-thanks" },
  ] },
  { id: "stall", panels: [
    { scene: "🏪", l: "🧑", mid: "🍎🍌", r: "🧑‍🌾" },
    { scene: "🏪", l: "🧑👉", mid: "🍎🏷️", r: "🧑‍🌾", bubbleL: "price" },
  ] },
  { id: "kids", panels: [
    { scene: "🛝", l: "🧒", r: "👧", apart: true },
    { scene: "🛝", l: "🧒", mid: "🏷️❓", r: "👧", bubbleL: "name" },
  ] },
  { id: "toilet", panels: [
    { l: "😣", r: "🧑", apart: true },
    { l: "😣", r: "🧑👉🚻", bubbleL: "toilet" },
  ] },
  { id: "birthday", panels: [
    { scene: "🎈", l: "🧑", mid: "🎂", r: "🥳" },
    { scene: "🎈", l: "🧑🎁", r: "🥳", bubbleL: "birthday" },
  ] },
];

/** In the order a nurturer would bring them in: greetings first, errands later. */
export const BUBBLES: Bubble[] = [
  { id: "greet", strip: "meet", line: { ru: "Привет!", en: "Hi!", es: "¡Hola!" } },
  { id: "greet-elder", strip: "meet-elder", line: { ru: "Здравствуйте!", en: "Good morning!", es: "¡Buenos días!" } },
  { id: "bye", strip: "part", line: { ru: "Пока!", en: "Bye!", es: "¡Hasta luego!" } },
  { id: "bye-elder", strip: "part-elder", line: { ru: "До свидания!", en: "Goodbye!", es: "¡Adiós!" } },
  { id: "thanks", strip: "gift", vocabId: "expr-thank-you", line: { ru: "Большое спасибо.", en: "Thank you very much.", es: "Muchas gracias." } },
  { id: "welcome", strip: "gift", vocabId: "expr-youre-welcome", line: { ru: "Пожалуйста.", en: "You're welcome.", es: "De nada." } },
  { id: "bless", strip: "sneeze", line: { ru: "Будьте здоровы!", en: "Bless you!", es: "¡Salud!" } },
  { id: "time", strip: "time", line: { ru: "Который час?", en: "What time is it?", es: "¿Qué hora es?" } },
  { id: "sorry", strip: "bump", vocabId: "expr-sorry", line: { ru: "Извините", en: "I'm sorry", es: "Lo siento" } },
  { id: "thats-ok", strip: "bump", vocabId: "expr-thats-ok", line: { ru: "Ничего страшного", en: "That's OK", es: "No pasa nada" } },
  { id: "come-in", strip: "door", line: { ru: "Проходите!", en: "Come in!", es: "¡Adelante!" } },
  { id: "help-me", strip: "spill", vocabId: "expr-request-help", line: { ru: "Помоги мне, пожалуйста.", en: "Please help me.", es: "Ayúdame, por favor." } },
  { id: "offer-help", strip: "heavy", vocabId: "expr-offer-help", line: { ru: "Тебе помочь?", en: "Can I help you?", es: "¿Te ayudo?" } },
  { id: "careful", strip: "danger", vocabId: "expr-be-careful", line: { ru: "Осторожно!", en: "Be careful!", es: "¡Ten cuidado!" } },
  { id: "offer-food", strip: "snack-yes", vocabId: "expr-offer-food", line: { ru: "Хочешь немного?", en: "Would you like some?", es: "¿Quieres un poco?" } },
  { id: "yes-please", strip: "snack-yes", vocabId: "expr-accept-food", line: { ru: "Да, пожалуйста.", en: "Yes, please.", es: "Sí, por favor." } },
  { id: "no-thanks", strip: "snack-no", vocabId: "expr-refuse-food", line: { ru: "Нет, спасибо.", en: "No, thank you.", es: "No, gracias." } },
  { id: "price", strip: "stall", line: { ru: "Сколько это стоит?", en: "How much is this?", es: "¿Cuánto cuesta esto?" } },
  { id: "name", strip: "kids", vocabId: "expr-whats-your-name", line: { ru: "Как тебя зовут?", en: "What is your name?", es: "¿Cómo te llamas?" } },
  { id: "toilet", strip: "toilet", vocabId: "expr-where-toilet", line: { ru: "Где туалет?", en: "Where is the toilet?", es: "¿Dónde está el baño?" } },
  { id: "birthday", strip: "birthday", line: { ru: "С днём рождения!", en: "Happy birthday!", es: "¡Feliz cumpleaños!" } },
];

/**
 * What is said in a bubble, in `lang`. The vocab deck's own wording wins when
 * the expression is a card (so its recorded clip plays, and so languages we
 * did not author here can still voice the bubbles their deck covers).
 */
export function bubbleLine(b: Bubble, lang: LangCode): string | undefined {
  const fromDeck = b.vocabId ? vocabWord(b.vocabId, lang) : undefined;
  if (fromDeck) return fromDeck;
  return isAuthored(lang) ? b.line[lang] : undefined;
}

/* ========================= 3. SOUND DISCRIMINATION ======================== */

/**
 * Pairs of real cards that sound close in each language — true minimal pairs
 * where the deck has them, easily-confused neighbours otherwise. Chosen by
 * hand, by ear (so "суп / зуб" counts: the final б is devoiced).
 */
export const SOUND_PAIRS: Record<AuthoredLang, [string, string][]> = {
  ru: [
    ["table", "chair"], // стол / стул
    ["cat", "tbl-spoon"], // кошка / ложка
    ["nose", "tbl-knife"], // нос / нож
    ["soup", "tooth"], // суп / зуб
    ["cheese", "fam-son"], // сыр / сын
    ["tbl-spoon", "boat"], // ложка / лодка
    ["cup", "cloth-hat"], // чашка / шапка
    ["hand", "nat-river"], // рука / река
    ["num-nine", "num-ten"], // девять / десять
    ["num-five", "drink"], // пять / пить
    ["animal-lion", "nat-forest"], // лев / лес
    ["house", "out-smoke"], // дом / дым
    ["foodx-honey", "water-ice"], // мёд / лёд
    ["foodx-meat", "foodx-oil"], // мясо / масло
    ["bug-fly", "ear"], // муха / ухо
    ["animal-goat", "mat-leather"], // коза / кожа
    ["out-garden", "town-courthouse"], // сад / суд
    ["foodx-salt", "num-zero"], // соль / ноль
  ],
  en: [
    ["sheep", "trav-ship"],
    ["cat", "cloth-hat"],
    ["mouse", "mouth"],
    ["num-three", "tree"],
    ["pen", "small-pin"],
    ["cloth-coat", "animal-goat"],
    ["animal-pig", "adj-big"],
    ["room-wall", "ball"],
    ["key", "drink-tea"],
    ["cup", "verb-cut"],
    ["chair", "hair"],
    ["moon", "tbl-spoon"],
    ["animal-duck", "trav-truck"],
    ["state-sick", "num-six"],
    ["rice", "water-ice"],
    ["num-ten", "out-tent"],
  ],
  es: [
    ["hair", "dog"], // el pelo / el perro
    ["cat", "animal-duck"], // el gato / el pato
    ["house", "bed"], // la casa / la cama
    ["cow", "mouth"], // la vaca / la boca
    ["bear", "eye"], // el oso / el ojo
    ["cup", "small-lid"], // la taza / la tapa
    ["house", "cont-box"], // la casa / la caja
    ["frog", "out-branch"], // la rana / la rama
    ["moon", "mat-wool"], // la luna / la lana
    ["eye", "foodx-garlic"], // el ojo / el ajo
    ["nat-river", "fam-uncle"], // el río / el tío
    ["fam-daughter", "out-leaf"], // la hija / la hoja
    ["room-ceiling", "body-chest"], // el techo / el pecho
    ["num-four", "ord-fourth"], // cuatro / cuarto
    ["num-two", "num-twelve"], // dos / doce
    ["num-sixty", "num-seventy"], // sesenta / setenta
    ["appl-battery", "foodx-pineapple"], // la pila / la piña
    ["wor-candle", "small-cloth"], // la vela / la tela
  ],
};

/* ========================== 4. LADDER OF SUCCESS ========================= */

/** Naming words a 1B grower already understands: things, animals, people, places in the house. */
export const LADDER_DOMAINS = [
  "food", "animals", "home", "body", "family", "tableware", "room",
  "animals-more", "nature", "nature-more", "drinks-more", "insects", "family-more",
];

/** Plural-only cards don't fit the top-rung sentence frame. */
export const LADDER_SKIP = new Set(["friends", "room-stairs"]);

/** Top rung: the word inside the shortest real sentence. */
export function ladderFrame(lang: LangCode, word: string): string | undefined {
  if (lang === "ru") return `Это ${word}.`;
  if (lang === "en") return `This is the ${word}.`;
  if (lang === "es") return `Aquí está ${word}.`;
  return undefined;
}

/* =========================== 5. SIXTEEN PICTURES ========================= */

export interface GapPart {
  /** vocab card id */
  id: string;
  emoji: string;
  clue: StudioText;
}

export const GAP_LANDS: GapPart[] = [
  { id: "mountain", emoji: "⛰️", clue: { ru: "Здесь гора.", en: "I see a mountain.", es: "Veo una montaña." } },
  { id: "sea", emoji: "🌊", clue: { ru: "Здесь море.", en: "I see the sea.", es: "Veo el mar." } },
  { id: "nat-forest", emoji: "🌲", clue: { ru: "Здесь лес.", en: "I see a forest.", es: "Veo un bosque." } },
  { id: "nat-river", emoji: "🏞️", clue: { ru: "Здесь река.", en: "I see a river.", es: "Veo un río." } },
];

export const GAP_SKIES: GapPart[] = [
  { id: "sun", emoji: "☀️", clue: { ru: "Светит солнце.", en: "The sun is shining.", es: "Brilla el sol." } },
  { id: "moon", emoji: "🌙", clue: { ru: "Светит луна.", en: "The moon is shining.", es: "Brilla la luna." } },
  { id: "rain", emoji: "🌧️", clue: { ru: "Идёт дождь.", en: "It is raining.", es: "Está lloviendo." } },
  { id: "snow", emoji: "❄️", clue: { ru: "Идёт снег.", en: "It is snowing.", es: "Está nevando." } },
];

export interface GapPic {
  id: string;
  land: GapPart;
  sky: GapPart;
}

/** Sixteen scenes: every land under every sky, so one clue is never enough. */
export const GAP_PICS: GapPic[] = GAP_LANDS.flatMap((land) =>
  GAP_SKIES.map((sky) => ({ id: `${land.id}+${sky.id}`, land, sky }))
);

/* ============================== 6. MARKETPLACE ============================ */

export interface MarketGood {
  /** vocab card id */
  id: string;
  /** asking price, a round ten so the number words stay inside what was met */
  price: number;
  have: Record<AuthoredLang, string>;
  howMuch: Record<AuthoredLang, string>;
}

export interface MarketStall {
  id: string;
  seller: string;
  goods: MarketGood[];
}

export const MARKET_STALLS: MarketStall[] = [
  {
    id: "fruit",
    seller: "🧑‍🌾",
    goods: [
      {
        id: "apple", price: 50,
        have: { ru: "У вас есть яблоки?", en: "Do you have apples?", es: "¿Tiene manzanas?" },
        howMuch: { ru: "Сколько стоят яблоки?", en: "How much are the apples?", es: "¿Cuánto cuestan las manzanas?" },
      },
      {
        id: "banana", price: 60,
        have: { ru: "У вас есть бананы?", en: "Do you have bananas?", es: "¿Tiene plátanos?" },
        howMuch: { ru: "Сколько стоят бананы?", en: "How much are the bananas?", es: "¿Cuánto cuestan los plátanos?" },
      },
      {
        id: "tomato", price: 40,
        have: { ru: "У вас есть помидоры?", en: "Do you have tomatoes?", es: "¿Tiene tomates?" },
        howMuch: { ru: "Сколько стоят помидоры?", en: "How much are the tomatoes?", es: "¿Cuánto cuestan los tomates?" },
      },
    ],
  },
  {
    id: "dairy",
    seller: "👩‍🍳",
    goods: [
      {
        id: "bread", price: 30,
        have: { ru: "У вас есть хлеб?", en: "Do you have bread?", es: "¿Tiene pan?" },
        howMuch: { ru: "Сколько стоит хлеб?", en: "How much is the bread?", es: "¿Cuánto cuesta el pan?" },
      },
      {
        id: "cheese", price: 90,
        have: { ru: "У вас есть сыр?", en: "Do you have cheese?", es: "¿Tiene queso?" },
        howMuch: { ru: "Сколько стоит сыр?", en: "How much is the cheese?", es: "¿Cuánto cuesta el queso?" },
      },
      {
        id: "milk", price: 70,
        have: { ru: "У вас есть молоко?", en: "Do you have milk?", es: "¿Tiene leche?" },
        howMuch: { ru: "Сколько стоит молоко?", en: "How much is the milk?", es: "¿Cuánto cuesta la leche?" },
      },
    ],
  },
  {
    id: "fresh",
    seller: "🧔",
    goods: [
      {
        id: "egg", price: 40,
        have: { ru: "У вас есть яйца?", en: "Do you have eggs?", es: "¿Tiene huevos?" },
        howMuch: { ru: "Сколько стоят яйца?", en: "How much are the eggs?", es: "¿Cuánto cuestan los huevos?" },
      },
      {
        id: "fish", price: 80,
        have: { ru: "У вас есть рыба?", en: "Do you have fish?", es: "¿Tiene pescado?" },
        howMuch: { ru: "Сколько стоит рыба?", en: "How much is the fish?", es: "¿Cuánto cuesta el pescado?" },
      },
    ],
  },
];

const TENS: Record<AuthoredLang, Record<number, string>> = {
  ru: { 20: "двадцать", 30: "тридцать", 40: "сорок", 50: "пятьдесят", 60: "шестьдесят", 70: "семьдесят", 80: "восемьдесят", 90: "девяносто" },
  en: { 20: "twenty", 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety" },
  es: { 20: "veinte", 30: "treinta", 40: "cuarenta", 50: "cincuenta", 60: "sesenta", 70: "setenta", 80: "ochenta", 90: "noventa" },
};

/** vocab card for each round ten — credited when the grower has bargained with it */
export const TENS_VOCAB: Record<number, string> = {
  20: "num-twenty", 30: "num-thirty", 40: "num-forty", 50: "num-fifty",
  60: "num-sixty", 70: "num-seventy", 80: "num-eighty", 90: "num-ninety",
};

const MARKET_FIXED: Record<"greet" | "yes" | "pay" | "thanks" | "bye", Record<AuthoredLang, string>> = {
  greet: { ru: "Здравствуйте!", en: "Hello!", es: "¡Buenos días!" },
  yes: { ru: "Да, есть.", en: "Yes, I do.", es: "Sí, tengo." },
  pay: { ru: "Вот, пожалуйста.", en: "Here you are.", es: "Aquí tiene." },
  thanks: { ru: "Спасибо!", en: "Thank you!", es: "¡Gracias!" },
  bye: { ru: "До свидания!", en: "Goodbye!", es: "¡Adiós!" },
};

function priceLine(lang: AuthoredLang, n: number): string {
  const w = cap(TENS[lang][n], lang);
  if (lang === "ru") return `${w} рублей.`;
  if (lang === "en") return `${w} cents.`;
  return `${w} céntimos.`;
}

function haggleLine(lang: AuthoredLang, offer: number): string {
  const w = TENS[lang][offer];
  if (lang === "ru") return `Дорого! Давайте за ${w}.`;
  if (lang === "en") return `That's too much. How about ${w}?`;
  return `Es caro. ¿${cap(w, lang)}?`;
}

function agreeLine(lang: AuthoredLang, offer: number): string {
  const w = TENS[lang][offer];
  if (lang === "ru") return `Хорошо, ${w}.`;
  if (lang === "en") return `All right, ${w}.`;
  return `Vale, ${w}.`;
}

export type MarketMove =
  | "greet" | "greetBack" | "have" | "yes" | "howMuch" | "price"
  | "haggle" | "agree" | "pay" | "thanks" | "bye" | "byeBack";

export interface MarketTurn {
  move: MarketMove;
  who: "buyer" | "seller";
  /** picture cue for the turn — what the cue card would show */
  cue: string;
  /** the spoken line; undefined when this language has no script authored */
  line?: string;
}

/**
 * One whole deal, turn by turn: greet → do you have…? → how much? → a price →
 * a counter-offer → agreement → pay → thanks → goodbye. The buyer offers ten
 * less and the seller accepts, so every number stays a round ten.
 */
export function marketTurns(lang: LangCode, good: MarketGood, goodEmoji: string): MarketTurn[] {
  const offer = good.price - 10;
  const a = isAuthored(lang) ? lang : null;
  const fixed = (k: keyof typeof MARKET_FIXED) => (a ? MARKET_FIXED[k][a] : undefined);
  return [
    { move: "greet", who: "buyer", cue: "👋", line: fixed("greet") },
    { move: "greetBack", who: "seller", cue: "👋", line: fixed("greet") },
    { move: "have", who: "buyer", cue: `${goodEmoji}❓`, line: a ? good.have[a] : undefined },
    { move: "yes", who: "seller", cue: `👍${goodEmoji}`, line: fixed("yes") },
    { move: "howMuch", who: "buyer", cue: "🏷️❓", line: a ? good.howMuch[a] : undefined },
    { move: "price", who: "seller", cue: `🏷️ ${good.price}`, line: a ? priceLine(a, good.price) : undefined },
    { move: "haggle", who: "buyer", cue: `😮 ${offer}❓`, line: a ? haggleLine(a, offer) : undefined },
    { move: "agree", who: "seller", cue: `🤝 ${offer}`, line: a ? agreeLine(a, offer) : undefined },
    { move: "pay", who: "buyer", cue: "💵", line: fixed("pay") },
    { move: "thanks", who: "seller", cue: "🙏", line: fixed("thanks") },
    { move: "bye", who: "buyer", cue: "👋", line: fixed("bye") },
    { move: "byeBack", who: "seller", cue: "👋", line: fixed("bye") },
  ];
}

/* ============================= AUDIO CONTRACT ============================= */

function uniq(lines: (string | undefined)[]): string[] {
  return [...new Set(lines.filter((l): l is string => Boolean(l)))];
}

/** Every card the Ladder may put on a rung, for one language: 1A naming words, deck order. */
export function ladderPool(lang: LangCode): P1Card[] {
  const out: P1Card[] = [];
  for (const d of VOCAB_DOMAINS) {
    if (!LADDER_DOMAINS.includes(d.id)) continue;
    for (const it of d.items) {
      const card = cardById(it.id, lang);
      if (card && card.meeting <= 15 && !LADDER_SKIP.has(card.id)) out.push(card);
    }
  }
  return out;
}

function audioLinesFor(lang: AuthoredLang): string[] {
  const makeTrue = MT_OBJECT_IDS.flatMap((id) => MT_SLOTS.map((slot) => mtSentence(lang, id, slot)));
  const bubbles = BUBBLES.map((b) => bubbleLine(b, lang));
  const sounds = SOUND_PAIRS[lang].flatMap(([a, b]) => [vocabWord(a, lang), vocabWord(b, lang)]);
  const ladder = ladderPool(lang).flatMap((c) => [c.word, ladderFrame(lang, c.word)]);
  const gap = [...GAP_LANDS, ...GAP_SKIES].map((p) => p.clue[lang]);
  const market = MARKET_STALLS.flatMap((stall) =>
    stall.goods.flatMap((good) => marketTurns(lang, good, "").map((turn) => turn.line))
  );
  return uniq([...makeTrue, ...bubbles, ...sounds, ...ladder, ...gap, ...market]);
}

/**
 * Every exact string the Phase 1 studio passes to speak(), per language —
 * the list a script pregenerates voice clips from. (Many of the single words
 * already have clips; the sentences are the new ones.)
 */
export const P1_AUDIO_LINES: Partial<Record<LangCode, string[]>> = {
  ru: audioLinesFor("ru"),
  en: audioLinesFor("en"),
  es: audioLinesFor("es"),
};
