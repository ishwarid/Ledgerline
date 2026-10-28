import { formatAUD, type Cents } from "@/lib/money";

/**
 * The headline of the dashboard: what you own against what you owe, drawn as
 * a single line split in two. The split makes the ratio obvious in a way two
 * separate numbers don't.
 */
export function NetPosition({ assets, liabilities }: { assets: Cents; liabilities: Cents }) {
  const net = assets - liabilities;
  const total = assets + liabilities;
  const assetShare = total === 0 ? 1 : assets / total;

  return (
    <section aria-labelledby="net-heading">
      <h2 id="net-heading" className="text-ink-soft text-sm">
        Net position
      </h2>
      <p className="mt-1 text-5xl font-semibold tracking-tight sm:text-6xl">{formatAUD(net)}</p>

      <div
        className="mt-6 flex h-3 gap-0.5"
        role="img"
        aria-label={`${Math.round(assetShare * 100)}% of your balances are savings and cash, ${Math.round((1 - assetShare) * 100)}% is money owed`}
      >
        <span className="bg-accent rounded-l-full" style={{ flexGrow: assets || 1 }} />
        {liabilities > 0 && (
          <span
            className="bg-series-out min-w-1 rounded-r-full"
            style={{ flexGrow: liabilities }}
          />
        )}
      </div>

      <dl className="mt-3 flex flex-wrap justify-between gap-x-8 gap-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-ink-soft">Cash and savings</dt>
          <dd className="font-medium">{formatAUD(assets)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-soft">Owed on cards</dt>
          <dd className="font-medium">{formatAUD(liabilities)}</dd>
        </div>
      </dl>
    </section>
  );
}
