"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AdminPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel route failed", error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="max-w-xl border-2 border-brand/30 bg-white p-6">
        <AlertTriangle size={32} className="text-brand" />
        <h1 className="mt-4 font-display uppercase text-2xl text-navy">
          Admin page failed
        </h1>
        <p className="mt-2 text-sm text-muted">
          The admin data could not be loaded. Check the backend connection or
          your admin session, then try again.
        </p>
        <button
          onClick={reset}
          className="skew-cta mt-6 bg-brand px-5 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer"
        >
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}
