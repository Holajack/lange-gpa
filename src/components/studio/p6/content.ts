import type { LangCode } from "@/lib/types";
import { hostText, type StudioText } from "../types";

/**
 * Phase 6 host-language content.
 *
 * Phase 6 has no authored curriculum: its real content is the grower's own
 * life and the people in it. What is authored here is deliberately small:
 *
 *  1. REHEARSAL SCRIPTS — prompt lines for the solo role-play warm-up. Nuri
 *     plays the customer / the guest (the layperson); the GROWER plays the
 *     professional or gives the toast, because that is the register the
 *     discourse track is built to grow. Nuri only ever supplies the prompt
 *     side. It never performs the model answer and never judges the reply.
 *  2. WAYS TO ASK — short things the grower says aloud to a host friend while
 *     going through a recording. Shown, never answered by the app.
 *  3. STARTER QUESTIONS — interview openers the grower can put in a question
 *     bank and then rework with a host friend.
 *
 * Authored for ru / en / es. Any other host language resolves to undefined
 * and the tools fall back to guide + recorder + library.
 */

export interface RehearsalScript {
  id: "toast" | "repair" | "salon";
  icon: string;
  /** needs-analysis bank ids this script is the nearest warm-up for */
  seeds: string[];
  /** Nuri's lines, in order. The grower answers each one aloud. */
  lines: StudioText[];
}

export const REHEARSAL_SCRIPTS: RehearsalScript[] = [
  {
    // Nuri is a guest at the table naming the occasion; the grower gives the toast.
    id: "toast",
    icon: "🥂",
    seeds: ["toast", "wedding", "blessing"],
    lines: [
      {
        ru: "Сегодня у нашей Марины день рождения. Скажите, пожалуйста, тост.",
        en: "It's Emma's birthday today. Would you say a toast, please?",
        es: "Hoy es el cumpleaños de Marina. ¿Nos dices unas palabras para brindar?",
      },
      {
        ru: "Сегодня мы отмечаем новоселье. Вам слово!",
        en: "We're celebrating a housewarming today. The floor is yours!",
        es: "Hoy estrenamos casa. ¡Tienes la palabra!",
      },
      {
        ru: "Сегодня у Андрея и Ольги свадьба. Скажите что-нибудь молодым.",
        en: "Andrew and Olivia got married today. Say a few words to the newlyweds.",
        es: "Hoy se casan Andrés y Olga. Diles algo a los novios.",
      },
      {
        ru: "Наш начальник уходит на пенсию. Скажите ему несколько тёплых слов.",
        en: "Our boss is retiring. Say a few warm words for him.",
        es: "Nuestro jefe se jubila. Dedícale unas palabras de cariño.",
      },
      {
        ru: "За столом сидит мама именинника. Может быть, вы скажете тост за родителей?",
        en: "The birthday boy's mother is at the table. Would you raise a glass to the parents?",
        es: "En la mesa está la mamá del cumpleañero. ¿Haces tú el brindis por los padres?",
      },
      {
        ru: "Мы так давно не виделись! С вас тост за встречу.",
        en: "It's been so long since we were all together! You owe us a toast.",
        es: "¡Cuánto tiempo sin vernos! Te toca brindar por el reencuentro.",
      },
    ],
  },
  {
    // Nuri is the customer with a car problem; the grower is the mechanic.
    id: "repair",
    icon: "🔧",
    seeds: ["car", "landlord"],
    lines: [
      {
        ru: "Здравствуйте. У меня машина плохо заводится по утрам.",
        en: "Hello. My car has trouble starting in the mornings.",
        es: "Buenos días. A mi coche le cuesta arrancar por las mañanas.",
      },
      {
        ru: "Это началось на прошлой неделе, когда похолодало.",
        en: "It began last week, when it turned cold.",
        es: "Empezó la semana pasada, cuando llegó el frío.",
      },
      {
        ru: "И ещё при торможении что-то скрипит.",
        en: "And something squeals when I brake.",
        es: "Y además algo chirría cuando freno.",
      },
      {
        ru: "Как вы думаете, в чём может быть дело?",
        en: "What do you think the problem might be?",
        es: "¿Qué cree usted que puede ser?",
      },
      {
        ru: "Сколько времени займёт ремонт?",
        en: "How long will the repair take?",
        es: "¿Cuánto tiempo va a tardar la reparación?",
      },
      {
        ru: "А пока на ней можно ездить?",
        en: "Is it all right to drive it in the meantime?",
        es: "¿Y mientras tanto puedo seguir usándolo?",
      },
      {
        ru: "Хорошо. Сколько это будет стоить?",
        en: "All right. How much will it cost?",
        es: "De acuerdo. ¿Cuánto me va a costar?",
      },
    ],
  },
  {
    // Nuri is the client in the chair; the grower is the hairdresser.
    id: "salon",
    icon: "💇",
    seeds: ["hair"],
    lines: [
      {
        ru: "Здравствуйте. У меня запись на три часа.",
        en: "Hello. I have an appointment at three.",
        es: "Buenas tardes. Tengo cita a las tres.",
      },
      {
        ru: "Я хочу немного подровнять кончики.",
        en: "I'd like just a little trim at the ends.",
        es: "Quiero cortarme solo las puntas.",
      },
      {
        ru: "Только, пожалуйста, не слишком коротко.",
        en: "Not too short, please.",
        es: "Pero no muy corto, por favor.",
      },
      {
        ru: "А что вы посоветуете сделать с чёлкой?",
        en: "What would you suggest I do with my bangs?",
        es: "¿Qué me recomienda hacer con el flequillo?",
      },
      {
        ru: "В последнее время волосы у меня стали очень сухими. Что можно сделать?",
        en: "My hair has been very dry lately. What can I do about it?",
        es: "Últimamente tengo el pelo muy seco. ¿Qué puedo hacer?",
      },
      {
        ru: "Спасибо, мне очень нравится. Сколько с меня?",
        en: "Thank you, I really like it. How much do I owe you?",
        es: "Gracias, me gusta mucho. ¿Cuánto le debo?",
      },
    ],
  },
];

/** Scripts that have authored lines in `lang` (empty when none do). */
export function scriptsFor(lang: LangCode): RehearsalScript[] {
  return REHEARSAL_SCRIPTS.filter((s) => s.lines.every((line) => hostText(line, lang) !== undefined));
}

/* ------------------------------ ways to ask ------------------------------ */

export type MoveSet = "feedback" | "clarify" | "reading" | "interview";

const MOVES: Record<MoveSet, StudioText[]> = {
  // going through your own recorded attempt with a host friend
  feedback: [
    { ru: "Как бы вы это сказали?", en: "How would you say that?", es: "¿Cómo lo diría usted?" },
    { ru: "Так говорят?", en: "Do people say it that way?", es: "¿Se dice así?" },
    { ru: "Я имею в виду, что…", en: "What I mean is…", es: "Lo que quiero decir es…" },
    { ru: "Что здесь звучит странно?", en: "What sounds odd here?", es: "¿Qué suena raro aquí?" },
  ],
  // working through a host person's recording
  clarify: [
    { ru: "Что значит это слово?", en: "What does this word mean?", es: "¿Qué significa esta palabra?" },
    {
      ru: "Повторите, пожалуйста, это место.",
      en: "Could you say that part again?",
      es: "¿Puede repetir esa parte, por favor?",
    },
    { ru: "Когда так говорят?", en: "When do people say that?", es: "¿Cuándo se dice eso?" },
    {
      ru: "Скажите, пожалуйста, это другими словами.",
      en: "Could you say it another way?",
      es: "¿Puede decirlo de otra manera?",
    },
  ],
  // talking over words from something you both read
  reading: [
    { ru: "Что значит это слово?", en: "What does this word mean?", es: "¿Qué significa esta palabra?" },
    { ru: "Где ещё так говорят?", en: "Where else do people say this?", es: "¿Dónde más se usa?" },
    { ru: "Приведите, пожалуйста, пример.", en: "Could you give me an example?", es: "¿Me puede dar un ejemplo?" },
    {
      ru: "Это книжное слово или разговорное?",
      en: "Is this a bookish word or an everyday one?",
      es: "¿Es una palabra culta o de todos los días?",
    },
  ],
  // keeping someone talking about the work they know
  interview: [
    { ru: "Расскажите об этом подробнее.", en: "Tell me more about that.", es: "Cuénteme más sobre eso." },
    { ru: "Как это называется?", en: "What is this called?", es: "¿Cómo se llama esto?" },
    { ru: "А что бывает потом?", en: "And what happens next?", es: "¿Y qué pasa después?" },
    {
      ru: "Покажите, пожалуйста, как это делается.",
      en: "Could you show me how it's done?",
      es: "¿Me puede mostrar cómo se hace?",
    },
  ],
};

/** Host-language "ways to ask" for a ClarifyPlayer, or undefined when none are authored. */
export function hostMoves(set: MoveSet, lang: LangCode): string[] | undefined {
  const out: string[] = [];
  for (const move of MOVES[set]) {
    const text = hostText(move, lang);
    if (text === undefined) return undefined;
    out.push(text);
  }
  return out;
}

/* ---------------------------- starter questions --------------------------- */

const STARTER_QUESTIONS: StudioText[] = [
  {
    ru: "Как вы пришли в эту профессию?",
    en: "How did you come into this line of work?",
    es: "¿Cómo llegó usted a esta profesión?",
  },
  {
    ru: "Как проходит ваш обычный рабочий день?",
    en: "What does an ordinary working day look like for you?",
    es: "¿Cómo es un día normal de trabajo para usted?",
  },
  {
    ru: "Что в вашей работе самое трудное?",
    en: "What is the hardest part of your work?",
    es: "¿Qué es lo más difícil de su trabajo?",
  },
  {
    ru: "Какими инструментами вы пользуетесь чаще всего?",
    en: "Which tools do you use most often?",
    es: "¿Qué herramientas usa con más frecuencia?",
  },
  {
    ru: "Чему новичку приходится учиться дольше всего?",
    en: "What takes a beginner the longest to learn?",
    es: "¿Qué es lo que más tarda en aprender un principiante?",
  },
  {
    ru: "Что люди обычно неправильно понимают в вашем деле?",
    en: "What do people usually get wrong about your field?",
    es: "¿Qué suele entender mal la gente sobre su oficio?",
  },
  {
    ru: "Что вы делаете, когда что-то идёт не так?",
    en: "What do you do when something goes wrong?",
    es: "¿Qué hace cuando algo sale mal?",
  },
  {
    ru: "Как понять, что работа сделана хорошо?",
    en: "How can you tell when a job has been done well?",
    es: "¿Cómo se sabe que un trabajo está bien hecho?",
  },
];

/** Interview openers in `lang`, or an empty list when none are authored. */
export function starterQuestions(lang: LangCode): string[] {
  const out: string[] = [];
  for (const q of STARTER_QUESTIONS) {
    const text = hostText(q, lang);
    if (text === undefined) return [];
    out.push(text);
  }
  return out;
}

/* ------------------------------ audio contract ---------------------------- */

const AUDIO_LANGS: LangCode[] = ["ru", "en", "es"];

/**
 * Every exact string the Phase 6 tools pass to speak(), per language: the
 * rehearsal prompt lines. (Ways-to-ask and starter questions are shown, not
 * spoken.)
 */
export const P6_AUDIO_LINES: Partial<Record<LangCode, string[]>> = Object.fromEntries(
  AUDIO_LANGS.map((lang) => [
    lang,
    REHEARSAL_SCRIPTS.flatMap((s) => s.lines.map((line) => line[lang]).filter((x): x is string => Boolean(x))),
  ])
);
