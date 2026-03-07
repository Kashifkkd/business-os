/**
 * Format a numeric amount as USD currency.
 * Use across the project for price display.
 */
export function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate a string to max length with ellipsis.
 * Returns "—" for null/undefined/empty. Use for descriptions, etc.
 */
export function truncate(
  str: string | null | undefined,
  max: number
): string {
  if (!str) return "—";
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

// ——— Date formatting (central config) ———

const DEFAULT_DATE_LOCALE = "en-US";

type TimeFormatPreference = "12h" | "24h";

/** Options for date/time formatting. Tweak here to change behavior project-wide. */
export const getDateFormat = {
  /** Date only (e.g. Jan 15, 2025) */
  date: (locale = DEFAULT_DATE_LOCALE) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  /** Date + time (e.g. Jan 15, 2025, 2:30 PM). Pass timeFormat to respect 12h/24h setting. */
  datetime: (locale = DEFAULT_DATE_LOCALE, timeFormat?: TimeFormatPreference) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: timeFormat ? timeFormat === "12h" : undefined,
    }),
  /** Time only (e.g. 2:30 PM or 14:30). Pass timeFormat to respect 12h/24h setting. */
  time: (locale = DEFAULT_DATE_LOCALE, timeFormat?: TimeFormatPreference) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: timeFormat ? timeFormat === "12h" : undefined,
    }),
};

/**
 * Format a date string or Date as date only. Use across the project.
 */
export function formatDate(
  value: string | Date | null | undefined,
  locale = DEFAULT_DATE_LOCALE
): string {
  if (value == null) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return getDateFormat.date(locale).format(d);
}

/**
 * Format a date string or Date as time only (e.g. 2:30 PM or 14:30).
 * timeFormat: use "12h" or "24h" to match org settings; omit for locale default.
 */
export function formatTime(
  value: string | Date | null | undefined,
  locale = DEFAULT_DATE_LOCALE,
  timeFormat?: TimeFormatPreference
): string {
  if (value == null) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return getDateFormat.time(locale, timeFormat).format(d);
}

/**
 * Format a date string or Date as date + time (e.g. Mar 3, 2025, 1:10 AM).
 * timeFormat: use "12h" or "24h" to match org settings; omit for locale default.
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale = DEFAULT_DATE_LOCALE,
  timeFormat?: TimeFormatPreference
): string {
  if (value == null) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return getDateFormat.datetime(locale, timeFormat).format(d);
}

/**
 * Format a date string or Date as relative time (e.g. "2 hours ago", "3 days ago").
 */
export function formatTimeAgo(
  value: string | Date | null | undefined,
  locale = DEFAULT_DATE_LOCALE
): string {
  if (value == null) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return getDateFormat.date(locale).format(d);
}
