"use client";

import clsx from "clsx";

/** Shared shell + form controls for the customer auth pages. */

export function AuthCard({
  ghost,
  title,
  subtitle,
  children,
}: {
  ghost: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative px-4 pb-20 pt-14 md:pt-20">
      <span
        aria-hidden
        className="ghost-text absolute inset-x-0 top-10 text-center font-display uppercase leading-none text-7xl md:text-9xl"
      >
        {ghost}
      </span>
      <div className="relative mx-auto max-w-md">
        <div className="-rotate-1 border-2 border-navy bg-white p-8 shadow-[8px_8px_0_0_var(--color-navy)]">
          <div className="rotate-1">
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/romz-mark.png"
                alt="ROMZ"
                className="h-10 w-auto select-none"
              />
            </div>
            <h1 className="mt-4 text-center font-display uppercase text-2xl text-navy">
              {title}
            </h1>
            <div className="mx-auto mt-2 h-1 w-14 bg-brand" />
            {subtitle && (
              <p className="mt-4 text-center text-sm text-muted">{subtitle}</p>
            )}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border-0 border-b-2 border-navy/30 bg-transparent px-1 py-2.5 text-sm text-navy placeholder:text-muted outline-none focus:border-brand transition-colors";

export function Field({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-navy">
        {label}
      </label>
      <input
        {...props}
        className={clsx(inputCls, error && "border-brand", className)}
      />
      {error && <p className="mt-1 text-xs font-bold text-brand">{error}</p>}
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="border-2 border-brand/30 bg-brand/5 px-3 py-2 text-center text-xs font-bold text-brand">
      {children}
    </p>
  );
}

export function FormSuccess({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="border-2 border-success/30 bg-success/5 px-3 py-2 text-center text-xs font-bold text-success">
      {children}
    </p>
  );
}
