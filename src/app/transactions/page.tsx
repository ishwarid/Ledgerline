import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TransactionFilters } from "@/components/transaction-filters";
import { PendingBadge, TransactionAmount } from "@/components/transaction-row";
import { loadBankingData } from "@/lib/dashboard";
import { applyFilters, paginate, parseFilters } from "@/lib/finance/filter";
import { formatShortDate } from "@/lib/format";
import { formatAUD } from "@/lib/money";

export const metadata: Metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: Props) {
  const rawParams = await searchParams;
  const filters = parseFilters(rawParams);
  const { accounts, transactions, accountById } = await loadBankingData();

  const matching = applyFilters(transactions, filters);
  const { items, page, pageCount } = paginate(matching, filters.page);

  const totalIn = matching.reduce((sum, t) => (t.amountCents > 0 ? sum + t.amountCents : sum), 0);
  const totalOut = matching.reduce((sum, t) => (t.amountCents < 0 ? sum - t.amountCents : sum), 0);

  const accountOptions = accounts.map((a) => ({
    id: a.accountId,
    label: a.nickname ?? a.displayName,
  }));

  function pageHref(target: number) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(rawParams)) {
      if (typeof value === "string" && key !== "page") next.set(key, value);
    }
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/transactions?${query}` : "/transactions";
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Last six months across {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </p>
      </header>

      {/* useSearchParams() needs a Suspense boundary to avoid opting the whole page out of streaming. */}
      <Suspense>
        <TransactionFilters accounts={accountOptions} />
      </Suspense>

      <p className="text-ink-soft text-sm" aria-live="polite">
        {matching.length} {matching.length === 1 ? "transaction" : "transactions"},{" "}
        <span className="text-positive">{formatAUD(totalIn)} in</span> and{" "}
        <span>{formatAUD(totalOut)} out</span>
      </p>

      {items.length === 0 ? (
        <div className="border-line-strong rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No transactions match these filters</p>
          <p className="text-ink-soft mt-1 text-sm">Try a shorter search or clear a filter.</p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-line-strong text-ink-soft border-b text-left">
                <th scope="col" className="py-2 pr-4 font-normal">
                  Date
                </th>
                <th scope="col" className="py-2 pr-4 font-normal">
                  Description
                </th>
                <th scope="col" className="py-2 pr-4 font-normal">
                  Category
                </th>
                <th scope="col" className="py-2 pr-4 font-normal">
                  Account
                </th>
                <th scope="col" className="py-2 text-right font-normal">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {items.map((txn) => {
                const account = accountById.get(txn.accountId);
                return (
                  <tr key={txn.transactionId}>
                    <td className="text-ink-soft py-2.5 pr-4 whitespace-nowrap">
                      {formatShortDate(txn.executionDateTime)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2">
                        {txn.merchantName ?? txn.description}
                        {txn.status === "PENDING" && <PendingBadge />}
                      </span>
                      {txn.reference && (
                        <span className="text-ink-muted block">{txn.reference}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/transactions?category=${encodeURIComponent(txn.category)}`}
                        className="text-ink-soft hover:text-accent hover:underline"
                      >
                        {txn.category}
                      </Link>
                    </td>
                    <td className="text-ink-soft py-2.5 pr-4 whitespace-nowrap">
                      {account?.nickname ?? account?.displayName}
                    </td>
                    <td className="py-2.5 text-right">
                      <TransactionAmount cents={txn.amountCents} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-accent font-medium hover:underline">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-soft">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="text-accent font-medium hover:underline">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
