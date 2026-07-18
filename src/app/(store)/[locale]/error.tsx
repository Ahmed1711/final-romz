"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { btn } from "@/components/ui/Button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Store route failed", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <AlertTriangle size={44} className="mx-auto text-brand" />
      <h1 className="mt-6 font-display uppercase text-3xl text-navy">
        Something went wrong
      </h1>
      <p className="mt-4 text-sm text-muted">
        We could not load this page. Please try again, or go back home.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button onClick={reset} className={btn("primary", "md")}>
          <span>Try again</span>
        </button>
        <Link href="/" className={btn("outline", "md")}>
          <span>Back home</span>
        </Link>
      </div>
    </div>
  );
}
