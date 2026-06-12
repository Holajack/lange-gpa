import type { ForumPost, Nurturer } from "./types";

/**
 * Demo nurturers — ordinary people who grew up inside the language,
 * not professional teachers. That is the GPA point: anyone who lives
 * the language can nurture a grower into it.
 */
export const NURTURERS: Nurturer[] = [
  { id: "lucia", name: "Lucía Ferrer", langs: ["es"], city: "Valencia", bio: "Grandmother of four, retired baker. Loves showing her kitchen, her market, her neighborhood.", tags: ["patient", "food", "phase 1–2"], sessions: 312, rating: 4.9, online: true, color: "#ff8a1e" },
  { id: "mateo", name: "Mateo Quispe", langs: ["es"], city: "Cusco", bio: "Tour guide and football fan. Will act out every word until you get it — no English, ever.", tags: ["energetic", "sport", "phase 1–3"], sessions: 198, rating: 4.8, online: true, color: "#7c5cff" },
  { id: "anya", name: "Anya Sokolova", langs: ["ru", "uk"], city: "Tbilisi", bio: "Nurse and mother of two. Gentle, slow speech, endless picture books from her childhood.", tags: ["gentle", "family", "phase 1–2"], sessions: 421, rating: 5.0, online: true, color: "#b8f03c" },
  { id: "dmitri", name: "Dmitri Volkov", langs: ["ru"], city: "Almaty", bio: "Taxi driver and chess player. Phase 3+ growers ride along through his stories of the city.", tags: ["stories", "humor", "phase 3–4"], sessions: 156, rating: 4.7, online: false, color: "#ffd234" },
  { id: "camille", name: "Camille Roux", langs: ["fr"], city: "Lyon", bio: "Florist. Names every plant, every color, every smell — your Phase 1 word world in bloom.", tags: ["nature", "calm", "phase 1–2"], sessions: 267, rating: 4.9, online: true, color: "#3ddc84" },
  { id: "karim", name: "Karim Haddad", langs: ["fr", "ar"], city: "Marseille", bio: "Fishmonger at the old port. Loud, kind, theatrical — you will understand him with zero translation.", tags: ["market life", "phase 2–3"], sessions: 189, rating: 4.8, online: true, color: "#ff5d5d" },
  { id: "greta", name: "Greta Baumann", langs: ["de"], city: "Leipzig", bio: "Kindergarten helper, speaks to growers the way she speaks to five-year-olds: clearly and warmly.", tags: ["clear speech", "phase 1"], sessions: 233, rating: 4.9, online: false, color: "#a78bfa" },
  { id: "joao", name: "João Mendes", langs: ["pt"], city: "Porto", bio: "Bus driver and amateur cook. His picture cards are photos of his own street.", tags: ["everyday life", "phase 1–2"], sessions: 144, rating: 4.8, online: true, color: "#ff8a1e" },
  { id: "elena", name: "Elena Greco", langs: ["it"], city: "Bari", bio: "Seamstress. Teaches through her hands: fabrics, tools, actions. Pure here-and-now talk.", tags: ["hands-on", "phase 1–2"], sessions: 178, rating: 4.9, online: true, color: "#b8f03c" },
  { id: "haruka", name: "Haruka Sato", langs: ["ja"], city: "Osaka", bio: "Retired school-lunch cook. Forty years of feeding children — now she feeds growers words, one warm bowl at a time.", tags: ["warm", "food", "phase 1–2"], sessions: 287, rating: 4.9, online: true, color: "#ff8a1e" },
  { id: "kenji", name: "Kenji Nakamura", langs: ["ja"], city: "Sapporo", bio: "Train conductor. Stations, timetables, bento on the platform — ride his daily route and the words arrive on schedule.", tags: ["routines", "travel", "phase 2–3"], sessions: 142, rating: 4.8, online: false, color: "#7c5cff" },
  { id: "liwei", name: "Li Wei", langs: ["zh"], city: "Chengdu", bio: "Street-food vendor. Point at anything on his cart and he names it, fries it, and hands it over — meaning you can taste.", tags: ["market life", "food", "phase 1–2"], sessions: 203, rating: 4.8, online: true, color: "#b8f03c" },
  { id: "zhangmin", name: "Zhang Min", langs: ["zh"], city: "Kunming", bio: "Grandmother and mahjong fan. Learns your name in one session, deals you into the family table by the next.", tags: ["family", "games", "phase 1–3"], sessions: 356, rating: 5.0, online: true, color: "#ffd234" },
  { id: "maggie", name: "Maggie Whitlow", langs: ["en"], city: "Leeds", bio: "Tea-shop owner. Pours, points and natters — scones, teapots and weather talk until her counter is your first hundred words.", tags: ["cozy", "food", "phase 1–2"], sessions: 248, rating: 4.9, online: true, color: "#a78bfa" },
  { id: "dwayne", name: "Dwayne Carter", langs: ["en"], city: "Atlanta", bio: "School bus driver. Twenty years of morning routes — seats, stops and the same jokes daily, so the words show up right on time.", tags: ["humor", "routines", "phase 1–3"], sessions: 173, rating: 4.8, online: true, color: "#3ddc84" },
];

export const nurturerById = (id: string) => NURTURERS.find((n) => n.id === id);

export const nurturersForLang = (lang: string) =>
  NURTURERS.filter((n) => (n.langs as string[]).includes(lang));

/** Seed posts for The Village (forum) */
export const FORUM_SEED: ForumPost[] = [
  {
    id: "p1", author: "Sofía M.", authorRole: "grower", lang: "ru", category: "wins", ago: "2h",
    title: "Понял свою первую шутку! 🎉",
    body: "Six weeks into Phase 1 and my nurturer made a joke about the cat picture card — and I LAUGHED before I realized I'd understood it. No translation. It just... landed. This method works.",
    likes: 48,
    replies: [
      { author: "Anya S. (nurturer)", body: "Это самый лучший момент! That moment is exactly what we nurture for. Молодец! 💚", ago: "1h" },
      { author: "Tom R.", body: "The first joke is a milestone they should put on the Phase 1 list honestly.", ago: "44m" },
    ],
  },
  {
    id: "p2", author: "Daniel K.", authorRole: "grower", lang: "es", category: "phase-help", ago: "5h",
    title: "Phase 2: when should I start speaking?",
    body: "I'm ~120 hours in. Words are emerging on their own now but I feel pressure to force full sentences. Should I push or let it come?",
    likes: 23,
    replies: [
      { author: "Lucía F. (nurturer)", body: "Let it come, mijo. In Phase 2 speech *emerges* — like a child. Forcing full sentences early just builds bad habits. Keep listening rich and your mouth will follow.", ago: "4h" },
      { author: "Mateo Q. (nurturer)", body: "What Lucía said. I never correct in conversation — I just say it back the right way and we keep going.", ago: "3h" },
    ],
  },
  {
    id: "p3", author: "Priya N.", authorRole: "nurturer", lang: "fr", category: "tools", ago: "1d",
    title: "My favorite picture-card sets for the Dirty Dozen",
    body: "After 50+ Phase 1 sessions: photos of YOUR OWN kitchen beat any stock images. The grower connects words to a real place they'll see again next session. I keep 12 new cards + 50 review cards per hour.",
    likes: 67,
    replies: [
      { author: "Camille R. (nurturer)", body: "Exactement ! I photograph my flower shop. Growers remember 'l'arrosoir' because they saw MY watering can.", ago: "20h" },
    ],
  },
  {
    id: "p4", author: "Marcus W.", authorRole: "grower", lang: "de", category: "find-nurturer", ago: "1d",
    title: "Looking for a German nurturer, evenings CET",
    body: "Phase 1, ~30 hours in via the app activities. Ready for my first live growing sessions. I'd love someone patient who enjoys cooking — food words are my favorite world so far.",
    likes: 9,
    replies: [
      { author: "Greta B. (nurturer)", body: "Hallo Marcus! I have Tuesday and Thursday evenings free. Let's cook with pictures. 🥨", ago: "22h" },
    ],
  },
  {
    id: "p5", author: "Yuki T.", authorRole: "grower", lang: "es", category: "culture", ago: "2d",
    title: "Sobremesa: the word my nurturer couldn't show in pictures",
    body: "Lucía spent ten minutes acting out 'sobremesa' — the time you stay at the table talking after the meal is done. No English equivalent. THIS is why I learn from a person and not a dictionary.",
    likes: 81,
    replies: [
      { author: "Lucía F. (nurturer)", body: "And next session we will have a real sobremesa, even on video call. Bring tea. ☕", ago: "2d" },
      { author: "Daniel K.", body: "Words like this are the whole reason for Phase 4 honestly. Beautiful.", ago: "1d" },
    ],
  },
  {
    id: "p6", author: "Anya S.", authorRole: "nurturer", lang: "ru", category: "tools", ago: "3d",
    title: "Nurturers: speak MORE, not slower-and-broken",
    body: "New nurturers often switch to broken 'foreigner talk'. Don't! Speak naturally but about the here-and-now, with pictures and gestures carrying the meaning. Rich input, real language, zero translation. The grower's iceberg grows under the water before it shows above.",
    likes: 102,
    replies: [
      { author: "João M. (nurturer)", body: "The iceberg picture changed how I nurture. Understanding first, speech later. 🧊", ago: "2d" },
      { author: "Karim H. (nurturer)", body: "Oui! I talk to growers like I talk to my customers — with my whole body. 😄", ago: "2d" },
    ],
  },
];
