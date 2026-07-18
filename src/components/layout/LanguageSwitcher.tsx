"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={other}
      className="border border-navy/20 px-2 py-1 text-xs font-extrabold uppercase text-navy hover:border-brand hover:text-brand transition-colors"
    >
      {other === "ar" ? "العربية" : "EN"}
    </Link>
  );
}
