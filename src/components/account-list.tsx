import Link from "next/link";
import type { BankingAccount, BankingBalance } from "@/lib/cdr/types";
import { formatAUD, toCents } from "@/lib/money";

export function AccountList({
  accounts,
  balances,
}: {
  accounts: BankingAccount[];
  balances: BankingBalance[];
}) {
  const balanceOf = new Map(balances.map((b) => [b.accountId, b]));

  return (
    <ul className="divide-line divide-y">
      {accounts.map((account) => {
        const balance = balanceOf.get(account.accountId);
        const current = balance ? toCents(balance.currentBalance) : 0;
        const isCard = account.productCategory === "CRED_AND_CHRG_CARDS";

        return (
          <li key={account.accountId}>
            <Link
              href={`/transactions?account=${account.accountId}`}
              className="hover:text-accent flex items-baseline justify-between gap-4 py-3"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {account.nickname ?? account.displayName}
                </span>
                <span className="text-ink-muted block truncate text-sm">
                  {account.dataHolder} ··{account.maskedNumber.slice(-4)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-medium">
                  {isCard ? formatAUD(Math.abs(current)) : formatAUD(current)}
                </span>
                {isCard && balance?.creditLimit && (
                  <span className="text-ink-muted block text-sm">
                    owed of {formatAUD(toCents(balance.creditLimit))}
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
