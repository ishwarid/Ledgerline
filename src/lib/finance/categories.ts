import type { BankingTransaction } from "@/lib/cdr/types";

export const CATEGORIES = [
  "Income",
  "Housing",
  "Groceries",
  "Eating out",
  "Transport",
  "Bills & utilities",
  "Shopping",
  "Health & fitness",
  "Entertainment",
  "Fees",
  "Transfers",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Categories that move money between your own accounts. They are real
 * transactions, but counting them as spending would double count — paying
 * off a credit card isn't spending, the card purchases already were.
 */
export const NON_SPENDING: ReadonlySet<Category> = new Set(["Income", "Transfers"]);

// Merchant category codes (ISO 18245). Only the ones we actually see.
const MCC_CATEGORIES: Record<string, Category> = {
  "5411": "Groceries",
  "5499": "Groceries",
  "5812": "Eating out",
  "5813": "Eating out",
  "5814": "Eating out",
  "4111": "Transport",
  "4121": "Transport",
  "5541": "Transport",
  "5542": "Transport",
  "4814": "Bills & utilities",
  "4900": "Bills & utilities",
  "5311": "Shopping",
  "5651": "Shopping",
  "5942": "Shopping",
  "5912": "Health & fitness",
  "8011": "Health & fitness",
  "7997": "Health & fitness",
  "5815": "Entertainment",
  "7832": "Entertainment",
};

const DESCRIPTION_RULES: Array<[RegExp, Category]> = [
  [/\b(rent|mortgage|strata)\b/i, "Housing"],
  [/\bsalary\b|\bpayroll\b/i, "Income"],
  [/\brepayment\b|payment received|\btransfer (to|from)\b/i, "Transfers"],
];

export function categorise(txn: BankingTransaction): Category {
  // Order matters: an own-account transfer should never fall through to an
  // MCC match, and fees/interest are identified by type, not merchant.
  for (const [pattern, category] of DESCRIPTION_RULES) {
    if (pattern.test(txn.description)) return category;
  }

  if (txn.type === "FEE" || txn.type === "INTEREST_CHARGED") return "Fees";
  if (txn.type === "INTEREST_PAID") return "Income";

  const fromMcc = txn.merchantCategoryCode && MCC_CATEGORIES[txn.merchantCategoryCode];
  if (fromMcc) return fromMcc;

  if (txn.type === "TRANSFER_INCOMING") return "Income";
  return "Other";
}
