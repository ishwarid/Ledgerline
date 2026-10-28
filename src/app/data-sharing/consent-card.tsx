"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { ConsentScope } from "@/lib/cdr/types";
import { stopSharing } from "./actions";

// CDR scopes are written for machines. These are the plain-language versions
// the CDR consumer experience guidelines ask apps to show people.
const SCOPE_LABELS: Record<ConsentScope, string> = {
  "bank:accounts.basic:read": "Account name, type and balance",
  "bank:accounts.detail:read": "Account numbers, interest rates and fees",
  "bank:transactions:read": "Transaction details",
  "bank:payees:read": "Saved payees",
  "bank:regular_payments:read": "Direct debits and scheduled payments",
};

export type ConsentView = {
  consentId: string;
  dataHolder: string;
  scopes: ConsentScope[];
  accountNames: string[];
  grantedLabel: string;
  expiresLabel: string;
  daysLeft: number;
  revoked: boolean;
};

export function ConsentCard({ consent }: { consent: ConsentView }) {
  const [revoked, setOptimisticRevoked] = useOptimistic(consent.revoked);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmStop() {
    setError(null);
    startTransition(async () => {
      setOptimisticRevoked(true);
      const result = await stopSharing(consent.consentId);
      if (!result.ok) setError(result.message);
      setConfirming(false);
    });
  }

  const expiringSoon = !revoked && consent.daysLeft <= 30;

  return (
    <article
      aria-labelledby={`${consent.consentId}-name`}
      className={`bg-surface rounded-lg border p-5 sm:p-6 ${revoked ? "border-line opacity-70" : "border-line-strong"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${consent.consentId}-name`} className="text-lg font-semibold">
            {consent.dataHolder}
          </h2>
          <p className="text-ink-soft mt-0.5 text-sm">{consent.accountNames.join(", ")}</p>
        </div>

        {revoked ? (
          <span className="bg-page text-ink-soft rounded px-2 py-1 text-sm">Not sharing</span>
        ) : expiringSoon ? (
          <span className="bg-warning-bg text-warning-ink rounded px-2 py-1 text-sm">
            Ends in {consent.daysLeft} days
          </span>
        ) : (
          <span className="bg-accent-soft rounded px-2 py-1 text-sm">Sharing</span>
        )}
      </div>

      <h3 className="text-ink-soft mt-5 text-sm">What we can see</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {consent.scopes.map((scope) => (
          <li key={scope} className="flex gap-2">
            <span aria-hidden className="text-ink-muted">
              –
            </span>
            {SCOPE_LABELS[scope]}
          </li>
        ))}
      </ul>

      <p className="text-ink-muted mt-5 text-sm">
        {revoked
          ? "You stopped sharing. We no longer show data from this bank."
          : `Shared since ${consent.grantedLabel}, until ${consent.expiresLabel}.`}
      </p>

      {error && (
        <p role="alert" className="text-negative mt-3 text-sm">
          {error}
        </p>
      )}

      {!revoked && (
        <div className="border-line mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
          {confirming ? (
            <>
              <p className="w-full text-sm">
                Stop sharing {consent.dataHolder} data? Its accounts will disappear from your
                dashboard.
              </p>
              <button
                type="button"
                onClick={confirmStop}
                disabled={isPending}
                className="bg-negative text-surface h-9 rounded-md px-4 text-sm font-medium disabled:opacity-60"
              >
                Stop sharing
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="text-ink-soft hover:text-ink h-9 rounded-md px-3 text-sm font-medium"
              >
                Keep sharing
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="border-line-strong hover:bg-page h-9 rounded-md border px-4 text-sm font-medium"
            >
              Stop sharing…
            </button>
          )}
        </div>
      )}
    </article>
  );
}
