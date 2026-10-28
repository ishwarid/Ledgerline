import Link from "next/link";
import type { CategorySpend } from "@/lib/finance/insights";
import { formatAUD } from "@/lib/money";

/*
 * Plain HTML bars rather than a chart library: a ranked list with lengths is
 * all this needs, it renders on the server, and every row is a real link.
 */
export function CategoryBars({ data, limit = 7 }: { data: CategorySpend[]; limit?: number }) {
  const rows = data.slice(0, limit);
  const max = rows[0]?.total ?? 0;

  if (rows.length === 0) {
    return <p className="text-ink-soft text-sm">No spending in this period.</p>;
  }

  return (
    <ul className="space-y-1">
      {rows.map((row) => (
        <li key={row.category}>
          <Link
            href={`/transactions?category=${encodeURIComponent(row.category)}`}
            className="group hover:bg-page grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 sm:grid-cols-[9rem_1fr_auto]"
          >
            <span className="truncate text-sm">{row.category}</span>
            <span className="h-2.5 overflow-hidden rounded-r-sm" aria-hidden>
              <span
                className="bg-series-in block h-full rounded-r-sm"
                style={{ width: `${Math.max(2, (row.total / max) * 100)}%` }}
              />
            </span>
            <span className="text-right text-sm">{formatAUD(row.total)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
