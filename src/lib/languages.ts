import type { LangCode, Language } from "./types";

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", tts: "en-US" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", tts: "es-ES" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", tts: "ru-RU" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", tts: "fr-FR" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", tts: "de-DE" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", tts: "pt-BR" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", tts: "it-IT" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", tts: "ja-JP" },
  { code: "zh", name: "Mandarin", nativeName: "中文", flag: "🇨🇳", tts: "zh-CN" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", tts: "ar-SA", rtl: true },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", tts: "ko-KR" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", tts: "tr-TR" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦", tts: "uk-UA" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", tts: "hi-IN" },
  { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl ayisyen", flag: "🇭🇹", tts: "ht-HT" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", tts: "vi-VN" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", tts: "id-ID" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", tts: "pl-PL" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", tts: "th-TH" },
];

export const langByCode = (code: LangCode): Language =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

/** Languages with full in-app immersion content (vocab decks + UI strings) */
export const FULL_CONTENT_LANGS: LangCode[] = ["en", "es", "ru", "fr", "de", "pt", "it", "ja", "zh", "ht"];
