import type { Locale, LocalizedText } from "./types";

export function formatEGP(amount: number, locale: Locale = "en"): string {
  const n = amount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
  return locale === "ar" ? `${n} ج.م` : `${n} EGP`;
}

export function lt(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}

export function formatDate(iso: string, locale: Locale = "en"): string {
  return new Date(iso).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );
}
