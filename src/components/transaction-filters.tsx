"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CATEGORIES } from "@/lib/finance/categories";

type AccountOption = { id: string; label: string };

const SEARCH_DELAY_MS = 300;

/**
 * Filters live in the URL, not component state. That way a filtered view
 * can be bookmarked or shared, the back button works, and the server does
 * the filtering on the full data set.
 */
export function TransactionFilters({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // any new filter starts back at page one

    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  function onSearchChange(value: string) {
    setQuery(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => update("q", value.trim()), SEARCH_DELAY_MS);
  }

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const hasFilters = ["q", "account", "category", "direction"].some((key) => params.has(key));

  return (
    <form
      role="search"
      aria-busy={isPending}
      onSubmit={(event) => event.preventDefault()}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <Field label="Search">
        <input
          type="search"
          value={query}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Merchant, description or reference"
          className={inputClass}
        />
      </Field>

      <Field label="Account">
        <select
          value={params.get("account") ?? ""}
          onChange={(event) => update("account", event.target.value)}
          className={inputClass}
        >
          <option value="">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Category">
        <select
          value={params.get("category") ?? ""}
          onChange={(event) => update("category", event.target.value)}
          className={inputClass}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Direction">
        <select
          value={params.get("direction") ?? ""}
          onChange={(event) => update("direction", event.target.value)}
          className={inputClass}
        >
          <option value="">In and out</option>
          <option value="in">Money in</option>
          <option value="out">Money out</option>
        </select>
      </Field>

      <button
        type="button"
        disabled={!hasFilters}
        onClick={() => {
          setQuery("");
          startTransition(() => router.replace(pathname, { scroll: false }));
        }}
        className="text-accent hover:bg-surface h-10 rounded-md px-3 text-sm font-medium disabled:invisible"
      >
        Clear filters
      </button>
    </form>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-muted";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-ink-soft mb-1 block">{label}</span>
      {children}
    </label>
  );
}
