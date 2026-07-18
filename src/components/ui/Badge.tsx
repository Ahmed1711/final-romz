import clsx from "clsx";
import type { ReactNode } from "react";

type BadgeVariant = "new" | "best-seller" | "sale" | "neutral";

const styles: Record<BadgeVariant, string> = {
  new: "bg-brand text-white",
  "best-seller": "bg-navy text-white",
  sale: "bg-brand text-white",
  neutral: "bg-surface text-navy",
};

export default function Badge({
  variant = "new",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "skew-cta inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest",
        styles[variant],
        className
      )}
    >
      <span>{children}</span>
    </span>
  );
}
