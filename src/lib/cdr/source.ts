import "server-only";

import { cache } from "react";
import { createMockBank } from "./mock-bank";
import type { BankingAccount, BankingBalance, BankingTransaction, Consent } from "./types";

/**
 * Everything the UI needs from a bank, and nothing more.
 *
 * Pages talk to this interface, never to a provider directly. To connect a real
 * CDR intermediary (Basiq, Frollo, etc.), write a second implementation that
 * calls their API and maps the response into these types, then pick it in
 * getDataSource() based on DATA_SOURCE.
 */
export interface BankingDataSource {
  getAccounts(): Promise<BankingAccount[]>;
  getBalances(): Promise<BankingBalance[]>;
  getTransactions(filter?: { accountId?: string }): Promise<BankingTransaction[]>;
  getConsents(): Promise<Consent[]>;
}

// One snapshot per request. React's cache() dedupes it across every server
// component that asks for data while rendering the same page. It has to live
// at module level — cache() keys on the function, so a new one per call
// would never hit.
const snapshot = cache(() => createMockBank({ today: new Date() }));

function createMockSource(): BankingDataSource {
  return {
    async getAccounts() {
      return snapshot().accounts;
    },
    async getBalances() {
      return snapshot().balances;
    },
    async getTransactions(filter = {}) {
      const all = snapshot().transactions;
      return filter.accountId ? all.filter((t) => t.accountId === filter.accountId) : all;
    },
    async getConsents() {
      return snapshot().consents;
    },
  };
}

export function getDataSource(): BankingDataSource {
  const kind = process.env.DATA_SOURCE ?? "mock";
  switch (kind) {
    case "mock":
      return createMockSource();
    default:
      throw new Error(`Unknown DATA_SOURCE "${kind}". Only "mock" is implemented.`);
  }
}
