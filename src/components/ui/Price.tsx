import clsx from "clsx";
import { formatEGP } from "@/lib/format";
import type { Locale } from "@/lib/types";

export default function Price({
  basePrice,
  salePrice,
  priceOverride,
  locale,
  size = "md",
  className,
}: {
  basePrice: number;
  salePrice?: number | null;
  priceOverride?: number | null;
  locale: Locale;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  } as const;

  const effectivePrice = priceOverride ?? salePrice ?? basePrice;
  const showComparison = effectivePrice < basePrice;

  if (effectivePrice !== basePrice) {
    return (
      <div className={clsx("flex items-baseline gap-2", sizes[size], className)}>
        <span className="font-extrabold text-brand">
          {formatEGP(effectivePrice, locale)}
        </span>
        {showComparison && (
          <span className="text-muted line-through text-[0.8em]">
            {formatEGP(basePrice, locale)}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={clsx("font-extrabold text-navy", sizes[size], className)}>
      {formatEGP(effectivePrice, locale)}
    </div>
  );
}
