/**
 * A subset of the Consumer Data Right (CDR) Banking API payloads.
 *
 * Field names and enum values follow the CDR standards
 * (https://consumerdatastandardsaustralia.github.io/standards/) so a real
 * data holder response can be dropped in without a mapping layer.
 *
 * Note that CDR sends money as decimal *strings* ("-42.50"), not numbers.
 * We keep that shape at the edge and convert to integer cents in lib/money.
 */

export type ProductCategory =
  | "TRANS_AND_SAVINGS_ACCOUNTS"
  | "CRED_AND_CHRG_CARDS"
  | "TERM_DEPOSITS"
  | "PERS_LOANS"
  | "RESIDENTIAL_MORTGAGES";

export type BankingAccount = {
  accountId: string;
  displayName: string;
  nickname?: string;
  maskedNumber: string;
  productCategory: ProductCategory;
  productName: string;
  openStatus: "OPEN" | "CLOSED";
  /** Not in the CDR spec — which bank the account came from. */
  dataHolder: string;
};

export type BankingBalance = {
  accountId: string;
  currentBalance: string;
  availableBalance: string;
  creditLimit?: string;
  currency: "AUD";
};

export type TransactionType =
  | "PAYMENT"
  | "DIRECT_DEBIT"
  | "TRANSFER_INCOMING"
  | "TRANSFER_OUTGOING"
  | "FEE"
  | "INTEREST_PAID"
  | "INTEREST_CHARGED"
  | "OTHER";

export type BankingTransaction = {
  accountId: string;
  transactionId: string;
  isDetailAvailable: boolean;
  type: TransactionType;
  status: "PENDING" | "POSTED";
  description: string;
  /** ISO 8601. Absent while the transaction is pending. */
  postingDateTime?: string;
  executionDateTime: string;
  amount: string;
  currency: "AUD";
  reference: string;
  merchantName?: string;
  merchantCategoryCode?: string;
};

export type ConsentScope =
  | "bank:accounts.basic:read"
  | "bank:accounts.detail:read"
  | "bank:transactions:read"
  | "bank:payees:read"
  | "bank:regular_payments:read";

export type Consent = {
  consentId: string;
  dataHolder: string;
  scopes: ConsentScope[];
  grantedAt: string;
  expiresAt: string;
  accountIds: string[];
};
