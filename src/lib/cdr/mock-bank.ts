import { fromCents, type Cents } from "@/lib/money";
import { createRandom, type Random } from "@/lib/random";
import type {
  BankingAccount,
  BankingBalance,
  BankingTransaction,
  Consent,
  TransactionType,
} from "./types";

/*
 * A believable six months of banking for one person in Sydney.
 *
 * Every bank and merchant name here is made up. The goal is realistic *shape*:
 * fortnightly pay, monthly rent, a credit card that gets paid off, transfers
 * between own accounts, and lots of small card spend with the right MCC codes.
 */

export const MOCK_ACCOUNTS: BankingAccount[] = [
  {
    accountId: "acc-harbour-everyday",
    displayName: "Everyday Account",
    nickname: "Spending",
    maskedNumber: "xxx-xxx xxxx 4821",
    productCategory: "TRANS_AND_SAVINGS_ACCOUNTS",
    productName: "Harbour Everyday",
    openStatus: "OPEN",
    dataHolder: "Harbour Bank",
  },
  {
    accountId: "acc-harbour-saver",
    displayName: "Goal Saver",
    nickname: "House deposit",
    maskedNumber: "xxx-xxx xxxx 9310",
    productCategory: "TRANS_AND_SAVINGS_ACCOUNTS",
    productName: "Harbour Goal Saver",
    openStatus: "OPEN",
    dataHolder: "Harbour Bank",
  },
  {
    accountId: "acc-wattle-card",
    displayName: "Wattle Low Rate Card",
    maskedNumber: "xxxx xxxx xxxx 2207",
    productCategory: "CRED_AND_CHRG_CARDS",
    productName: "Wattle Low Rate Mastercard",
    openStatus: "OPEN",
    dataHolder: "Wattle Card Services",
  },
];

const EVERYDAY = "acc-harbour-everyday";
const SAVER = "acc-harbour-saver";
const CARD = "acc-wattle-card";

const OPENING_BALANCES: Record<string, Cents> = {
  [EVERYDAY]: 3_150_00,
  [SAVER]: 18_400_00,
  [CARD]: -640_00,
};

const CARD_LIMIT: Cents = 8_000_00;

type Merchant = {
  name: string;
  mcc: string;
  /** Inclusive range in cents. */
  amount: [Cents, Cents];
  /** Expected visits per week. */
  perWeek: number;
};

const CARD_MERCHANTS: Merchant[] = [
  { name: "Fresh Fields Market", mcc: "5411", amount: [45_00, 160_00], perWeek: 1.6 },
  { name: "Corner Grocer Newtown", mcc: "5411", amount: [8_00, 35_00], perWeek: 1.2 },
  { name: "Little Lane Coffee", mcc: "5814", amount: [5_20, 12_80], perWeek: 4 },
  { name: "Banh Mi Bros", mcc: "5814", amount: [12_00, 24_00], perWeek: 1.5 },
  { name: "The Local Bistro", mcc: "5812", amount: [48_00, 140_00], perWeek: 0.6 },
  { name: "Night Owl Thai", mcc: "5812", amount: [28_00, 62_00], perWeek: 0.7 },
  { name: "Metro Transit Top Up", mcc: "4111", amount: [20_00, 50_00], perWeek: 0.8 },
  { name: "RideShare Trip", mcc: "4121", amount: [14_00, 42_00], perWeek: 0.6 },
  { name: "Coastline Fuel", mcc: "5541", amount: [60_00, 95_00], perWeek: 0.3 },
  { name: "Shelf & Co Department Store", mcc: "5311", amount: [25_00, 220_00], perWeek: 0.35 },
  { name: "Threadline Apparel", mcc: "5651", amount: [40_00, 180_00], perWeek: 0.2 },
  { name: "Greenleaf Pharmacy", mcc: "5912", amount: [9_00, 48_00], perWeek: 0.35 },
  { name: "Palace Cinemas", mcc: "7832", amount: [19_00, 46_00], perWeek: 0.25 },
  { name: "Pageturner Books", mcc: "5942", amount: [18_00, 55_00], perWeek: 0.15 },
];

type Draft = {
  accountId: string;
  type: TransactionType;
  description: string;
  amount: Cents;
  date: Date;
  merchant?: Pick<Merchant, "name" | "mcc">;
  reference?: string;
};

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function atTime(date: Date, random: Random) {
  const copy = new Date(date);
  copy.setHours(random.int(7, 21), random.int(0, 59), random.int(0, 59), 0);
  return copy;
}

/** Poisson-ish: how many visits to a merchant happen today. */
function visitsToday(perWeek: number, random: Random) {
  const perDay = perWeek / 7;
  let visits = 0;
  while (random.chance(perDay / (visits + 1))) visits++;
  return visits;
}

function generateDrafts(today: Date, months: number, random: Random): Draft[] {
  const drafts: Draft[] = [];
  const end = startOfDay(today);
  const start = new Date(end.getFullYear(), end.getMonth() - months, 1);

  let cardSpendThisCycle: Cents = 0;
  let payday = addDays(start, 3);

  for (let day = new Date(start); day <= end; day = addDays(day, 1)) {
    const dom = day.getDate();

    if (day.getTime() === payday.getTime()) {
      drafts.push({
        accountId: EVERYDAY,
        type: "TRANSFER_INCOMING",
        description: "SALARY BRIGHTWAVE DIGITAL PTY LTD",
        amount: 4_286_40,
        date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 6, 2),
        reference: "PAYROLL",
      });
      payday = addDays(payday, 14);
    }

    if (dom === 1) {
      drafts.push({
        accountId: EVERYDAY,
        type: "DIRECT_DEBIT",
        description: "RENT - ALDER PROPERTY GROUP",
        amount: -2_640_00,
        date: atTime(day, random),
        reference: "UNIT 4/12 KING ST",
      });
    }

    if (dom === 2) {
      drafts.push({
        accountId: EVERYDAY,
        type: "TRANSFER_OUTGOING",
        description: "TRANSFER TO GOAL SAVER",
        amount: -900_00,
        date: atTime(day, random),
        reference: "House deposit",
      });
      drafts.push({
        accountId: SAVER,
        type: "TRANSFER_INCOMING",
        description: "TRANSFER FROM EVERYDAY",
        amount: 900_00,
        date: atTime(day, random),
        reference: "House deposit",
      });
    }

    if (dom === 8) {
      drafts.push({
        accountId: EVERYDAY,
        type: "DIRECT_DEBIT",
        description: "VOLTA ENERGY",
        amount: -random.int(140_00, 230_00),
        date: atTime(day, random),
        merchant: { name: "Volta Energy", mcc: "4900" },
      });
    }

    if (dom === 12) {
      drafts.push({
        accountId: EVERYDAY,
        type: "DIRECT_DEBIT",
        description: "SKYLINK NBN 100",
        amount: -89_00,
        date: atTime(day, random),
        merchant: { name: "Skylink Internet", mcc: "4814" },
      });
      drafts.push({
        accountId: CARD,
        type: "PAYMENT",
        description: "STREAMBOX SUBSCRIPTION",
        amount: -18_99,
        date: atTime(day, random),
        merchant: { name: "Streambox", mcc: "5815" },
      });
    }

    if (dom === 20) {
      drafts.push({
        accountId: CARD,
        type: "PAYMENT",
        description: "PULSE FITNESS MEMBERSHIP",
        amount: -64_00,
        date: atTime(day, random),
        merchant: { name: "Pulse Fitness", mcc: "7997" },
      });
    }

    // Pay the card off in full on the 25th, like a responsible adult.
    if (dom === 25 && cardSpendThisCycle > 0) {
      const repayment = cardSpendThisCycle;
      drafts.push({
        accountId: EVERYDAY,
        type: "TRANSFER_OUTGOING",
        description: "WATTLE CARD REPAYMENT",
        amount: -repayment,
        date: atTime(day, random),
      });
      drafts.push({
        accountId: CARD,
        type: "TRANSFER_INCOMING",
        description: "PAYMENT RECEIVED - THANK YOU",
        amount: repayment,
        date: atTime(day, random),
      });
      cardSpendThisCycle = 0;
    }

    if (dom === 28) {
      drafts.push({
        accountId: SAVER,
        type: "INTEREST_PAID",
        description: "BONUS INTEREST",
        amount: random.int(68_00, 84_00),
        date: atTime(day, random),
      });
    }

    for (const merchant of CARD_MERCHANTS) {
      for (let i = visitsToday(merchant.perWeek, random); i > 0; i--) {
        const amount = random.int(merchant.amount[0], merchant.amount[1]);
        drafts.push({
          accountId: CARD,
          type: "PAYMENT",
          description: merchant.name.toUpperCase(),
          amount: -amount,
          date: atTime(day, random),
          merchant,
        });
        cardSpendThisCycle += amount;
      }
    }

    if (random.chance(0.06)) {
      drafts.push({
        accountId: EVERYDAY,
        type: "FEE",
        description: "INTERNATIONAL ATM FEE",
        amount: -5_00,
        date: atTime(day, random),
      });
    }
  }

  return drafts;
}

export type MockBank = {
  accounts: BankingAccount[];
  balances: BankingBalance[];
  transactions: BankingTransaction[];
  consents: Consent[];
};

export function createMockBank({
  today = new Date(),
  months = 6,
  seed = 20_250_301,
}: { today?: Date; months?: number; seed?: number } = {}): MockBank {
  const random = createRandom(seed);
  const pendingCutoff = addDays(startOfDay(today), -1);

  // Random times on "today" can land later than right now — drop those.
  const drafts = generateDrafts(today, months, random)
    .filter((draft) => draft.date <= today)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const transactions: BankingTransaction[] = drafts.map((draft, index) => {
    const isPending = draft.date >= pendingCutoff && draft.type === "PAYMENT";
    return {
      accountId: draft.accountId,
      transactionId: `txn-${String(drafts.length - index).padStart(5, "0")}`,
      isDetailAvailable: false,
      type: draft.type,
      status: isPending ? "PENDING" : "POSTED",
      description: draft.description,
      executionDateTime: draft.date.toISOString(),
      postingDateTime: isPending ? undefined : draft.date.toISOString(),
      amount: fromCents(draft.amount),
      currency: "AUD",
      reference: draft.reference ?? "",
      merchantName: draft.merchant?.name,
      merchantCategoryCode: draft.merchant?.mcc,
    };
  });

  const totals = new Map<string, Cents>(Object.entries(OPENING_BALANCES));
  for (const draft of drafts) {
    totals.set(draft.accountId, (totals.get(draft.accountId) ?? 0) + draft.amount);
  }

  const balances: BankingBalance[] = MOCK_ACCOUNTS.map(({ accountId }) => {
    const current = totals.get(accountId) ?? 0;
    const isCard = accountId === CARD;
    return {
      accountId,
      currentBalance: fromCents(current),
      availableBalance: fromCents(isCard ? CARD_LIMIT + current : current),
      creditLimit: isCard ? fromCents(CARD_LIMIT) : undefined,
      currency: "AUD",
    };
  });

  const consents: Consent[] = [
    {
      consentId: "cns-harbour-01",
      dataHolder: "Harbour Bank",
      scopes: ["bank:accounts.basic:read", "bank:accounts.detail:read", "bank:transactions:read"],
      grantedAt: addDays(today, -190).toISOString(),
      expiresAt: addDays(today, 175).toISOString(),
      accountIds: [EVERYDAY, SAVER],
    },
    {
      consentId: "cns-wattle-01",
      dataHolder: "Wattle Card Services",
      scopes: ["bank:accounts.basic:read", "bank:transactions:read"],
      grantedAt: addDays(today, -340).toISOString(),
      expiresAt: addDays(today, 25).toISOString(),
      accountIds: [CARD],
    },
  ];

  return { accounts: MOCK_ACCOUNTS, balances, transactions, consents };
}
