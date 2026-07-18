import type { Locale, StorefrontSettings } from "@/lib/types";

export default function PromoBar({
  locale,
  promoBar,
}: {
  locale: Locale;
  promoBar: StorefrontSettings["promoBar"];
}) {
  const line = (locale === "ar" ? promoBar.text.ar : promoBar.text.en).trim();
  if (!promoBar.active || !line) return null;

  return (
    <div className="overflow-hidden bg-navy-deep px-4 py-1.5 text-center">
      <p className="whitespace-nowrap text-[10px] font-extrabold uppercase text-white md:text-[11px]">
        {line}
      </p>
    </div>
  );
}
