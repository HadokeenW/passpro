/**
 * Date formatting and utilities conforming to DESIGN.md specification.
 * Dates are rendered in fr-FR format.
 */

export function formatDate(
  dateInput: string | number | Date,
  timezone: string = "Africa/Algiers"
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

export function formatDateTime(
  dateInput: string | number | Date,
  timezone: string = "Africa/Algiers"
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export function formatTime(
  dateInput: string | number | Date,
  timezone: string = "Africa/Algiers"
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export function formatRelativeTime(
  dateInput: string | number | Date,
  timezone: string = "Africa/Algiers"
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 45) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;

  return formatDate(date, timezone);
}

export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = to.getTime() - from.getTime();
  return Math.max(0, Math.ceil(diff / msPerDay));
}
