import type { LangCode } from "@/lib/types";
import type { StudioText } from "../types";

/**
 * Phase 3 host-language content. Everything the grower HEARS from Nuri (or
 * reads after hearing it) lives here, authored per language. A language that
 * isn't authored gets no solo content at all: the tools fall back to the
 * nurturer-led workbench.
 *
 * All tales are original, simple retellings of public-domain folk tales. The
 * action sequences and flood sentences are original. Nothing here is a
 * "story from the host culture": those only ever come from a real person.
 */

export const P3_LANGS: LangCode[] = ["ru", "en", "es"];
export const hasP3Content = (lang: LangCode): boolean => P3_LANGS.includes(lang);

const tx = (ru: string, en: string, es: string): StudioText => ({ ru, en, es });

/* ------------------------------------------------------------------ *
 *  Things the grower SAYS to a real person. Nuri only models how they
 *  sound; the answer always comes from the person.
 * ------------------------------------------------------------------ */

export interface PhraseDef {
  id: string;
  /** st3_ key naming what the phrase is for (interface language) */
  labelKey: string;
  text: StudioText;
}

/** The four negotiation moves of massaging a recording. */
export const MOVES: PhraseDef[] = [
  {
    id: "mv-again",
    labelKey: "st3_mvAgain",
    text: tx("Повторите, пожалуйста, ещё раз.", "Could you say that again, please?", "¿Puede repetirlo, por favor?"),
  },
  {
    id: "mv-pieces",
    labelKey: "st3_mvPieces",
    text: tx(
      "Скажите это медленно, по частям.",
      "Could you say it slowly, in small pieces?",
      "¿Puede decirlo despacio, por partes?"
    ),
  },
  {
    id: "mv-meaning",
    labelKey: "st3_mvMeaning",
    text: tx("Что значит это слово?", "What does that word mean?", "¿Qué significa esa palabra?"),
  },
  {
    id: "mv-example",
    labelKey: "st3_mvExample",
    text: tx("Приведите, пожалуйста, пример.", "Could you give me an example?", "¿Me puede dar un ejemplo?"),
  },
];

export const BRIDGE_ASKS: PhraseDef[] = [
  {
    id: "br-tell",
    labelKey: "st3_brAskTell",
    text: tx(
      "Расскажите, пожалуйста, эту сказку медленно, своими словами.",
      "Please tell me this story slowly, in your own words.",
      "Cuénteme, por favor, este cuento despacio y con sus propias palabras."
    ),
  },
  {
    id: "br-retell",
    labelKey: "st3_brAskRetell",
    text: tx(
      "Теперь я попробую рассказать эту историю.",
      "Now let me try to tell the story.",
      "Ahora voy a intentar contar el cuento."
    ),
  },
];

export const SCRIPT_PROBES: PhraseDef[] = [
  {
    id: "sc-open",
    labelKey: "st3_scAskOpen",
    text: tx(
      "Расскажите, пожалуйста, как это обычно бывает у вас.",
      "Please tell me how this usually goes here.",
      "Cuénteme, por favor, cómo es esto normalmente aquí."
    ),
  },
  {
    id: "sc-first",
    labelKey: "st3_scAskFirst",
    text: tx("С чего вы начинаете?", "What do you do first?", "¿Qué hace primero?"),
  },
  {
    id: "sc-next",
    labelKey: "st3_scAskNext",
    text: tx("А что потом?", "And then what?", "¿Y después?"),
  },
  {
    id: "sc-between",
    labelKey: "st3_scAskBetween",
    text: tx(
      "А между этим вы что-нибудь делаете?",
      "Is there anything you do in between?",
      "¿Hace algo más entre una cosa y la otra?"
    ),
  },
  {
    id: "sc-smaller",
    labelKey: "st3_scAskSmaller",
    text: tx(
      "Расскажите об этом подробнее, шаг за шагом.",
      "Tell me that part in smaller steps.",
      "Cuénteme esa parte paso a paso."
    ),
  },
  {
    id: "sc-end",
    labelKey: "st3_scAskEnd",
    text: tx("Чем всё заканчивается?", "How does it end?", "¿Cómo termina?"),
  },
];

export const PROP_ANGLES: PhraseDef[] = [
  { id: "pr-what", labelKey: "st3_prAngWhat", text: tx("Что это такое?", "What is this?", "¿Qué es esto?") },
  { id: "pr-from", labelKey: "st3_prAngFrom", text: tx("Откуда это?", "Where is it from?", "¿De dónde es?") },
  { id: "pr-for", labelKey: "st3_prAngFor", text: tx("Для чего это нужно?", "What is it for?", "¿Para qué sirve?") },
  { id: "pr-who", labelKey: "st3_prAngWho", text: tx("Кто этим пользуется?", "Who uses it?", "¿Quién lo usa?") },
  {
    id: "pr-do",
    labelKey: "st3_prAngDo",
    text: tx("Что с этим можно делать?", "What can you do with it?", "¿Qué se puede hacer con esto?"),
  },
  {
    id: "pr-made",
    labelKey: "st3_prAngMade",
    text: tx("Из чего это сделано?", "What is it made of?", "¿De qué está hecho?"),
  },
  {
    id: "pr-broken",
    labelKey: "st3_prAngBroken",
    text: tx(
      "А если это сломается, что вы делаете?",
      "What do you do if it breaks?",
      "¿Qué hace usted si se rompe?"
    ),
  },
  {
    id: "pr-memory",
    labelKey: "st3_prAngMemory",
    text: tx(
      "Вы помните какой-нибудь случай с такой вещью?",
      "Do you remember a time with something like this?",
      "¿Recuerda alguna historia con algo así?"
    ),
  },
];

export const REMINISCE_PHRASES: PhraseDef[] = [
  {
    id: "rm-open",
    labelKey: "st3_rmAskOpen",
    text: tx(
      "Расскажите, пожалуйста, что мы с вами делали.",
      "Please tell me about what we did together.",
      "Cuénteme, por favor, lo que hicimos juntos."
    ),
  },
  { id: "rm-yes", labelKey: "st3_rmSigYes", text: tx("Да-да.", "Yeah.", "Sí, sí.") },
  { id: "rm-really", labelKey: "st3_rmSigReally", text: tx("Правда?", "Really?", "¿De verdad?") },
  { id: "rm-see", labelKey: "st3_rmSigSee", text: tx("Понятно.", "I see.", "Ya veo.") },
  { id: "rm-then", labelKey: "st3_rmSigThen", text: tx("А потом?", "And then?", "¿Y después?") },
  { id: "rm-remember", labelKey: "st3_rmSigRemember", text: tx("Я помню!", "I remember that!", "¡Me acuerdo!") },
];

export const HOST_ASKS: PhraseDef[] = [
  {
    id: "hs-list",
    labelKey: "st3_hsAskList",
    text: tx(
      "Какие сказки у вас знают все?",
      "Which stories does everyone here know?",
      "¿Qué cuentos conoce todo el mundo aquí?"
    ),
  },
  {
    id: "hs-gist",
    labelKey: "st3_hsAskGist",
    text: tx(
      "Расскажите сначала коротко и просто, о чём эта история.",
      "First tell me, short and simple, what the story is about.",
      "Primero cuénteme, corto y sencillo, de qué trata el cuento."
    ),
  },
  {
    id: "hs-full",
    labelKey: "st3_hsAskFull",
    text: tx(
      "А теперь расскажите всю историю так, как её рассказывают детям.",
      "Now tell me the whole story, the way it is told to children.",
      "Ahora cuénteme todo el cuento, como se lo cuentan a los niños."
    ),
  },
];

export const FLOOD_ASKS: PhraseDef[] = [
  {
    id: "fl-many",
    labelKey: "st3_flAskMany",
    text: tx(
      "Скажите, пожалуйста, много таких предложений.",
      "Please say lots of sentences like that.",
      "Dígame, por favor, muchas frases así."
    ),
  },
];

export const CARTOON_ASKS: PhraseDef[] = [
  {
    id: "ct-tell",
    labelKey: "st3_ctAskTell",
    text: tx(
      "Рассказывайте, что вы видите. Я не смотрю.",
      "Tell me what you see. I am not looking.",
      "Cuénteme lo que ve. Yo no miro."
    ),
  },
  {
    id: "ct-again",
    labelKey: "st3_ctAskAgain",
    text: tx(
      "Расскажите это ещё раз, уже без картинок.",
      "Now tell it once more, without the pictures.",
      "Ahora cuéntelo otra vez, ya sin las imágenes."
    ),
  },
];

/* ------------------------------------------------------------------ *
 *  Bridge-story rehearsal: public-domain folk tales, retold simply.
 *  `pic` is a wordless picture (emoji; ":turnip:" renders a drawn turnip).
 *  `simpler` is an easier host-language way to say the same sentence.
 *  `words` point at host-language-only explanations of hard words.
 * ------------------------------------------------------------------ */

export interface TaleSentence {
  text: StudioText;
  pic: string;
  simpler?: StudioText;
  words?: string[];
}

export interface HardWord {
  /** the word as it is logged (shown only after its sentence has been heard) */
  word: StudioText;
  /** a host-language explanation, never a translation */
  explain: StudioText;
  pic: string;
}

export interface Tale {
  id: string;
  /** st3_ key of the tale's name in the interface language */
  titleKey: string;
  emoji: string;
  /** wordless cast strip, so the grower can tell which known story this is */
  cast: string;
  sentences: TaleSentence[];
  words: Record<string, HardWord>;
}

const TURNIP: Tale = {
  id: "turnip",
  titleKey: "st3_taleTurnip",
  emoji: "🌱",
  cast: "👴 👵 👧 🐕 🐈 🐁 :turnip:",
  words: {
    turnip: {
      word: tx("репка", "turnip", "nabo"),
      explain: tx(
        "Репка — это овощ. Она растёт в земле.",
        "A turnip is a vegetable. It grows in the ground.",
        "El nabo es una verdura. Crece dentro de la tierra."
      ),
      pic: ":turnip:",
    },
    garden: {
      word: tx("огород", "garden", "huerto"),
      explain: tx(
        "Огород — это место возле дома, где растут овощи.",
        "A garden is a place by the house where vegetables grow.",
        "El huerto es un lugar cerca de la casa donde crecen las verduras."
      ),
      pic: "🏡 🥕 🥬",
    },
    pull: {
      word: tx("тянуть", "pull", "tirar"),
      explain: tx(
        "Тянуть — значит взять что-то руками и двигать к себе.",
        "To pull is to hold something and move it toward you.",
        "Tirar es agarrar algo y moverlo hacia ti."
      ),
      pic: "🤲 ⬅️",
    },
    call: {
      word: tx("позвать", "call", "llamar"),
      explain: tx(
        "Позвать — значит громко сказать: «Иди сюда!»",
        "To call someone is to say loudly: come here!",
        "Llamar a alguien es decirle en voz alta: ¡ven aquí!"
      ),
      pic: "📣 👋",
    },
    granddaughter: {
      word: tx("внучка", "granddaughter", "nieta"),
      explain: tx(
        "Внучка — это дочка сына или дочки.",
        "A granddaughter is the daughter of your son or your daughter.",
        "La nieta es la hija de tu hijo o de tu hija."
      ),
      pic: "👵 ➡️ 👩 ➡️ 👧",
    },
    strength: {
      word: tx("изо всех сил", "as hard as they could", "con todas sus fuerzas"),
      explain: tx(
        "Изо всех сил — значит очень-очень сильно.",
        "As hard as they could means very, very hard.",
        "Con todas sus fuerzas quiere decir muy, muy fuerte."
      ),
      pic: "💪 💪",
    },
  },
  sentences: [
    { text: tx("Жил-был дед.", "Once there was an old man.", "Había una vez un abuelo."), pic: "👴" },
    {
      text: tx(
        "Весной дед посадил в огороде репку.",
        "In spring he planted a turnip in his garden.",
        "En primavera plantó un nabo en su huerto."
      ),
      pic: "👴 🌱",
      words: ["turnip", "garden"],
    },
    {
      text: tx("Репка росла всё лето.", "The turnip grew all summer.", "El nabo creció todo el verano."),
      pic: "☀️ 🌱",
    },
    {
      text: tx(
        "Она выросла большая-пребольшая.",
        "It grew bigger and bigger, until it was huge.",
        "Creció y creció, hasta hacerse enorme."
      ),
      pic: "🌱 ➡️ :turnip:",
      simpler: tx(
        "Репка стала очень большая.",
        "The turnip was now very, very big.",
        "El nabo ya era muy, muy grande."
      ),
    },
    {
      text: tx(
        "Осенью дед пошёл в огород.",
        "In autumn the old man went out to the garden.",
        "En otoño el abuelo fue al huerto."
      ),
      pic: "🍂 👴",
    },
    {
      text: tx(
        "Он взялся за репку и стал тянуть.",
        "He took hold of the turnip and began to pull.",
        "Agarró el nabo y empezó a tirar."
      ),
      pic: "👴 🤲 :turnip:",
      words: ["pull"],
    },
    {
      text: tx(
        "Тянет-потянет, а вытянуть не может.",
        "He pulled and pulled, but the turnip did not come out.",
        "Tiró y tiró, pero no pudo sacarlo."
      ),
      pic: "👴 😓 :turnip:",
      simpler: tx(
        "Дед тянет долго, но репка остаётся в земле.",
        "He pulled for a long time, but the turnip stayed in the ground.",
        "Tiró mucho tiempo, pero el nabo se quedó en la tierra."
      ),
    },
    {
      text: tx("Тогда дед позвал бабку.", "So the old man called his wife.", "Entonces el abuelo llamó a la abuela."),
      pic: "👴 📣 👵",
      words: ["call"],
    },
    {
      text: tx(
        "Бабка взялась за деда, дед — за репку.",
        "The old woman held on to the old man, and the old man held on to the turnip.",
        "La abuela agarró al abuelo, y el abuelo agarró el nabo."
      ),
      pic: "👵 👴 :turnip:",
      simpler: tx(
        "Бабка держит деда, а дед держит репку.",
        "The old woman held the old man. The old man held the turnip.",
        "La abuela sujetó al abuelo. El abuelo sujetó el nabo."
      ),
    },
    {
      text: tx(
        "Тянут-потянут, а вытянуть не могут.",
        "They pulled and pulled, but they could not pull it out.",
        "Tiraron y tiraron, pero no pudieron sacarlo."
      ),
      pic: "👵 👴 😓 :turnip:",
    },
    {
      text: tx(
        "Бабка позвала внучку.",
        "The old woman called their granddaughter.",
        "La abuela llamó a la nieta."
      ),
      pic: "👵 📣 👧",
      words: ["granddaughter"],
    },
    {
      text: tx(
        "Внучка взялась за бабку, и они снова стали тянуть.",
        "The girl held on to her grandmother, and they began to pull again.",
        "La nieta agarró a la abuela, y volvieron a tirar."
      ),
      pic: "👧 👵 👴 :turnip:",
    },
    {
      text: tx(
        "Но репка сидела в земле крепко.",
        "But the turnip sat tight in the ground.",
        "Pero el nabo seguía bien metido en la tierra."
      ),
      pic: ":turnip: ⬇️ 🟫",
      simpler: tx("Репка не двигалась.", "The turnip did not move.", "El nabo no se movió."),
    },
    {
      text: tx("Внучка позвала собаку Жучку.", "The girl called the dog.", "La nieta llamó al perro."),
      pic: "👧 📣 🐕",
    },
    {
      text: tx(
        "Жучка прибежала и тоже стала помогать.",
        "The dog came running and began to help too.",
        "El perro vino corriendo y también se puso a ayudar."
      ),
      pic: "🐕 💨",
    },
    {
      text: tx(
        "Тянут-потянут, а репка всё сидит в земле.",
        "They pulled and pulled, and still the turnip stayed in the ground.",
        "Tiraron y tiraron, y el nabo seguía en la tierra."
      ),
      pic: "🐕 👧 👵 👴 :turnip:",
    },
    {
      text: tx("Тогда Жучка позвала кошку.", "Then the dog called the cat.", "Entonces el perro llamó al gato."),
      pic: "🐕 📣 🐈",
    },
    {
      text: tx(
        "Кошка взялась за Жучку, но и вместе они не вытянули репку.",
        "The cat held on to the dog, but even together they could not pull the turnip out.",
        "El gato agarró al perro, pero ni siquiera juntos pudieron sacar el nabo."
      ),
      pic: "🐈 🐕 👧 👵 👴 :turnip:",
      simpler: tx(
        "Кошка тоже помогала, но репка всё ещё была в земле.",
        "The cat helped too, but the turnip was still in the ground.",
        "El gato también ayudó, pero el nabo seguía en la tierra."
      ),
    },
    {
      text: tx("Наконец кошка позвала мышку.", "At last the cat called the mouse.", "Por fin el gato llamó al ratón."),
      pic: "🐈 📣 🐁",
    },
    {
      text: tx(
        "Мышка была совсем маленькая, но тоже взялась помогать.",
        "The mouse was very small, but she wanted to help too.",
        "El ratón era muy pequeño, pero también quiso ayudar."
      ),
      pic: "🐁",
    },
    {
      text: tx(
        "Все вместе потянули изо всех сил.",
        "They all pulled together as hard as they could.",
        "Todos juntos tiraron con todas sus fuerzas."
      ),
      pic: "🐁 🐈 🐕 👧 👵 👴 💪",
      words: ["strength"],
    },
    { text: tx("И вытянули репку!", "And out came the turnip!", "¡Y el nabo salió!"), pic: ":turnip: 🎉" },
    {
      text: tx(
        "Бабка сварила из репки кашу.",
        "The old woman cooked the turnip for supper.",
        "La abuela preparó una sopa con el nabo."
      ),
      pic: "👵 🍲",
    },
    {
      text: tx(
        "Каши хватило всем: и деду, и бабке, и внучке, и Жучке, и кошке, и мышке.",
        "There was enough for everyone: the old man, the old woman, the girl, the dog, the cat and the mouse.",
        "Hubo suficiente para todos: el abuelo, la abuela, la nieta, el perro, el gato y el ratón."
      ),
      pic: "👴 👵 👧 🐕 🐈 🐁 🍲",
      simpler: tx(
        "Все ели кашу. Каши было много.",
        "Everyone ate. There was a lot of food.",
        "Todos comieron. Había mucha comida."
      ),
    },
  ],
};

const PIGS: Tale = {
  id: "pigs",
  titleKey: "st3_talePigs",
  emoji: "🐷",
  cast: "🐷 🐷 🐷 🏠 🐺",
  words: {
    lazy: {
      word: tx("ленивый", "lazy", "perezoso"),
      explain: tx(
        "Ленивый человек не любит работать. Он любит только отдыхать.",
        "A lazy person does not like to work. He only likes to rest.",
        "Una persona perezosa no quiere trabajar. Solo quiere descansar."
      ),
      pic: "😴 🛋️",
    },
    straw: {
      word: tx("солома", "straw", "paja"),
      explain: tx("Солома — это сухая жёлтая трава.", "Straw is dry yellow grass.", "La paja es hierba seca y amarilla."),
      pic: "🌾",
    },
    brick: {
      word: tx("кирпич", "brick", "ladrillo"),
      explain: tx(
        "Кирпичи твёрдые и тяжёлые. Из них строят дома.",
        "Bricks are hard and heavy. People build houses with them.",
        "Los ladrillos son duros y pesados. Con ellos se construyen casas."
      ),
      pic: "🧱",
    },
    knock: {
      word: tx("постучать", "knock", "tocar la puerta"),
      explain: tx(
        "Постучать — значит ударить рукой в дверь: тук-тук.",
        "To knock is to hit the door with your hand: knock, knock.",
        "Tocar la puerta es golpearla con la mano: toc, toc."
      ),
      pic: "✊ 🚪",
    },
    blow: {
      word: tx("дунуть", "blow", "soplar"),
      explain: tx(
        "Дунуть — значит сильно выпустить воздух изо рта.",
        "To blow is to push air out of your mouth.",
        "Soplar es echar aire por la boca."
      ),
      pic: "🌬️",
    },
    chimney: {
      word: tx("труба", "chimney", "chimenea"),
      explain: tx(
        "Труба стоит на крыше. Из неё идёт дым.",
        "The chimney is on the roof. Smoke comes out of it.",
        "La chimenea está en el techo. Por ella sale el humo."
      ),
      pic: "🏠 💨",
    },
    pot: {
      word: tx("котёл", "pot", "olla"),
      explain: tx(
        "Котёл — это очень большая кастрюля.",
        "A pot is what you cook soup in.",
        "La olla es donde se cocina la sopa."
      ),
      pic: "🍲",
    },
  },
  sentences: [
    {
      text: tx("Жили-были три поросёнка.", "Once there were three little pigs.", "Había una vez tres cerditos."),
      pic: "🐷 🐷 🐷",
    },
    {
      text: tx(
        "Они были братья и жили вместе с мамой.",
        "They were brothers, and they lived with their mother.",
        "Eran hermanos y vivían con su mamá."
      ),
      pic: "🐷 🐷 🐷 🐖",
    },
    {
      text: tx(
        "Однажды мама сказала: «Вы уже большие. Пора строить свои дома».",
        "One day their mother said, “You are big now. It is time to build your own houses.”",
        "Un día la mamá dijo: «Ya son grandes. Es hora de construir sus propias casas»."
      ),
      pic: "🐖 💬 🏠 🏠 🏠",
      simpler: tx(
        "Мама сказала: «Теперь каждый будет жить в своём доме».",
        "Their mother said, “Now each of you will live in your own house.”",
        "La mamá dijo: «Ahora cada uno va a vivir en su casa»."
      ),
    },
    {
      text: tx("Первый поросёнок был ленивый.", "The first little pig was lazy.", "El primer cerdito era perezoso."),
      pic: "🐷 😴",
      words: ["lazy"],
    },
    {
      text: tx(
        "Он быстро построил дом из соломы.",
        "He quickly built a house of straw.",
        "Construyó rápido una casa de paja."
      ),
      pic: "🐷 🌾 🏠",
      words: ["straw"],
    },
    {
      text: tx(
        "Второй поросёнок тоже не любил работать.",
        "The second little pig did not like to work either.",
        "Al segundo cerdito tampoco le gustaba trabajar."
      ),
      pic: "🐷 🥱",
    },
    {
      text: tx("Он построил дом из палок.", "He built a house of sticks.", "Construyó una casa de palos."),
      pic: "🐷 🪵 🏠",
    },
    {
      text: tx(
        "Третий поросёнок работал долго.",
        "The third little pig worked for a long time.",
        "El tercer cerdito trabajó mucho tiempo."
      ),
      pic: "🐷 🔨 ⏳",
    },
    {
      text: tx(
        "Он построил крепкий дом из кирпичей.",
        "He built a strong house of bricks.",
        "Construyó una casa fuerte de ladrillos."
      ),
      pic: "🐷 🧱 🏠",
      words: ["brick"],
    },
    {
      text: tx(
        "Однажды из леса пришёл голодный волк.",
        "One day a hungry wolf came out of the forest.",
        "Un día salió del bosque un lobo hambriento."
      ),
      pic: "🌲 🐺",
    },
    {
      text: tx(
        "Он постучал в дверь дома из соломы.",
        "He knocked on the door of the straw house.",
        "Tocó la puerta de la casa de paja."
      ),
      pic: "🐺 ✊ 🚪",
      words: ["knock"],
    },
    {
      text: tx(
        "«Поросёнок, пусти меня в дом!» — сказал волк.",
        "“Little pig, let me in!” said the wolf.",
        "«¡Cerdito, déjame entrar!», dijo el lobo."
      ),
      pic: "🐺 💬 🚪",
    },
    {
      text: tx("«Не пущу!» — ответил поросёнок.", "“No, I won't!” said the little pig.", "«¡No te dejo!», contestó el cerdito."),
      pic: "🐷 🙅",
    },
    {
      text: tx(
        "Тогда волк дунул изо всех сил, и дом из соломы улетел.",
        "So the wolf blew as hard as he could, and the straw house flew away.",
        "Entonces el lobo sopló con todas sus fuerzas, y la casa de paja salió volando."
      ),
      pic: "🐺 🌬️ 🌾",
      words: ["blow"],
      simpler: tx(
        "Волк сильно дунул. Дома из соломы больше не было.",
        "The wolf blew very hard. The straw house was gone.",
        "El lobo sopló muy fuerte. La casa de paja ya no estaba."
      ),
    },
    {
      text: tx(
        "Поросёнок побежал к брату, в дом из палок.",
        "The little pig ran to his brother, to the house of sticks.",
        "El cerdito corrió a casa de su hermano, a la casa de palos."
      ),
      pic: "🐷 💨 🪵 🏠",
    },
    {
      text: tx("Волк пришёл и туда.", "The wolf came there too.", "El lobo llegó allí también."),
      pic: "🐺 🪵 🏠",
    },
    {
      text: tx(
        "Он дунул раз, дунул другой, и дом из палок упал.",
        "He blew once, he blew twice, and the house of sticks fell down.",
        "Sopló una vez, sopló otra vez, y la casa de palos se cayó."
      ),
      pic: "🐺 🌬️ 🪵",
      simpler: tx(
        "Волк дунул два раза. Дом из палок упал.",
        "The wolf blew two times. The stick house fell down.",
        "El lobo sopló dos veces. La casa de palos se cayó."
      ),
    },
    {
      text: tx(
        "Два поросёнка побежали к третьему брату.",
        "The two little pigs ran to their third brother.",
        "Los dos cerditos corrieron a casa del tercer hermano."
      ),
      pic: "🐷 🐷 💨",
    },
    {
      text: tx(
        "Они вбежали в кирпичный дом и закрыли дверь.",
        "They ran into the brick house and shut the door.",
        "Entraron en la casa de ladrillos y cerraron la puerta."
      ),
      pic: "🐷 🐷 🐷 🧱 🚪",
    },
    {
      text: tx(
        "Волк дул, дул, но дом стоял.",
        "The wolf blew and blew, but the house stood.",
        "El lobo sopló y sopló, pero la casa no se movió."
      ),
      pic: "🐺 🌬️ 🧱 🏠",
    },
    {
      text: tx(
        "Тогда волк залез на крышу.",
        "Then the wolf climbed onto the roof.",
        "Entonces el lobo subió al techo."
      ),
      pic: "🐺 ⬆️ 🏠",
    },
    {
      text: tx(
        "Он хотел попасть в дом через трубу.",
        "He wanted to get into the house through the chimney.",
        "Quería entrar en la casa por la chimenea."
      ),
      pic: "🐺 ⬇️ 🏠",
      words: ["chimney"],
      simpler: tx(
        "Волк хотел войти в дом сверху.",
        "The wolf wanted to come into the house from the top.",
        "El lobo quería entrar en la casa por arriba."
      ),
    },
    {
      text: tx(
        "Но третий поросёнок поставил на огонь большой котёл с водой.",
        "But the third little pig put a big pot of water on the fire.",
        "Pero el tercer cerdito puso al fuego una olla grande con agua."
      ),
      pic: "🐷 🔥 🍲",
      words: ["pot"],
    },
    {
      text: tx(
        "Волк упал прямо в горячую воду.",
        "The wolf fell right into the hot water.",
        "El lobo cayó justo en el agua caliente."
      ),
      pic: "🐺 ⬇️ 🍲 💦",
    },
    {
      text: tx(
        "Он закричал, выскочил из дома и убежал в лес.",
        "He cried out, jumped out of the house and ran away into the forest.",
        "Gritó, saltó fuera de la casa y huyó al bosque."
      ),
      pic: "🐺 😱 💨 🌲",
      simpler: tx(
        "Волку было очень горячо. Он убежал.",
        "The water was very hot. The wolf ran away.",
        "El agua estaba muy caliente. El lobo huyó."
      ),
    },
    {
      text: tx(
        "Больше волк не приходил, а три поросёнка жили дружно в кирпичном доме.",
        "The wolf never came back, and the three little pigs lived happily in the brick house.",
        "El lobo no volvió nunca más, y los tres cerditos vivieron felices en la casa de ladrillos."
      ),
      pic: "🐷 🐷 🐷 🧱 🏠 😊",
      simpler: tx(
        "Волк больше не пришёл. Поросята жили хорошо.",
        "The wolf did not come again. The pigs lived well.",
        "El lobo no volvió. Los cerditos vivieron bien."
      ),
    },
  ],
};

const RED_HOOD: Tale = {
  id: "redhood",
  titleKey: "st3_taleRedHood",
  emoji: "🧺",
  cast: "👧 🧺 🌲 🐺 👵",
  words: {
    sick: {
      word: tx("болеть", "sick", "enferma"),
      explain: tx(
        "Болеет — значит ей плохо, и она лежит в кровати.",
        "Sick means she feels bad and stays in bed.",
        "Enferma quiere decir que se siente mal y está en cama."
      ),
      pic: "🤒 🛏️",
    },
    basket: {
      word: tx("корзинка", "basket", "canasta"),
      explain: tx(
        "В корзинке носят еду, грибы или ягоды. У неё есть ручка.",
        "You carry food in a basket. It has a handle.",
        "En una canasta se lleva comida. Tiene un asa."
      ),
      pic: "🧺",
    },
    swallow: {
      word: tx("проглотить", "swallow", "tragar"),
      explain: tx(
        "Проглотить — значит съесть сразу, целиком.",
        "To swallow is to eat something whole, all at once.",
        "Tragar es comerse algo entero, de una vez."
      ),
      pic: "😮 ⬇️",
    },
    scarf: {
      word: tx("платок", "scarf", "pañuelo"),
      explain: tx(
        "Платок женщины носят на голове.",
        "A scarf is a piece of cloth you wear on your head or neck.",
        "El pañuelo es una tela que se lleva en la cabeza o en el cuello."
      ),
      pic: "🧣",
    },
    surprised: {
      word: tx("удивиться", "surprised", "sorprenderse"),
      explain: tx(
        "Удивиться — значит увидеть что-то странное и сказать: «Ой!»",
        "To be surprised is to see something strange and say: oh!",
        "Sorprenderse es ver algo raro y decir: ¡oh!"
      ),
      pic: "😮",
    },
    hunter: {
      word: tx("охотник", "hunter", "cazador"),
      explain: tx(
        "Охотник ходит в лес с ружьём и ищет зверей.",
        "A hunter goes into the forest with a gun and looks for animals.",
        "Un cazador va al bosque con una escopeta y busca animales."
      ),
      pic: "🧔 🌲 🦌",
    },
    snore: {
      word: tx("храпеть", "snore", "roncar"),
      explain: tx(
        "Храпеть — значит очень громко дышать во сне.",
        "To snore is to breathe very loudly in your sleep.",
        "Roncar es respirar muy fuerte al dormir."
      ),
      pic: "😴 💤",
    },
  },
  sentences: [
    {
      text: tx("Жила-была маленькая девочка.", "Once there was a little girl.", "Había una vez una niña pequeña."),
      pic: "👧",
    },
    {
      text: tx(
        "Она всегда носила красную шапочку.",
        "She always wore a red hood.",
        "Siempre llevaba una caperuza roja."
      ),
      pic: "👧 🔴",
    },
    {
      text: tx(
        "Поэтому все звали её Красной Шапочкой.",
        "So everyone called her Little Red Riding Hood.",
        "Por eso todos la llamaban Caperucita Roja."
      ),
      pic: "👧 🔴 💬",
      simpler: tx(
        "У девочки было имя — Красная Шапочка.",
        "The girl's name was Little Red Riding Hood.",
        "La niña se llamaba Caperucita Roja."
      ),
    },
    {
      text: tx("Однажды мама испекла пирожки.", "One day her mother baked some cakes.", "Un día su mamá hizo unos pasteles."),
      pic: "👩 🥧",
    },
    {
      text: tx(
        "«Отнеси пирожки бабушке, — сказала мама. — Бабушка болеет».",
        "“Take these cakes to your grandmother,” said her mother. “She is sick.”",
        "«Llévale estos pasteles a la abuela», dijo la mamá. «Está enferma»."
      ),
      pic: "👩 💬 🥧 ➡️ 👵 🤒",
      words: ["sick"],
    },
    {
      text: tx(
        "Бабушка жила в другой деревне, за лесом.",
        "Her grandmother lived in another village, on the other side of the forest.",
        "La abuela vivía en otro pueblo, al otro lado del bosque."
      ),
      pic: "🏡 🌲 🌲 🏠 👵",
      simpler: tx(
        "Бабушка жила далеко. Идти к ней надо было через лес.",
        "Her grandmother lived far away. The road to her house went through the forest.",
        "La abuela vivía lejos. Para llegar había que pasar por el bosque."
      ),
    },
    {
      text: tx(
        "Красная Шапочка взяла корзинку и пошла через лес.",
        "Little Red Riding Hood took a basket and set off through the forest.",
        "Caperucita Roja tomó una canasta y se fue por el bosque."
      ),
      pic: "👧 🧺 🌲",
      words: ["basket"],
    },
    {
      text: tx("В лесу она встретила волка.", "In the forest she met a wolf.", "En el bosque se encontró con un lobo."),
      pic: "👧 🌲 🐺",
    },
    {
      text: tx("«Куда ты идёшь?» — спросил волк.", "“Where are you going?” asked the wolf.", "«¿Adónde vas?», preguntó el lobo."),
      pic: "🐺 ❓",
    },
    {
      text: tx(
        "«К бабушке. Она живёт в первом доме за лесом», — ответила девочка.",
        "“To my grandmother's. She lives in the first house after the forest,” said the girl.",
        "«A casa de mi abuela. Vive en la primera casa después del bosque», contestó la niña."
      ),
      pic: "👧 👉 🏠",
    },
    {
      text: tx(
        "Волк побежал к дому бабушки по самой короткой дороге.",
        "The wolf ran to the grandmother's house by the shortest road.",
        "El lobo corrió a la casa de la abuela por el camino más corto."
      ),
      pic: "🐺 💨 🏠",
      simpler: tx(
        "Волк побежал быстро. Он знал короткую дорогу.",
        "The wolf ran fast. He knew a short road.",
        "El lobo corrió rápido. Conocía un camino corto."
      ),
    },
    {
      text: tx(
        "А Красная Шапочка шла медленно и собирала цветы.",
        "But Little Red Riding Hood walked slowly and picked flowers.",
        "Pero Caperucita Roja caminaba despacio y recogía flores."
      ),
      pic: "👧 🐢 🌼",
    },
    {
      text: tx(
        "Волк прибежал первым и постучал в дверь.",
        "The wolf got there first and knocked on the door.",
        "El lobo llegó primero y tocó la puerta."
      ),
      pic: "🐺 ✊ 🚪",
    },
    {
      text: tx(
        "Он вошёл в дом и проглотил бабушку.",
        "He went into the house and swallowed the grandmother.",
        "Entró en la casa y se tragó a la abuela."
      ),
      pic: "🐺 😋 👵",
      words: ["swallow"],
    },
    {
      text: tx(
        "Потом волк надел бабушкин платок и лёг в её кровать.",
        "Then the wolf put on her scarf and lay down in her bed.",
        "Después el lobo se puso el pañuelo de la abuela y se acostó en su cama."
      ),
      pic: "🐺 🧣 🛏️",
      words: ["scarf"],
      simpler: tx(
        "Волк оделся как бабушка и лёг в кровать.",
        "The wolf dressed like the grandmother and got into her bed.",
        "El lobo se vistió como la abuela y se metió en su cama."
      ),
    },
    {
      text: tx("Скоро пришла Красная Шапочка.", "Soon Little Red Riding Hood arrived.", "Pronto llegó Caperucita Roja."),
      pic: "👧 🚪",
    },
    {
      text: tx(
        "Она посмотрела на бабушку и удивилась.",
        "She looked at her grandmother and was surprised.",
        "Miró a la abuela y se sorprendió."
      ),
      pic: "👧 😮",
      words: ["surprised"],
    },
    {
      text: tx(
        "«Бабушка, почему у тебя такие большие уши?» — спросила она.",
        "“Grandmother, why are your ears so big?” she asked.",
        "«Abuela, ¿por qué tienes las orejas tan grandes?», preguntó."
      ),
      pic: "👂 ❓",
    },
    {
      text: tx(
        "«Чтобы лучше тебя слышать», — ответил волк.",
        "“To hear you better,” said the wolf.",
        "«Para oírte mejor», contestó el lobo."
      ),
      pic: "🐺 👂",
    },
    {
      text: tx(
        "«Бабушка, почему у тебя такие большие глаза?»",
        "“Grandmother, why are your eyes so big?”",
        "«Abuela, ¿por qué tienes los ojos tan grandes?»"
      ),
      pic: "👀 ❓",
    },
    {
      text: tx("«Чтобы лучше тебя видеть».", "“To see you better.”", "«Para verte mejor»."),
      pic: "🐺 👀",
    },
    {
      text: tx(
        "«Бабушка, почему у тебя такие большие зубы?»",
        "“Grandmother, why are your teeth so big?”",
        "«Abuela, ¿por qué tienes los dientes tan grandes?»"
      ),
      pic: "🦷 ❓",
    },
    {
      text: tx(
        "«Чтобы съесть тебя!» — крикнул волк и проглотил девочку.",
        "“To eat you up!” cried the wolf, and he swallowed the girl.",
        "«¡Para comerte!», gritó el lobo, y se tragó a la niña."
      ),
      pic: "🐺 😋 👧",
    },
    {
      text: tx("Потом он крепко заснул.", "Then he fell fast asleep.", "Después se quedó profundamente dormido."),
      pic: "🐺 😴",
    },
    {
      text: tx(
        "Мимо дома шёл охотник и услышал, как храпит волк.",
        "A hunter was walking past the house and heard the wolf snoring.",
        "Un cazador pasaba junto a la casa y oyó roncar al lobo."
      ),
      pic: "🧔 👂 😴",
      words: ["hunter", "snore"],
      simpler: tx(
        "Около дома шёл человек с ружьём. Он услышал волка.",
        "A man with a gun was walking near the house. He heard the wolf.",
        "Un hombre con una escopeta pasaba cerca de la casa. Oyó al lobo."
      ),
    },
    {
      text: tx(
        "Он вошёл в дом и разрезал волку живот.",
        "He went into the house and cut open the wolf's belly.",
        "Entró en la casa y le abrió la barriga al lobo."
      ),
      pic: "🧔 ✂️ 🐺",
    },
    {
      text: tx(
        "Оттуда вышли бабушка и Красная Шапочка, живые и здоровые.",
        "Out came the grandmother and Little Red Riding Hood, alive and well.",
        "De allí salieron la abuela y Caperucita Roja, sanas y salvas."
      ),
      pic: "👵 👧 😊",
      simpler: tx(
        "Бабушка и девочка вышли. С ними всё было хорошо.",
        "The grandmother and the girl came out. They were fine.",
        "La abuela y la niña salieron. Estaban bien."
      ),
    },
    {
      text: tx(
        "Они сказали охотнику спасибо и вместе съели пирожки.",
        "They thanked the hunter, and together they ate the cakes.",
        "Le dieron las gracias al cazador y juntos se comieron los pasteles."
      ),
      pic: "👵 👧 🧔 🥧",
    },
  ],
};

export const TALES: Tale[] = [TURNIP, PIGS, RED_HOOD];

/* ------------------------------------------------------------------ *
 *  Action sequences: original wordless picture strips. The narrator
 *  sees them in order; the listener only ever gets them shuffled.
 * ------------------------------------------------------------------ */

export interface CartoonPanel {
  id: string;
  art: string;
  /** Nuri's play-by-play line for this picture (solo rehearsal only) */
  line: StudioText;
}

export interface CartoonSequence {
  id: string;
  panels: CartoonPanel[];
}

export const CARTOONS: CartoonSequence[] = [
  {
    id: "cat-fish",
    panels: [
      {
        id: "a",
        art: "🐈 👀 🐟",
        line: tx(
          "Кот сидит на полу и смотрит на рыбку в банке.",
          "A cat is sitting on the floor, looking at a fish in a jar.",
          "Un gato está sentado en el suelo y mira un pez en un frasco."
        ),
      },
      {
        id: "b",
        art: "🐈 ⤴️ 🪑",
        line: tx("Кот прыгает на стол.", "The cat jumps onto the table.", "El gato salta a la mesa."),
      },
      {
        id: "c",
        art: "🐟 ⤵️ 💦",
        line: tx(
          "Банка падает со стола, и вода разливается.",
          "The jar falls off the table, and the water spills.",
          "El frasco se cae de la mesa y el agua se derrama."
        ),
      },
      {
        id: "d",
        art: "🐕 ❗ 🗯️",
        line: tx(
          "Собака просыпается и громко лает.",
          "The dog wakes up and barks loudly.",
          "El perro se despierta y ladra fuerte."
        ),
      },
      {
        id: "e",
        art: "🐈 💨 🚪",
        line: tx(
          "Кот пугается и выбегает за дверь.",
          "The cat gets scared and runs out through the door.",
          "El gato se asusta y sale corriendo por la puerta."
        ),
      },
      {
        id: "f",
        art: "🐕 🐟 🥣",
        line: tx(
          "Собака осторожно кладёт рыбку в миску с водой.",
          "The dog gently puts the fish into a bowl of water.",
          "El perro pone el pez con cuidado en un plato con agua."
        ),
      },
    ],
  },
  {
    id: "ball-window",
    panels: [
      {
        id: "a",
        art: "👦 ⚽ 🏡",
        line: tx(
          "Мальчик играет с мячом во дворе.",
          "A boy is playing with a ball in the yard.",
          "Un niño juega con una pelota en el patio."
        ),
      },
      {
        id: "b",
        art: "⚽ ➡️ 🏠 💥",
        line: tx(
          "Мяч летит в окно, и стекло разбивается.",
          "The ball flies into a window, and the glass breaks.",
          "La pelota vuela hacia una ventana y el vidrio se rompe."
        ),
      },
      {
        id: "c",
        art: "👦 🙈 🌳",
        line: tx(
          "Мальчик прячется за деревом.",
          "The boy hides behind a tree.",
          "El niño se esconde detrás de un árbol."
        ),
      },
      {
        id: "d",
        art: "👵 🚪 ⚽",
        line: tx(
          "Из дома выходит бабушка с мячом в руках.",
          "An old woman comes out of the house with the ball in her hands.",
          "Una abuela sale de la casa con la pelota en las manos."
        ),
      },
      {
        id: "e",
        art: "👵 😊 ⚽ ➡️ 👦",
        line: tx(
          "Она улыбается и бросает мяч мальчику.",
          "She smiles and throws the ball back to the boy.",
          "Ella sonríe y le lanza la pelota al niño."
        ),
      },
      {
        id: "f",
        art: "👦 🧹 ✨",
        line: tx(
          "Мальчик берёт веник и подметает осколки.",
          "The boy takes a broom and sweeps up the glass.",
          "El niño toma una escoba y barre los vidrios."
        ),
      },
    ],
  },
  {
    id: "monkey-hat",
    panels: [
      {
        id: "a",
        art: "👨 🎩 🌴",
        line: tx(
          "Мужчина в шляпе идёт под деревом.",
          "A man in a hat is walking under a tree.",
          "Un hombre con sombrero camina debajo de un árbol."
        ),
      },
      {
        id: "b",
        art: "🐒 ✋ 🎩 ⬆️",
        line: tx(
          "Обезьяна хватает шляпу и лезет на дерево.",
          "A monkey grabs the hat and climbs up the tree.",
          "Un mono agarra el sombrero y sube al árbol."
        ),
      },
      {
        id: "c",
        art: "👨 😠 ✊",
        line: tx(
          "Мужчина сердится и кричит на обезьяну.",
          "The man gets angry and shouts at the monkey.",
          "El hombre se enoja y le grita al mono."
        ),
      },
      {
        id: "d",
        art: "🐒 🎩 😄",
        line: tx(
          "Обезьяна надевает шляпу и смеётся.",
          "The monkey puts on the hat and laughs.",
          "El mono se pone el sombrero y se ríe."
        ),
      },
      {
        id: "e",
        art: "👨 🍌 👋",
        line: tx(
          "Мужчина достаёт банан и показывает его обезьяне.",
          "The man takes out a banana and shows it to the monkey.",
          "El hombre saca un plátano y se lo muestra al mono."
        ),
      },
      {
        id: "f",
        art: "🎩 ⬇️ 🐒 🍌",
        line: tx(
          "Обезьяна бросает шляпу вниз и берёт банан.",
          "The monkey drops the hat and takes the banana.",
          "El mono deja caer el sombrero y toma el plátano."
        ),
      },
    ],
  },
  {
    id: "snowman",
    panels: [
      {
        id: "a",
        art: "👧 ⛄ ❄️",
        line: tx(
          "Девочка лепит во дворе снеговика.",
          "A girl is building a snowman in the yard.",
          "Una niña hace un muñeco de nieve en el patio."
        ),
      },
      {
        id: "b",
        art: "👧 🥕 ➡️ ⛄",
        line: tx(
          "Она делает ему нос из морковки.",
          "She gives him a carrot for a nose.",
          "Le pone una zanahoria de nariz."
        ),
      },
      {
        id: "c",
        art: "🐇 👀 🥕",
        line: tx(
          "Из-за забора на морковку смотрит заяц.",
          "A rabbit watches the carrot from behind the fence.",
          "Un conejo mira la zanahoria desde detrás de la cerca."
        ),
      },
      {
        id: "d",
        art: "👧 ➡️ 🏠 🍽️",
        line: tx(
          "Девочка уходит в дом обедать.",
          "The girl goes into the house to have lunch.",
          "La niña entra en la casa para almorzar."
        ),
      },
      {
        id: "e",
        art: "🐇 🥕 💨",
        line: tx(
          "Заяц хватает морковку и убегает.",
          "The rabbit grabs the carrot and runs away.",
          "El conejo agarra la zanahoria y sale corriendo."
        ),
      },
      {
        id: "f",
        art: "👧 😮 ⛄ ❓",
        line: tx(
          "Девочка выходит и видит: у снеговика нет носа!",
          "The girl comes out and sees that the snowman has no nose!",
          "La niña sale y ve que el muñeco de nieve no tiene nariz."
        ),
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 *  Input floods: one sentence shape, many natural examples, with a few
 *  sentences that do NOT carry it so the ear has to stay awake.
 * ------------------------------------------------------------------ */

export interface FloodLine {
  text: StudioText;
  /** does this sentence carry the target shape? */
  hit: boolean;
}

export interface FloodPattern {
  id: string;
  /** st3_ key describing what the shape is used for (interface language) */
  labelKey: string;
  /** the forms to listen for, shown only after the models have been heard */
  target: StudioText;
  models: StudioText[];
  lines: FloodLine[];
}

const hit = (ru: string, en: string, es: string): FloodLine => ({ text: tx(ru, en, es), hit: true });
const miss = (ru: string, en: string, es: string): FloodLine => ({ text: tx(ru, en, es), hit: false });

export const FLOODS: FloodPattern[] = [
  {
    id: "who",
    labelKey: "st3_flPatWho",
    target: tx("который · которая · которые", "who is · who are", "que está · que están"),
    models: [
      tx(
        "Вот мальчик, который ест яблоко.",
        "Here is a boy who is eating an apple.",
        "Aquí hay un niño que está comiendo una manzana."
      ),
      tx(
        "Вот женщина, которая читает книгу.",
        "Here is a woman who is reading a book.",
        "Aquí hay una mujer que está leyendo un libro."
      ),
      tx(
        "Вот дети, которые едят мороженое.",
        "Here are some children who are eating ice cream.",
        "Aquí hay unos niños que están comiendo helado."
      ),
    ],
    lines: [
      hit(
        "Вот мужчина, который несёт сумку.",
        "Here is a man who is carrying a bag.",
        "Aquí hay un hombre que está cargando una bolsa."
      ),
      hit(
        "Вот девочка, которая кормит кошку.",
        "Here is a girl who is feeding a cat.",
        "Aquí hay una niña que está dándole de comer a un gato."
      ),
      miss("Мальчик ест яблоко.", "The boy is eating an apple.", "El niño está comiendo una manzana."),
      hit(
        "Вот дети, которые играют в мяч.",
        "Here are some children who are playing ball.",
        "Aquí hay unos niños que están jugando a la pelota."
      ),
      hit(
        "Вот бабушка, которая сидит на скамейке.",
        "Here is an old woman who is sitting on a bench.",
        "Aquí hay una abuela que está sentada en un banco."
      ),
      hit(
        "Где малыш, который спит в коляске?",
        "Where is the baby who is sleeping in the pram?",
        "¿Dónde está el bebé que está durmiendo en el cochecito?"
      ),
      miss(
        "Женщина читает книгу на скамейке.",
        "The woman is reading a book on a bench.",
        "La mujer está leyendo un libro en un banco."
      ),
      hit(
        "Вот водитель, который моет машину.",
        "Here is a driver who is washing his car.",
        "Aquí hay un hombre que está lavando su carro."
      ),
      hit(
        "Где мальчик, который бежит за автобусом?",
        "Where is the boy who is running after the bus?",
        "¿Dónde está el niño que está corriendo detrás del autobús?"
      ),
      hit(
        "Вот рабочие, которые красят стену.",
        "Here are two men who are painting a wall.",
        "Aquí hay dos hombres que están pintando una pared."
      ),
      miss(
        "Дети играют в мяч во дворе.",
        "The children are playing ball in the yard.",
        "Los niños están jugando a la pelota en el patio."
      ),
      hit(
        "Вот девушка, которая говорит по телефону.",
        "Here is a girl who is talking on the phone.",
        "Aquí hay una muchacha que está hablando por teléfono."
      ),
      hit(
        "Где мужчина, который продаёт хлеб?",
        "Where is the man who is selling bread?",
        "¿Dónde está el hombre que está vendiendo pan?"
      ),
      hit(
        "Вот женщина, которая смотрит в окно.",
        "Here is a woman who is looking out of the window.",
        "Aquí hay una mujer que está mirando por la ventana."
      ),
      miss("Малыш спит в коляске.", "The baby is sleeping in the pram.", "El bebé está durmiendo en el cochecito."),
      hit(
        "Вот люди, которые ждут автобус.",
        "Here are the people who are waiting for the bus.",
        "Aquí está la gente que está esperando el autobús."
      ),
    ],
  },
  {
    id: "try",
    labelKey: "st3_flPatTry",
    target: tx("пытается · пытаются", "is trying to · are trying to", "está tratando de · están tratando de"),
    models: [
      tx(
        "Кошка пытается поймать птицу.",
        "The cat is trying to catch a bird.",
        "El gato está tratando de atrapar un pájaro."
      ),
      tx(
        "Мальчик пытается открыть дверь.",
        "The boy is trying to open the door.",
        "El niño está tratando de abrir la puerta."
      ),
      tx(
        "Дети пытаются открыть окно.",
        "The children are trying to open the window.",
        "Los niños están tratando de abrir la ventana."
      ),
    ],
    lines: [
      hit(
        "Малыш пытается надеть ботинок.",
        "The baby is trying to put on a shoe.",
        "El bebé está tratando de ponerse un zapato."
      ),
      hit(
        "Мужчина пытается починить велосипед.",
        "The man is trying to fix his bicycle.",
        "El hombre está tratando de arreglar su bicicleta."
      ),
      miss("Женщина открывает окно.", "The woman is opening the window.", "La mujer está abriendo la ventana."),
      hit(
        "Собака пытается достать мяч из воды.",
        "The dog is trying to get the ball out of the water.",
        "El perro está tratando de sacar la pelota del agua."
      ),
      hit(
        "Дети пытаются поймать бабочку.",
        "The children are trying to catch a butterfly.",
        "Los niños están tratando de atrapar una mariposa."
      ),
      hit(
        "Девочка пытается завязать шнурки.",
        "The girl is trying to tie her shoes.",
        "La niña está tratando de amarrarse los zapatos."
      ),
      miss("Мальчик читает книгу.", "The boy is reading a book.", "El niño está leyendo un libro."),
      hit(
        "Бабушка пытается перейти дорогу.",
        "The old woman is trying to cross the road.",
        "La abuela está tratando de cruzar la calle."
      ),
      hit(
        "Водитель пытается завести машину.",
        "The driver is trying to start the car.",
        "El chofer está tratando de arrancar el carro."
      ),
      miss("Кошка спит на диване.", "The cat is sleeping on the sofa.", "El gato está durmiendo en el sofá."),
      hit(
        "Студент пытается вспомнить слово.",
        "The student is trying to remember a word.",
        "El estudiante está tratando de recordar una palabra."
      ),
      hit(
        "Мы пытаемся открыть эту банку.",
        "We are trying to open this jar.",
        "Estamos tratando de abrir este frasco."
      ),
      hit(
        "Птица пытается построить гнездо.",
        "The bird is trying to build a nest.",
        "El pájaro está tratando de hacer un nido."
      ),
      miss(
        "Мужчина несёт тяжёлую сумку.",
        "The man is carrying a heavy bag.",
        "El hombre está cargando una bolsa pesada."
      ),
      hit(
        "Мальчики пытаются залезть на дерево.",
        "The boys are trying to climb the tree.",
        "Los muchachos están tratando de subir al árbol."
      ),
      hit(
        "Я пытаюсь понять эту историю.",
        "I am trying to understand this story.",
        "Estoy tratando de entender este cuento."
      ),
    ],
  },
  {
    id: "made",
    labelKey: "st3_flPatMade",
    target: tx("заставил · заставила", "made me · made us", "me hizo · nos hizo"),
    models: [
      tx(
        "Врач заставил меня выпить лекарство.",
        "The doctor made me take the medicine.",
        "El doctor me hizo tomar la medicina."
      ),
      tx(
        "Мама заставила меня надеть шапку.",
        "My mother made me wear a hat.",
        "Mi mamá me hizo ponerme un gorro."
      ),
      tx("Учитель заставил нас сесть.", "The teacher made us sit down.", "El maestro nos hizo sentarnos."),
    ],
    lines: [
      hit(
        "Учитель заставил нас написать всё ещё раз.",
        "The teacher made us write it all again.",
        "El maestro nos hizo escribir todo otra vez."
      ),
      hit(
        "Дождь заставил нас вернуться домой.",
        "The rain made us go back home.",
        "La lluvia nos hizo volver a casa."
      ),
      miss("Мама купила мне шапку.", "My mother bought me a hat.", "Mi mamá me compró un gorro."),
      hit(
        "Бабушка заставила меня съесть суп.",
        "My grandmother made me eat the soup.",
        "Mi abuela me hizo comer la sopa."
      ),
      hit(
        "Полицейский заставил водителя остановиться.",
        "The police officer made the driver stop.",
        "El policía hizo parar al chofer."
      ),
      hit(
        "Брат заставил меня убрать комнату.",
        "My brother made me clean the room.",
        "Mi hermano me hizo limpiar el cuarto."
      ),
      miss("Врач дал мне лекарство.", "The doctor gave me some medicine.", "El doctor me dio una medicina."),
      hit(
        "Холод заставил всех надеть куртки.",
        "The cold made everyone put on a coat.",
        "El frío nos hizo ponernos abrigo."
      ),
      hit(
        "Сестра заставила меня помыть посуду.",
        "My sister made me wash the dishes.",
        "Mi hermana me hizo lavar los platos."
      ),
      miss("Мы вернулись домой поздно.", "We came home late.", "Volvimos a casa tarde."),
      hit(
        "Тренер заставил нас бегать целый час.",
        "The coach made us run for a whole hour.",
        "El entrenador nos hizo correr una hora entera."
      ),
      hit(
        "Начальник заставил его прийти в субботу.",
        "His boss made him come in on Saturday.",
        "Su jefe lo hizo venir el sábado."
      ),
      miss(
        "Брат убрал комнату утром.",
        "My brother cleaned the room in the morning.",
        "Mi hermano limpió el cuarto por la mañana."
      ),
      hit(
        "Мама заставила детей лечь спать рано.",
        "The mother made the children go to bed early.",
        "La mamá los hizo acostarse temprano."
      ),
      hit("Этот фильм заставил меня плакать.", "That film made me cry.", "Esa película me hizo llorar."),
      hit(
        "Голод заставил волка выйти из леса.",
        "Hunger made the wolf come out of the forest.",
        "El hambre hizo salir al lobo del bosque."
      ),
    ],
  },
];

/* ------------------------------------------------------------------ *
 *  Audio contract: every exact string a Phase 3 tool passes to speak().
 * ------------------------------------------------------------------ */

const ALL_PHRASES: PhraseDef[] = [
  ...MOVES,
  ...BRIDGE_ASKS,
  ...SCRIPT_PROBES,
  ...PROP_ANGLES,
  ...REMINISCE_PHRASES,
  ...HOST_ASKS,
  ...FLOOD_ASKS,
  ...CARTOON_ASKS,
];

function gather(lang: LangCode): string[] {
  const out = new Set<string>();
  const add = (text?: StudioText) => {
    const v = text?.[lang];
    if (v) out.add(v);
  };
  ALL_PHRASES.forEach((p) => add(p.text));
  TALES.forEach((tale) => {
    tale.sentences.forEach((s) => {
      add(s.text);
      add(s.simpler);
    });
    Object.values(tale.words).forEach((w) => add(w.explain));
  });
  CARTOONS.forEach((c) => c.panels.forEach((p) => add(p.line)));
  FLOODS.forEach((f) => {
    f.models.forEach(add);
    f.lines.forEach((l) => add(l.text));
  });
  return [...out];
}

export const P3_AUDIO_LINES: Partial<Record<LangCode, string[]>> = {
  ru: gather("ru"),
  en: gather("en"),
  es: gather("es"),
};
