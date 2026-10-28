"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/data-sharing", label: "Data sharing" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-line border-b px-4 py-4 md:w-56 md:shrink-0 md:border-r md:border-b-0 md:px-6 md:py-10">
      <div className="md:sticky md:top-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <LogoMark />
          Ledgerline
        </Link>

        <nav aria-label="Main" className="mt-4 md:mt-10">
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                      active
                        ? "bg-accent-soft text-ink font-medium"
                        : "text-ink-soft hover:bg-surface hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="text-ink-muted mt-10 hidden text-xs leading-relaxed md:block">
          Demo with sample data. No real bank is connected.
        </p>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="var(--accent)" />
      <path
        d="M6 14.5h10M6 10.5h6.5M6 6.5h3"
        stroke="var(--surface)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
