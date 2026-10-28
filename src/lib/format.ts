const TIME_ZONE = "Australia/Sydney";

const shortDate = new Intl.DateTimeFormat("en-AU", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});

const longDate = new Intl.DateTimeFormat("en-AU", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const monthName = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  month: "short",
});

export function formatShortDate(iso: string) {
  return shortDate.format(new Date(iso));
}

export function formatLongDate(iso: string) {
  return longDate.format(new Date(iso));
}

/** "2026-03" → "Mar" */
export function formatMonthKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return monthName.format(new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 15)));
}

export function formatPercent(fraction: number) {
  return `${Math.round(Math.abs(fraction) * 100)}%`;
}

export function daysUntil(iso: string, from = new Date()) {
  return Math.ceil((new Date(iso).getTime() - from.getTime()) / 86_400_000);
}
