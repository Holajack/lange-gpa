import type { LangCode } from "./types";

/**
 * The Nuri toy family — Nuri's siblings. Each growing language has its own
 * sibling modeled after that country's iconic toy (piñata, nutcracker,
 * matryoshka, daruma…), so the mascot itself carries culture — never translation.
 */
export type MascotDef = {
  id: string;
  name: string;
  lang: LangCode;
  toy: string;
  color: string;
  accent: string;
  image: string;
  nativeHello: string;
};

export const MASCOTS: MascotDef[] = [
  { id: "nuri", name: "Nuri", lang: "en", toy: "The original sprout-bot", color: "#ff7a00", accent: "#b8f03c", image: "/mascots/nuri.png", nativeHello: "Hello!" },
  { id: "brotito", name: "Brotito", lang: "es", toy: "Piñata", color: "#ff4747", accent: "#ffd234", image: "/mascots/brotito.png", nativeHello: "¡Hola!" },
  { id: "brin", name: "Brin", lang: "fr", toy: "Marinière sailor", color: "#2e3a85", accent: "#e82e2e", image: "/mascots/brin.png", nativeHello: "Salut !" },
  { id: "sprossi", name: "Sprossi", lang: "de", toy: "Nutcracker", color: "#2f54e0", accent: "#e8b54a", image: "/mascots/sprossi.png", nativeHello: "Hallo!" },
  { id: "gemma", name: "Gemma", lang: "it", toy: "Wooden marionette", color: "#cf9d5f", accent: "#e82e2e", image: "/mascots/gemma.png", nativeHello: "Ciao!" },
  { id: "broto", name: "Broto", lang: "pt", toy: "Barcelos rooster", color: "#2b3a5e", accent: "#f0a030", image: "/mascots/broto.png", nativeHello: "Olá!" },
  { id: "listik", name: "Listik", lang: "ru", toy: "Matryoshka doll", color: "#e02f26", accent: "#f5e6cf", image: "/mascots/listik.png", nativeHello: "Привет!" },
  { id: "futaba", name: "Futaba", lang: "ja", toy: "Daruma doll", color: "#ff7fae", accent: "#e8b54a", image: "/mascots/futaba.png", nativeHello: "こんにちは！" },
  { id: "yaya", name: "Yaya", lang: "zh", toy: "Panda", color: "#f0ece4", accent: "#e82e2e", image: "/mascots/yaya.png", nativeHello: "你好！" },
  { id: "tiboujon", name: "Ti Boujon", lang: "ht", toy: "Tanbou (Haitian barrel drum)", color: "#00209f", accent: "#d21034", image: "/mascots/tiboujon.png", nativeHello: "Bonjou!" },
];

/** Exact lang match, else Nuri — the family's original sibling. */
export function mascotForLang(lang: LangCode): MascotDef {
  return MASCOTS.find((m) => m.lang === lang) ?? MASCOTS[0];
}
