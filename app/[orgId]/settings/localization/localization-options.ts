/** Common IANA timezones for organization settings. */
export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern (America/New_York)" },
  { value: "America/Chicago", label: "Central (America/Chicago)" },
  { value: "America/Denver", label: "Mountain (America/Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (America/Los_Angeles)" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
] as const;

/** Date format options (value = format token for date-fns/Intl; label = human preview). */
export const DATE_FORMAT_OPTIONS = [
  // Numeric
  { value: "MM/dd/yyyy", label: "12/24/2024 (MM/DD/YYYY)" },
  { value: "dd/MM/yyyy", label: "24/12/2024 (DD/MM/YYYY)" },
  { value: "yyyy-MM-dd", label: "2024-12-24 (YYYY-MM-DD)" },
  { value: "dd.MM.yyyy", label: "24.12.2024 (DD.MM.YYYY)" },
  { value: "MM/dd/yy", label: "12/24/24 (MM/DD/YY)" },
  { value: "dd/MM/yy", label: "24/12/24 (DD/MM/YY)" },
  { value: "yy-MM-dd", label: "24-12-24 (YY-MM-DD)" },
  { value: "d/M/yyyy", label: "24/12/2024 (D/M/YYYY)" },
  { value: "M/d/yyyy", label: "12/24/2024 (M/D/YYYY)" },
  // Short month + day/year
  { value: "MMM d, yyyy", label: "Dec 24, 2024" },
  { value: "MMM d yyyy", label: "Dec 24 2024" },
  { value: "d MMM yyyy", label: "24 Dec 2024" },
  { value: "d MMM yy", label: "24 Dec 24" },
  { value: "MMM d yy", label: "Dec 24 24" },
  // With weekday (short)
  { value: "EEE, MMM d, yyyy", label: "Mon, Dec 24, 2024" },
  { value: "EEE MMM d yyyy", label: "Mon Dec 24 2024" },
  { value: "EEE d MMM", label: "Mon 24 Dec" },
  { value: "EEE d MMM yyyy", label: "Mon 24 Dec 2024" },
  { value: "EEE MMM d", label: "Mon Dec 24" },
  // Long month
  { value: "MMMM d, yyyy", label: "December 24, 2024" },
  { value: "MMMM d yyyy", label: "December 24 2024" },
  { value: "d MMMM yyyy", label: "24 December 2024" },
  { value: "MMM yyyy", label: "Dec 2024 (month & year)" },
  { value: "MMMM yyyy", label: "December 2024" },
  { value: "yyyy MMM", label: "2024 Dec" },
  { value: "yyyy MMMM", label: "2024 December" },
  // Full weekday
  { value: "EEEE, MMMM d, yyyy", label: "Monday, December 24, 2024" },
  { value: "EEEE MMM d yyyy", label: "Monday Dec 24 2024" },
  { value: "EEEE, MMM d", label: "Monday, Dec 24" },
  // Day only / compact
  { value: "d MMM", label: "24 Dec (no year)" },
  { value: "MMM d", label: "Dec 24" },
] as const;

export const TIME_FORMAT_OPTIONS = [
  { value: "12h", label: "12-hour" },
  { value: "24h", label: "24-hour" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "USD", symbol: "$", label: "USD ($)" },
  { value: "EUR", symbol: "€", label: "EUR (€)" },
  { value: "GBP", symbol: "£", label: "GBP (£)" },
  { value: "INR", symbol: "₹", label: "INR (₹)" },
  { value: "AUD", symbol: "A$", label: "AUD (A$)" },
  { value: "CAD", symbol: "C$", label: "CAD (C$)" },
  { value: "JPY", symbol: "¥", label: "JPY (¥)" },
] as const;

export const NUMBER_FORMAT_OPTIONS = [
  { value: "1,234.56", label: "1,234.56" },
  { value: "1.234,56", label: "1.234,56" },
  { value: "1 234,56", label: "1 234,56" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "ja", label: "Japanese" },
] as const;

export const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "IN", label: "India" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
  { value: "JP", label: "Japan" },
] as const;

export const LOCALE_OPTIONS = [
  { value: "en-US", label: "en-US" },
  { value: "en-GB", label: "en-GB" },
  { value: "de-DE", label: "de-DE" },
  { value: "fr-FR", label: "fr-FR" },
  { value: "hi-IN", label: "hi-IN" },
  { value: "ja-JP", label: "ja-JP" },
] as const;
