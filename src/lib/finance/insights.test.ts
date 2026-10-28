import { describe, expect, it } from "vitest";
import type { BankingTransaction } from "@/lib/cdr/types";
import { createMockBank } from "@/lib/cdr/mock-bank";
import { categorise } from "./categories";
import {
  enrich,
  monthKey,
  monthlyCashflow,
  monthOverMonth,
  netPosition,
  spendingByCategory,
} from "./insights";

function txn(overrides: Partial<BankingTransaction>): BankingTransaction {
  return {
    accountId: "acc-1",
    transactionId: "t-1",
    isDetailAvailable: false,
    type: "PAYMENT",
    status: "POSTED",
    description: "SOMETHING",
    executionDateTime: "2026-03-10T02:00:00.000Z",
    amount: "-10.00",
    currency: "AUD",
    reference: "",
    ...overrides,
  };
}

describe("categorise", () => {
  it("uses the merchant category code", () => {
    expect(categorise(txn({ merchantCategoryCode: "5411" }))).toBe("Groceries");
    expect(categorise(txn({ merchantCategoryCode: "5814" }))).toBe("Eating out");
  });

  it("recognises rent and salary from the description", () => {
    expect(categorise(txn({ description: "RENT - ALDER PROPERTY", type: "DIRECT_DEBIT" }))).toBe(
      "Housing",
    );
    expect(categorise(txn({ description: "SALARY ACME", type: "TRANSFER_INCOMING" }))).toBe(
      "Income",
    );
  });

  it("treats card repayments as transfers even though they look like payments", () => {
    expect(
      categorise(txn({ description: "WATTLE CARD REPAYMENT", type: "TRANSFER_OUTGOING" })),
    ).toBe("Transfers");
  });

  it("falls back to Other", () => {
    expect(categorise(txn({ merchantCategoryCode: "9999" }))).toBe("Other");
  });
});

describe("monthKey", () => {
  it("buckets by Sydney time, not UTC", () => {
    // 1 April 00:30 in Sydney is still 31 March in UTC.
    expect(monthKey("2026-03-31T13:30:00.000Z")).toBe("2026-04");
  });
});

describe("spendingByCategory", () => {
  it("ignores income and transfers, and sorts biggest first", () => {
    const result = spendingByCategory(
      enrich([
        txn({ merchantCategoryCode: "5411", amount: "-50.00" }),
        txn({ merchantCategoryCode: "5411", amount: "-25.00" }),
        txn({ merchantCategoryCode: "5814", amount: "-90.00" }),
        txn({ description: "SALARY", type: "TRANSFER_INCOMING", amount: "4000.00" }),
        txn({ description: "WATTLE CARD REPAYMENT", amount: "-500.00" }),
      ]),
    );

    expect(result).toEqual([
      { category: "Eating out", total: 9000, count: 1 },
      { category: "Groceries", total: 7500, count: 2 },
    ]);
  });
});

describe("monthlyCashflow", () => {
  it("adds up money in and out per month, skipping transfers", () => {
    const result = monthlyCashflow(
      enrich([
        txn({ executionDateTime: "2026-02-10T00:00:00Z", amount: "-100.00" }),
        txn({ executionDateTime: "2026-03-10T00:00:00Z", amount: "-40.00" }),
        txn({
          executionDateTime: "2026-03-11T00:00:00Z",
          amount: "1000.00",
          type: "TRANSFER_INCOMING",
          description: "SALARY",
        }),
        txn({
          executionDateTime: "2026-03-12T00:00:00Z",
          amount: "-900.00",
          description: "TRANSFER TO GOAL SAVER",
        }),
      ]),
    );

    expect(result).toEqual([
      { month: "2026-02", moneyIn: 0, moneyOut: 10000, net: -10000 },
      { month: "2026-03", moneyIn: 100000, moneyOut: 4000, net: 96000 },
    ]);
  });
});

describe("netPosition", () => {
  it("counts card debt as a liability", () => {
    const result = netPosition(
      [
        { accountId: "a", currentBalance: "1000.00", availableBalance: "1000.00", currency: "AUD" },
        { accountId: "c", currentBalance: "-250.00", availableBalance: "7750.00", currency: "AUD" },
      ],
      (id) => (id === "c" ? "CRED_AND_CHRG_CARDS" : "TRANS_AND_SAVINGS_ACCOUNTS"),
    );
    expect(result).toEqual({ assets: 100000, liabilities: 25000, net: 75000 });
  });
});

describe("monthOverMonth", () => {
  it("returns the relative change", () => {
    expect(monthOverMonth([100, 200, 150])).toBe(-0.25);
  });

  it("returns null when it can't say", () => {
    expect(monthOverMonth([100])).toBeNull();
    expect(monthOverMonth([0, 100])).toBeNull();
  });
});

describe("mock bank", () => {
  const today = new Date("2026-10-12T04:00:00Z");

  it("is deterministic for the same seed and date", () => {
    expect(createMockBank({ today })).toEqual(createMockBank({ today }));
  });

  it("never produces transactions in the future", () => {
    const { transactions } = createMockBank({ today });
    expect(transactions.every((t) => new Date(t.executionDateTime) <= today)).toBe(true);
  });

  it("only produces valid CDR amounts", () => {
    const { transactions } = createMockBank({ today });
    expect(() => enrich(transactions)).not.toThrow();
  });

  it("balances own-account transfers to zero", () => {
    const { transactions } = createMockBank({ today });
    const transfers = enrich(transactions).filter((t) => t.category === "Transfers");
    const sum = transfers.reduce((total, t) => total + t.amountCents, 0);
    expect(sum).toBe(0);
  });
});
