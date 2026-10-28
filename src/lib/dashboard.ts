import "server-only";

import { getDataSource } from "@/lib/cdr/source";
import { getRevokedConsentIds } from "@/lib/consent-store";
import { enrich } from "@/lib/finance/insights";

/**
 * Loads everything the pages need, already limited to accounts the user is
 * still sharing. Pages shouldn't have to remember to check consent — if a
 * consent is revoked, that bank's data simply isn't here.
 */
export async function loadBankingData() {
  const source = getDataSource();
  const [accounts, balances, transactions, consents, revoked] = await Promise.all([
    source.getAccounts(),
    source.getBalances(),
    source.getTransactions(),
    source.getConsents(),
    getRevokedConsentIds(),
  ]);

  const activeConsents = consents.filter((c) => !revoked.has(c.consentId));
  const sharedAccountIds = new Set(activeConsents.flatMap((c) => c.accountIds));

  const visibleAccounts = accounts.filter((a) => sharedAccountIds.has(a.accountId));

  return {
    accounts: visibleAccounts,
    balances: balances.filter((b) => sharedAccountIds.has(b.accountId)),
    transactions: enrich(transactions.filter((t) => sharedAccountIds.has(t.accountId))),
    consents,
    revoked,
    accountById: new Map(visibleAccounts.map((a) => [a.accountId, a])),
  };
}

export type BankingData = Awaited<ReturnType<typeof loadBankingData>>;
