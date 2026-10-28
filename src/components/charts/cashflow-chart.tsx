"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatAUD } from "@/lib/money";

export type CashflowPoint = {
  label: string;
  moneyIn: number;
  moneyOut: number;
  partial: boolean;
};

const SERIES = [
  { key: "moneyIn", name: "Money in", color: "var(--series-in)" },
  { key: "moneyOut", name: "Money out", color: "var(--series-out)" },
] as const;

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <figure>
      <ul className="text-ink-soft mb-3 flex gap-5 text-sm" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            {s.name}
          </li>
        ))}
      </ul>

      <div className="h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ left: 0, right: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--line-strong)" }}
              tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
              tickFormatter={(cents: number) => formatAUD(cents, { compact: true })}
            />
            <Tooltip cursor={{ fill: "var(--line)", opacity: 0.5 }} content={CashflowTooltip} />
            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Screen readers get the numbers as a table instead of an SVG. */}
      <table className="sr-only">
        <caption>Money in and out by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Money in</th>
            <th scope="col">Money out</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{formatAUD(row.moneyIn)}</td>
              <td>{formatAUD(row.moneyOut)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function CashflowTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as CashflowPoint | undefined;
  const net = point ? point.moneyIn - point.moneyOut : 0;

  return (
    <div className="border-line bg-surface rounded-md border px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey as string} className="text-ink-soft flex justify-between gap-6">
          <span>{entry.name}</span>
          <span className="text-ink">{formatAUD(Number(entry.value))}</span>
        </p>
      ))}
      <p className="border-line mt-1 flex justify-between gap-6 border-t pt-1">
        <span className="text-ink-soft">Net</span>
        <span className={net >= 0 ? "text-positive" : "text-negative"}>
          {formatAUD(net, { signed: true })}
        </span>
      </p>
    </div>
  );
}
