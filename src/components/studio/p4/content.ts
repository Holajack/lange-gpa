import type { LangCode } from "@/lib/types";
import type { StudioText } from "../types";

/**
 * Phase 4 host-language content.
 *
 * Phase 4 has no authored stories: the content of this phase is real people's
 * lives, and Nuri never invents any of it. What IS authored here is only the
 * grower's side of the conversation: the things they say to a mentor (asking
 * permission, the one opening question, ways to ask about a gap) and the
 * hole-finding prompt cards Nuri reads to the grower.
 *
 * Lines the grower says to a mentor use the polite form; prompt cards Nuri
 * says to the grower use the familiar form. Second-person past tense is
 * avoided throughout so nothing is gendered.
 */

const L = (ru: string, en: string, es: string): StudioText => ({ ru, en, es });

/* ---------------------- asking before you record ---------------------- */

export const P4_CONSENT_ASK: StudioText[] = [
  L("Можно я запишу наш разговор?", "May I record our conversation?", "¿Puedo grabar nuestra conversación?"),
  L(
    "Запись буду слушать только я.",
    "Only I will listen to the recording.",
    "Solo yo voy a escuchar la grabación."
  ),
  L(
    "Если захотите что-то стереть, я сразу сотру.",
    "If you ever want something erased, I will erase it right away.",
    "Si quiere que borre algo, lo borro enseguida."
  ),
];

/* --------------------------- the life story --------------------------- */

/** The one question. There is deliberately no list of topics after it. */
export const P4_LIFE_OPENER: StudioText[] = [
  L(
    "Расскажите, пожалуйста, историю своей жизни.",
    "Please tell me the story of your life.",
    "Cuénteme, por favor, la historia de su vida."
  ),
  L(
    "Мне правда интересно. Рассказывайте так, как вам хочется.",
    "I really am interested. Tell it any way you like.",
    "De verdad me interesa. Cuéntela como usted quiera."
  ),
];

/** Ways to ask about a moment you flagged. Said to a person; never answered by the app. */
export const P4_CLARIFY_MOVES: StudioText[] = [
  L("Что значит это слово?", "What does that word mean?", "¿Qué significa esa palabra?"),
  L(
    "Повторите, пожалуйста, помедленнее.",
    "Could you say that again, more slowly?",
    "¿Puede repetirlo más despacio, por favor?"
  ),
  L(
    "Я знаю это слово, но здесь оно значит что-то другое?",
    "I know that word, but does it mean something different here?",
    "Conozco esa palabra, pero ¿aquí significa otra cosa?"
  ),
  L(
    "Это такое выражение? Что оно значит?",
    "Is that an expression? What does it mean?",
    "¿Es una expresión? ¿Qué quiere decir?"
  ),
  L(
    "Я не знаю, что это такое. Объясните, пожалуйста, коротко.",
    "I don't know what that is. Could you explain it briefly?",
    "No sé qué es eso. ¿Me lo explica en pocas palabras?"
  ),
  L(
    "Почему так было? У нас это по-другому.",
    "Why was it like that? Where I'm from it's different.",
    "¿Por qué era así? En mi tierra es distinto."
  ),
  L("Я правильно понимаю, что…?", "Am I right in thinking that…?", "¿Entiendo bien que…?"),
];

/** Ways to ask for more about something they already mentioned. */
export const P4_EXPAND_MOVES: StudioText[] = [
  L(
    "Вы упомянули… Расскажите об этом подробнее.",
    "You mentioned… Tell me more about that.",
    "Usted mencionó… Cuénteme más sobre eso."
  ),
  L(
    "Что вам рассказывали о том времени?",
    "What have you been told about that time?",
    "¿Qué le han contado de aquella época?"
  ),
  L(
    "Расскажите всё, что помните о том времени.",
    "Tell me everything you remember about that time.",
    "Cuénteme todo lo que recuerde de aquella época."
  ),
  L("Какими были эти люди?", "What were those people like?", "¿Cómo era esa gente?"),
  L("Что обычно делают, когда…?", "What do people usually do when…?", "¿Qué suele hacer la gente cuando…?"),
  L("А что было потом?", "And what happened after that?", "¿Y qué pasó después?"),
];

export const P4_RETELL_OPENER: StudioText[] = [
  L(
    "Можно я перескажу вашу историю?",
    "May I tell your story back to you?",
    "¿Puedo contarle su historia con mis palabras?"
  ),
  L(
    "Поправьте меня, если что-то не так.",
    "Correct me if I get something wrong.",
    "Corríjame si me equivoco."
  ),
];

/* ---------------------------- walks of life ---------------------------- */

/** Said before the first question: what is ordinary to them is unknown to you. */
export const P4_WALK_FRAMING: StudioText[] = [
  L(
    "Для вас это привычное дело, а я о нём почти ничего не знаю.",
    "For you this is everyday life, but I know almost nothing about it.",
    "Para usted es lo de todos los días, pero yo casi no sé nada de eso."
  ),
  L(
    "Мне интересно всё. Рассказывайте со всеми подробностями.",
    "All of it interests me. Tell me with every detail.",
    "Me interesa todo. Cuéntemelo con todos los detalles."
  ),
];

export interface WalkAngle {
  id: string;
  lines: StudioText[];
}

/** Question angles for a walk-of-life conversation. `typical` is always the opener. */
export const P4_WALK_ANGLES: WalkAngle[] = [
  {
    id: "typical",
    lines: [
      L(
        "Расскажите, как проходит ваш обычный рабочий день.",
        "Tell me what a typical working day is like for you.",
        "Cuénteme cómo es para usted un día normal de trabajo."
      ),
      L(
        "С чего начинается ваш день и чем он заканчивается?",
        "How does your day begin, and how does it end?",
        "¿Cómo empieza su día y cómo termina?"
      ),
    ],
  },
  {
    id: "specific",
    lines: [
      L(
        "А как прошёл ваш вчерашний день? Расскажите по порядку.",
        "And how did yesterday go? Tell me in order.",
        "¿Y cómo le fue ayer? Cuéntemelo en orden."
      ),
    ],
  },
  {
    id: "show",
    lines: [
      L(
        "Покажите мне, пожалуйста, ваше рабочее место.",
        "Could you show me around where you work?",
        "¿Me puede enseñar el lugar donde trabaja?"
      ),
      L(
        "Можно я посмотрю, как вы это делаете? Рассказывайте, что делаете.",
        "May I watch you do it? Talk me through what you're doing.",
        "¿Puedo ver cómo lo hace? Vaya contándome lo que hace."
      ),
    ],
  },
  {
    id: "minitour",
    lines: [
      L(
        "Расскажите подробно, шаг за шагом, как вы это делаете.",
        "Tell me in detail, step by step, how you do that.",
        "Cuénteme en detalle, paso a paso, cómo lo hace."
      ),
      L("Что вы делаете сначала? А потом?", "What do you do first? And then?", "¿Qué hace primero? ¿Y después?"),
    ],
  },
  {
    id: "learned",
    lines: [
      L("Как вы научились этому делу?", "How did you learn this work?", "¿Cómo aprendió este oficio?"),
      L("Кто вас учил?", "Who taught you?", "¿Quién le enseñó?"),
    ],
  },
  {
    id: "hard",
    lines: [
      L(
        "Что в вашей работе самое трудное?",
        "What is the hardest part of your work?",
        "¿Qué es lo más difícil de su trabajo?"
      ),
      L(
        "А что вам в ней нравится больше всего?",
        "And what do you like most about it?",
        "¿Y qué es lo que más le gusta?"
      ),
    ],
  },
  {
    id: "outsiders",
    lines: [
      L(
        "Чего люди со стороны не понимают в вашей работе?",
        "What do people on the outside not understand about your work?",
        "¿Qué es lo que la gente de fuera no entiende de su trabajo?"
      ),
    ],
  },
  {
    id: "tools",
    lines: [
      L(
        "Чем вы пользуетесь в работе? Покажите, пожалуйста.",
        "What do you use in your work? Could you show me?",
        "¿Qué usa en su trabajo? ¿Me lo puede mostrar?"
      ),
      L("Для чего это нужно?", "What is this for?", "¿Para qué sirve esto?"),
    ],
  },
  {
    id: "changes",
    lines: [
      L(
        "Что изменилось в вашем деле за эти годы?",
        "What has changed in your work over the years?",
        "¿Qué ha cambiado en su oficio con los años?"
      ),
    ],
  },
  {
    id: "experience",
    lines: [
      L(
        "Был ли на работе случай, который вам особенно запомнился?",
        "Has anything happened at work that has really stayed with you?",
        "¿Le ha pasado algo en el trabajo que se le haya quedado grabado?"
      ),
    ],
  },
  {
    id: "kinds",
    lines: [
      L("Какие ещё бывают…?", "What other kinds of … are there?", "¿Qué otros tipos de … hay?"),
      L("Что-нибудь ещё?", "Anything else?", "¿Algo más?"),
      L(
        "Как всё это назвать одним словом?",
        "What would you call all of these together?",
        "¿Cómo se le llama a todo esto junto?"
      ),
    ],
  },
  {
    id: "contrast",
    lines: [
      L(
        "Чем лёгкий день отличается от тяжёлого?",
        "How is an easy day different from a hard one?",
        "¿En qué se diferencia un día tranquilo de uno pesado?"
      ),
      L(
        "А зимой всё так же или по-другому?",
        "Is it the same in winter, or different?",
        "¿En invierno es igual o distinto?"
      ),
    ],
  },
];

/** The read-back cues for filling a list of life, reused by the list builder. */
export const P4_LIST_MOVES: StudioText[] = P4_WALK_ANGLES.find((a) => a.id === "kinds")?.lines ?? [];

/* ------------------------- observe and describe ------------------------ */

export const P4_OBSERVE_ASKS: StudioText[] = [
  L(
    "Можно я опишу вам одну сцену? Поправляйте меня, пожалуйста.",
    "May I describe a scene to you? Please correct me as I go.",
    "¿Puedo describirle una escena? Corríjame mientras hablo, por favor."
  ),
  L(
    "Как вы думаете, что там происходило?",
    "What do you think was going on there?",
    "¿Qué cree usted que estaba pasando ahí?"
  ),
  L("Кто, по-вашему, этот человек?", "Who do you think that person is?", "¿Quién cree usted que es esa persona?"),
  L("Почему это делают именно так?", "Why is it done that way?", "¿Por qué se hace así?"),
  L(
    "Для кого это важно и почему?",
    "Who is this important to, and why?",
    "¿Para quién es importante esto, y por qué?"
  ),
  L("А как бы вы сами это описали?", "How would you describe it yourself?", "¿Cómo lo describiría usted?"),
  L(
    "Расскажите это, пожалуйста, целиком своими словами, я запишу.",
    "Could you tell the whole thing in your own words while I record?",
    "¿Puede contarlo todo con sus palabras mientras lo grabo?"
  ),
];

/** For checking one person's reading of a scene with someone else. */
export const P4_TRIANGULATE_ASKS: StudioText[] = [
  L(
    "Мне объяснили это так… А вы как думаете?",
    "Someone explained it to me like this… What do you think?",
    "A mí me lo explicaron así… ¿Usted qué piensa?"
  ),
];

/* ---------------------- record yourself for feedback -------------------- */

export const P4_FEEDBACK_ASKS: StudioText[] = [
  L(
    "Давайте послушаем мою запись по одному предложению.",
    "Let's listen to my recording one sentence at a time.",
    "Escuchemos mi grabación frase por frase."
  ),
  L(
    "Так говорят? Или это звучит странно?",
    "Is that how people say it? Or does it sound odd?",
    "¿Así se dice? ¿O suena raro?"
  ),
  L("А как бы сказали вы?", "How would you say it?", "¿Cómo lo diría usted?"),
  L("В чём здесь ошибка?", "What is wrong with it here?", "¿Cuál es el error aquí?"),
  L(
    "Скажите это ещё раз, пожалуйста, я запишу.",
    "Could you say it once more while I record?",
    "¿Puede decirlo otra vez mientras lo grabo?"
  ),
];

export const P4_JOURNAL_ASK: StudioText[] = [
  L(
    "Я веду дневник. Прочитайте, пожалуйста, и поправьте меня.",
    "I'm keeping a journal. Would you read it and correct me?",
    "Estoy escribiendo un diario. ¿Puede leerlo y corregirme?"
  ),
];

/* -------------------------- vocabulary recordings ----------------------- */

export const P4_VOCAB_ASKS: StudioText[] = [
  L(
    "Скажите слово, потом предложение с ним, потом ещё раз слово.",
    "Say the word, then a sentence with it, then the word again.",
    "Diga la palabra, luego una frase con ella y luego la palabra otra vez."
  ),
  L(
    "Придумайте, пожалуйста, ещё два-три предложения с этим словом.",
    "Could you make two or three more sentences with this word?",
    "¿Puede decir dos o tres frases más con esta palabra?"
  ),
  L("Когда так говорят?", "When do people say that?", "¿Cuándo se dice eso?"),
  L(
    "Давайте коротко обсудим каждое слово из моего списка.",
    "Let's talk briefly about each word on my list.",
    "Hablemos un poco de cada palabra de mi lista."
  ),
];

/* ------------------------------ hole-finding ---------------------------- */

/** Said to a mentor when bringing them a hole to close. */
export const P4_HOLE_ASKS: StudioText[] = [
  L("Как это называется?", "What is this called?", "¿Cómo se llama esto?"),
  L("Как это сказать по-русски?", "How do you say this in English?", "¿Cómo se dice esto en español?"),
  L(
    "Я хочу сказать вот что… Как это сказать правильно?",
    "Here is what I want to say… What is the right way to say it?",
    "Quiero decir esto… ¿Cómo se dice bien?"
  ),
  L(
    "Скажите это целиком, пожалуйста, я запишу.",
    "Could you say the whole thing while I record?",
    "¿Puede decirlo completo mientras lo grabo?"
  ),
];

export interface HoleDomain {
  id: string;
  emoji: string;
  /** prompt cards Nuri reads to the grower; empty for bring-your-own domains */
  cards: StudioText[];
}

/** Everyday areas of life to talk through aloud. Each card is one thing to explain or describe. */
export const P4_HOLE_DOMAINS: HoleDomain[] = [
  {
    id: "body",
    emoji: "🩺",
    cards: [
      L(
        "Расскажи, что ты делаешь, когда у тебя простуда.",
        "Talk through what you do when you have a cold.",
        "Cuenta qué haces cuando tienes un resfriado."
      ),
      L(
        "Опиши, что и где болит, когда подвернёшь ногу.",
        "Describe what hurts, and where, when you twist your ankle.",
        "Describe qué te duele, y dónde, cuando te tuerces el tobillo."
      ),
      L(
        "Объясни врачу, как ты себя чувствуешь после бессонной ночи.",
        "Explain to a doctor how you feel after a sleepless night.",
        "Explícale a un médico cómo te sientes después de una noche sin dormir."
      ),
    ],
  },
  {
    id: "tools",
    emoji: "🔧",
    cards: [
      L(
        "Расскажи, как повесить полку на стену.",
        "Explain how to put up a shelf on a wall.",
        "Explica cómo se cuelga un estante en la pared."
      ),
      L(
        "Опиши всё, что лежит в ящике с инструментами.",
        "Describe everything in a toolbox.",
        "Describe todo lo que hay en una caja de herramientas."
      ),
      L(
        "Объясни, как починить проколотое колесо у велосипеда.",
        "Explain how to fix a flat bicycle tyre.",
        "Explica cómo se arregla una rueda pinchada de bicicleta."
      ),
    ],
  },
  {
    id: "feelings",
    emoji: "💛",
    cards: [
      L(
        "Опиши, что чувствуешь, когда долго ждёшь важных новостей.",
        "Describe what you feel while waiting a long time for important news.",
        "Describe lo que sientes cuando esperas mucho tiempo una noticia importante."
      ),
      L(
        "Объясни, чем обида отличается от злости.",
        "Explain the difference between feeling hurt and feeling angry.",
        "Explica la diferencia entre sentir pena y sentir rabia."
      ),
      L(
        "Расскажи, что тебя успокаивает, когда ты нервничаешь.",
        "Talk about what calms you down when you feel nervous.",
        "Cuenta qué te calma cuando sientes nervios."
      ),
    ],
  },
  {
    id: "weather",
    emoji: "⛅",
    cards: [
      L(
        "Опиши грозу от первых туч до последних капель.",
        "Describe a thunderstorm from the first clouds to the last drops.",
        "Describe una tormenta desde las primeras nubes hasta las últimas gotas."
      ),
      L(
        "Расскажи, как меняется улица, когда выпадает первый снег.",
        "Describe how a street changes when the first snow falls.",
        "Cuenta cómo cambia una calle cuando cae la primera nevada."
      ),
      L(
        "Объясни, как одеться в сильный мороз.",
        "Explain how to dress for a hard frost.",
        "Explica cómo hay que vestirse cuando hiela."
      ),
    ],
  },
  {
    id: "household",
    emoji: "🏠",
    cards: [
      L(
        "Расскажи по шагам, как ты убираешь кухню после ужина.",
        "Go step by step through cleaning the kitchen after dinner.",
        "Cuenta paso a paso cómo limpias la cocina después de cenar."
      ),
      L(
        "Опиши, что нужно сделать, если на кухне потёк кран.",
        "Describe what to do when the kitchen tap starts leaking.",
        "Describe qué hay que hacer cuando gotea el grifo de la cocina."
      ),
      L(
        "Объясни, как постирать и развесить бельё.",
        "Explain how to wash laundry and hang it out.",
        "Explica cómo se lava y se tiende la ropa."
      ),
    ],
  },
  {
    id: "people",
    emoji: "🧑",
    cards: [
      L(
        "Опиши кого-нибудь из соседей так, чтобы его можно было узнать в толпе.",
        "Describe a neighbour well enough to pick them out of a crowd.",
        "Describe a alguien del barrio tan bien que se le pueda reconocer entre la gente."
      ),
      L(
        "Расскажи, какой характер у человека, которым ты восхищаешься.",
        "Describe the character of someone you admire.",
        "Cuenta cómo es el carácter de una persona a la que admiras."
      ),
      L(
        "Опиши, как человек ходит, говорит и смеётся.",
        "Describe how a person walks, talks and laughs.",
        "Describe cómo camina, habla y se ríe una persona."
      ),
    ],
  },
  {
    id: "works",
    emoji: "⚙️",
    cards: [
      L(
        "Объясни, как устроен велосипед и почему он едет.",
        "Explain how a bicycle is put together and why it moves.",
        "Explica cómo está hecha una bicicleta y por qué avanza."
      ),
      L(
        "Расскажи, как вода попадает в кран.",
        "Explain how water gets to the tap.",
        "Explica cómo llega el agua al grifo."
      ),
      L("Объясни, почему тесто поднимается.", "Explain why dough rises.", "Explica por qué sube la masa."),
    ],
  },
  {
    id: "cooking",
    emoji: "🍲",
    cards: [
      L(
        "Расскажи по шагам, как приготовить суп.",
        "Go step by step through making a soup.",
        "Cuenta paso a paso cómo se prepara una sopa."
      ),
      L(
        "Опиши вкус и запах свежего хлеба.",
        "Describe the taste and smell of fresh bread.",
        "Describe el sabor y el olor del pan recién hecho."
      ),
      L(
        "Объясни, как выбрать спелый арбуз.",
        "Explain how to pick a ripe watermelon.",
        "Explica cómo se elige una sandía madura."
      ),
    ],
  },
  {
    id: "roads",
    emoji: "🚌",
    cards: [
      L(
        "Объясни, как дойти от твоего дома до ближайшего рынка.",
        "Give directions from your home to the nearest market.",
        "Explica cómo se llega desde tu casa hasta el mercado más cercano."
      ),
      L(
        "Расскажи, что происходит в автобусе в час пик.",
        "Describe what happens on a bus at rush hour.",
        "Cuenta lo que pasa en un autobús en hora punta."
      ),
      L(
        "Опиши, что делать, если машина заглохла на дороге.",
        "Describe what to do when a car breaks down on the road.",
        "Describe qué hay que hacer si el coche se avería en la carretera."
      ),
    ],
  },
  {
    id: "money",
    emoji: "🪙",
    cards: [
      L(
        "Расскажи, как торговаться на рынке.",
        "Explain how to bargain at a market.",
        "Explica cómo se regatea en un mercado."
      ),
      L(
        "Объясни, чем кредит в банке отличается от долга другу.",
        "Explain how a bank loan differs from owing a friend.",
        "Explica en qué se diferencia un préstamo del banco de una deuda con un amigo."
      ),
      L(
        "Опиши, на что уходят деньги за месяц.",
        "Describe where the money goes in a month.",
        "Describe en qué se va el dinero de un mes."
      ),
    ],
  },
  {
    id: "land",
    emoji: "🌾",
    cards: [
      L(
        "Опиши, как растёт помидор от семечка до урожая.",
        "Describe how a tomato grows from seed to harvest.",
        "Describe cómo crece un tomate desde la semilla hasta la cosecha."
      ),
      L(
        "Расскажи, как ухаживать за собакой.",
        "Explain how to take care of a dog.",
        "Explica cómo se cuida a un perro."
      ),
      L(
        "Опиши лес ранним утром: что видно, что слышно, чем пахнет.",
        "Describe a forest in the early morning: what you see, hear and smell.",
        "Describe un bosque de madrugada: qué se ve, qué se oye y a qué huele."
      ),
    ],
  },
  {
    id: "play",
    emoji: "🪁",
    cards: [
      L(
        "Объясни правила игры, в которую дети играют во дворе.",
        "Explain the rules of a game children play outside.",
        "Explica las reglas de un juego al que juegan los niños en la calle."
      ),
      L(
        "Расскажи, как научить ребёнка кататься на велосипеде.",
        "Explain how to teach a child to ride a bike.",
        "Explica cómo se le enseña a un niño a montar en bicicleta."
      ),
      L(
        "Опиши детский день рождения от начала до конца.",
        "Describe a child's birthday party from start to finish.",
        "Describe una fiesta de cumpleaños infantil de principio a fin."
      ),
    ],
  },
  // bring-your-own: the guide's original versions of this activity
  { id: "picture", emoji: "🖼️", cards: [] },
  { id: "film", emoji: "🎞️", cards: [] },
];

/* --------------------------- two-recorder technique --------------------- */

export const P4_TWOREC_MOVES: StudioText[] = [
  L(
    "Давайте послушаем вашу запись вместе.",
    "Let's listen to your recording together.",
    "Escuchemos juntos su grabación."
  ),
  L(
    "Я буду останавливать там, где мне непонятно.",
    "I'll stop wherever I don't follow.",
    "Voy a parar donde no entienda."
  ),
];

/* ----------------------------- ways to talk a lot ----------------------- */

export interface TalkItem {
  id: string;
  /** a line to open with, when one helps */
  starter?: StudioText[];
  /** retelling someone else's story: show the anonymize reminder and keep it confidential */
  othersStory?: boolean;
}

/** The output menu: ways to get a lot of your own talking done. */
export const P4_TALK_MENU: TalkItem[] = [
  { id: "back", starter: P4_RETELL_OPENER, othersStory: true },
  {
    id: "own",
    starter: [
      L(
        "Хотите, я расскажу вам историю своей жизни?",
        "Would you like to hear the story of my life?",
        "¿Quiere que le cuente la historia de mi vida?"
      ),
    ],
  },
  {
    id: "incident",
    starter: [L("Со мной однажды был такой случай.", "Something happened to me once.", "Una vez me pasó una cosa.")],
  },
  {
    id: "epic",
    starter: [
      L(
        "Сегодня расскажу начало, а продолжение — в следующий раз.",
        "Today I'll tell the beginning, and the rest next time.",
        "Hoy le cuento el principio y la próxima vez sigo."
      ),
    ],
  },
  {
    id: "seen",
    starter: [
      L(
        "Сегодня на улице была интересная сцена.",
        "There was an interesting scene in the street today.",
        "Hoy hubo una escena interesante en la calle."
      ),
    ],
  },
  {
    id: "passon",
    starter: [
      L(
        "У одного моего знакомого был интересный случай.",
        "Someone I know had an interesting experience.",
        "A un conocido mío le pasó algo interesante."
      ),
    ],
    othersStory: true,
  },
  {
    id: "again",
    starter: [L("Хочу рассказать вам одну историю.", "I'd like to tell you a story.", "Quiero contarle una historia.")],
  },
  { id: "group" },
];

/* ------------------------------ audio contract -------------------------- */

const ALL_LINES: StudioText[] = [
  ...P4_CONSENT_ASK,
  ...P4_LIFE_OPENER,
  ...P4_CLARIFY_MOVES,
  ...P4_EXPAND_MOVES,
  ...P4_RETELL_OPENER,
  ...P4_WALK_FRAMING,
  ...P4_WALK_ANGLES.flatMap((a) => a.lines),
  ...P4_OBSERVE_ASKS,
  ...P4_TRIANGULATE_ASKS,
  ...P4_FEEDBACK_ASKS,
  ...P4_JOURNAL_ASK,
  ...P4_VOCAB_ASKS,
  ...P4_HOLE_ASKS,
  ...P4_HOLE_DOMAINS.flatMap((d) => d.cards),
  ...P4_TWOREC_MOVES,
  ...P4_TALK_MENU.flatMap((item) => item.starter ?? []),
];

const linesFor = (lang: LangCode): string[] => [
  ...new Set(ALL_LINES.map((line) => line[lang]).filter((s): s is string => Boolean(s))),
];

/** Every exact string this phase passes to speak(), per language. */
export const P4_AUDIO_LINES: Partial<Record<LangCode, string[]>> = {
  ru: linesFor("ru"),
  en: linesFor("en"),
  es: linesFor("es"),
};
