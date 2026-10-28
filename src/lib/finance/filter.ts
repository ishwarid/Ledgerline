import { CATEGORIES, type Category } from "./categories";
import type { CategorisedTransaction } from "./insights";

export type TransactionFilters = {
  q?: string;
  account?: string;
  category?: Category;
  direction?: "in" | "out";
  page: number;
};

export const PAGE_SIZE = 25;

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Turns untrusted URL search params into filters. Anything unrecognised is
 * dropped rather than throwing — a stale bookmark should still load a page.
 */
export function parseFilters(params: RawParams): TransactionFilters {
  const q = first(params.q)?.trim().slice(0, 100);
  const account = first(params.account);
  const category = first(params.category);
  const direction = first(params.direction);
  const page = Number.parseInt(first(params.page) ?? "1", 10);

  return {
    q: q || undefined,
    account: account || undefined,
    category: CATEGORIES.includes(category as Category) ? (category as Category) : undefined,
    direction: direction === "in" || direction === "out" ? direction : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function applyFilters(txns: CategorisedTransaction[], filters: TransactionFilters) {
  const needle = filters.q?.toLowerCase();

  return txns.filter((txn) => {
    if (filters.account && txn.accountId !== filters.account) return false;
    if (filters.category && txn.category !== filters.category) return false;
    if (filters.direction === "in" && txn.amountCents <= 0) return false;
    if (filters.direction === "out" && txn.amountCents >= 0) return false;
    if (needle) {
      const haystack =
        `${txn.merchantName ?? ""} ${txn.description} ${txn.reference}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pageCount);
  return {
    items: items.slice((current - 1) * size, current * size),
    page: current,
    pageCount,
  };
}
