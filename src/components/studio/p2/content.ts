import type { LangCode } from "@/lib/types";
import type { StudioText } from "../types";

/**
 * Phase 2 practice content — everything the grower HEARS in the host language,
 * plus the original picture panels it is tied to.
 *
 * There is no stock art for this phase and real wordless books are
 * copyrighted, so every story, busy scene and process strip here is original:
 * a soft backdrop with a few large emoji / simple shapes placed by percentage.
 * Lines are simple present-tense descriptions (Phase 2 level); each story also
 * carries a short past-tense "story form" telling for the end of the book.
 *
 * Authored in ru / en / es. Any other target language gets the pictures only
 * (they are wordless) and the tools fall back to nurturer-led mode.
 */

const T = (ru: string, en: string, es: string): StudioText => ({ ru, en, es });

/* ------------------------------ panel model ------------------------------ */

export type PanelEl =
  /** emoji glyph — x/y = centre in %, s = size in % of the panel width */
  | { k: "e"; g: string; x: number; y: number; s: number; flip?: boolean; rot?: number }
  /** soft rectangle / pill — x/y = top-left in %, w/h in %, r = corner radius in % */
  | { k: "r"; x: number; y: number; w: number; h: number; c: string; r?: number; bd?: string; o?: number; rot?: number }
  /** a Phase-1 vocab card shown as a small framed sign (CardFace art, emoji fallback) */
  | { k: "c"; id: string; g: string; x: number; y: number; s: number };

export interface PanelSpot {
  id: string;
  /** hit-box in %: [left, top, width, height] */
  box: [number, number, number, number];
  /** what the grower hears, then points to */
  say: StudioText;
}

export interface Panel {
  id: string;
  /** backdrop gradient, top → bottom */
  bg: [string, string];
  /** optional ground band: [color, height %] */
  floor?: [string, number];
  els: PanelEl[];
  spots: PanelSpot[];
  /** clean present-tense description of the page, one sentence per entry */
  lines: StudioText[];
  /** the same page in story form (past tense), for the end-of-book telling */
  past?: StudioText[];
}

export interface Story {
  id: string;
  icon: string;
  panels: Panel[];
}

export interface BusyScene {
  id: string;
  icon: string;
  panel: Panel;
}

export interface ProcessSeries {
  id: string;
  icon: string;
  /** one small panel per step; `lines[0]` is the step */
  steps: Panel[];
}

const e = (g: string, x: number, y: number, s: number, opt: { flip?: boolean; rot?: number } = {}): PanelEl => ({
  k: "e",
  g,
  x,
  y,
  s,
  ...opt,
});
const r = (
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
  rad = 0,
  opt: { bd?: string; o?: number; rot?: number } = {}
): PanelEl => ({ k: "r", x, y, w, h, c, r: rad, ...opt });
const sign = (id: string, g: string, x: number, y: number, s: number): PanelEl => ({ k: "c", id, g, x, y, s });
const sp = (id: string, box: [number, number, number, number], say: StudioText): PanelSpot => ({ id, box, say });

/* backdrops */
const ROOM: Pick<Panel, "bg" | "floor"> = { bg: ["#fdeccb", "#f8d9ad"], floor: ["#d6b08a", 20] };
const KITCHEN: Pick<Panel, "bg" | "floor"> = { bg: ["#eaf3e6", "#d6e8d0"], floor: ["#c8b599", 20] };
const LOUNGE: Pick<Panel, "bg" | "floor"> = { bg: ["#eee6f7", "#dccfee"], floor: ["#b9a6cf", 20] };
const HALL: Pick<Panel, "bg" | "floor"> = { bg: ["#f4e9d6", "#ead8ba"], floor: ["#c9ae8c", 20] };
const WOOD = "#b98a5e";
const WATER = "#74c1ea";
const window_ = (x: number, y: number, w: number, h: number): PanelEl => r(x, y, w, h, "#bfe3ff", 6, { bd: "#ffffff" });

/* ------------------------------- stories -------------------------------- */

const STORY_SOCK: Story = {
  id: "sock",
  icon: "🧦",
  panels: [
    {
      id: "sock-1",
      ...ROOM,
      els: [
        window_(8, 8, 30, 38),
        e("☀️", 23, 26, 15),
        e("🛌", 50, 66, 44),
        r(78, 58, 17, 24, WOOD, 4),
        e("⏰", 86.5, 46, 15),
      ],
      spots: [
        sp("bed", [26, 46, 48, 42], T("Где кровать?", "Where is the bed?", "¿Dónde está la cama?")),
        sp("sun", [8, 6, 30, 38], T("Где солнце?", "Where is the sun?", "¿Dónde está el sol?")),
        sp("clock", [76, 28, 21, 32], T("Где будильник?", "Where is the alarm clock?", "¿Dónde está el despertador?")),
      ],
      lines: [
        T("Утро. Мальчик просыпается.", "It is morning. The boy wakes up.", "Es de mañana. El niño se despierta."),
        T("За окном светит солнце.", "The sun is shining outside the window.", "Afuera brilla el sol."),
        T("Звонит будильник.", "The alarm clock is ringing.", "Suena el despertador."),
      ],
      past: [
        T("Однажды утром мальчик проснулся.", "One morning a boy woke up.", "Una mañana, un niño se despertó."),
        T(
          "Светило солнце, звонил будильник.",
          "The sun was shining and the alarm clock was ringing.",
          "Brillaba el sol y sonaba el despertador."
        ),
      ],
    },
    {
      id: "sock-2",
      ...ROOM,
      els: [e("👦", 22, 46, 30), e("👕", 56, 30, 20), e("👖", 82, 32, 20), e("🧦", 57, 72, 18), e("❓", 82, 72, 15)],
      spots: [
        sp("boy", [6, 22, 32, 50], T("Где мальчик?", "Where is the boy?", "¿Dónde está el niño?")),
        sp("shirt", [44, 12, 24, 36], T("Где рубашка?", "Where is the shirt?", "¿Dónde está la camisa?")),
        sp("pants", [70, 14, 24, 36], T("Где штаны?", "Where are the pants?", "¿Dónde está el pantalón?")),
        sp("sock", [45, 54, 24, 36], T("Где носок?", "Where is the sock?", "¿Dónde está el calcetín?")),
      ],
      lines: [
        T("Мальчик одевается.", "The boy gets dressed.", "El niño se viste."),
        T("Вот рубашка и штаны.", "Here are a shirt and pants.", "Aquí están la camisa y el pantalón."),
        T(
          "Вот один носок. А где второй?",
          "Here is one sock. But where is the other one?",
          "Aquí hay un calcetín. ¿Y dónde está el otro?"
        ),
      ],
      past: [
        T("Он начал одеваться.", "He started to get dressed.", "Empezó a vestirse."),
        T(
          "Он надел рубашку и штаны, но нашёл только один носок.",
          "He put on his shirt and pants, but he found only one sock.",
          "Se puso la camisa y el pantalón, pero encontró solo un calcetín."
        ),
      ],
    },
    {
      id: "sock-3",
      ...ROOM,
      els: [
        e("🛏️", 60, 32, 50),
        r(34, 60, 58, 26, "#3a2a1c", 6, { o: 0.22 }),
        e("⚽", 47, 73, 13),
        e("👞", 68, 73, 14),
        e("👦", 14, 64, 22),
        e("🔦", 27, 76, 10),
      ],
      spots: [
        sp("bed", [34, 6, 54, 50], T("Где кровать?", "Where is the bed?", "¿Dónde está la cama?")),
        sp("ball", [38, 58, 18, 30], T("Где мяч?", "Where is the ball?", "¿Dónde está la pelota?")),
        sp("shoe", [58, 58, 20, 30], T("Где ботинок?", "Where is the shoe?", "¿Dónde está el zapato?")),
        sp(
          "boy",
          [2, 44, 30, 44],
          T("Кто смотрит под кровать?", "Who is looking under the bed?", "¿Quién mira debajo de la cama?")
        ),
      ],
      lines: [
        T("Мальчик смотрит под кровать.", "The boy looks under the bed.", "El niño mira debajo de la cama."),
        T(
          "Под кроватью лежат мяч и старый ботинок.",
          "Under the bed there are a ball and an old shoe.",
          "Debajo de la cama hay una pelota y un zapato viejo."
        ),
        T("Носка там нет.", "The sock is not there.", "El calcetín no está ahí."),
      ],
      past: [
        T("Он посмотрел под кровать.", "He looked under the bed.", "Miró debajo de la cama."),
        T(
          "Там лежали мяч и старый ботинок, а носка не было.",
          "There were a ball and an old shoe, but no sock.",
          "Había una pelota y un zapato viejo, pero el calcetín no estaba."
        ),
      ],
    },
    {
      id: "sock-4",
      ...ROOM,
      els: [
        r(8, 8, 30, 72, "#a8744a", 4),
        r(22.5, 8, 1, 72, "#855a37"),
        r(19, 40, 2, 5, "#e8c88f", 50),
        r(25, 40, 2, 5, "#e8c88f", 50),
        e("🧥", 52, 30, 19, { rot: -14 }),
        e("🧣", 68, 52, 16, { rot: 18 }),
        e("🧢", 50, 68, 14, { rot: -10 }),
        e("👦", 86, 60, 22),
        e("❗", 88, 26, 11),
      ],
      spots: [
        sp("wardrobe", [6, 6, 34, 76], T("Где шкаф?", "Where is the wardrobe?", "¿Dónde está el armario?")),
        sp("jacket", [42, 12, 20, 34], T("Где куртка?", "Where is the jacket?", "¿Dónde está la chaqueta?")),
        sp("scarf", [60, 38, 17, 28], T("Где шарф?", "Where is the scarf?", "¿Dónde está la bufanda?")),
        sp("cap", [41, 54, 18, 28], T("Где кепка?", "Where is the cap?", "¿Dónde está la gorra?")),
      ],
      lines: [
        T("Мальчик открывает шкаф.", "The boy opens the wardrobe.", "El niño abre el armario."),
        T(
          "Из шкафа падают куртка, шарф и кепка.",
          "A jacket, a scarf and a cap fall out of the wardrobe.",
          "Del armario se caen una chaqueta, una bufanda y una gorra."
        ),
        T("Носка и тут нет.", "The sock is not here either.", "El calcetín tampoco está aquí."),
      ],
      past: [
        T("Потом он открыл шкаф.", "Then he opened the wardrobe.", "Luego abrió el armario."),
        T(
          "Оттуда выпали куртка, шарф и кепка, но носка не было и там.",
          "A jacket, a scarf and a cap fell out, but the sock was not there either.",
          "Se cayeron una chaqueta, una bufanda y una gorra, pero el calcetín tampoco estaba allí."
        ),
      ],
    },
    {
      id: "sock-5",
      ...ROOM,
      els: [
        r(50, 58, 44, 30, "#a8744a", 50),
        r(54, 61, 36, 20, "#c99666", 50),
        e("🐶", 72, 56, 22),
        e("💤", 88, 30, 12),
        e("👦", 20, 50, 26),
        e("👣", 42, 80, 9),
        e("❓", 57, 42, 9),
      ],
      spots: [
        sp("dog", [60, 36, 26, 34], T("Кто спит?", "Who is sleeping?", "¿Quién duerme?")),
        sp("basket", [50, 71, 44, 19], T("Где корзина?", "Where is the basket?", "¿Dónde está la cesta?")),
        sp(
          "boy",
          [5, 28, 30, 46],
          T("Кто подходит к собаке?", "Who is walking up to the dog?", "¿Quién se acerca al perro?")
        ),
      ],
      lines: [
        T("В углу стоит корзина.", "There is a basket in the corner.", "En el rincón hay una cesta."),
        T("В корзине спит собака.", "The dog is sleeping in the basket.", "El perro duerme en la cesta."),
        T("Мальчик тихо подходит к ней.", "The boy quietly walks up to it.", "El niño se acerca despacio."),
        T("Что это у неё под лапой?", "What is that under its paw?", "¿Qué tiene debajo de la pata?"),
      ],
      past: [
        T(
          "В углу в корзине спала собака.",
          "In the corner, the dog was sleeping in its basket.",
          "En el rincón, el perro dormía en su cesta."
        ),
        T(
          "Мальчик тихо подошёл к ней и что-то заметил.",
          "The boy quietly walked up to it and noticed something.",
          "El niño se acercó despacio y vio algo."
        ),
      ],
    },
    {
      id: "sock-6",
      ...ROOM,
      els: [
        r(38, 54, 58, 34, "#a8744a", 50),
        r(43, 58, 48, 22, "#c99666", 50),
        e("🐶", 20, 38, 26),
        e("🧦", 52, 42, 17),
        e("👓", 73, 38, 16),
        e("🔑", 86, 60, 13),
        e("🥄", 65, 68, 14),
        e("👦", 14, 78, 17),
      ],
      spots: [
        sp("sock", [42, 24, 20, 32], T("Где носок?", "Where is the sock?", "¿Dónde está el calcetín?")),
        sp("glasses", [63, 22, 20, 28], T("Где очки?", "Where are the glasses?", "¿Dónde están las gafas?")),
        sp("key", [78, 46, 17, 28], T("Где ключ?", "Where is the key?", "¿Dónde está la llave?")),
        sp("spoon", [56, 56, 19, 26], T("Где ложка?", "Where is the spoon?", "¿Dónde está la cuchara?")),
      ],
      lines: [
        T("Собака просыпается.", "The dog wakes up.", "El perro se despierta."),
        T("Вот он, второй носок!", "There it is, the other sock!", "¡Ahí está el otro calcetín!"),
        T(
          "А ещё тут мамины очки, ключ и ложка.",
          "And here are Mom's glasses, a key and a spoon too.",
          "Y también están las gafas de mamá, una llave y una cuchara."
        ),
      ],
      past: [
        T("Собака проснулась.", "The dog woke up.", "El perro se despertó."),
        T(
          "Под лапой у неё лежал второй носок, а ещё мамины очки, ключ и ложка!",
          "Under its paw was the other sock, and also Mom's glasses, a key and a spoon!",
          "Debajo de la pata tenía el otro calcetín, ¡y también las gafas de mamá, una llave y una cuchara!"
        ),
      ],
    },
    {
      id: "sock-7",
      ...ROOM,
      els: [
        e("🚪", 84, 44, 34),
        e("👦", 50, 38, 26),
        e("🎒", 65, 68, 18),
        e("🐕", 20, 62, 24),
        e("❤️", 30, 34, 9),
        e("🧦", 40, 80, 11),
        e("🧦", 49, 80, 11, { flip: true }),
      ],
      spots: [
        sp("door", [70, 12, 28, 66], T("Где дверь?", "Where is the door?", "¿Dónde está la puerta?")),
        sp("backpack", [56, 52, 18, 32], T("Где рюкзак?", "Where is the backpack?", "¿Dónde está la mochila?")),
        sp("dog", [6, 44, 28, 36], T("Где собака?", "Where is the dog?", "¿Dónde está el perro?")),
        sp(
          "socks",
          [33, 66, 22, 26],
          T("Где два носка?", "Where are the two socks?", "¿Dónde están los dos calcetines?")
        ),
      ],
      lines: [
        T(
          "Мальчик смеётся и гладит собаку.",
          "The boy laughs and pets the dog.",
          "El niño se ríe y acaricia al perro."
        ),
        T("Теперь у него два носка.", "Now he has two socks.", "Ahora tiene dos calcetines."),
        T(
          "Он берёт рюкзак и идёт в школу.",
          "He takes his backpack and goes to school.",
          "Toma su mochila y se va a la escuela."
        ),
      ],
      past: [
        T(
          "Мальчик засмеялся и погладил собаку.",
          "The boy laughed and petted the dog.",
          "El niño se rio y acarició al perro."
        ),
        T(
          "Он надел второй носок, взял рюкзак и пошёл в школу.",
          "He put on the other sock, took his backpack and went to school.",
          "Se puso el otro calcetín, tomó su mochila y se fue a la escuela."
        ),
      ],
    },
  ],
};

const STOVE = "#5b616b";

const STORY_SOUP: Story = {
  id: "soup",
  icon: "🍲",
  panels: [
    {
      id: "soup-1",
      ...KITCHEN,
      els: [
        r(8, 62, 86, 9, WOOD, 3),
        e("👩‍🍳", 17, 36, 26),
        e("🔪", 40, 51, 12),
        e("🥕", 54, 50, 15),
        e("🧅", 69, 50, 14),
        e("🥔", 84, 51, 14),
      ],
      spots: [
        sp("knife", [33, 34, 14, 30], T("Где нож?", "Where is the knife?", "¿Dónde está el cuchillo?")),
        sp("carrot", [47, 34, 15, 30], T("Где морковь?", "Where is the carrot?", "¿Dónde está la zanahoria?")),
        sp("onion", [62, 34, 14, 30], T("Где лук?", "Where is the onion?", "¿Dónde está la cebolla?")),
        sp("potato", [76, 34, 16, 30], T("Где картошка?", "Where is the potato?", "¿Dónde está la papa?")),
      ],
      lines: [
        T("Женщина готовит суп.", "A woman is making soup.", "Una mujer prepara una sopa."),
        T(
          "На столе лежат морковь, лук и картошка.",
          "On the table there are a carrot, an onion and a potato.",
          "En la mesa hay una zanahoria, una cebolla y una papa."
        ),
        T(
          "Она режет овощи ножом.",
          "She cuts the vegetables with a knife.",
          "Corta las verduras con un cuchillo."
        ),
      ],
      past: [
        T(
          "Однажды женщина решила сварить суп.",
          "One day a woman decided to make soup.",
          "Un día, una mujer decidió preparar una sopa."
        ),
        T(
          "Она нарезала морковь, лук и картошку.",
          "She cut up a carrot, an onion and a potato.",
          "Cortó una zanahoria, una cebolla y una papa."
        ),
      ],
    },
    {
      id: "soup-2",
      ...KITCHEN,
      els: [
        r(34, 54, 36, 34, STOVE, 4),
        e("🍲", 52, 36, 26),
        e("🔥", 52, 64, 11),
        e("🥕", 33, 16, 9, { rot: 40 }),
        e("👩", 15, 40, 24),
        r(74, 56, 20, 3, WOOD, 2),
        e("🧂", 84, 42, 14),
      ],
      spots: [
        sp("pot", [38, 16, 28, 36], T("Где кастрюля?", "Where is the pot?", "¿Dónde está la olla?")),
        sp("fire", [41, 53, 22, 24], T("Где огонь?", "Where is the fire?", "¿Dónde está el fuego?")),
        sp("salt", [74, 24, 20, 32], T("Где соль?", "Where is the salt?", "¿Dónde está la sal?")),
        sp("woman", [3, 20, 26, 44], T("Где женщина?", "Where is the woman?", "¿Dónde está la mujer?")),
      ],
      lines: [
        T("Кастрюля стоит на плите.", "The pot is on the stove.", "La olla está en el fuego."),
        T(
          "Женщина кладёт овощи в кастрюлю.",
          "The woman puts the vegetables into the pot.",
          "La mujer pone las verduras en la olla."
        ),
        T("Суп варится.", "The soup is cooking.", "La sopa se cocina."),
      ],
      past: [
        T(
          "Она положила овощи в кастрюлю и поставила её на плиту.",
          "She put the vegetables into the pot and put it on the stove.",
          "Puso las verduras en la olla y la puso al fuego."
        ),
        T("Суп начал вариться.", "The soup began to cook.", "La sopa empezó a cocinarse."),
      ],
    },
    {
      id: "soup-3",
      ...LOUNGE,
      els: [
        r(5, 42, 18, 16, STOVE, 3),
        e("🍲", 14, 32, 13),
        e("🔥", 14, 49, 6),
        e("🛋️", 62, 62, 46),
        e("👩", 58, 38, 22),
        e("📱", 76, 34, 11),
        e("💬", 88, 16, 12),
      ],
      spots: [
        sp("phone", [69, 18, 15, 30], T("Где телефон?", "Where is the phone?", "¿Dónde está el teléfono?")),
        sp("sofa", [38, 58, 50, 30], T("Где диван?", "Where is the sofa?", "¿Dónde está el sofá?")),
        sp("soup", [3, 18, 23, 42], T("Где суп?", "Where is the soup?", "¿Dónde está la sopa?")),
      ],
      lines: [
        T("Звонит телефон.", "The phone rings.", "Suena el teléfono."),
        T(
          "Женщина садится на диван и говорит по телефону.",
          "The woman sits down on the sofa and talks on the phone.",
          "La mujer se sienta en el sofá y habla por teléfono."
        ),
        T(
          "Она смеётся и забывает про суп.",
          "She laughs and forgets about the soup.",
          "Se ríe y se olvida de la sopa."
        ),
      ],
      past: [
        T("Тут зазвонил телефон.", "Then the phone rang.", "Entonces sonó el teléfono."),
        T(
          "Женщина села на диван, долго разговаривала и совсем забыла про суп.",
          "The woman sat down on the sofa, talked for a long time and completely forgot about the soup.",
          "La mujer se sentó en el sofá, habló mucho tiempo y se olvidó por completo de la sopa."
        ),
      ],
    },
    {
      id: "soup-4",
      ...KITCHEN,
      els: [
        r(10, 56, 36, 32, STOVE, 4),
        r(22, 14, 13, 16, "#77777c", 50, { o: 0.85 }),
        r(31, 4, 15, 18, "#8c8c92", 50, { o: 0.8 }),
        r(15, 2, 10, 13, "#a0a0a6", 50, { o: 0.7 }),
        e("🍲", 28, 42, 22),
        e("🔥", 20, 64, 9),
        e("🔥", 36, 64, 9),
        e("🏃‍♀️", 76, 54, 32),
        e("❗", 60, 20, 10),
      ],
      spots: [
        sp("smoke", [11, 0, 37, 30], T("Где дым?", "Where is the smoke?", "¿Dónde está el humo?")),
        sp("pot", [15, 31, 27, 24], T("Где кастрюля?", "Where is the pot?", "¿Dónde está la olla?")),
        sp("runner", [60, 28, 32, 54], T("Кто бежит?", "Who is running?", "¿Quién corre?")),
      ],
      lines: [
        T("Из кастрюли идёт дым.", "Smoke is coming out of the pot.", "Sale humo de la olla."),
        T("Суп горит!", "The soup is burning!", "¡La sopa se quema!"),
        T(
          "Женщина чувствует запах и бежит на кухню.",
          "The woman smells it and runs to the kitchen.",
          "La mujer siente el olor y corre a la cocina."
        ),
      ],
      past: [
        T(
          "Вдруг она почувствовала запах дыма.",
          "Suddenly she smelled smoke.",
          "De pronto sintió olor a humo."
        ),
        T("Суп сгорел!", "The soup was burnt!", "¡La sopa se había quemado!"),
      ],
    },
    {
      id: "soup-5",
      ...KITCHEN,
      els: [
        r(8, 64, 50, 9, WOOD, 3),
        r(21, 44, 24, 21, "#1f1f22", 6),
        r(18, 41, 30, 6, "#3b3b40", 3),
        r(27, 30, 8, 9, "#9a9aa0", 50, { o: 0.6 }),
        e("🕕", 52, 16, 13),
        e("🙍‍♀️", 76, 48, 32),
      ],
      spots: [
        sp(
          "blackpot",
          [14, 28, 38, 38],
          T("Где чёрная кастрюля?", "Where is the black pot?", "¿Dónde está la olla negra?")
        ),
        sp("clock", [42, 2, 20, 28], T("Где часы?", "Where is the clock?", "¿Dónde está el reloj?")),
        sp("sad", [60, 24, 32, 56], T("Кто грустит?", "Who is sad?", "¿Quién está triste?")),
      ],
      lines: [
        T("Кастрюля чёрная.", "The pot is black.", "La olla está negra."),
        T("Супа больше нет.", "There is no more soup.", "Ya no hay sopa."),
        T(
          "Женщина грустит: скоро придёт подруга.",
          "The woman is sad: her friend is coming soon.",
          "La mujer está triste: su amiga llega pronto."
        ),
      ],
      past: [
        T("Кастрюля стала чёрной.", "The pot had turned black.", "La olla quedó negra."),
        T(
          "Женщина очень расстроилась, ведь скоро должна была прийти подруга.",
          "The woman was very upset, because her friend was coming soon.",
          "La mujer se puso muy triste, porque su amiga iba a llegar pronto."
        ),
      ],
    },
    {
      id: "soup-6",
      ...HALL,
      els: [
        e("🚪", 48, 44, 40),
        e("🔔", 70, 16, 11),
        e("👩", 15, 48, 24),
        e("👩‍🦱", 86, 40, 22),
        e("📦", 84, 74, 20),
      ],
      spots: [
        sp("door", [32, 10, 32, 70], T("Где дверь?", "Where is the door?", "¿Dónde está la puerta?")),
        sp("bell", [64, 2, 14, 28], T("Где звонок?", "Where is the doorbell?", "¿Dónde está el timbre?")),
        sp("friend", [75, 22, 23, 36], T("Где подруга?", "Where is the friend?", "¿Dónde está la amiga?")),
        sp("box", [72, 60, 24, 30], T("Где коробка?", "Where is the box?", "¿Dónde está la caja?")),
      ],
      lines: [
        T("Звонок в дверь.", "The doorbell rings.", "Suena el timbre."),
        T("Женщина открывает дверь.", "The woman opens the door.", "La mujer abre la puerta."),
        T(
          "На пороге стоит подруга с большой коробкой.",
          "Her friend is standing at the door with a big box.",
          "En la puerta está su amiga con una caja grande."
        ),
      ],
      past: [
        T("Тут позвонили в дверь.", "Just then the doorbell rang.", "En ese momento sonó el timbre."),
        T(
          "Женщина открыла — на пороге стояла подруга с большой коробкой.",
          "The woman opened the door, and there stood her friend with a big box.",
          "La mujer abrió: en la puerta estaba su amiga con una caja grande."
        ),
      ],
    },
    {
      id: "soup-7",
      ...KITCHEN,
      els: [
        r(8, 62, 84, 10, WOOD, 3),
        e("👩", 12, 32, 20),
        e("👩‍🦱", 88, 32, 20),
        e("☕", 27, 52, 11),
        e("☕", 38, 52, 11),
        e("🍕", 60, 46, 26),
        e("✨", 76, 22, 9),
      ],
      spots: [
        sp("pizza", [47, 26, 26, 36], T("Где пицца?", "Where is the pizza?", "¿Dónde está la pizza?")),
        sp("cups", [20, 36, 25, 26], T("Где чашки?", "Where are the cups?", "¿Dónde están las tazas?")),
        sp("table", [8, 62, 84, 18], T("Где стол?", "Where is the table?", "¿Dónde está la mesa?")),
      ],
      lines: [
        T("В коробке пицца!", "There is a pizza in the box!", "¡En la caja hay una pizza!"),
        T(
          "Подруги сидят за столом и едят.",
          "The friends sit at the table and eat.",
          "Las amigas se sientan a la mesa y comen."
        ),
        T(
          "Они смеются: суп сгорел, а ужин есть.",
          "They laugh: the soup burned, but there is dinner.",
          "Se ríen: la sopa se quemó, pero hay cena."
        ),
      ],
      past: [
        T("В коробке была пицца!", "In the box there was a pizza!", "¡En la caja había una pizza!"),
        T(
          "Подруги сели за стол, ели и долго смеялись.",
          "The friends sat down at the table, ate and laughed for a long time.",
          "Las amigas se sentaron a la mesa, comieron y se rieron mucho."
        ),
      ],
    },
  ],
};

const MORNING_SKY: [string, string] = ["#cfe9ff", "#ffe9cc"];
const DAY_SKY: [string, string] = ["#bfe1ff", "#e6f4ff"];
const GRASS: [string, number] = ["#9fd08a", 34];
const lake = (): PanelEl => r(50, 56, 50, 44, WATER);
/* The 🎣 glyph always has a fish on the hook, which would give the story away —
   so the rod is drawn: a slanted stick, a line, and a red float. */
const rod = (cx: number, cy: number, len: number, rot: number): PanelEl =>
  r(cx - 0.6, cy - len / 2, 1.2, len, "#8a5c38", 2, { rot });
const fishLine = (x: number, y: number, h: number): PanelEl => r(x, y, 0.5, h, "#5a5a5a");
const float = (x: number, y: number): PanelEl => r(x - 1.2, y, 2.4, 3.2, "#e8473d", 50);

const STORY_FISH: Story = {
  id: "fishing",
  icon: "🎣",
  panels: [
    {
      id: "fish-1",
      bg: MORNING_SKY,
      floor: GRASS,
      els: [
        e("☀️", 90, 14, 12),
        e("🌲", 10, 42, 22),
        e("🌲", 25, 48, 15),
        rod(72, 42, 46, 25),
        fishLine(79.1, 21, 12),
        float(79.3, 32),
        e("👴", 56, 44, 24),
        e("🪣", 58, 78, 14),
        e("🐈", 30, 78, 18, { flip: true }),
      ],
      spots: [
        sp("grandpa", [44, 24, 22, 38], T("Где дедушка?", "Where is Grandpa?", "¿Dónde está el abuelo?")),
        sp("rod", [64, 16, 20, 50], T("Где удочка?", "Where is the fishing rod?", "¿Dónde está la caña de pescar?")),
        sp("bucket", [48, 64, 20, 30], T("Где ведро?", "Where is the bucket?", "¿Dónde está el balde?")),
        sp("cat", [17, 62, 26, 32], T("Где кот?", "Where is the cat?", "¿Dónde está el gato?")),
      ],
      lines: [
        T("Раннее утро.", "It is early morning.", "Es muy temprano."),
        T("Дедушка идёт на озеро.", "Grandpa is walking to the lake.", "El abuelo va al lago."),
        T(
          "У него удочка и ведро.",
          "He has a fishing rod and a bucket.",
          "Lleva una caña de pescar y un balde."
        ),
        T("За ним идёт кот.", "The cat walks behind him.", "El gato va detrás de él."),
      ],
      past: [
        T(
          "Однажды рано утром дедушка пошёл на озеро.",
          "Early one morning Grandpa went to the lake.",
          "Una mañana, muy temprano, el abuelo fue al lago."
        ),
        T(
          "Он взял удочку и ведро, а кот пошёл за ним.",
          "He took a fishing rod and a bucket, and the cat followed him.",
          "Llevó una caña de pescar y un balde, y el gato lo siguió."
        ),
      ],
    },
    {
      id: "fish-2",
      bg: DAY_SKY,
      floor: GRASS,
      els: [
        lake(),
        rod(45, 40, 44, 40),
        fishLine(55.4, 23, 36),
        float(55.6, 57),
        e("👴", 30, 44, 22),
        e("🐈", 19, 76, 16, { flip: true }),
        e("🪣", 38, 80, 12),
        e("🦆", 84, 66, 13),
      ],
      spots: [
        sp("water", [50, 78, 50, 22], T("Где вода?", "Where is the water?", "¿Dónde está el agua?")),
        sp("duck", [74, 54, 21, 24], T("Где утка?", "Where is the duck?", "¿Dónde está el pato?")),
        sp("cat", [7, 62, 24, 30], T("Где кот?", "Where is the cat?", "¿Dónde está el gato?")),
        sp("grandpa", [18, 24, 24, 36], T("Кто ловит рыбу?", "Who is fishing?", "¿Quién está pescando?")),
      ],
      lines: [
        T("Дедушка сидит на берегу.", "Grandpa is sitting on the shore.", "El abuelo está sentado en la orilla."),
        T("Он ловит рыбу.", "He is fishing.", "Está pescando."),
        T(
          "Кот сидит рядом и смотрит на воду.",
          "The cat sits next to him and looks at the water.",
          "El gato se sienta a su lado y mira el agua."
        ),
      ],
      past: [
        T(
          "Дедушка сел на берегу и стал ловить рыбу.",
          "Grandpa sat down on the shore and began to fish.",
          "El abuelo se sentó en la orilla y se puso a pescar."
        ),
        T(
          "Кот сидел рядом и смотрел на воду.",
          "The cat sat next to him and watched the water.",
          "El gato se sentó a su lado y miraba el agua."
        ),
      ],
    },
    {
      id: "fish-3",
      bg: DAY_SKY,
      floor: GRASS,
      els: [
        lake(),
        rod(41, 38, 44, 40),
        fishLine(51.4, 21, 27),
        e("👴", 24, 44, 22),
        e("❗", 36, 14, 10),
        e("👢", 53, 59, 18),
        e("💧", 48, 84, 7),
        e("💧", 59, 88, 6),
        e("🐈", 13, 78, 15, { flip: true }),
      ],
      spots: [
        sp("boot", [42, 43, 22, 32], T("Где сапог?", "Where is the boot?", "¿Dónde está la bota?")),
        sp(
          "drops",
          [40, 76, 28, 24],
          T("Где капли воды?", "Where are the drops of water?", "¿Dónde están las gotas de agua?")
        ),
        sp("grandpa", [12, 24, 24, 36], T("Где дедушка?", "Where is Grandpa?", "¿Dónde está el abuelo?")),
      ],
      lines: [
        T("Дедушка тянет удочку.", "Grandpa pulls the rod.", "El abuelo tira de la caña."),
        T(
          "На крючке не рыба, а старый сапог!",
          "On the hook there is not a fish but an old boot!",
          "¡En el anzuelo no hay un pez, sino una bota vieja!"
        ),
        T("Из сапога льётся вода.", "Water pours out of the boot.", "De la bota sale agua."),
      ],
      past: [
        T("Вдруг удочка дёрнулась.", "Suddenly the rod jerked.", "De pronto la caña se movió."),
        T(
          "Дедушка потянул — и вытащил старый сапог!",
          "Grandpa pulled, and out came an old boot!",
          "El abuelo tiró… ¡y sacó una bota vieja!"
        ),
      ],
    },
    {
      id: "fish-4",
      bg: DAY_SKY,
      floor: GRASS,
      els: [
        lake(),
        rod(44, 36, 44, 40),
        fishLine(54.4, 19, 29),
        e("👴", 27, 40, 22),
        e("💢", 39, 14, 10),
        e("🥫", 55.5, 58, 16),
        e("👢", 38, 82, 12),
        e("😹", 13, 74, 16),
      ],
      spots: [
        sp("can", [45, 43, 21, 30], T("Где банка?", "Where is the can?", "¿Dónde está la lata?")),
        sp("boot", [29, 70, 19, 26], T("Где сапог?", "Where is the boot?", "¿Dónde está la bota?")),
        sp("cat", [3, 56, 22, 34], T("Кто смеётся?", "Who is laughing?", "¿Quién se ríe?")),
        sp("grandpa", [15, 20, 24, 36], T("Кто сердится?", "Who is angry?", "¿Quién está enojado?")),
      ],
      lines: [
        T(
          "Дедушка снова забрасывает удочку.",
          "Grandpa casts his line again.",
          "El abuelo lanza la caña otra vez."
        ),
        T(
          "Теперь на крючке консервная банка.",
          "Now there is a tin can on the hook.",
          "Ahora en el anzuelo hay una lata."
        ),
        T(
          "Дедушка сердится, а кот смеётся.",
          "Grandpa is angry, and the cat is laughing.",
          "El abuelo se enoja y el gato se ríe."
        ),
      ],
      past: [
        T(
          "Он забросил удочку ещё раз и поймал консервную банку.",
          "He cast his line once more and caught a tin can.",
          "Lanzó la caña otra vez y pescó una lata."
        ),
        T("Дедушка рассердился.", "Grandpa got angry.", "El abuelo se enojó."),
      ],
    },
    {
      id: "fish-5",
      bg: DAY_SKY,
      floor: GRASS,
      els: [
        lake(),
        e("☀️", 50, 14, 16),
        e("👴", 20, 48, 22),
        e("💤", 34, 26, 12),
        rod(28, 86, 40, 80),
        e("🐈", 42, 68, 15, { flip: true }),
        e("🐟", 78, 76, 20),
      ],
      spots: [
        sp("sun", [38, 0, 24, 30], T("Где солнце?", "Where is the sun?", "¿Dónde está el sol?")),
        sp("grandpa", [8, 28, 26, 38], T("Кто спит?", "Who is sleeping?", "¿Quién duerme?")),
        sp("fish", [64, 62, 28, 30], T("Где рыба?", "Where is the fish?", "¿Dónde está el pez?")),
        sp("cat", [34, 54, 18, 28], T("Кто не спит?", "Who is not sleeping?", "¿Quién no duerme?")),
      ],
      lines: [
        T("Солнце уже высоко.", "The sun is already high.", "El sol ya está alto."),
        T("Дедушка устал и спит.", "Grandpa is tired and sleeping.", "El abuelo está cansado y duerme."),
        T(
          "А кот не спит: в воде плывёт большая рыба.",
          "But the cat is not sleeping: a big fish is swimming in the water.",
          "Pero el gato no duerme: en el agua nada un pez grande."
        ),
      ],
      past: [
        T("Солнце поднялось высоко.", "The sun rose high.", "El sol subió alto."),
        T(
          "Дедушка устал и уснул, а кот увидел в воде большую рыбу.",
          "Grandpa got tired and fell asleep, but the cat saw a big fish in the water.",
          "El abuelo se cansó y se durmió, pero el gato vio un pez grande en el agua."
        ),
      ],
    },
    {
      id: "fish-6",
      bg: DAY_SKY,
      floor: GRASS,
      els: [
        lake(),
        e("👴", 12, 42, 14),
        e("💤", 21, 26, 8),
        e("🐈", 42, 58, 24, { flip: true }),
        e("🐟", 69, 62, 22),
        e("💦", 60, 32, 14),
        e("💦", 82, 38, 12, { flip: true }),
      ],
      spots: [
        sp("cat", [29, 42, 26, 34], T("Где кот?", "Where is the cat?", "¿Dónde está el gato?")),
        sp("fish", [57, 48, 25, 30], T("Где рыба?", "Where is the fish?", "¿Dónde está el pez?")),
        sp(
          "splash",
          [51, 16, 42, 30],
          T("Где брызги?", "Where is the splash?", "¿Dónde están las salpicaduras?")
        ),
        sp("grandpa", [2, 22, 22, 36], T("Где дедушка?", "Where is Grandpa?", "¿Dónde está el abuelo?")),
      ],
      lines: [
        T("Кот прыгает к воде.", "The cat jumps to the water.", "El gato salta hacia el agua."),
        T(
          "Он ловит рыбу лапой!",
          "He catches the fish with his paw!",
          "¡Atrapa el pez con la pata!"
        ),
        T(
          "Брызги летят во все стороны.",
          "Water splashes everywhere.",
          "El agua salpica por todas partes."
        ),
      ],
      past: [
        T(
          "Кот прыгнул к воде и поймал рыбу лапой!",
          "The cat jumped to the water and caught the fish with his paw!",
          "El gato saltó hacia el agua ¡y atrapó el pez con la pata!"
        ),
      ],
    },
    {
      id: "fish-7",
      bg: ["#f8c9a2", "#f1a9b8"],
      floor: ["#7fae6b", 34],
      els: [
        e("🌙", 15, 16, 12),
        e("🏠", 84, 42, 26),
        e("👴", 30, 44, 22),
        e("👢", 27, 68, 8, { rot: -12 }),
        e("🥫", 34, 68, 7, { rot: 10 }),
        e("🪣", 30, 80, 16),
        e("🐈", 58, 78, 18, { flip: true }),
        e("🐟", 70, 70, 11),
      ],
      spots: [
        sp("house", [70, 20, 28, 42], T("Где дом?", "Where is the house?", "¿Dónde está la casa?")),
        sp("moon", [5, 2, 20, 28], T("Где луна?", "Where is the moon?", "¿Dónde está la luna?")),
        sp("bucket", [19, 60, 22, 36], T("Где ведро?", "Where is the bucket?", "¿Dónde está el balde?")),
        sp("fish", [62, 56, 17, 26], T("Где рыба?", "Where is the fish?", "¿Dónde está el pescado?")),
      ],
      lines: [
        T(
          "Вечер. Дедушка и кот идут домой.",
          "It is evening. Grandpa and the cat are walking home.",
          "Es de tarde. El abuelo y el gato vuelven a casa."
        ),
        T(
          "В ведре у дедушки сапог и банка.",
          "In Grandpa's bucket there are a boot and a can.",
          "En el balde del abuelo hay una bota y una lata."
        ),
        T("А рыбу несёт кот!", "And the cat is carrying the fish!", "¡Y el pescado lo lleva el gato!"),
      ],
      past: [
        T("Вечером они пошли домой.", "In the evening they went home.", "Por la tarde volvieron a casa."),
        T(
          "Дедушка нёс в ведре сапог и банку, а рыбу нёс кот.",
          "Grandpa carried a boot and a can in his bucket, and the cat carried the fish.",
          "El abuelo llevaba en el balde una bota y una lata, y el gato llevaba el pescado."
        ),
      ],
    },
  ],
};

export const STORIES: Story[] = [STORY_SOCK, STORY_SOUP, STORY_FISH];

/* ----------------------------- busy scenes ------------------------------ */
/* Square panels, many small clusters. Each spot's `say` is one thing that is
   happening; the grower finds it, then later describes it themselves. */

const crumb = (x: number, y: number): PanelEl => r(x, y, 1.2, 1.2, "#8a5c38", 50);

const SCENE_MARKET: BusyScene = {
  id: "market",
  icon: "🧺",
  panel: {
    id: "market",
    bg: ["#fdeccb", "#f3d6a3"],
    els: [
      // stall awnings
      r(4, 3, 28, 5, "#e8705f", 3),
      r(36, 3, 28, 5, "#5c9fe8", 3),
      r(68, 3, 28, 5, "#58b77a", 3),
      // shop signs hang on the awnings, clear of the numbered regions below
      sign("apple", "🍎", 27, 5.5, 6.5),
      sign("bread", "🍞", 59, 5.5, 6.5),
      sign("flower", "🌸", 91, 5.5, 6.5),
      // row 1 — stalls
      e("👩‍🌾", 17, 19, 11),
      e("🍎", 26, 22, 7),
      e("🍎", 29, 16, 5),
      e("👨‍🍳", 49, 19, 11),
      e("🥖", 59, 20, 9),
      e("👩", 81, 19, 11),
      e("💐", 91, 20, 10),
      // row 2
      e("👦", 10, 42, 10),
      e("🍦", 19, 44, 8),
      e("👵", 35, 42, 10),
      e("🧺", 45, 45, 9),
      e("🧑‍🎤", 60, 42, 10),
      e("🎸", 69, 44, 9),
      e("🎵", 74, 34, 5),
      e("👧", 87, 44, 10),
      e("🎈", 94, 34, 8),
      // row 3
      e("🚴", 14, 65, 14),
      e("🐕", 37, 66, 11),
      e("🦴", 46, 70, 6),
      r(56, 68, 18, 2.4, WOOD, 2),
      e("👩‍🦳", 55, 62, 9),
      e("👩‍🦱", 75, 62, 9),
      e("☕", 62, 65, 5),
      e("☕", 68, 65, 5),
      e("👶", 89, 65, 10),
      e("💤", 95, 56, 6),
      // row 4
      e("🐈", 12, 88, 11),
      e("🐟", 22, 90, 7),
      e("👨", 41, 86, 10),
      e("🧹", 51, 88, 10),
      e("🐦", 67, 88, 8),
      e("🐦", 76, 90, 7, { flip: true }),
      crumb(70, 95),
      crumb(73, 96.5),
      crumb(79, 96),
      e("⛲", 91, 87, 12),
    ],
    spots: [
      sp("apples", [3, 9, 30, 20], T("Женщина продаёт яблоки.", "A woman is selling apples.", "Una mujer vende manzanas.")),
      sp("bread", [35, 9, 30, 20], T("Пекарь продаёт хлеб.", "The baker is selling bread.", "El panadero vende pan.")),
      sp("flowers", [67, 9, 31, 20], T("Женщина покупает цветы.", "A woman is buying flowers.", "Una mujer compra flores.")),
      sp("icecream", [3, 32, 22, 21], T("Мальчик ест мороженое.", "A boy is eating ice cream.", "Un niño come helado.")),
      sp("basket", [27, 32, 24, 21], T("Бабушка несёт корзину.", "A grandmother is carrying a basket.", "Una abuela lleva una cesta.")),
      sp("guitar", [53, 30, 24, 23], T("Музыкант играет на гитаре.", "A musician is playing the guitar.", "Un músico toca la guitarra.")),
      sp("balloon", [79, 28, 20, 25], T("Девочка держит воздушный шарик.", "A girl is holding a balloon.", "Una niña tiene un globo.")),
      sp("bike", [4, 55, 22, 20], T("Мужчина едет на велосипеде.", "A man is riding a bicycle.", "Un hombre va en bicicleta.")),
      sp("bone", [28, 56, 22, 20], T("Собака грызёт кость.", "A dog is chewing a bone.", "Un perro muerde un hueso.")),
      sp("tea", [50, 54, 30, 20], T("Две подруги пьют чай.", "Two friends are drinking tea.", "Dos amigas toman té.")),
      sp("baby", [81, 52, 18, 22], T("Малыш спит.", "A baby is sleeping.", "Un bebé duerme.")),
      sp("cat", [3, 78, 26, 20], T("Кошка крадёт рыбу.", "A cat is stealing a fish.", "Un gato roba un pescado.")),
      sp("sweep", [32, 76, 26, 22], T("Мужчина подметает улицу.", "A man is sweeping the street.", "Un hombre barre la calle.")),
      sp("birds", [60, 78, 22, 21], T("Птицы клюют крошки.", "Birds are pecking at crumbs.", "Los pájaros picotean migas.")),
    ],
    lines: [],
  },
};

const SCENE_PARK: BusyScene = {
  id: "park",
  icon: "🌳",
  panel: {
    id: "park",
    bg: ["#d3edb8", "#b3dc92"],
    els: [
      r(60, 55, 38, 22, WATER, 50),
      // row 1
      e("👧", 11, 21, 10),
      e("🪁", 22, 9, 9),
      e("🌳", 45, 17, 21),
      e("🐦", 51, 10, 6),
      e("🎵", 58, 5, 5),
      e("🧑‍🎨", 78, 18, 11),
      e("🖼️", 90, 19, 10),
      // row 2
      e("🏃", 12, 44, 13),
      r(27, 50, 21, 2.4, "#8a5c38", 2),
      e("👴", 33, 42, 10),
      e("📰", 42, 44, 8),
      r(63, 47, 13, 5, "#f08fb0", 2),
      e("👩", 60, 42, 10),
      e("🍦", 70, 40, 7),
      e("👩‍🦰", 86, 42, 10),
      e("📷", 94, 45, 7),
      // row 3
      e("👦", 8, 65, 9),
      e("⚽", 17, 69, 6),
      e("👦", 26, 65, 9),
      e("🚶‍♀️", 41, 63, 12),
      e("🐕", 51, 68, 9),
      e("🦆", 69, 63, 8),
      e("🦆", 78, 68, 7),
      e("🚣", 90, 63, 10),
      // row 4
      r(4, 87, 25, 10, "#f2a7a0", 3),
      e("👨", 8, 82, 7),
      e("👩", 16, 82, 7),
      e("👧", 12, 90, 6),
      e("🧺", 25, 86, 8),
      e("🥪", 20, 93, 5),
      e("🐿️", 42, 88, 10),
      e("🌰", 50, 91, 5),
      e("🌳", 75, 86, 17),
      e("😴", 66, 93, 8),
      e("🌷", 92, 89, 7),
      e("🌼", 96, 80, 5),
    ],
    spots: [
      sp("kite", [3, 3, 27, 27], T("Девочка запускает воздушного змея.", "A girl is flying a kite.", "Una niña vuela una cometa.")),
      sp("song", [33, 2, 30, 28], T("Птица поёт на дереве.", "A bird is singing in the tree.", "Un pájaro canta en el árbol.")),
      sp("painter", [70, 7, 28, 23], T("Художник рисует картину.", "An artist is painting a picture.", "Un pintor pinta un cuadro.")),
      sp("runner", [3, 33, 20, 22], T("Мужчина бежит.", "A man is running.", "Un hombre corre.")),
      sp("paper", [26, 32, 24, 22], T("Дедушка читает газету.", "A grandfather is reading a newspaper.", "Un abuelo lee el periódico.")),
      sp("seller", [53, 32, 24, 22], T("Женщина продаёт мороженое.", "A woman is selling ice cream.", "Una mujer vende helados.")),
      sp("photo", [79, 32, 20, 22], T("Женщина фотографирует.", "A woman is taking a photo.", "Una mujer toma una foto.")),
      sp("ball", [2, 56, 30, 20], T("Мальчики играют в мяч.", "Boys are playing ball.", "Unos niños juegan a la pelota.")),
      sp("walk", [34, 54, 23, 22], T("Женщина гуляет с собакой.", "A woman is walking her dog.", "Una mujer pasea a su perro.")),
      sp("ducks", [61, 55, 23, 20], T("Утки плавают в пруду.", "Ducks are swimming in the pond.", "Los patos nadan en el estanque.")),
      sp("boat", [84, 53, 16, 22], T("Мужчина плывёт на лодке.", "A man is rowing a boat.", "Un hombre rema en un bote.")),
      sp("picnic", [3, 77, 28, 22], T("Семья обедает на траве.", "A family is having lunch on the grass.", "Una familia come en la hierba.")),
      sp("squirrel", [34, 78, 22, 21], T("Белка грызёт орех.", "A squirrel is eating a nut.", "Una ardilla come una nuez.")),
      sp("sleeper", [58, 77, 27, 22], T("Мужчина спит под деревом.", "A man is sleeping under a tree.", "Un hombre duerme debajo de un árbol.")),
    ],
    lines: [],
  },
};

export const BUSY_SCENES: BusyScene[] = [SCENE_MARKET, SCENE_PARK];

/* --------------------------- process picture series ---------------------- */

const step = (
  id: string,
  bg: [string, string],
  els: PanelEl[],
  line: StudioText
): Panel => ({ id, bg, els, spots: [], lines: [line] });

const steam = (x: number, y: number): PanelEl[] => [
  r(x, y + 8, 14, 14, "#ffffff", 50, { o: 0.9 }),
  r(x - 12, y, 11, 11, "#ffffff", 50, { o: 0.8 }),
  r(x + 10, y - 4, 9, 9, "#ffffff", 50, { o: 0.7 }),
];

const TEA_BG: [string, string] = ["#e6f1e2", "#d2e6cb"];
const SERIES_TEA: ProcessSeries = {
  id: "tea",
  icon: "🫖",
  steps: [
    step(
      "tea-1",
      TEA_BG,
      [e("🚰", 30, 30, 36), e("💧", 44, 54, 12), e("🫖", 64, 68, 42)],
      T("Женщина наливает воду в чайник.", "The woman pours water into the kettle.", "La mujer echa agua en la tetera.")
    ),
    step(
      "tea-2",
      TEA_BG,
      [e("🫖", 50, 40, 48), e("🔥", 50, 80, 30)],
      T("Она ставит чайник на огонь.", "She puts the kettle on the stove.", "Pone la tetera al fuego.")
    ),
    step(
      "tea-3",
      TEA_BG,
      [...steam(52, 8), e("🫖", 50, 60, 48), e("🔥", 50, 90, 16)],
      T("Вода кипит.", "The water is boiling.", "El agua hierve.")
    ),
    step(
      "tea-4",
      TEA_BG,
      [e("🍃", 38, 26, 26), e("☕", 56, 64, 48)],
      T("Она кладёт чай в чашку.", "She puts tea into the cup.", "Pone té en la taza.")
    ),
    step(
      "tea-5",
      TEA_BG,
      [e("🫖", 34, 34, 42, { rot: 28 }), e("💧", 58, 52, 10), e("☕", 70, 72, 36)],
      T("Она наливает кипяток в чашку.", "She pours the hot water into the cup.", "Echa el agua caliente en la taza.")
    ),
    step(
      "tea-6",
      TEA_BG,
      [e("👩", 38, 44, 46), e("☕", 74, 66, 28)],
      T("Она пьёт горячий чай.", "She drinks the hot tea.", "Toma el té caliente.")
    ),
  ],
};

const AM_BG: [string, string] = ["#fdeccb", "#f8d9ad"];
const SERIES_MORNING: ProcessSeries = {
  id: "morning",
  icon: "⏰",
  steps: [
    step(
      "am-1",
      AM_BG,
      [e("🛌", 46, 62, 60), e("⏰", 78, 24, 26)],
      T("Мальчик просыпается.", "The boy wakes up.", "El niño se despierta.")
    ),
    step(
      "am-2",
      AM_BG,
      [e("🚿", 50, 42, 56), e("💧", 36, 80, 12), e("💧", 60, 84, 10)],
      T("Он принимает душ.", "He takes a shower.", "Se ducha.")
    ),
    step(
      "am-3",
      AM_BG,
      [e("🪥", 42, 42, 48), e("🦷", 72, 70, 28)],
      T("Он чистит зубы.", "He brushes his teeth.", "Se cepilla los dientes.")
    ),
    step(
      "am-4",
      AM_BG,
      [e("👕", 34, 40, 42), e("👖", 68, 62, 42)],
      T("Он одевается.", "He gets dressed.", "Se viste.")
    ),
    step(
      "am-5",
      AM_BG,
      [e("🥣", 40, 60, 48), e("🥛", 76, 42, 30)],
      T("Он завтракает.", "He eats breakfast.", "Desayuna.")
    ),
    step(
      "am-6",
      AM_BG,
      [e("🚪", 70, 48, 54), e("🎒", 30, 64, 40)],
      T(
        "Он берёт рюкзак и выходит из дома.",
        "He takes his backpack and leaves the house.",
        "Toma su mochila y sale de casa."
      )
    ),
  ],
};

const WASH_BG: [string, string] = ["#e3eefb", "#cddff5"];
const machine = (x: number): PanelEl[] => [
  r(x, 28, 46, 56, "#f4f4f6", 8, { bd: "#c6c8cf" }),
  r(x + 5, 33, 12, 4, "#c6c8cf", 3),
  r(x + 11, 46, 24, 24, "#8fc7ee", 50, { bd: "#9a9ca3" }),
];
const SERIES_WASH: ProcessSeries = {
  id: "laundry",
  icon: "👕",
  steps: [
    step(
      "wash-1",
      WASH_BG,
      [e("👕", 34, 28, 26, { rot: -14 }), e("🧦", 66, 30, 22, { rot: 14 }), e("🧺", 50, 68, 50)],
      T("Мужчина собирает грязную одежду.", "The man gathers the dirty clothes.", "El hombre junta la ropa sucia.")
    ),
    step(
      "wash-2",
      WASH_BG,
      [...machine(46), e("👕", 22, 56, 30)],
      T(
        "Он кладёт одежду в стиральную машину.",
        "He puts the clothes into the washing machine.",
        "Mete la ropa en la lavadora."
      )
    ),
    step(
      "wash-3",
      WASH_BG,
      [...machine(10), e("👈", 76, 36, 30)],
      T("Он включает машину.", "He turns the machine on.", "Enciende la lavadora.")
    ),
    step(
      "wash-4",
      WASH_BG,
      [...machine(27), e("🌀", 50, 58, 20), e("💦", 84, 30, 18), e("💦", 14, 34, 16, { flip: true })],
      T("Машина стирает одежду.", "The machine washes the clothes.", "La lavadora lava la ropa.")
    ),
    step(
      "wash-5",
      WASH_BG,
      [
        e("☀️", 16, 12, 16),
        r(4, 28, 92, 1.4, "#7a6a55"),
        e("👕", 26, 46, 30),
        e("👖", 54, 48, 28),
        e("🧦", 80, 44, 20),
      ],
      T("Он вешает одежду на верёвку.", "He hangs the clothes on the line.", "Cuelga la ropa en la cuerda.")
    ),
    step(
      "wash-6",
      WASH_BG,
      [e("👕", 50, 60, 50), e("✨", 78, 26, 20), e("✨", 24, 30, 14)],
      T("Он складывает чистую одежду.", "He folds the clean clothes.", "Dobla la ropa limpia.")
    ),
  ],
};

const SEED_BG: [string, string] = ["#e9f6ff", "#d2eafa"];
const SOIL = "#5a3d2b";
const pot = (x: number, y: number): PanelEl[] => [
  r(x - 16, y, 32, 26, "#c9794f", 8),
  r(x - 19, y - 5, 38, 8, "#b5673f", 4),
  r(x - 15, y - 4, 30, 4, SOIL, 50),
];
const SERIES_SEED: ProcessSeries = {
  id: "seed",
  icon: "🌱",
  steps: [
    step(
      "seed-1",
      SEED_BG,
      [...pot(56, 64), e("👧", 22, 30, 30), r(52, 24, 12, 10, SOIL, 50), r(58, 40, 8, 7, SOIL, 50)],
      T("Девочка насыпает землю в горшок.", "The girl puts soil into the pot.", "La niña pone tierra en la maceta.")
    ),
    step(
      "seed-2",
      SEED_BG,
      [...pot(50, 64), e("🌰", 50, 32, 18)],
      T("Она кладёт семечко в землю.", "She puts a seed into the soil.", "Pone una semilla en la tierra.")
    ),
    step(
      "seed-3",
      SEED_BG,
      [...pot(50, 64), e("💧", 38, 30, 14), e("💧", 54, 20, 16), e("💧", 64, 40, 11)],
      T("Она поливает землю.", "She waters the soil.", "Riega la tierra.")
    ),
    step(
      "seed-4",
      SEED_BG,
      [window_(10, 6, 80, 56), e("☀️", 68, 26, 24), ...pot(36, 66)],
      T(
        "Горшок стоит на окне, на солнце.",
        "The pot stands in the window, in the sun.",
        "La maceta está en la ventana, al sol."
      )
    ),
    step(
      "seed-5",
      SEED_BG,
      [e("🌱", 50, 44, 30), ...pot(50, 64)],
      T("Из земли появляется росток.", "A sprout comes up out of the soil.", "De la tierra sale un brote.")
    ),
    step(
      "seed-6",
      SEED_BG,
      [e("🌻", 44, 32, 48), ...pot(44, 66), e("👧", 84, 72, 22)],
      T("Вырастает большой цветок.", "A big flower grows.", "Crece una flor grande.")
    ),
  ],
};

const EGG_BG: [string, string] = ["#fff2d9", "#fde1b0"];
const pan = (x: number, y: number): PanelEl[] => [
  r(x + 18, y - 3, 30, 6, "#2a2d33", 3),
  r(x - 24, y - 10, 48, 20, "#3b3f46", 50),
  r(x - 19, y - 7, 38, 14, "#565b64", 50),
];
const SERIES_EGG: ProcessSeries = {
  id: "egg",
  icon: "🍳",
  steps: [
    step(
      "egg-1",
      EGG_BG,
      [...pan(42, 44), e("🔥", 42, 76, 28)],
      T(
        "Мужчина ставит сковороду на огонь.",
        "The man puts the frying pan on the stove.",
        "El hombre pone la sartén al fuego."
      )
    ),
    step(
      "egg-2",
      EGG_BG,
      [...pan(42, 62), e("🧈", 42, 34, 26)],
      T("Он кладёт масло на сковороду.", "He puts butter in the pan.", "Pone mantequilla en la sartén.")
    ),
    step(
      "egg-3",
      EGG_BG,
      [...pan(42, 70), e("🥚", 42, 30, 30), e("💥", 62, 20, 14)],
      T("Он разбивает яйцо.", "He cracks an egg.", "Rompe un huevo.")
    ),
    step(
      "egg-4",
      EGG_BG,
      [...steam(48, 2), e("🍳", 46, 56, 56), e("🔥", 44, 90, 14)],
      T("Яйцо жарится.", "The egg is frying.", "El huevo se fríe.")
    ),
    step(
      "egg-5",
      EGG_BG,
      [e("🍳", 42, 64, 50), e("🧂", 72, 24, 28, { rot: -30 })],
      T("Он солит яйцо.", "He salts the egg.", "Le pone sal al huevo.")
    ),
    step(
      "egg-6",
      EGG_BG,
      [e("🍽️", 46, 58, 62), e("🍳", 46, 58, 24), e("🍞", 84, 26, 22), e("😋", 16, 24, 20)],
      T(
        "Он кладёт яичницу на тарелку и ест.",
        "He puts the fried egg on a plate and eats it.",
        "Pone el huevo frito en un plato y se lo come."
      )
    ),
  ],
};

export const PROCESS_SERIES: ProcessSeries[] = [SERIES_TEA, SERIES_MORNING, SERIES_WASH, SERIES_SEED, SERIES_EGG];

/* ------------------------- ways to ask (clarifying) ---------------------- */
/* Things the GROWER says to the nurturer about a moment they lost. */

export const ASK_MOVES: StudioText[] = [
  T("Скажи ещё раз, пожалуйста.", "Say it again, please.", "Dilo otra vez, por favor."),
  T("Помедленнее, пожалуйста.", "More slowly, please.", "Más despacio, por favor."),
  T("Я не понимаю.", "I don't understand.", "No entiendo."),
  T("Что это?", "What is that?", "¿Qué es eso?"),
  T("Что он делает?", "What is he doing?", "¿Qué está haciendo?"),
  T("Что значит это слово?", "What does this word mean?", "¿Qué significa esa palabra?"),
  T("Покажи, пожалуйста.", "Show me, please.", "Muéstrame, por favor."),
  T("Вот так?", "Like this?", "¿Así?"),
];

/* --------------------------- small-talk openers -------------------------- */
/* Questions the grower can ask to find today's one new fact. */

export const TALK_STARTERS: StudioText[] = [
  T("Как дела?", "How are you?", "¿Cómo estás?"),
  T("Что нового?", "What's new?", "¿Qué hay de nuevo?"),
  T("Где ты живёшь?", "Where do you live?", "¿Dónde vives?"),
  T("У тебя есть братья или сёстры?", "Do you have brothers or sisters?", "¿Tienes hermanos o hermanas?"),
  T("Кем ты работаешь?", "What is your job?", "¿En qué trabajas?"),
  T("Что ты любишь есть?", "What do you like to eat?", "¿Qué te gusta comer?"),
  T("Ты любишь кофе или чай?", "Do you like coffee or tea?", "¿Te gusta el café o el té?"),
  T(
    "Что ты любишь делать в выходные?",
    "What do you like to do on the weekend?",
    "¿Qué te gusta hacer los fines de semana?"
  ),
  T("Какое твоё любимое время года?", "What is your favorite season?", "¿Cuál es tu estación favorita?"),
];

/* ----------------------- word–sentence–word example ---------------------- */
/* One original model of the format, and one weak sentence to hear the
   difference: a good sentence SHOWS the meaning. */

export const WSW_EXAMPLE = {
  /** Phase-1 vocab card used as the picture */
  cardId: "cup",
  emoji: "☕",
  word: T("Чашка.", "Cup.", "La taza."),
  good: T(
    "Женщина наливает чай в чашку.",
    "The woman pours tea into the cup.",
    "La mujer echa té en la taza."
  ),
  weak: T("У меня нет чашки.", "I don't have a cup.", "No tengo una taza."),
};

/* ------------------------------- helpers -------------------------------- */

/** All lines in `lang`, or null when ANY is missing — never a half-authored set. */
export function hostLines(texts: StudioText[] | undefined, lang: LangCode): string[] | null {
  if (!texts || texts.length === 0) return null;
  const out: string[] = [];
  for (const text of texts) {
    const line = text[lang];
    if (!line) return null;
    out.push(line);
  }
  return out;
}

/** Vocab card ids shown as signs inside a panel (credited as words met on finish). */
export function panelCardIds(panel: Panel): string[] {
  return panel.els.flatMap((el) => (el.k === "c" ? [el.id] : []));
}

/* ----------------------------- audio contract ---------------------------- */

const AUDIO_LANGS: LangCode[] = ["ru", "en", "es"];

function allTexts(): StudioText[] {
  const out: StudioText[] = [];
  const fromPanel = (p: Panel) => {
    out.push(...p.lines, ...(p.past ?? []), ...p.spots.map((s) => s.say));
  };
  STORIES.forEach((s) => s.panels.forEach(fromPanel));
  BUSY_SCENES.forEach((s) => fromPanel(s.panel));
  PROCESS_SERIES.forEach((s) => s.steps.forEach(fromPanel));
  out.push(...ASK_MOVES, ...TALK_STARTERS, WSW_EXAMPLE.word, WSW_EXAMPLE.good, WSW_EXAMPLE.weak);
  return out;
}

/** Every exact string these tools pass to speak(), per language — for clip pregeneration. */
export const P2_AUDIO_LINES: Partial<Record<LangCode, string[]>> = Object.fromEntries(
  AUDIO_LANGS.map((lang) => [
    lang,
    [...new Set(allTexts().flatMap((text) => (text[lang] ? [text[lang] as string] : [])))],
  ])
);

/** True when Nuri has authored Phase 2 lines for this language. */
export const hasP2Voice = (lang: LangCode): boolean => (P2_AUDIO_LINES[lang]?.length ?? 0) > 0;
