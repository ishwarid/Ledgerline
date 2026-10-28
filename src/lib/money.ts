/**
 * Money is stored as integer cents everywhere inside the app.
 * Floats are fine for display but drift when you sum hundreds of them
 * (0.1 + 0.2 !== 0.3), so we only format at the very end.
 */
export type Cents = number;

const AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/;

export function toCents(amount: string): Cents {
  const trimmed = amount.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new Error(`Invalid CDR amount: "${amount}"`);
  }

  const negative = trimmed.startsWith("-");
  const [dollars = "0", fraction = ""] = trimmed.replace("-", "").split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));

  return negative ? -cents : cents;
}

export function fromCents(cents: Cents): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const audFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const audCompactFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatAUD(cents: Cents, options: { compact?: boolean; signed?: boolean } = {}) {
  const formatter = options.compact ? audCompactFormatter : audFormatter;
  const formatted = formatter.format(cents / 100);
  if (options.signed && cents > 0) return `+${formatted}`;
  return formatted;
}
