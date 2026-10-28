import type { CategorisedTransaction } from "@/lib/finance/insights";
import { formatShortDate } from "@/lib/format";
import { formatAUD } from "@/lib/money";

export function TransactionAmount({ cents }: { cents: number }) {
  return (
    <span className={`whitespace-nowrap ${cents > 0 ? "text-positive" : ""}`}>
      {formatAUD(cents, { signed: true })}
    </span>
  );
}

export function PendingBadge() {
  return (
    <span className="bg-warning-bg text-warning-ink rounded px-1.5 py-0.5 text-xs">Pending</span>
  );
}

/** Compact row used in the overview's recent activity list. */
export function TransactionRow({ txn }: { txn: CategorisedTransaction }) {
  return (
    <li className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate">{txn.merchantName ?? txn.description}</span>
          {txn.status === "PENDING" && <PendingBadge />}
        </span>
        <span className="text-ink-muted block text-sm">
          {formatShortDate(txn.executionDateTime)}, {txn.category}
        </span>
      </span>
      <TransactionAmount cents={txn.amountCents} />
    </li>
  );
}
