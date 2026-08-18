import { franc } from 'franc-min';

// Maps common browser locale prefixes (ISO 639-1) to the ISO 639-3 codes franc uses.
const ISO_639_1_TO_3: Record<string, string> = {
  pt: 'por',
  en: 'eng',
  es: 'spa',
  fr: 'fra',
  de: 'deu',
  it: 'ita',
  nl: 'nld',
  ja: 'jpn',
  zh: 'cmn',
  ko: 'kor',
  ru: 'rus',
  ar: 'arb',
};

/** Reads the browser's language (no permission prompt needed) and maps it to an ISO 639-3 code. */
export function getUserLanguageCode(): string {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'pt-BR';
  const prefix = locale.slice(0, 2).toLowerCase();
  return ISO_639_1_TO_3[prefix] ?? 'por';
}

/** English is always allowed alongside the user's detected language, since most Spoonacular content is in English. */
export function getAllowedLanguages(): Set<string> {
  return new Set([getUserLanguageCode(), 'eng']);
}

/**
 * Returns true when `text` is written in one of `allowed` languages, or when there
 * isn't enough text to detect reliably (short titles like "Pizza" shouldn't be punished).
 */
export function isAllowedLanguage(text: string, allowed: Set<string>): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 20) return true;
  const code = franc(trimmed);
  if (code === 'und') return true;
  return allowed.has(code);
}
