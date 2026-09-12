/**
 * Date formatting and utilities conforming to DESIGN.md specification.
 * Dates are rendered in fr-FR format.
 */

function getCurrentLocale(): "fr" | "en" | "ar" {
  if (typeof window !== "undefined") {
    const saved =
      (localStorage.getItem("passpro_lang") as "fr" | "en" | "ar") ||
      (localStorage.getItem("passpro_language") as "fr" | "en" | "ar");
    if (saved === "en" || saved === "ar" || saved === "fr") return saved;
  }
  return "fr";
}

export function toLatinDigits(str: string): string {
  if (!str) return str;
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

function getIntlLocale(locale?: string): string {
  const l = locale || getCurrentLocale();
  if (l === "en") return "en-US";
  if (l === "ar") return "ar-DZ-u-nu-latn";
  return "fr-FR";
}

export function formatDate(
  dateInput: string | number | Date,
  timezone: string = "Africa/Algiers",
  locale?: string
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return toLatinDigits(
    new Intl.DateTimeFormat(getIntlLocale(locale), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: timezone,
    }).format(date)
  );
}

export function formatDateTime(
  dateInput: string | number | Date,
  timezone: string = "Africa/Algiers",
  locale?: string
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return toLatinDigits(
    new Intl.DateTimeFormat(getIntlLocale(locale), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(date)
  );
}

export function formatTime(
  dateInput: string | number | Date,
  timezone: string = "Africa/Algiers",
  locale?: string
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return toLatinDigits(
    new Intl.DateTimeFormat(getIntlLocale(locale), {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(date)
  );
}

export function formatRelativeTime(
  dateInput: string | number | Date,
  timezone: string = "Africa/Algiers",
  locale?: string
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  const lang = locale || getCurrentLocale();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 45) {
    if (lang === "ar") return "الآن";
    if (lang === "en") return "just now";
    return "à l'instant";
  }
  if (diffMin < 60) {
    if (lang === "ar") return `منذ ${diffMin} د`;
    if (lang === "en") return `${diffMin}m ago`;
    return `il y a ${diffMin} min`;
  }
  if (diffHours < 24) {
    if (lang === "ar") return `منذ ${diffHours} س`;
    if (lang === "en") return `${diffHours}h ago`;
    return `il y a ${diffHours} h`;
  }

  return formatDate(date, timezone, lang);
}

export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = to.getTime() - from.getTime();
  return Math.max(0, Math.ceil(diff / msPerDay));
}

