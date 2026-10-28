import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ledgerline",
    template: "%s · Ledgerline",
  },
  description:
    "A personal finance dashboard built on Australian Consumer Data Right banking data. Demo with sample data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="focus:bg-surface sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <div className="mx-auto flex min-h-dvh max-w-6xl flex-col md:flex-row">
          <SiteNav />
          <main id="main" className="min-w-0 flex-1 px-4 pt-6 pb-16 md:px-10 md:pt-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
