import type { LangCode } from "@/lib/types";
import type { StudioText } from "../types";

/**
 * Phase 5 host-language content.
 *
 * Phase 5's listening material is real native-to-native speech, recorded
 * without the grower present. None of it can be authored here, so nothing
 * below is practice audio. These are only the short things the GROWER says
 * to real people: to whoever makes a recording, to the mentor while
 * clarifying, to an audience. Nuri may voice them as a model; Nuri never
 * supplies the answers.
 *
 * Authored for ru / en / es. Any other target language gets no host-language
 * lines at all (the tools then show the guide, recorder and library only).
 */

export interface HostLine {
  id: string;
  text: StudioText;
}

const line = (id: string, ru: string, en: string, es: string): HostLine => ({ id, text: { ru, en, es } });

/** p5-record: asking someone to make a recording without you. */
export const ASK_TO_RECORD: HostLine[] = [
  line(
    "rec-need",
    "Мне нужна запись того, как люди говорят между собой, без меня.",
    "I need a recording of people talking among themselves, without me there.",
    "Necesito una grabación de gente hablando entre sí, sin que yo esté presente."
  ),
  line(
    "rec-natural",
    "Говорите, пожалуйста, так, как вы обычно говорите друг с другом.",
    "Please talk the way you normally talk to each other.",
    "Hablen, por favor, como hablan normalmente entre ustedes."
  ),
  line(
    "rec-noslow",
    "Не надо говорить медленнее или проще ради меня.",
    "Don't slow down or simplify for my sake.",
    "No hace falta hablar más despacio ni más sencillo por mí."
  ),
  line(
    "rec-length",
    "Хорошо бы записать около часа, но не меньше двадцати минут.",
    "About an hour would be great, and at least twenty minutes.",
    "Lo ideal sería más o menos una hora, y como mínimo veinte minutos."
  ),
  line(
    "rec-consent",
    "Потом я буду слушать эту запись и разбирать её с человеком, который мне помогает. Вы не против?",
    "Later I'll listen to this recording and work through it with someone who helps me. Is that all right with you?",
    "Después voy a escuchar esta grabación y repasarla con una persona que me ayuda. ¿Les parece bien?"
  ),
  line(
    "rec-life",
    "Попросите, пожалуйста, этого человека рассказать о своей жизни.",
    "Please ask this person to tell the story of their life.",
    "Pídale, por favor, a esta persona que cuente la historia de su vida."
  ),
  line(
    "rec-hot",
    "О чём сейчас все говорят?",
    "What is everyone talking about these days?",
    "¿De qué habla todo el mundo últimamente?"
  ),
  line(
    "rec-leave",
    "Обсудите, пожалуйста, эту тему между собой, а я в это время уйду.",
    "Please talk this topic over among yourselves, and I'll leave while you do.",
    "Conversen sobre este tema entre ustedes, por favor; yo mientras tanto me voy."
  ),
];

/** p5-tensteps, arriving: real small talk with the mentor. */
export const SMALL_TALK: HostLine[] = [
  line("st-mind", "О чём вы сейчас думаете?", "What's on your mind right now?", "¿En qué está pensando ahora?"),
  line("st-matters", "Что для вас сегодня важно?", "What matters to you today?", "¿Qué es importante para usted hoy?"),
  line(
    "st-new",
    "Что у вас нового с прошлой встречи?",
    "What's new with you since we last met?",
    "¿Qué hay de nuevo desde la última vez que nos vimos?"
  ),
];

/** p5-tensteps, clarifying: what to say the moment you lose the thread. */
export const CLARIFY_MOVES: HostLine[] = [
  line(
    "cl-slow",
    "Повторите это, пожалуйста, помедленнее.",
    "Please say that again slowly.",
    "Repítalo despacio, por favor."
  ),
  line("cl-again", "Можно ещё раз?", "One more time, please?", "¿Otra vez, por favor?"),
  line(
    "cl-check",
    "Я повторю, а вы скажите, правильно ли я слышу.",
    "I'll repeat it, and you tell me whether I'm hearing it right.",
    "Yo lo repito y usted me dice si lo oigo bien."
  ),
  line(
    "cl-sense",
    "Я слышу слова, но не понимаю смысла.",
    "I hear the words, but I don't get the meaning.",
    "Oigo las palabras, pero no entiendo el sentido."
  ),
  line("cl-word", "Что значит это слово?", "What does this word mean?", "¿Qué significa esta palabra?"),
];

/** p5-tensteps, the word recording: drawing a fuller answer out of the mentor. */
export const ELABORATE_MOVES: HostLine[] = [
  line(
    "el-when",
    "А в каких ещё случаях так говорят?",
    "When else do people say this?",
    "¿En qué otras situaciones se dice esto?"
  ),
  line(
    "el-examples",
    "Приведите, пожалуйста, ещё пару примеров.",
    "Could you give me a couple more examples?",
    "¿Me da un par de ejemplos más, por favor?"
  ),
  line(
    "el-register",
    "Так говорят в обычной жизни или это книжное слово?",
    "Do people say this in everyday life, or is it a bookish word?",
    "¿Esto se dice en la vida diaria o es una palabra más bien de libro?"
  ),
  line(
    "el-try",
    "А так можно сказать? Послушайте.",
    "Could I say it this way? Listen.",
    "¿Puedo decirlo así? Escuche."
  ),
  line(
    "el-write",
    "Напишите мне, пожалуйста, это слово.",
    "Could you write this word down, please?",
    "¿Me escribe esta palabra, por favor?"
  ),
];

/** p5-tensteps, steps 7–9: life you don't know yet, and asking for more. */
export const LIFE_MOVES: HostLine[] = [
  line("lf-more", "Расскажите об этом подробнее.", "Tell me more about this.", "Cuénteme más sobre esto."),
  line(
    "lf-why",
    "Я не понимаю, почему здесь так сказали.",
    "I don't understand why they put it that way here.",
    "No entiendo por qué aquí lo dijeron así."
  ),
  line(
    "lf-usual",
    "Как это обычно бывает у вас?",
    "How does this usually go here?",
    "¿Cómo suele ser esto aquí?"
  ),
  line(
    "lf-group",
    "А что ещё сюда можно отнести?",
    "What else would you put in the same group?",
    "¿Qué más entraría en este mismo grupo?"
  ),
  line(
    "lf-you",
    "С вами когда-нибудь случалось что-то похожее?",
    "Has anything like this ever happened to you?",
    "¿Le ha pasado alguna vez algo parecido?"
  ),
  line(
    "lf-opinion",
    "А что вы сами об этом думаете?",
    "And what do you think about it yourself?",
    "¿Y usted qué piensa de esto?"
  ),
];

/** Keeping it personal: things to talk over once a stretch of a STORY is clear. */
export const DISCUSS_STORY: HostLine[] = [
  line("ds-what", "Что произошло в этом отрывке?", "What happened in this stretch?", "¿Qué pasó en este tramo?"),
  line(
    "ds-people",
    "Что мы уже знаем об этих людях?",
    "What do we already know about these people?",
    "¿Qué sabemos ya de estas personas?"
  ),
  line(
    "ds-said",
    "Почему это было сказано именно так?",
    "Why was it said in just this way?",
    "¿Por qué se dijo justo de esta manera?"
  ),
  line(
    "ds-others",
    "Как поступили бы другие люди в такой ситуации?",
    "What would other people do in a situation like this?",
    "¿Qué harían otras personas en una situación así?"
  ),
  line("ds-good", "Хорошо это или плохо? Почему?", "Was that good or bad? Why?", "¿Eso estuvo bien o mal? ¿Por qué?"),
  line(
    "ds-learn",
    "Чему эта история может научить?",
    "What can this story teach us?",
    "¿Qué nos puede enseñar esta historia?"
  ),
];

/** …of a CONVERSATION. */
export const DISCUSS_TALK: HostLine[] = [
  line(
    "dt-who",
    "Кто эти люди друг другу?",
    "Who are these people to each other?",
    "¿Qué son estas personas entre sí?"
  ),
  line(
    "dt-agree",
    "О чём они спорят и в чём согласны?",
    "What do they disagree about, and where do they agree?",
    "¿En qué no están de acuerdo y en qué sí?"
  ),
  line(
    "dt-support",
    "Чем каждый подкрепляет своё мнение?",
    "How does each one back up their view?",
    "¿Con qué respalda cada uno su opinión?"
  ),
  line(
    "dt-side",
    "С кем из них вы согласны? Почему?",
    "Which of them do you agree with? Why?",
    "¿Con cuál de ellos está de acuerdo? ¿Por qué?"
  ),
  line(
    "dt-felt",
    "Как вы думаете, что они чувствовали после разговора?",
    "How do you think they felt after the conversation?",
    "¿Cómo cree que se sintieron después de la conversación?"
  ),
];

/** …of a SPEECH or other public talk. */
export const DISCUSS_SPEECH: HostLine[] = [
  line(
    "dp-who",
    "Кто это говорит и кто его слушает?",
    "Who is speaking, and who is listening to them?",
    "¿Quién habla y quién lo escucha?"
  ),
  line(
    "dp-point",
    "В чём выступающий хочет убедить людей?",
    "What is the speaker trying to convince people of?",
    "¿De qué quiere convencer a la gente la persona que habla?"
  ),
  line(
    "dp-agree",
    "Люди с этим согласятся? Почему?",
    "Will people agree with this? Why?",
    "¿La gente estará de acuerdo con esto? ¿Por qué?"
  ),
  line(
    "dp-me",
    "Насколько это важно для вас?",
    "How much does this matter to you?",
    "¿Cuánto le importa esto a usted?"
  ),
];

/** p5-retell: asking for help, and for the way a host person would tell it. */
export const RETELL_MOVES: HostLine[] = [
  line(
    "rt-open",
    "Вчера мы разбирали запись. Я попробую её пересказать.",
    "Yesterday we worked through a recording. Let me try to retell it.",
    "Ayer repasamos una grabación. Voy a intentar contarla."
  ),
  line("rt-help", "Помогите мне, если я запнусь.", "Help me if I get stuck.", "Ayúdeme si me atasco."),
  line(
    "rt-yours",
    "А как бы вы сами это рассказали?",
    "How would you tell it yourself?",
    "¿Y usted cómo lo contaría?"
  ),
  line(
    "rt-feedback",
    "Что у меня прозвучало не так, как говорят у вас?",
    "What didn't sound the way people here would say it?",
    "¿Qué no sonó como lo diría la gente de aquí?"
  ),
];

/** p5-media: describing a scene, then asking for the insider's reading of it. */
export const MEDIA_MOVES: HostLine[] = [
  line(
    "md-describe",
    "Я опишу, что вижу, а вы скажите, что здесь происходит на самом деле.",
    "I'll describe what I see, and you tell me what is really going on here.",
    "Yo describo lo que veo y usted me dice qué está pasando en realidad."
  ),
  line("md-meant", "Что здесь имелось в виду?", "What was meant here?", "¿Qué se quiso decir aquí?"),
  line("md-laugh", "Почему все засмеялись?", "Why did everyone laugh?", "¿Por qué se rieron todos?"),
  line(
    "md-simple",
    "Перескажите, пожалуйста, эту сцену простыми словами.",
    "Could you retell this scene in simple words?",
    "¿Me cuenta esta escena con palabras sencillas, por favor?"
  ),
  line(
    "md-real",
    "Так говорят в жизни или только в кино?",
    "Do people talk like this in real life, or only in films?",
    "¿Así se habla en la vida real o solo en las películas?"
  ),
];

/** p5-epic: Nuri as a rehearsal audience. Listener's lines only, never a judgment. */
export const EPIC_OPEN: HostLine = line(
  "ep-open",
  "Я слушаю. Можно начинать.",
  "I'm listening. Go ahead.",
  "Te escucho. Puedes empezar."
);

export const EPIC_NUDGES: HostLine[] = [
  line("ep-next", "А что было дальше?", "And what happened next?", "¿Y qué pasó después?"),
  line("ep-more", "Расскажи об этом подробнее.", "Tell me more about that.", "Cuéntame más sobre eso."),
  line("ep-who", "Кто там ещё был?", "Who else was there?", "¿Quién más estaba ahí?"),
  line("ep-where", "Где это происходило?", "Where did this take place?", "¿Dónde ocurrió eso?"),
  line("ep-why", "Почему так получилось?", "Why did it turn out that way?", "¿Por qué resultó así?"),
  line("ep-look", "Как это выглядело?", "What did it look like?", "¿Cómo se veía?"),
];

export const EPIC_CLOSE: HostLine = line(
  "ep-close",
  "Спасибо за рассказ. Теперь расскажи это живому человеку.",
  "Thank you for the story. Now tell it to a real person.",
  "Gracias por la historia. Ahora cuéntasela a una persona de verdad."
);

/** p5-epic: said to the real audience. */
export const EPIC_ASK: HostLine[] = [
  line(
    "ea-offer",
    "Я рассказываю длинную историю по частям. Хотите послушать следующую часть?",
    "I'm telling a long story in parts. Would you like to hear the next part?",
    "Estoy contando una historia larga por partes. ¿Quiere escuchar la siguiente?"
  ),
  line(
    "ea-stop",
    "Останавливайте меня, если что-то непонятно.",
    "Stop me if anything is unclear.",
    "Interrúmpame si algo no se entiende."
  ),
  line("ea-better", "Как это лучше сказать?", "What's a better way to say this?", "¿Cómo se dice esto mejor?"),
  line(
    "ea-recall",
    "Что вам запомнилось из прошлой части?",
    "What do you remember from the last part?",
    "¿Qué recuerda de la parte anterior?"
  ),
];

/** p5-community: staying in the room when the talk runs ahead of you. */
export const COMMUNITY_MOVES: HostLine[] = [
  line(
    "cm-what",
    "Простите, о чём вы сейчас говорили?",
    "Sorry, what were you all just talking about?",
    "Perdón, ¿de qué estaban hablando ahora?"
  ),
  line(
    "cm-joke",
    "До меня не дошла шутка. Объясните потом?",
    "I didn't get the joke. Will you explain it to me later?",
    "No entendí el chiste. ¿Me lo explican luego?"
  ),
  line("cm-help", "Чем я могу помочь?", "How can I help?", "¿En qué puedo ayudar?"),
  line(
    "cm-weekly",
    "Можно я буду приходить каждую неделю?",
    "May I come every week?",
    "¿Puedo venir todas las semanas?"
  ),
];

/** Reading: the mentor reads aloud, you record, and the recording gets clarified. */
export const READING_MOVES: HostLine[] = [
  line(
    "rd-aloud",
    "Прочитайте, пожалуйста, это вслух, как вы обычно читаете.",
    "Could you read this aloud, the way you would normally read it?",
    "¿Me lo lee en voz alta, por favor, como lo leería normalmente?"
  ),
  line(
    "rd-record",
    "Я запишу, а потом мы разберём запись.",
    "I'll record it, and then we'll go through the recording.",
    "Lo grabo y después repasamos la grabación."
  ),
];

/** Lines of a group that exist in `lang`, as plain strings. */
export function hostLines(lines: HostLine[], lang: LangCode): { id: string; text: string }[] {
  return lines.flatMap((l) => {
    const text = l.text[lang];
    return text ? [{ id: l.id, text }] : [];
  });
}

/** True when a group has anything to show in `lang`. */
export const hasHostLines = (lines: HostLine[], lang: LangCode) => lines.some((l) => Boolean(l.text[lang]));

const EVERY_LINE: HostLine[] = [
  ...ASK_TO_RECORD,
  ...SMALL_TALK,
  ...CLARIFY_MOVES,
  ...ELABORATE_MOVES,
  ...LIFE_MOVES,
  ...DISCUSS_STORY,
  ...DISCUSS_TALK,
  ...DISCUSS_SPEECH,
  ...RETELL_MOVES,
  ...MEDIA_MOVES,
  EPIC_OPEN,
  ...EPIC_NUDGES,
  EPIC_CLOSE,
  ...EPIC_ASK,
  ...COMMUNITY_MOVES,
  ...READING_MOVES,
];

const AUTHORED: LangCode[] = ["ru", "en", "es"];

/**
 * Audio contract: every exact string these tools pass to speak(), per
 * language, so voice clips can be pregenerated for them.
 */
export const P5_AUDIO_LINES: Partial<Record<LangCode, string[]>> = Object.fromEntries(
  AUTHORED.map((lang) => [lang, hostLines(EVERY_LINE, lang).map((l) => l.text)])
);
