import Link from "next/link";
import { AccountList } from "@/components/account-list";
import { CashflowChart, type CashflowPoint } from "@/components/charts/cashflow-chart";
import { CategoryBars } from "@/components/charts/category-bars";
import { NetPosition } from "@/components/net-position";
import { TransactionRow } from "@/components/transaction-row";
import { loadBankingData } from "@/lib/dashboard";
import { monthKey, monthlyCashflow, netPosition, spendingByCategory } from "@/lib/finance/insights";
import { formatLongDate, formatMonthKey, formatPercent } from "@/lib/format";
import { formatAUD } from "@/lib/money";

// Balances change constantly, so never serve a cached copy of this page.
export const dynamic = "force-dynamic";

const SPENDING_WINDOW_DAYS = 90;

export default async function OverviewPage() {
  const { accounts, balances, transactions, accountById } = await loadBankingData();

  if (accounts.length === 0) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">Nothing shared yet</h1>
        <p className="text-ink-soft mt-2">
          You&apos;ve stopped sharing data from every bank, so there&apos;s nothing to show.
        </p>
        <Link href="/data-sharing" className="text-accent mt-4 inline-block font-medium underline">
          Manage data sharing
        </Link>
      </div>
    );
  }

  const now = new Date();
  const { assets, liabilities } = netPosition(
    balances,
    (id) => accountById.get(id)?.productCategory,
  );

  const thisMonth = monthKey(now.toISOString());
  const cashflow = monthlyCashflow(transactions);
  const chartData: CashflowPoint[] = cashflow.map((m) => ({
    label: m.month === thisMonth ? `${formatMonthKey(m.month)} (so far)` : formatMonthKey(m.month),
    moneyIn: m.moneyIn,
    moneyOut: m.moneyOut,
    partial: m.month === thisMonth,
  }));

  // Compare the last two *complete* months; the current one is always partial.
  const complete = cashflow.filter((m) => m.month !== thisMonth);
  const lastMonth = complete.at(-1);
  const monthBefore = complete.at(-2);
  const spendChange =
    lastMonth && monthBefore && monthBefore.moneyOut > 0
      ? (lastMonth.moneyOut - monthBefore.moneyOut) / monthBefore.moneyOut
      : null;

  const since = new Date(now.getTime() - SPENDING_WINDOW_DAYS * 86_400_000);
  const recentSpending = spendingByCategory(
    transactions.filter((t) => new Date(t.executionDateTime) >= since),
  );

  return (
    <div className="space-y-14">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Balances as of {formatLongDate(now.toISOString())}
        </p>
      </header>

      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[3fr_2fr]">
        <NetPosition assets={assets} liabilities={liabilities} />

        <section aria-labelledby="accounts-heading">
          <h2 id="accounts-heading" className="text-ink-soft text-sm">
            Accounts
          </h2>
          <AccountList accounts={accounts} balances={balances} />
        </section>
      </div>

      <section aria-labelledby="cashflow-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cashflow-heading" className="text-lg font-semibold">
            Money in and out
          </h2>
          {lastMonth && spendChange !== null && (
            <p className="text-ink-soft text-sm">
              You spent{" "}
              <strong className="text-ink font-medium">{formatAUD(lastMonth.moneyOut)}</strong> in{" "}
              {formatMonthKey(lastMonth.month)}, {formatPercent(spendChange)}{" "}
              {spendChange > 0 ? "more" : "less"} than {formatMonthKey(monthBefore!.month)}.
            </p>
          )}
        </div>
        <p className="text-ink-muted mt-1 text-sm">
          Transfers between your own accounts and card repayments aren&apos;t counted.
        </p>
        <div className="mt-5">
          <CashflowChart data={chartData} />
        </div>
      </section>

      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
        <section aria-labelledby="spending-heading">
          <h2 id="spending-heading" className="text-lg font-semibold">
            Where it went
          </h2>
          <p className="text-ink-muted mt-1 mb-4 text-sm">Last {SPENDING_WINDOW_DAYS} days</p>
          <CategoryBars data={recentSpending} />
        </section>

        <section aria-labelledby="recent-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-heading" className="text-lg font-semibold">
              Recent activity
            </h2>
            <Link href="/transactions" className="text-accent text-sm font-medium hover:underline">
              All transactions
            </Link>
          </div>
          <ul className="divide-line mt-3 divide-y">
            {transactions.slice(0, 7).map((txn) => (
              <TransactionRow key={txn.transactionId} txn={txn} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
