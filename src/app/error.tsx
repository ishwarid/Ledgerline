"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Where Sentry (or similar) would pick this up in production.
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Couldn&apos;t load your accounts</h1>
      <p className="text-ink-soft mt-2">
        The bank data didn&apos;t come back. This is usually temporary.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-accent text-surface mt-5 h-10 rounded-md px-4 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
