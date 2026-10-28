import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-ink-soft mt-2">There&apos;s nothing at this address.</p>
      <Link href="/" className="text-accent mt-4 inline-block font-medium underline">
        Go to the overview
      </Link>
    </div>
  );
}
