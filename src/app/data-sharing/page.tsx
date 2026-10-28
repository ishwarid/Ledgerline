import type { Metadata } from "next";
import { getDataSource } from "@/lib/cdr/source";
import { getRevokedConsentIds } from "@/lib/consent-store";
import { daysUntil, formatLongDate } from "@/lib/format";
import { resetDemo } from "./actions";
import { ConsentCard, type ConsentView } from "./consent-card";

export const metadata: Metadata = { title: "Data sharing" };
export const dynamic = "force-dynamic";

export default async function DataSharingPage() {
  const source = getDataSource();
  const [consents, accounts, revoked] = await Promise.all([
    source.getConsents(),
    source.getAccounts(),
    getRevokedConsentIds(),
  ]);

  const nameOf = new Map(accounts.map((a) => [a.accountId, a.nickname ?? a.displayName]));

  const views: ConsentView[] = consents.map((c) => ({
    consentId: c.consentId,
    dataHolder: c.dataHolder,
    scopes: c.scopes,
    accountNames: c.accountIds.map((id) => nameOf.get(id) ?? id),
    grantedLabel: formatLongDate(c.grantedAt),
    expiresLabel: formatLongDate(c.expiresAt),
    daysLeft: daysUntil(c.expiresAt),
    revoked: revoked.has(c.consentId),
  }));

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Data sharing</h1>
        <p className="text-ink-soft mt-2">
          Under the Consumer Data Right you choose which banks share data with Ledgerline, what they
          share, and for how long. You can stop at any time.
        </p>
      </header>

      <div className="space-y-4">
        {views.map((view) => (
          // Keying on revoked status resets the card's local state after a reset.
          <ConsentCard key={`${view.consentId}-${view.revoked}`} consent={view} />
        ))}
      </div>

      {revoked.size > 0 && (
        <form action={resetDemo} className="text-ink-soft text-sm">
          This is a demo, so nothing was really revoked.{" "}
          <button type="submit" className="text-accent font-medium underline">
            Restore sample data
          </button>
        </form>
      )}
    </div>
  );
}
