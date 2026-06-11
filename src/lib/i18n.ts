import type { LangCode } from "./types";

/**
 * UI strings. The app's chrome switches into the grower's TARGET language
 * (GPA immersion: the app itself becomes part of the host world).
 * English is the fallback for any missing key.
 */
type Dict = Record<string, Partial<Record<LangCode, string>>>;

export const STRINGS: Dict = {
  // ---- navigation ----
  courses: { en: "Courses", es: "Cursos", ru: "Курсы", fr: "Cours", de: "Kurse", pt: "Cursos", it: "Corsi" },
  dashboard: { en: "Dashboard", es: "Panel", ru: "Главная", fr: "Tableau", de: "Übersicht", pt: "Painel", it: "Pannello" },
  schedule: { en: "Schedule", es: "Agenda", ru: "Расписание", fr: "Agenda", de: "Kalender", pt: "Agenda", it: "Agenda" },
  forum: { en: "Forum", es: "Foro", ru: "Форум", fr: "Forum", de: "Forum", pt: "Fórum", it: "Forum" },
  student: { en: "Grower", es: "Cultivador", ru: "Растущий", fr: "Apprenant", de: "Wachsende:r", pt: "Cultivador", it: "Coltivatore" },
  nurturerWord: { en: "Nurturer", es: "Nutridor", ru: "Наставник", fr: "Accompagnant", de: "Begleiter", pt: "Nutridor", it: "Nutritore" },

  // ---- common ----
  continue: { en: "Continue", es: "Continuar", ru: "Продолжить", fr: "Continuer", de: "Weiter", pt: "Continuar", it: "Continua" },
  back: { en: "Back", es: "Atrás", ru: "Назад", fr: "Retour", de: "Zurück", pt: "Voltar", it: "Indietro" },
  start: { en: "Start", es: "Empezar", ru: "Начать", fr: "Commencer", de: "Starten", pt: "Começar", it: "Inizia" },
  next: { en: "Next", es: "Siguiente", ru: "Дальше", fr: "Suivant", de: "Weiter", pt: "Próximo", it: "Avanti" },
  done: { en: "Done", es: "Hecho", ru: "Готово", fr: "Terminé", de: "Fertig", pt: "Feito", it: "Fatto" },
  play: { en: "Play", es: "Jugar", ru: "Играть", fr: "Jouer", de: "Spielen", pt: "Jogar", it: "Gioca" },
  listen: { en: "Listen", es: "Escucha", ru: "Слушай", fr: "Écoute", de: "Hör zu", pt: "Escuta", it: "Ascolta" },
  speak: { en: "Speak", es: "Habla", ru: "Говори", fr: "Parle", de: "Sprich", pt: "Fala", it: "Parla" },
  repeat: { en: "Repeat", es: "Repite", ru: "Повтори", fr: "Répète", de: "Wiederhole", pt: "Repete", it: "Ripeti" },
  correct: { en: "Correct!", es: "¡Correcto!", ru: "Верно!", fr: "Correct !", de: "Richtig!", pt: "Correto!", it: "Corretto!" },
  tryAgain: { en: "Listen again", es: "Escucha otra vez", ru: "Послушай ещё раз", fr: "Écoute encore", de: "Hör nochmal", pt: "Escuta de novo", it: "Ascolta ancora" },
  online: { en: "Online", es: "En línea", ru: "В сети", fr: "En ligne", de: "Online", pt: "Online", it: "Online" },
  minutes: { en: "min", es: "min", ru: "мин", fr: "min", de: "Min", pt: "min", it: "min" },
  hours: { en: "hours", es: "horas", ru: "часов", fr: "heures", de: "Stunden", pt: "horas", it: "ore" },
  words: { en: "words", es: "palabras", ru: "слов", fr: "mots", de: "Wörter", pt: "palavras", it: "parole" },
  dayStreak: { en: "day streak", es: "días seguidos", ru: "дней подряд", fr: "jours d'affilée", de: "Tage in Folge", pt: "dias seguidos", it: "giorni di fila" },
  phaseWord: { en: "Phase", es: "Fase", ru: "Фаза", fr: "Phase", de: "Phase", pt: "Fase", it: "Fase" },
  hello: { en: "Hello", es: "Hola", ru: "Привет", fr: "Salut", de: "Hallo", pt: "Olá", it: "Ciao" },
  today: { en: "Today", es: "Hoy", ru: "Сегодня", fr: "Aujourd'hui", de: "Heute", pt: "Hoje", it: "Oggi" },
  book: { en: "Book", es: "Reservar", ru: "Записаться", fr: "Réserver", de: "Buchen", pt: "Reservar", it: "Prenota" },
  cancel: { en: "Cancel", es: "Cancelar", ru: "Отменить", fr: "Annuler", de: "Abbrechen", pt: "Cancelar", it: "Annulla" },
  immersionOn: { en: "Immersion", es: "Inmersión", ru: "Погружение", fr: "Immersion", de: "Immersion", pt: "Imersão", it: "Immersione" },

  // ---- dashboard ----
  joinSpeakingClub: { en: "Join speaking club", es: "Únete al club de conversación", ru: "Разговорный клуб", fr: "Rejoindre le club de conversation", de: "Sprachclub beitreten", pt: "Entrar no clube de conversa", it: "Unisciti al club di conversazione" },
  yourNurturer: { en: "Your nurturer", es: "Tu nutridor", ru: "Твой наставник", fr: "Ton accompagnant", de: "Dein Begleiter", pt: "Seu nutridor", it: "Il tuo nutritore" },
  trainings: { en: "Growing time", es: "Tiempo de crecer", ru: "Время расти", fr: "Temps de pousse", de: "Wachstumszeit", pt: "Hora de crescer", it: "Tempo di crescita" },
  trainingsSub: { en: "Grow into your new world a little every day!", es: "¡Crece en tu nuevo mundo un poco cada día!", ru: "Расти в новом мире понемногу каждый день!", fr: "Grandis dans ton nouveau monde un peu chaque jour !", de: "Wachse jeden Tag ein Stück in deine neue Welt!", pt: "Cresça no seu novo mundo um pouco a cada dia!", it: "Cresci nel tuo nuovo mondo un po' ogni giorno!" },
  chooseCategory: { en: "Choose a world to explore", es: "Elige un mundo para explorar", ru: "Выбери мир для исследования", fr: "Choisis un monde à explorer", de: "Wähle eine Welt zum Entdecken", pt: "Escolha um mundo para explorar", it: "Scegli un mondo da esplorare" },
  practiceSpeaking: { en: "Practice speaking", es: "Practica el habla", ru: "Практика речи", fr: "Pratique l'oral", de: "Sprechen üben", pt: "Pratique a fala", it: "Pratica il parlato" },
  fastRepeat: { en: "Fast repeat", es: "Repetición rápida", ru: "Быстрый повтор", fr: "Répétition rapide", de: "Schnell wiederholen", pt: "Repetição rápida", it: "Ripetizione veloce" },
  minPractice: { en: "10 min practice", es: "Práctica de 10 min", ru: "10 минут практики", fr: "10 min de pratique", de: "10 Min Übung", pt: "Prática de 10 min", it: "Pratica di 10 min" },
  weeklyActivity: { en: "Weekly growth", es: "Crecimiento semanal", ru: "Рост за неделю", fr: "Croissance hebdo", de: "Wachstum der Woche", pt: "Crescimento semanal", it: "Crescita settimanale" },
  hoursLogged: { en: "hours grown", es: "horas cultivadas", ru: "часов роста", fr: "heures de pousse", de: "Stunden gewachsen", pt: "horas cultivadas", it: "ore coltivate" },
  wordsMet: { en: "words met", es: "palabras conocidas", ru: "знакомых слов", fr: "mots rencontrés", de: "Wörter getroffen", pt: "palavras conhecidas", it: "parole incontrate" },
  activitiesDone: { en: "activities", es: "actividades", ru: "занятий", fr: "activités", de: "Aktivitäten", pt: "atividades", it: "attività" },

  // ---- trainings ----
  vocabulary: { en: "Word world", es: "Mundo de palabras", ru: "Мир слов", fr: "Monde des mots", de: "Wörterwelt", pt: "Mundo das palavras", it: "Mondo delle parole" },
  listening: { en: "Listening", es: "Escucha", ru: "Слушание", fr: "Écoute", de: "Hören", pt: "Escuta", it: "Ascolto" },
  speaking: { en: "Speaking", es: "Habla", ru: "Говорение", fr: "Parole", de: "Sprechen", pt: "Fala", it: "Parlato" },
  literacy: { en: "Literacy", es: "Lectura", ru: "Чтение", fr: "Lecture", de: "Lesen", pt: "Leitura", it: "Lettura" },

  // ---- categories ----
  food: { en: "Food", es: "Comida", ru: "Еда", fr: "Nourriture", de: "Essen", pt: "Comida", it: "Cibo" },
  traveling: { en: "Traveling", es: "Viajes", ru: "Путешествия", fr: "Voyages", de: "Reisen", pt: "Viagens", it: "Viaggi" },
  sport: { en: "Sport", es: "Deporte", ru: "Спорт", fr: "Sport", de: "Sport", pt: "Esporte", it: "Sport" },
  animals: { en: "Animals", es: "Animales", ru: "Животные", fr: "Animaux", de: "Tiere", pt: "Animais", it: "Animali" },
  health: { en: "Health", es: "Salud", ru: "Здоровье", fr: "Santé", de: "Gesundheit", pt: "Saúde", it: "Salute" },
  home: { en: "Home", es: "Casa", ru: "Дом", fr: "Maison", de: "Zuhause", pt: "Casa", it: "Casa" },
  work: { en: "Work", es: "Trabajo", ru: "Работа", fr: "Travail", de: "Arbeit", pt: "Trabalho", it: "Lavoro" },
  family: { en: "Family", es: "Familia", ru: "Семья", fr: "Famille", de: "Familie", pt: "Família", it: "Famiglia" },
  body: { en: "Body", es: "Cuerpo", ru: "Тело", fr: "Corps", de: "Körper", pt: "Corpo", it: "Corpo" },
  nature: { en: "Nature", es: "Naturaleza", ru: "Природа", fr: "Nature", de: "Natur", pt: "Natureza", it: "Natura" },

  // ---- courses ----
  coursesTitle: { en: "The six phases", es: "Las seis fases", ru: "Шесть фаз", fr: "Les six phases", de: "Die sechs Phasen", pt: "As seis fases", it: "Le sei fasi" },
  coursesSub: { en: "Your whole journey from first words to belonging — the Growing Participator path.", es: "Todo tu viaje, de las primeras palabras a pertenecer: el camino del Participante en Crecimiento.", ru: "Весь путь — от первых слов до своих людей. Путь растущего участника.", fr: "Tout ton voyage, des premiers mots à l'appartenance — le chemin du Participant Grandissant.", de: "Deine ganze Reise — von ersten Wörtern bis zur Zugehörigkeit.", pt: "Sua jornada inteira, das primeiras palavras ao pertencimento.", it: "Tutto il tuo viaggio, dalle prime parole all'appartenenza." },
  milestonesWord: { en: "Milestones", es: "Hitos", ru: "Вехи", fr: "Jalons", de: "Meilensteine", pt: "Marcos", it: "Traguardi" },
  activitiesWord: { en: "Activities", es: "Actividades", ru: "Занятия", fr: "Activités", de: "Aktivitäten", pt: "Atividades", it: "Attività" },
  currentPhase: { en: "You are here", es: "Estás aquí", ru: "Ты здесь", fr: "Tu es ici", de: "Du bist hier", pt: "Você está aqui", it: "Sei qui" },
  openPhase: { en: "Open phase", es: "Abrir fase", ru: "Открыть фазу", fr: "Ouvrir la phase", de: "Phase öffnen", pt: "Abrir fase", it: "Apri fase" },

  // ---- schedule ----
  scheduleTitle: { en: "Your schedule", es: "Tu agenda", ru: "Твоё расписание", fr: "Ton agenda", de: "Dein Kalender", pt: "Sua agenda", it: "La tua agenda" },
  upcoming: { en: "Upcoming sessions", es: "Próximas sesiones", ru: "Ближайшие встречи", fr: "Séances à venir", de: "Nächste Sitzungen", pt: "Próximas sessões", it: "Prossime sessioni" },
  bookSession: { en: "Book a session", es: "Reserva una sesión", ru: "Записаться на встречу", fr: "Réserver une séance", de: "Sitzung buchen", pt: "Reservar uma sessão", it: "Prenota una sessione" },
  availableNurturers: { en: "Available nurturers", es: "Nutridores disponibles", ru: "Доступные наставники", fr: "Accompagnants disponibles", de: "Verfügbare Begleiter", pt: "Nutridores disponíveis", it: "Nutritori disponibili" },
  noSessions: { en: "Nothing booked yet — grab a nurturer below!", es: "Nada reservado aún. ¡Elige un nutridor abajo!", ru: "Пока пусто — выбери наставника ниже!", fr: "Rien de prévu — choisis un accompagnant ci-dessous !", de: "Noch nichts gebucht — such dir unten einen Begleiter!", pt: "Nada reservado ainda — escolha um nutridor abaixo!", it: "Niente in programma — scegli un nutritore qui sotto!" },

  // ---- session room ----
  sessionRoom: { en: "Growing session", es: "Sesión de crecimiento", ru: "Сессия роста", fr: "Séance de pousse", de: "Wachstumssitzung", pt: "Sessão de crescimento", it: "Sessione di crescita" },
  showCards: { en: "Picture cards", es: "Tarjetas de imágenes", ru: "Карточки с картинками", fr: "Cartes-images", de: "Bildkarten", pt: "Cartões de imagens", it: "Carte illustrate" },
  endSession: { en: "End session", es: "Terminar sesión", ru: "Завершить", fr: "Terminer", de: "Beenden", pt: "Encerrar", it: "Termina" },
  timeLeft: { en: "left", es: "restante", ru: "осталось", fr: "restant", de: "übrig", pt: "restante", it: "rimasto" },

  // ---- forum ----
  forumTitle: { en: "The village", es: "La aldea", ru: "Деревня", fr: "Le village", de: "Das Dorf", pt: "A aldeia", it: "Il villaggio" },
  forumSub: { en: "Growers and nurturers helping each other belong.", es: "Cultivadores y nutridores ayudándose a pertenecer.", ru: "Растущие и наставники помогают друг другу.", fr: "Apprenants et accompagnants qui s'entraident.", de: "Wachsende und Begleiter helfen einander.", pt: "Cultivadores e nutridores se ajudando.", it: "Coltivatori e nutritori che si aiutano." },
  newPost: { en: "New post", es: "Nueva publicación", ru: "Новый пост", fr: "Nouveau message", de: "Neuer Beitrag", pt: "Nova publicação", it: "Nuovo post" },
  reply: { en: "Reply", es: "Responder", ru: "Ответить", fr: "Répondre", de: "Antworten", pt: "Responder", it: "Rispondi" },
};

export function t(key: string, lang: LangCode): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? key;
}

/** Build a translate function bound to one language */
export const makeT = (lang: LangCode) => (key: string) => t(key, lang);
