import type { BankingBalance, BankingTransaction, ProductCategory } from "@/lib/cdr/types";
import { toCents, type Cents } from "@/lib/money";
import { categorise, NON_SPENDING, type Category } from "./categories";

export type CategorisedTransaction = BankingTransaction & {
  category: Category;
  amountCents: Cents;
};

export function enrich(transactions: BankingTransaction[]): CategorisedTransaction[] {
  return transactions.map((txn) => ({
    ...txn,
    category: categorise(txn),
    amountCents: toCents(txn.amount),
  }));
}

/** "2026-03" — sortable, and stable across time zones once we pick one. */
export function monthKey(iso: string, timeZone = "Australia/Sydney") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export type MonthlyCashflow = {
  month: string;
  moneyIn: Cents;
  moneyOut: Cents;
  net: Cents;
};

export function monthlyCashflow(transactions: CategorisedTransaction[]): MonthlyCashflow[] {
  const byMonth = new Map<string, MonthlyCashflow>();

  for (const txn of transactions) {
    if (txn.category === "Transfers") continue;

    const month = monthKey(txn.executionDateTime);
    const entry = byMonth.get(month) ?? { month, moneyIn: 0, moneyOut: 0, net: 0 };

    if (txn.amountCents >= 0) entry.moneyIn += txn.amountCents;
    else entry.moneyOut += -txn.amountCents;
    entry.net = entry.moneyIn - entry.moneyOut;

    byMonth.set(month, entry);
  }

  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export type CategorySpend = { category: Category; total: Cents; count: number };

export function spendingByCategory(transactions: CategorisedTransaction[]): CategorySpend[] {
  const totals = new Map<Category, CategorySpend>();

  for (const txn of transactions) {
    if (NON_SPENDING.has(txn.category) || txn.amountCents >= 0) continue;

    const entry = totals.get(txn.category) ?? { category: txn.category, total: 0, count: 0 };
    entry.total += -txn.amountCents;
    entry.count += 1;
    totals.set(txn.category, entry);
  }

  return [...totals.values()].sort((a, b) => b.total - a.total);
}

const LIABILITY_PRODUCTS: ReadonlySet<ProductCategory> = new Set([
  "CRED_AND_CHRG_CARDS",
  "PERS_LOANS",
  "RESIDENTIAL_MORTGAGES",
]);

export function netPosition(
  balances: BankingBalance[],
  productOf: (accountId: string) => ProductCategory | undefined,
) {
  let assets: Cents = 0;
  let liabilities: Cents = 0;

  for (const balance of balances) {
    const current = toCents(balance.currentBalance);
    const product = productOf(balance.accountId);

    // A card balance of -640.00 is money owed, not negative savings.
    if (product && LIABILITY_PRODUCTS.has(product)) liabilities += Math.max(0, -current);
    else assets += current;
  }

  return { assets, liabilities, net: assets - liabilities };
}

/** Change between the last two complete months, as a fraction. null if unknown. */
export function monthOverMonth(values: Cents[]): number | null {
  if (values.length < 2) return null;
  const previous = values.at(-2)!;
  const current = values.at(-1)!;
  if (previous === 0) return null;
  return (current - previous) / previous;
}
