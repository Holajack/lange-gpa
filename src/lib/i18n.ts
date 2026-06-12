import type { LangCode } from "./types";

/**
 * UI strings. The app's chrome switches into the grower's TARGET language
 * (GPA immersion: the app itself becomes part of the host world).
 * English is the fallback for any missing key.
 */
type Dict = Record<string, Partial<Record<LangCode, string>>>;

export const STRINGS: Dict = {
  // ---- navigation ----
  courses: { en: "Courses", es: "Cursos", ru: "Курсы", fr: "Cours", de: "Kurse", pt: "Cursos", it: "Corsi", ja: "コース", zh: "课程" },
  dashboard: { en: "Dashboard", es: "Panel", ru: "Главная", fr: "Tableau", de: "Übersicht", pt: "Painel", it: "Pannello", ja: "ホーム", zh: "主页" },
  schedule: { en: "Schedule", es: "Agenda", ru: "Расписание", fr: "Agenda", de: "Kalender", pt: "Agenda", it: "Agenda", ja: "スケジュール", zh: "日程" },
  forum: { en: "Forum", es: "Foro", ru: "Форум", fr: "Forum", de: "Forum", pt: "Fórum", it: "Forum", ja: "フォーラム", zh: "论坛" },
  world: { en: "World", es: "Mundo", ru: "Мир", fr: "Monde", de: "Welt", pt: "Mundo", it: "Mondo", ja: "世界", zh: "世界" },
  student: { en: "Grower", es: "Cultivador", ru: "Растущий", fr: "Apprenant", de: "Wachsende:r", pt: "Cultivador", it: "Coltivatore", ja: "育つ人", zh: "成长者" },
  nurturerWord: { en: "Nurturer", es: "Nutridor", ru: "Наставник", fr: "Accompagnant", de: "Begleiter", pt: "Nutridor", it: "Nutritore", ja: "ナーチャラー", zh: "培育者" },
  nurture: { en: "Nurture", es: "Nutrir", ru: "Наставник", fr: "Accompagner", de: "Begleiten", pt: "Nutrir", it: "Nutrire", ja: "育てる", zh: "培育" },
  aiNurturer: { en: "AI nurturer", es: "Nutridor IA", ru: "ИИ-наставник", fr: "Accompagnant IA", de: "KI-Begleiter", pt: "Nutridor IA", it: "Nutritore IA", ja: "AIナーチャラー", zh: "AI培育者" },

  // ---- common ----
  continue: { en: "Continue", es: "Continuar", ru: "Продолжить", fr: "Continuer", de: "Weiter", pt: "Continuar", it: "Continua", ja: "続ける", zh: "继续" },
  back: { en: "Back", es: "Atrás", ru: "Назад", fr: "Retour", de: "Zurück", pt: "Voltar", it: "Indietro", ja: "戻る", zh: "返回" },
  start: { en: "Start", es: "Empezar", ru: "Начать", fr: "Commencer", de: "Starten", pt: "Começar", it: "Inizia", ja: "スタート", zh: "开始" },
  next: { en: "Next", es: "Siguiente", ru: "Дальше", fr: "Suivant", de: "Weiter", pt: "Próximo", it: "Avanti", ja: "次へ", zh: "下一个" },
  done: { en: "Done", es: "Hecho", ru: "Готово", fr: "Terminé", de: "Fertig", pt: "Feito", it: "Fatto", ja: "完了", zh: "完成" },
  play: { en: "Play", es: "Jugar", ru: "Играть", fr: "Jouer", de: "Spielen", pt: "Jogar", it: "Gioca", ja: "プレイ", zh: "玩" },
  listen: { en: "Listen", es: "Escucha", ru: "Слушай", fr: "Écoute", de: "Hör zu", pt: "Escuta", it: "Ascolta", ja: "聞いて", zh: "听" },
  speak: { en: "Speak", es: "Habla", ru: "Говори", fr: "Parle", de: "Sprich", pt: "Fala", it: "Parla", ja: "話して", zh: "说" },
  repeat: { en: "Repeat", es: "Repite", ru: "Повтори", fr: "Répète", de: "Wiederhole", pt: "Repete", it: "Ripeti", ja: "リピート", zh: "跟读" },
  correct: { en: "Correct!", es: "¡Correcto!", ru: "Верно!", fr: "Correct !", de: "Richtig!", pt: "Correto!", it: "Corretto!", ja: "正解！", zh: "对了！" },
  tryAgain: { en: "Listen again", es: "Escucha otra vez", ru: "Послушай ещё раз", fr: "Écoute encore", de: "Hör nochmal", pt: "Escuta de novo", it: "Ascolta ancora", ja: "もう一度聞いて", zh: "再听一遍" },
  online: { en: "Online", es: "En línea", ru: "В сети", fr: "En ligne", de: "Online", pt: "Online", it: "Online", ja: "オンライン", zh: "在线" },
  minutes: { en: "min", es: "min", ru: "мин", fr: "min", de: "Min", pt: "min", it: "min", ja: "分", zh: "分钟" },
  hours: { en: "hours", es: "horas", ru: "часов", fr: "heures", de: "Stunden", pt: "horas", it: "ore", ja: "時間", zh: "小时" },
  words: { en: "words", es: "palabras", ru: "слов", fr: "mots", de: "Wörter", pt: "palavras", it: "parole", ja: "単語", zh: "单词" },
  dayStreak: { en: "day streak", es: "días seguidos", ru: "дней подряд", fr: "jours d'affilée", de: "Tage in Folge", pt: "dias seguidos", it: "giorni di fila", ja: "日連続", zh: "天连续" },
  phaseWord: { en: "Phase", es: "Fase", ru: "Фаза", fr: "Phase", de: "Phase", pt: "Fase", it: "Fase", ja: "フェーズ", zh: "阶段" },
  hello: { en: "Hello", es: "Hola", ru: "Привет", fr: "Salut", de: "Hallo", pt: "Olá", it: "Ciao", ja: "こんにちは", zh: "你好" },
  today: { en: "Today", es: "Hoy", ru: "Сегодня", fr: "Aujourd'hui", de: "Heute", pt: "Hoje", it: "Oggi", ja: "今日", zh: "今天" },
  book: { en: "Book", es: "Reservar", ru: "Записаться", fr: "Réserver", de: "Buchen", pt: "Reservar", it: "Prenota", ja: "予約", zh: "预约" },
  cancel: { en: "Cancel", es: "Cancelar", ru: "Отменить", fr: "Annuler", de: "Abbrechen", pt: "Cancelar", it: "Annulla", ja: "キャンセル", zh: "取消" },
  immersionOn: { en: "Immersion", es: "Inmersión", ru: "Погружение", fr: "Immersion", de: "Immersion", pt: "Imersão", it: "Immersione", ja: "イマージョン", zh: "沉浸模式" },

  // ---- dashboard ----
  joinSpeakingClub: { en: "Join speaking club", es: "Únete al club de conversación", ru: "Разговорный клуб", fr: "Rejoindre le club de conversation", de: "Sprachclub beitreten", pt: "Entrar no clube de conversa", it: "Unisciti al club di conversazione", ja: "会話クラブに参加", zh: "加入口语俱乐部" },
  yourNurturer: { en: "Your nurturer", es: "Tu nutridor", ru: "Твой наставник", fr: "Ton accompagnant", de: "Dein Begleiter", pt: "Seu nutridor", it: "Il tuo nutritore", ja: "あなたのナーチャラー", zh: "你的培育者" },
  trainings: { en: "Growing time", es: "Tiempo de crecer", ru: "Время расти", fr: "Temps de pousse", de: "Wachstumszeit", pt: "Hora de crescer", it: "Tempo di crescita", ja: "成長タイム", zh: "成长时间" },
  trainingsSub: { en: "Grow into your new world a little every day!", es: "¡Crece en tu nuevo mundo un poco cada día!", ru: "Расти в новом мире понемногу каждый день!", fr: "Grandis dans ton nouveau monde un peu chaque jour !", de: "Wachse jeden Tag ein Stück in deine neue Welt!", pt: "Cresça no seu novo mundo um pouco a cada dia!", it: "Cresci nel tuo nuovo mondo un po' ogni giorno!", ja: "毎日少しずつ、新しい世界で育っていこう！", zh: "每天一点点，在新世界里成长！" },
  chooseCategory: { en: "Choose a world to explore", es: "Elige un mundo para explorar", ru: "Выбери мир для исследования", fr: "Choisis un monde à explorer", de: "Wähle eine Welt zum Entdecken", pt: "Escolha um mundo para explorar", it: "Scegli un mondo da esplorare", ja: "探検する世界を選ぼう", zh: "选一个世界去探索" },
  practiceSpeaking: { en: "Practice speaking", es: "Practica el habla", ru: "Практика речи", fr: "Pratique l'oral", de: "Sprechen üben", pt: "Pratique a fala", it: "Pratica il parlato", ja: "話す練習", zh: "口语练习" },
  fastRepeat: { en: "Fast repeat", es: "Repetición rápida", ru: "Быстрый повтор", fr: "Répétition rapide", de: "Schnell wiederholen", pt: "Repetição rápida", it: "Ripetizione veloce", ja: "高速リピート", zh: "快速复习" },
  minPractice: { en: "10 min practice", es: "Práctica de 10 min", ru: "10 минут практики", fr: "10 min de pratique", de: "10 Min Übung", pt: "Prática de 10 min", it: "Pratica di 10 min", ja: "10分練習", zh: "10分钟练习" },
  weeklyActivity: { en: "Weekly growth", es: "Crecimiento semanal", ru: "Рост за неделю", fr: "Croissance hebdo", de: "Wachstum der Woche", pt: "Crescimento semanal", it: "Crescita settimanale", ja: "今週の成長", zh: "每周成长" },
  hoursLogged: { en: "hours grown", es: "horas cultivadas", ru: "часов роста", fr: "heures de pousse", de: "Stunden gewachsen", pt: "horas cultivadas", it: "ore coltivate", ja: "成長時間", zh: "成长时长" },
  wordsMet: { en: "words met", es: "palabras conocidas", ru: "знакомых слов", fr: "mots rencontrés", de: "Wörter getroffen", pt: "palavras conhecidas", it: "parole incontrate", ja: "出会った単語", zh: "遇见的单词" },
  activitiesDone: { en: "activities", es: "actividades", ru: "занятий", fr: "activités", de: "Aktivitäten", pt: "atividades", it: "attività", ja: "アクティビティ", zh: "活动" },

  // ---- trainings ----
  vocabulary: { en: "Word world", es: "Mundo de palabras", ru: "Мир слов", fr: "Monde des mots", de: "Wörterwelt", pt: "Mundo das palavras", it: "Mondo delle parole", ja: "ことばの世界", zh: "单词世界" },
  listening: { en: "Listening", es: "Escucha", ru: "Слушание", fr: "Écoute", de: "Hören", pt: "Escuta", it: "Ascolto", ja: "リスニング", zh: "听力" },
  speaking: { en: "Speaking", es: "Habla", ru: "Говорение", fr: "Parole", de: "Sprechen", pt: "Fala", it: "Parlato", ja: "スピーキング", zh: "口语" },
  literacy: { en: "Literacy", es: "Lectura", ru: "Чтение", fr: "Lecture", de: "Lesen", pt: "Leitura", it: "Lettura", ja: "読み書き", zh: "读写" },

  // ---- categories ----
  food: { en: "Food", es: "Comida", ru: "Еда", fr: "Nourriture", de: "Essen", pt: "Comida", it: "Cibo", ja: "食べ物", zh: "食物" },
  traveling: { en: "Traveling", es: "Viajes", ru: "Путешествия", fr: "Voyages", de: "Reisen", pt: "Viagens", it: "Viaggi", ja: "旅行", zh: "旅行" },
  sport: { en: "Sport", es: "Deporte", ru: "Спорт", fr: "Sport", de: "Sport", pt: "Esporte", it: "Sport", ja: "スポーツ", zh: "运动" },
  animals: { en: "Animals", es: "Animales", ru: "Животные", fr: "Animaux", de: "Tiere", pt: "Animais", it: "Animali", ja: "動物", zh: "动物" },
  health: { en: "Health", es: "Salud", ru: "Здоровье", fr: "Santé", de: "Gesundheit", pt: "Saúde", it: "Salute", ja: "健康", zh: "健康" },
  home: { en: "Home", es: "Casa", ru: "Дом", fr: "Maison", de: "Zuhause", pt: "Casa", it: "Casa", ja: "家", zh: "家" },
  work: { en: "Work", es: "Trabajo", ru: "Работа", fr: "Travail", de: "Arbeit", pt: "Trabalho", it: "Lavoro", ja: "仕事", zh: "工作" },
  family: { en: "Family", es: "Familia", ru: "Семья", fr: "Famille", de: "Familie", pt: "Família", it: "Famiglia", ja: "家族", zh: "家庭" },
  body: { en: "Body", es: "Cuerpo", ru: "Тело", fr: "Corps", de: "Körper", pt: "Corpo", it: "Corpo", ja: "体", zh: "身体" },
  nature: { en: "Nature", es: "Naturaleza", ru: "Природа", fr: "Nature", de: "Natur", pt: "Natureza", it: "Natura", ja: "自然", zh: "自然" },

  // ---- courses ----
  coursesTitle: { en: "The six phases", es: "Las seis fases", ru: "Шесть фаз", fr: "Les six phases", de: "Die sechs Phasen", pt: "As seis fases", it: "Le sei fasi", ja: "6つのフェーズ", zh: "六个阶段" },
  coursesSub: { en: "Your whole journey from first words to belonging — the Growing Participator path.", es: "Todo tu viaje, de las primeras palabras a pertenecer: el camino del Participante en Crecimiento.", ru: "Весь путь — от первых слов до своих людей. Путь растущего участника.", fr: "Tout ton voyage, des premiers mots à l'appartenance — le chemin du Participant Grandissant.", de: "Deine ganze Reise — von ersten Wörtern bis zur Zugehörigkeit.", pt: "Sua jornada inteira, das primeiras palavras ao pertencimento.", it: "Tutto il tuo viaggio, dalle prime parole all'appartenenza.", ja: "最初のことばから「仲間」になるまで——成長する参加者の道のり。", zh: "从第一个词到真正的归属——成长参与者之路。" },
  milestonesWord: { en: "Milestones", es: "Hitos", ru: "Вехи", fr: "Jalons", de: "Meilensteine", pt: "Marcos", it: "Traguardi", ja: "マイルストーン", zh: "里程碑" },
  activitiesWord: { en: "Activities", es: "Actividades", ru: "Занятия", fr: "Activités", de: "Aktivitäten", pt: "Atividades", it: "Attività", ja: "アクティビティ", zh: "活动" },
  currentPhase: { en: "You are here", es: "Estás aquí", ru: "Ты здесь", fr: "Tu es ici", de: "Du bist hier", pt: "Você está aqui", it: "Sei qui", ja: "現在地", zh: "你在这里" },
  openPhase: { en: "Open phase", es: "Abrir fase", ru: "Открыть фазу", fr: "Ouvrir la phase", de: "Phase öffnen", pt: "Abrir fase", it: "Apri fase", ja: "フェーズを開く", zh: "进入阶段" },

  // ---- schedule ----
  scheduleTitle: { en: "Your schedule", es: "Tu agenda", ru: "Твоё расписание", fr: "Ton agenda", de: "Dein Kalender", pt: "Sua agenda", it: "La tua agenda", ja: "あなたのスケジュール", zh: "你的日程" },
  upcoming: { en: "Upcoming sessions", es: "Próximas sesiones", ru: "Ближайшие встречи", fr: "Séances à venir", de: "Nächste Sitzungen", pt: "Próximas sessões", it: "Prossime sessioni", ja: "これからのセッション", zh: "即将开始的课程" },
  bookSession: { en: "Book a session", es: "Reserva una sesión", ru: "Записаться на встречу", fr: "Réserver une séance", de: "Sitzung buchen", pt: "Reservar uma sessão", it: "Prenota una sessione", ja: "セッションを予約", zh: "预约课程" },
  availableNurturers: { en: "Available nurturers", es: "Nutridores disponibles", ru: "Доступные наставники", fr: "Accompagnants disponibles", de: "Verfügbare Begleiter", pt: "Nutridores disponíveis", it: "Nutritori disponibili", ja: "空いているナーチャラー", zh: "可预约的培育者" },
  noSessions: { en: "Nothing booked yet — grab a nurturer below!", es: "Nada reservado aún. ¡Elige un nutridor abajo!", ru: "Пока пусто — выбери наставника ниже!", fr: "Rien de prévu — choisis un accompagnant ci-dessous !", de: "Noch nichts gebucht — such dir unten einen Begleiter!", pt: "Nada reservado ainda — escolha um nutridor abaixo!", it: "Niente in programma — scegli un nutritore qui sotto!", ja: "まだ予約はないよ——下からナーチャラーを選ぼう！", zh: "还没有预约——在下面选一位培育者吧！" },

  // ---- session room ----
  sessionRoom: { en: "Growing session", es: "Sesión de crecimiento", ru: "Сессия роста", fr: "Séance de pousse", de: "Wachstumssitzung", pt: "Sessão de crescimento", it: "Sessione di crescita", ja: "成長セッション", zh: "成长课堂" },
  showCards: { en: "Picture cards", es: "Tarjetas de imágenes", ru: "Карточки с картинками", fr: "Cartes-images", de: "Bildkarten", pt: "Cartões de imagens", it: "Carte illustrate", ja: "絵カード", zh: "图片卡" },
  endSession: { en: "End session", es: "Terminar sesión", ru: "Завершить", fr: "Terminer", de: "Beenden", pt: "Encerrar", it: "Termina", ja: "セッション終了", zh: "结束课程" },
  timeLeft: { en: "left", es: "restante", ru: "осталось", fr: "restant", de: "übrig", pt: "restante", it: "rimasto", ja: "残り", zh: "剩余" },

  // ---- forum ----
  forumTitle: { en: "The village", es: "La aldea", ru: "Деревня", fr: "Le village", de: "Das Dorf", pt: "A aldeia", it: "Il villaggio", ja: "みんなの村", zh: "村庄" },
  forumSub: { en: "Growers and nurturers helping each other belong.", es: "Cultivadores y nutridores ayudándose a pertenecer.", ru: "Растущие и наставники помогают друг другу.", fr: "Apprenants et accompagnants qui s'entraident.", de: "Wachsende und Begleiter helfen einander.", pt: "Cultivadores e nutridores se ajudando.", it: "Coltivatori e nutritori che si aiutano.", ja: "育つ人とナーチャラーが支え合う場所。", zh: "成长者和培育者互相帮助的地方。" },
  newPost: { en: "New post", es: "Nueva publicación", ru: "Новый пост", fr: "Nouveau message", de: "Neuer Beitrag", pt: "Nova publicação", it: "Nuovo post", ja: "新しい投稿", zh: "发新帖" },
  reply: { en: "Reply", es: "Responder", ru: "Ответить", fr: "Répondre", de: "Antworten", pt: "Responder", it: "Rispondi", ja: "返信", zh: "回复" },

  // ---- growth shelf ----
  growthShelf: { en: "Growth shelf", es: "Estante de crecimiento", ru: "Полка роста", fr: "Étagère de croissance", de: "Wachstumsregal", pt: "Estante de crescimento", it: "Mensola della crescita", ja: "成長のたな", zh: "成长架" },
  appSpeaks: { en: "Your app is {pct} {language} now", es: "Tu app ya está al {pct} en {language}", ru: "Твоё приложение уже на {pct} — {language}", fr: "Ton appli est déjà à {pct} en {language}", de: "Deine App spricht jetzt zu {pct} {language}", pt: "Seu app já está {pct} em {language}", it: "La tua app ormai è al {pct} in {language}", ja: "アプリの{pct}はもう{language}", zh: "你的应用已有{pct}是{language}" },
  immersionWarm: { en: "Bit by bit, it stops speaking your language — because you're starting not to need it.", es: "Poco a poco deja de hablar tu idioma — porque empiezas a no necesitarlo.", ru: "Понемногу оно перестаёт говорить на твоём языке — потому что он тебе всё меньше нужен.", fr: "Petit à petit, elle cesse de parler ta langue — parce que tu commences à ne plus en avoir besoin.", de: "Stück für Stück hört sie auf, deine Sprache zu sprechen — weil du sie immer weniger brauchst.", pt: "Aos poucos ele para de falar a sua língua — porque você está deixando de precisar dela.", it: "Poco a poco smette di parlare la tua lingua — perché inizi a non averne bisogno.", ja: "すこしずつ、母語で話さなくなる——もう、いらなくなってきたから。", zh: "它正一点点不再说你的母语——因为你开始不需要了。" },
  firstJoke: { en: "I understood my first joke", es: "Entendí mi primer chiste", ru: "Я понял(а) первую шутку", fr: "J'ai compris ma première blague", de: "Ich habe meinen ersten Witz verstanden", pt: "Entendi minha primeira piada", it: "Ho capito la mia prima battuta", ja: "はじめてジョークがわかった", zh: "我听懂了第一个笑话" },
  // --- i18n-coverage additions ---
  crsSequence: { en: "The sequence", es: "La secuencia", ru: "Последовательность", fr: "La séquence", de: "Die Abfolge", pt: "A sequência", it: "La sequenza", ja: "進む順番", zh: "学习顺序" },
  crsHowGrowthWorks: { en: "How growth works here", es: "Cómo se crece aquí", ru: "Как здесь происходит рост", fr: "Comment on grandit ici", de: "Wie Wachstum hier funktioniert", pt: "Como o crescimento funciona aqui", it: "Come si cresce qui", ja: "ここでの成長のしくみ", zh: "这里如何成长" },
  crsThroughout: { en: "Throughout the phase", es: "A lo largo de la fase", ru: "На протяжении всей фазы", fr: "Tout au long de la phase", de: "Während der ganzen Phase", pt: "Ao longo da fase", it: "Per tutta la fase", ja: "フェーズ全体を通して", zh: "贯穿整个阶段" },
  crsHostExperience: { en: "How host people experience you", es: "Cómo te perciben las personas del lugar", ru: "Каким тебя видят местные жители", fr: "Comment les gens du pays te perçoivent", de: "Wie dich die Menschen vor Ort erleben", pt: "Como as pessoas locais percebem você", it: "Come ti percepiscono le persone del posto", ja: "現地の人にどう映るか", zh: "当地人眼中的你" },
  crsCircleCloses: { en: "The circle closes", es: "El círculo se cierra", ru: "Круг замыкается", fr: "La boucle se referme", de: "Der Kreis schließt sich", pt: "O círculo se fecha", it: "Il cerchio si chiude", ja: "輪が閉じる", zh: "圆满归一" },
  crsWithNurturer: { en: "with your nurturer", es: "con tu nutridor", ru: "с твоим наставником", fr: "avec ton accompagnant", de: "mit deinem Begleiter", pt: "com seu nutridor", it: "con il tuo nutritore", ja: "ナーチャラーと一緒に", zh: "和你的培育者一起" },
  crsNoPhaseTitle: { en: "Hmm… no such phase", es: "Mmm… esa fase no existe", ru: "Хм… такой фазы нет", fr: "Hmm… cette phase n'existe pas", de: "Hmm… diese Phase gibt es nicht", pt: "Hmm… essa fase não existe", it: "Mmm… questa fase non esiste", ja: "うーん…そんなフェーズはないよ", zh: "嗯……没有这个阶段" },
  crsNoPhaseBody: { en: "This corner of the journey doesn't exist — but six real phases are waiting on the map.", es: "Este rincón del viaje no existe, pero seis fases reales te esperan en el mapa.", ru: "Такого уголка на этом пути нет — но на карте тебя ждут шесть настоящих фаз.", fr: "Ce recoin du voyage n'existe pas — mais six vraies phases t'attendent sur la carte.", de: "Diesen Winkel der Reise gibt es nicht — aber sechs echte Phasen warten auf der Karte.", pt: "Este canto da jornada não existe — mas seis fases reais esperam por você no mapa.", it: "Questo angolo del viaggio non esiste — ma sei fasi vere ti aspettano sulla mappa.", ja: "この旅にそんな場所はないよ——でも地図には本物のフェーズが6つ待っている。", zh: "旅程里没有这个角落——但地图上有六个真实的阶段在等你。" },
  frmCatAll: { en: "All", es: "Todo", ru: "Все", fr: "Tout", de: "Alle", pt: "Tudo", it: "Tutto", ja: "すべて", zh: "全部" },
  frmCatFindNurturer: { en: "Find a nurturer", es: "Buscar nutridor", ru: "Найти наставника", fr: "Trouver un accompagnant", de: "Begleiter finden", pt: "Encontrar nutridor", it: "Trova un nutritore", ja: "ナーチャラーを探す", zh: "寻找培育者" },
  frmCatPhaseHelp: { en: "Phase help", es: "Ayuda con fases", ru: "Помощь с фазой", fr: "Aide sur les phases", de: "Phasen-Hilfe", pt: "Ajuda com fases", it: "Aiuto sulle fasi", ja: "フェーズのヘルプ", zh: "阶段帮助" },
  frmCatWins: { en: "Wins", es: "Logros", ru: "Победы", fr: "Victoires", de: "Erfolge", pt: "Conquistas", it: "Successi", ja: "うれしかったこと", zh: "好消息" },
  frmCatCulture: { en: "Culture", es: "Cultura", ru: "Культура", fr: "Culture", de: "Kultur", pt: "Cultura", it: "Cultura", ja: "文化", zh: "文化" },
  frmCatTools: { en: "Nurturer tools", es: "Recursos para nutridores", ru: "Инструменты наставника", fr: "Outils pour accompagnants", de: "Begleiter-Werkzeuge", pt: "Ferramentas do nutridor", it: "Strumenti per nutritori", ja: "ナーチャラーの道具", zh: "培育者工具" },
  frmTitlePlaceholder: { en: "What's happening in your village?", es: "¿Qué pasa en tu aldea?", ru: "Что происходит в твоей деревне?", fr: "Que se passe-t-il dans ton village ?", de: "Was passiert in deinem Dorf?", pt: "O que está acontecendo na sua aldeia?", it: "Cosa succede nel tuo villaggio?", ja: "あなたの村で、いまどんなこと？", zh: "你的村庄里发生了什么？" },
  frmBodyPlaceholder: { en: "Tell the story — a win, a question, a tool that worked…", es: "Cuenta la historia: un logro, una duda, algo que te funcionó…", ru: "Расскажи свою историю — победа, вопрос, что-то, что сработало…", fr: "Raconte ton histoire — une victoire, une question, un truc qui a marché…", de: "Erzähl deine Geschichte — ein Erfolg, eine Frage, etwas, das geklappt hat…", pt: "Conte a história — uma conquista, uma dúvida, algo que funcionou…", it: "Racconta la tua storia — un successo, una domanda, qualcosa che ha funzionato…", ja: "ストーリーを聞かせて——うれしかったこと、質問、うまくいった工夫…", zh: "讲讲你的故事吧——一个好消息、一个问题、一个好用的方法……" },
  frmEmptyTitle: { en: "It's quiet on this street…", es: "Esta calle está tranquila…", ru: "На этой улице тихо…", fr: "C'est calme dans cette rue…", de: "Hier auf der Straße ist es still…", pt: "Esta rua está quieta…", it: "Qui in strada è tutto tranquillo…", ja: "この通りは、しずかだね…", zh: "这条街上静悄悄的……" },
  frmEmptyBody: { en: "No posts match these filters yet. Plant the first one and watch the village gather.", es: "Aún no hay publicaciones con estos filtros. Planta la primera y mira cómo se reúne la aldea.", ru: "Под эти фильтры пока нет постов. Посади первый — и деревня соберётся.", fr: "Aucun message ne correspond à ces filtres pour l'instant. Plante le premier et regarde le village se rassembler.", de: "Noch keine Beiträge für diese Filter. Pflanze den ersten und sieh zu, wie sich das Dorf versammelt.", pt: "Nenhuma publicação corresponde a estes filtros ainda. Plante a primeira e veja a aldeia se reunir.", it: "Ancora nessun post con questi filtri. Pianta il primo e guarda il villaggio radunarsi.", ja: "このフィルターに合う投稿はまだないよ。最初のひとつを植えて、村が集まるのを見てみよう。", zh: "还没有符合这些筛选的帖子。种下第一个，看看村庄怎样聚拢起来。" },
  frmReplyPlaceholder: { en: "Add your voice…", es: "Añade tu voz…", ru: "Добавь свой голос…", fr: "Ajoute ta voix…", de: "Bring deine Stimme ein…", pt: "Acrescente a sua voz…", it: "Aggiungi la tua voce…", ja: "あなたの声を、ひとこと…", zh: "说说你的想法……" },
  wldGrowing: { en: "growing", es: "cultivando", ru: "растит", fr: "apprend", de: "wächst in", pt: "cultivando", it: "coltiva", ja: "育成中", zh: "正在成长" },
  wldSpeaks: { en: "speaks", es: "habla", ru: "говорит", fr: "parle", de: "spricht", pt: "fala", it: "parla", ja: "話せる", zh: "会说" },
  wldPeopleOf: { en: "People of", es: "Gente de", ru: "Люди мира", fr: "Les gens de", de: "Menschen von", pt: "Gente de", it: "Gente di", ja: "の人々", zh: "的人们" },
  wldSpinHint: { en: "drag to spin · zoom in to meet people", es: "arrastra para girar · acércate para conocer gente", ru: "крути пальцем · приблизь, чтобы встретить людей", fr: "fais glisser pour tourner · zoome pour rencontrer du monde", de: "ziehen zum Drehen · heranzoomen, um Leute zu treffen", pt: "arraste para girar · aproxime para conhecer pessoas", it: "trascina per ruotare · avvicinati per conoscere persone", ja: "ドラッグで回転 · 近づいて人と出会おう", zh: "拖动旋转 · 放大遇见大家" },
  wldPrivacyPromise: { en: "Everyone appears at city level only — never an exact location.", es: "Todos aparecen solo a nivel de ciudad, nunca en una ubicación exacta.", ru: "Все показаны только на уровне города — никогда точное местоположение.", fr: "Chacun n'apparaît qu'au niveau de la ville — jamais à un endroit précis.", de: "Alle erscheinen nur auf Stadtebene — nie ein genauer Standort.", pt: "Todos aparecem apenas no nível da cidade — nunca a localização exata.", it: "Tutti compaiono solo a livello di città — mai una posizione esatta.", ja: "全員が市区町村レベルでのみ表示されます——正確な位置は決して出ません。", zh: "所有人仅显示到城市级别——绝不显示确切位置。" },
  wldPeopleSub: { en: "Tap a dot on the planet or a row below to say hello. City level only — never an exact location.", es: "Toca un punto en el planeta o una fila abajo para saludar. Solo a nivel de ciudad, nunca una ubicación exacta.", ru: "Нажми на точку на планете или на строку ниже, чтобы поздороваться. Только уровень города — никогда точное местоположение.", fr: "Touche un point sur la planète ou une ligne ci-dessous pour dire bonjour. Niveau ville seulement — jamais un lieu précis.", de: "Tippe auf einen Punkt auf dem Planeten oder eine Zeile unten, um Hallo zu sagen. Nur Stadtebene — nie ein genauer Standort.", pt: "Toque num ponto no planeta ou numa linha abaixo para dizer olá. Apenas nível de cidade — nunca uma localização exata.", it: "Tocca un punto sul pianeta o una riga qui sotto per salutare. Solo a livello di città — mai una posizione esatta.", ja: "地球上のドットか下の一覧をタップしてあいさつしよう。市区町村レベルのみ——正確な位置は出ません。", zh: "点击地球上的圆点或下方的某一行打个招呼。仅城市级别——绝不显示确切位置。" },
  wldNurturersLabel: { en: "Nurturers — they live the language", es: "Nutridores — viven el idioma", ru: "Наставники — они живут этим языком", fr: "Accompagnants — ils vivent la langue", de: "Begleiter — sie leben die Sprache", pt: "Nutridores — eles vivem a língua", it: "Nutritori — vivono la lingua", ja: "ナーチャラー——その言語を生きる人たち", zh: "培育者——他们活在这门语言里" },
  wldMoreNurturers: { en: "nurturers are joining soon.", es: "se unirán pronto.", ru: "наставники скоро присоединятся.", fr: ": d'autres accompagnants arrivent bientôt.", de: "Begleiter kommen bald dazu.", pt: ": mais nutridores chegam em breve.", it: ": altri nutritori arrivano presto.", ja: "のナーチャラーがまもなく参加します。", zh: "培育者即将加入。" },
  wldGrowersLabel: { en: "Growers — growing into it, near and far", es: "Cultivadores — creciendo en ello, de cerca y de lejos", ru: "Растущие — врастают в язык, рядом и вдалеке", fr: "Apprenants — ils y grandissent, de près comme de loin", de: "Wachsende — sie wachsen hinein, nah und fern", pt: "Cultivadores — crescendo nela, de perto e de longe", it: "Coltivatori — crescono dentro, vicino e lontano", ja: "育つ人——近くからも遠くからも、その言語に育っていく", zh: "成长者——由近及远地融入其中" },
  wldNoGrowers: { en: "No growers here yet — you could be the first.", es: "Aún no hay cultivadores aquí — podrías ser el primero.", ru: "Здесь пока нет растущих — ты можешь стать первым.", fr: "Aucun apprenant ici pour l'instant — tu pourrais être le premier.", de: "Noch keine Wachsenden hier — du könntest die:der Erste sein.", pt: "Ainda não há cultivadores aqui — você pode ser o primeiro.", it: "Ancora nessun coltivatore qui — potresti essere il primo.", ja: "まだ育つ人はいません——あなたが最初になれます。", zh: "这里还没有成长者——你可以成为第一个。" },
  wldMoreNurturersWide: { en: "nurturers are joining soon — meet the wider village meanwhile.", es: "se unirán pronto — mientras tanto, conoce a la aldea más amplia.", ru: "наставники скоро присоединятся — а пока познакомься со всей деревней.", fr: ": d'autres accompagnants arrivent bientôt — en attendant, découvre le village au sens large.", de: "Begleiter kommen bald dazu — lerne inzwischen das größere Dorf kennen.", pt: ": mais nutridores chegam em breve — enquanto isso, conheça a aldeia maior.", it: ": altri nutritori arrivano presto — intanto scopri il villaggio più ampio.", ja: "のナーチャラーがまもなく参加します——それまでは、もっと広い村をのぞいてみよう。", zh: "培育者即将加入——在此期间，先认识更广阔的村庄吧。" },
  wldCityOnly: { en: "city shown, never exact location", es: "se muestra la ciudad, nunca la ubicación exacta", ru: "показан город, никогда точное местоположение", fr: "ville affichée, jamais le lieu exact", de: "Stadt angezeigt, nie der genaue Standort", pt: "cidade exibida, nunca a localização exata", it: "mostra la città, mai la posizione esatta", ja: "市区町村のみ表示、正確な位置は出ません", zh: "仅显示城市，绝不显示确切位置" },
  wldOpenToExchange: { en: "Open to language exchange", es: "Abierto a intercambio de idiomas", ru: "Открыт(а) к языковому обмену", fr: "Ouvert à l'échange linguistique", de: "Offen für Sprachaustausch", pt: "Aberto a intercâmbio de idiomas", it: "Aperto allo scambio linguistico", ja: "言語交換を歓迎", zh: "欢迎语言交换" },
  wldWaveHello: { en: "Wave hello in the Village", es: "Saluda en la Aldea", ru: "Поздоровайся в Деревне", fr: "Dis bonjour au Village", de: "Sag im Dorf Hallo", pt: "Diga olá na Aldeia", it: "Saluta nel Villaggio", ja: "村であいさつしよう", zh: "在村庄里打个招呼" },
  prcVocabName: { en: "Rough-and-Ready Dozen", es: "La docena express", ru: "Дюжина на скорую руку", fr: "La douzaine express", de: "Das schnelle Dutzend", pt: "A dúzia rápida", it: "La dozzina veloce", ja: "ざっくり12枚", zh: "速记十二张" },
  prcListenName: { en: "Listen & Do", es: "Escucha y actúa", ru: "Слушай и делай", fr: "Écoute et agis", de: "Hören & Handeln", pt: "Escute e faça", it: "Ascolta e fai", ja: "聞いて動こう", zh: "听一听，做一做" },
  prcSpeakName: { en: "Power Phrases", es: "Frases poderosas", ru: "Сильные фразы", fr: "Phrases clés", de: "Schlüsselsätze", pt: "Frases-chave", it: "Frasi chiave", ja: "パワーフレーズ", zh: "实用金句" },
  prcRepeatName: { en: "Re-live Your Words", es: "Revive tus palabras", ru: "Оживи свои слова", fr: "Revis tes mots", de: "Erlebe deine Wörter neu", pt: "Reviva suas palavras", it: "Rivivi le tue parole", ja: "ことばをもう一度", zh: "重温你的词语" },
  prcVocabBlurb: { en: "A dozen picture cards a round — hear the word, find the picture. Ears before eyes.", es: "Una docena de tarjetas por ronda: escucha la palabra y encuentra la imagen. Primero el oído, luego la vista.", ru: "Дюжина карточек за раунд: услышь слово — найди картинку. Сначала уши, потом глаза.", fr: "Une douzaine de cartes par tour : écoute le mot, trouve l'image. L'oreille avant les yeux.", de: "Ein Dutzend Bildkarten pro Runde — hör das Wort, finde das Bild. Ohren vor Augen.", pt: "Uma dúzia de cartões por rodada: ouça a palavra e ache a imagem. Primeiro o ouvido, depois os olhos.", it: "Una dozzina di carte a giro: ascolta la parola e trova l'immagine. Prima le orecchie, poi gli occhi.", ja: "1ラウンドに12枚の絵カード。ことばを聞いて、その絵をさがそう。目より先に、まず耳から。", zh: "每轮十二张图片卡——听到词语，找出对应的图。先用耳朵，再用眼睛。" },
  prcListenBlurb: { en: "Nuri speaks, your body answers. No talking yet — just do what you hear.", es: "Nuri habla y tu cuerpo responde. Aún no hables: solo haz lo que escuchas.", ru: "Нури говорит — отвечает твоё тело. Пока не говори, просто делай то, что слышишь.", fr: "Nuri parle, ton corps répond. Ne parle pas encore : fais simplement ce que tu entends.", de: "Nuri spricht, dein Körper antwortet. Noch nicht reden — tu einfach, was du hörst.", pt: "Nuri fala e seu corpo responde. Ainda não fale: apenas faça o que ouvir.", it: "Nuri parla, il tuo corpo risponde. Non parlare ancora: fai solo ciò che senti.", ja: "ヌリが話し、あなたの体が答える。まだ話さなくていい——聞こえたとおりに動くだけ。", zh: "Nuri 说，你的身体来回答。先别开口——听到什么就做什么。" },
  prcSpeakBlurb: { en: "Eight survival questions that turn every host person into your nurturer.", es: "Ocho preguntas de supervivencia que convierten a cualquier persona del lugar en tu nutridor.", ru: "Восемь фраз на выживание, которые превращают любого местного в твоего наставника.", fr: "Huit questions de survie qui transforment chaque habitant en ton accompagnant.", de: "Acht Überlebensfragen, die jeden Einheimischen zu deinem Begleiter machen.", pt: "Oito perguntas de sobrevivência que transformam qualquer pessoa do lugar no seu nutridor.", it: "Otto domande di sopravvivenza che trasformano ogni persona del posto nel tuo nutritore.", ja: "出会った人みんなをあなたのナーチャラーに変える、8つのサバイバル質問。", zh: "八句生存问句，让你遇到的每个当地人都成为你的培育者。" },
  prcRepeatBlurb: { en: "Replay yesterday's session — eyes on the pictures, ears in the host world.", es: "Repite la sesión de ayer: los ojos en las imágenes, los oídos en el mundo anfitrión.", ru: "Повтори вчерашнюю сессию: глаза — на картинки, уши — в мире хозяев.", fr: "Rejoue la séance d'hier : les yeux sur les images, les oreilles dans le monde d'accueil.", de: "Spiel die gestrige Sitzung erneut ab — Augen auf den Bildern, Ohren in der neuen Welt.", pt: "Repita a sessão de ontem: os olhos nas imagens, os ouvidos no mundo anfitrião.", it: "Rivivi la sessione di ieri: occhi sulle immagini, orecchie nel mondo ospitante.", ja: "きのうのセッションをもう一度。目は絵に、耳は新しい世界に。", zh: "重播昨天的练习——眼睛看图，耳朵留在新世界里。" },
  prcFootnote: { en: "Growing Participator practice — meaning lives in pictures and voices, never in translation.", es: "Práctica del Participante en Crecimiento: el significado vive en imágenes y voces, nunca en la traducción.", ru: "Практика растущего участника: смысл живёт в картинках и голосах, а не в переводе.", fr: "Pratique du Participant Grandissant : le sens vit dans les images et les voix, jamais dans la traduction.", de: "Übung für Wachsende Teilnehmer — Bedeutung lebt in Bildern und Stimmen, nie in Übersetzung.", pt: "Prática do Participante em Crescimento: o significado vive em imagens e vozes, nunca na tradução.", it: "Pratica del Partecipante in Crescita: il significato vive in immagini e voci, mai nella traduzione.", ja: "成長する参加者の練習——意味は絵と声の中に宿る。翻訳の中にではなく。", zh: "成长参与者练习——意义活在图像与声音里，而不在翻译中。" },
  prcFallbackDeck: { en: "Full picture decks for this language are growing — here's the Spanish demo deck", es: "Las barajas completas para este idioma están creciendo: aquí tienes la baraja de demostración en español", ru: "Полные колоды карточек для этого языка ещё растут — пока вот испанская демоколода", fr: "Les jeux de cartes complets pour cette langue sont en train de pousser — voici le jeu de démo en espagnol", de: "Die vollständigen Bildkartensätze für diese Sprache wachsen noch — hier ist das spanische Demo-Set", pt: "Os baralhos completos de imagens para este idioma estão crescendo — aqui está o baralho de demonstração em espanhol", it: "I mazzi completi di carte per questa lingua stanno crescendo — ecco il mazzo demo in spagnolo", ja: "この言語の絵カードはまだ準備中——いまはスペイン語のデモデッキをどうぞ", zh: "这门语言的完整图片卡还在成长中——先用西班牙语的示范卡组吧" },
  prcIceberg: { en: "It's in your iceberg", es: "Está en tu iceberg", ru: "Это уже в твоём айсберге", fr: "C'est dans ton iceberg", de: "Es ist in deinem Eisberg", pt: "Está no seu iceberg", it: "È nel tuo iceberg", ja: "あなたの氷山に入ったよ", zh: "它进了你的冰山里" },
  prcListenKicker: { en: "Total Physical Response", es: "Respuesta Física Total", ru: "Полный физический отклик", fr: "Réponse physique totale", de: "Total Physical Response", pt: "Resposta Física Total", it: "Risposta fisica totale", ja: "全身反応（TPR）", zh: "全身反应法" },
  prcListenFinish: { en: "Your body answered before your mouth had to — that's exactly how Phase 1 grows.", es: "Tu cuerpo respondió antes de que tuvieras que hablar: así es exactamente como crece la Fase 1.", ru: "Твоё тело ответило раньше, чем пришлось говорить, — именно так растёт Фаза 1.", fr: "Ton corps a répondu avant même que ta bouche ait à le faire — c'est exactement ainsi que grandit la Phase 1.", de: "Dein Körper hat geantwortet, bevor dein Mund musste — genau so wächst Phase 1.", pt: "Seu corpo respondeu antes mesmo de você precisar falar: é exatamente assim que a Fase 1 cresce.", it: "Il tuo corpo ha risposto prima che dovessi parlare: è esattamente così che cresce la Fase 1.", ja: "口を開く前に、体が答えた——フェーズ1は、まさにこうして育つ。", zh: "还没开口，你的身体已经回答了——第一阶段正是这样成长的。" },
  prcVocabFinish: { en: "Twelve meetings, zero translation — those words now live in pictures and sound.", es: "Doce encuentros, cero traducción: esas palabras ya viven en imágenes y sonido.", ru: "Двенадцать встреч, ноль перевода — эти слова теперь живут в картинках и звуке.", fr: "Douze rencontres, zéro traduction — ces mots vivent désormais dans les images et le son.", de: "Zwölf Begegnungen, null Übersetzung — diese Wörter leben jetzt in Bildern und Klang.", pt: "Doze encontros, zero tradução: essas palavras agora vivem em imagens e som.", it: "Dodici incontri, zero traduzione: quelle parole ora vivono in immagini e suono.", ja: "12回の出会い、翻訳はゼロ——そのことばは、もう絵と音の中に生きている。", zh: "十二次相遇，零翻译——这些词语如今活在图像与声音里。" },
  prcSpeakKicker: { en: "Your power tools — they make every host person your nurturer", es: "Tus herramientas de poder: convierten a cada persona del lugar en tu nutridor", ru: "Твои главные инструменты — с ними любой местный становится твоим наставником", fr: "Tes outils clés — ils font de chaque habitant ton accompagnant", de: "Deine Schlüsselwerkzeuge — sie machen jeden Einheimischen zu deinem Begleiter", pt: "Suas ferramentas de poder: elas transformam cada pessoa do lugar no seu nutridor", it: "I tuoi strumenti chiave: trasformano ogni persona del posto nel tuo nutritore", ja: "あなたの強力な道具——出会う人みんなを、あなたのナーチャラーに変える", zh: "你的得力工具——让每个当地人都成为你的培育者" },
  prcSpeakFinish: { en: "Eight power tools in your pocket — now every patient stranger in the host world can become your nurturer.", es: "Ocho herramientas de poder en el bolsillo: ahora cualquier desconocido paciente del mundo anfitrión puede ser tu nutridor.", ru: "Восемь сильных инструментов в кармане — теперь любой терпеливый незнакомец в мире хозяев может стать твоим наставником.", fr: "Huit outils clés en poche — désormais, chaque inconnu patient du monde d'accueil peut devenir ton accompagnant.", de: "Acht Schlüsselwerkzeuge in der Tasche — jetzt kann jeder geduldige Fremde in der neuen Welt dein Begleiter werden.", pt: "Oito ferramentas de poder no bolso: agora qualquer desconhecido paciente do mundo anfitrião pode ser seu nutridor.", it: "Otto strumenti chiave in tasca: ora ogni sconosciuto paziente del mondo ospitante può diventare il tuo nutritore.", ja: "ポケットに8つの強力な道具——これで、新しい世界の親切な見知らぬ人みんなが、あなたのナーチャラーになれる。", zh: "口袋里有八件得力工具——现在新世界里每个有耐心的陌生人都能成为你的培育者。" },
  prcPowerTools: { en: "power tools", es: "herramientas de poder", ru: "сильные инструменты", fr: "outils clés", de: "Schlüsselwerkzeuge", pt: "ferramentas de poder", it: "strumenti chiave", ja: "強力な道具", zh: "得力工具" },
  prcHoldMic: { en: "hold the mic & say it aloud", es: "mantén el micro y dilo en voz alta", ru: "зажми микрофон и скажи вслух", fr: "maintiens le micro et dis-le à voix haute", de: "Mikro halten und laut aussprechen", pt: "segure o microfone e diga em voz alta", it: "tieni premuto il microfono e dillo ad alta voce", ja: "マイクを押したまま、声に出して言ってみよう", zh: "按住麦克风，大声说出来" },
  prcHoldLonger: { en: "hold a little longer next time", es: "la próxima vez mantenlo un poco más", ru: "в следующий раз подержи чуть дольше", fr: "maintiens un peu plus longtemps la prochaine fois", de: "beim nächsten Mal etwas länger halten", pt: "da próxima vez segure um pouco mais", it: "la prossima volta tieni premuto un po' di più", ja: "次はもう少し長く押してみよう", zh: "下次按住久一点" },
  prcHoldToRecord: { en: "hold to record", es: "mantén para grabar", ru: "удерживай, чтобы записать", fr: "maintiens pour enregistrer", de: "halten zum Aufnehmen", pt: "segure para gravar", it: "tieni premuto per registrare", ja: "押したまま録音", zh: "按住录音" },
  prcMicUnavailable: { en: "Mic unavailable — saying it out loud still counts", es: "Micrófono no disponible: decirlo en voz alta también cuenta", ru: "Микрофон недоступен — сказать вслух всё равно считается", fr: "Micro indisponible — le dire à voix haute compte quand même", de: "Kein Mikro verfügbar — laut aussprechen zählt trotzdem", pt: "Microfone indisponível: dizer em voz alta também conta", it: "Microfono non disponibile: dirlo ad alta voce conta lo stesso", ja: "マイクが使えない——でも声に出して言えば、ちゃんとカウントされるよ", zh: "麦克风不可用——大声说出来也算数" },
  prcRepeatKicker: { en: "Re-live yesterday's meeting — eyes on the pictures, ears in the host world", es: "Revive el encuentro de ayer: los ojos en las imágenes, los oídos en el mundo anfitrión", ru: "Оживи вчерашнюю встречу: глаза — на картинки, уши — в мире хозяев", fr: "Revis la rencontre d'hier : les yeux sur les images, les oreilles dans le monde d'accueil", de: "Erlebe die gestrige Begegnung neu — Augen auf den Bildern, Ohren in der neuen Welt", pt: "Reviva o encontro de ontem: os olhos nas imagens, os ouvidos no mundo anfitrião", it: "Rivivi l'incontro di ieri: occhi sulle immagini, orecchie nel mondo ospitante", ja: "きのうの出会いをもう一度——目は絵に、耳は新しい世界に", zh: "重温昨天的相遇——眼睛看图，耳朵留在新世界里" },
  prcRepeatFinish: { en: "Ten word-meetings re-lived — yesterday's session just sank a little deeper into your iceberg.", es: "Diez encuentros con palabras revividos: la sesión de ayer se hundió un poco más en tu iceberg.", ru: "Десять встреч со словами заново — вчерашняя сессия осела чуть глубже в твоём айсберге.", fr: "Dix rencontres avec des mots revécues — la séance d'hier vient de s'enfoncer un peu plus dans ton iceberg.", de: "Zehn Wortbegegnungen neu erlebt — die gestrige Sitzung ist gerade ein Stück tiefer in deinen Eisberg gesunken.", pt: "Dez encontros com palavras revividos: a sessão de ontem afundou um pouco mais no seu iceberg.", it: "Dieci incontri con le parole rivissuti: la sessione di ieri è scesa un po' più in fondo nel tuo iceberg.", ja: "10のことばとの出会いを、もう一度。きのうのセッションが、あなたの氷山にまた少し深く沈んでいった。", zh: "重温十次与词语的相遇——昨天的练习又往你的冰山里沉得更深了一点。" },
  prcPause: { en: "Pause", es: "Pausa", ru: "Пауза", fr: "Pause", de: "Pause", pt: "Pausar", it: "Pausa", ja: "一時停止", zh: "暂停" },
};

/* ---------------------------------------------------------------- *
 *  Graduated immersion tiers
 * ---------------------------------------------------------------- */

/**
 * Which immersion stage flips each key into the target language.
 *   tier 1 — nav tabs & greetings: the first words to go host-language
 *   tier 2 — buttons & short labels
 *   tier 3 — section titles & stat labels
 *   tier 4 — everything, including explanations and long copy
 * Keys missing from this map default to tier 4 (last to flip).
 */
export const KEY_TIERS: Record<string, 1 | 2 | 3 | 4> = {
  // tier 1 — nav & greetings
  courses: 1, dashboard: 1, schedule: 1, forum: 1, world: 1, hello: 1, today: 1,
  // tier 2 — buttons & short labels
  continue: 2, back: 2, start: 2, next: 2, done: 2, play: 2, listen: 2, speak: 2,
  repeat: 2, book: 2, cancel: 2, online: 2, minutes: 2, hours: 2, words: 2,
  phaseWord: 2, openPhase: 2, endSession: 2, timeLeft: 2, reply: 2, newPost: 2, nurture: 2,
  // tier 3 — section titles & stat labels
  student: 3, nurturerWord: 3, aiNurturer: 3, correct: 3, tryAgain: 3, dayStreak: 3,
  immersionOn: 3, joinSpeakingClub: 3, yourNurturer: 3, trainings: 3,
  practiceSpeaking: 3, fastRepeat: 3, minPractice: 3, weeklyActivity: 3,
  hoursLogged: 3, wordsMet: 3, activitiesDone: 3, vocabulary: 3, listening: 3,
  speaking: 3, literacy: 3, food: 3, traveling: 3, sport: 3, animals: 3,
  health: 3, home: 3, work: 3, family: 3, body: 3, nature: 3,
  milestonesWord: 3, activitiesWord: 3, currentPhase: 3, scheduleTitle: 3,
  upcoming: 3, bookSession: 3, availableNurturers: 3, sessionRoom: 3,
  showCards: 3, forumTitle: 3, growthShelf: 3,
  // tier 4 — long copy & explanations
  trainingsSub: 4, chooseCategory: 4, coursesTitle: 4, coursesSub: 4,
  noSessions: 4, forumSub: 4, appSpeaks: 4, immersionWarm: 4, firstJoke: 4,
  // --- i18n-coverage additions ---
  crsSequence: 3, crsHowGrowthWorks: 3, crsThroughout: 3, crsHostExperience: 3, crsCircleCloses: 3, crsWithNurturer: 3,
  crsNoPhaseTitle: 4, crsNoPhaseBody: 4, frmCatAll: 2, frmCatFindNurturer: 2, frmCatPhaseHelp: 2, frmCatWins: 2,
  frmCatCulture: 2, frmCatTools: 2, frmTitlePlaceholder: 4, frmBodyPlaceholder: 4, frmEmptyTitle: 4, frmEmptyBody: 4,
  frmReplyPlaceholder: 4, wldGrowing: 2, wldSpeaks: 2, wldPeopleOf: 3, wldSpinHint: 4, wldPrivacyPromise: 4,
  wldPeopleSub: 4, wldNurturersLabel: 3, wldMoreNurturers: 4, wldGrowersLabel: 3, wldNoGrowers: 4, wldMoreNurturersWide: 4,
  wldCityOnly: 4, wldOpenToExchange: 3, wldWaveHello: 2, prcVocabName: 2, prcListenName: 2, prcSpeakName: 2,
  prcRepeatName: 2, prcVocabBlurb: 4, prcListenBlurb: 4, prcSpeakBlurb: 4, prcRepeatBlurb: 4, prcFootnote: 4,
  prcFallbackDeck: 4, prcIceberg: 4, prcListenKicker: 3, prcListenFinish: 4, prcVocabFinish: 4, prcSpeakKicker: 3,
  prcSpeakFinish: 4, prcPowerTools: 3, prcHoldMic: 4, prcHoldLonger: 4, prcHoldToRecord: 3, prcMicUnavailable: 4,
  prcRepeatKicker: 3, prcRepeatFinish: 4, prcPause: 2,
};

export function t(key: string, lang: LangCode): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? key;
}

/** Build a translate function bound to one language */
export const makeT = (lang: LangCode) => (key: string) => t(key, lang);

/**
 * Graduated-immersion translator: per KEY, speak the target language once the
 * grower's stage has reached that key's tier (and a translation exists);
 * otherwise fall back to the native language, then English.
 * Stage 0 = fully native UI · stage 4 = fully target UI.
 */
export const makeBlendedT =
  (native: LangCode, target: LangCode, stage: number) =>
  (key: string): string => {
    const entry = STRINGS[key];
    if (!entry) return key;
    const tier = KEY_TIERS[key] ?? 4;
    const hit = entry[target];
    if (tier <= stage && hit) return hit;
    return entry[native] ?? entry.en ?? key;
  };

/**
 * How much of the UI speaks the target language at a given stage, 0..1 —
 * the dashboard's immersion meter.
 */
export function immersionShare(target: LangCode, stage: number): number {
  if (stage <= 0) return 0;
  const keys = Object.keys(STRINGS);
  const flipped = keys.filter(
    (k) => (KEY_TIERS[k] ?? 4) <= stage && STRINGS[k][target] !== undefined
  ).length;
  return keys.length === 0 ? 0 : flipped / keys.length;
}
