"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "./CartProvider";
import Price from "@/components/ui/Price";
import { getProducts } from "@/lib/api";
import { lt } from "@/lib/format";
import type { Locale, Product } from "@/lib/types";

// Fetch best sellers once per session and share the result across every drawer
// open. A failed lookup resolves to an empty list so the section just hides.
let cache: Promise<Product[]> | null = null;
const loadSuggestions = () => {
  if (!cache) cache = getProducts({ sort: "best-selling" }).catch(() => []);
  return cache;
};

const MAX_SUGGESTIONS = 6;

export default function SuggestedProducts() {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const { items, setOpen } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let alive = true;
    loadSuggestions().then((list) => {
      if (alive) setProducts(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Don't suggest what's already in the cart.
  const inCart = new Set(items.map((i) => i.productId));
  const suggestions = products
    .filter((p) => !inCart.has(p.id) && p.images.length > 0)
    .slice(0, MAX_SUGGESTIONS);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-6 border-t border-navy/10 pt-5">
      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-navy">
        {t("suggestionsTitle")}
      </h3>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {suggestions.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            onClick={() => setOpen(false)}
            className="group w-28 shrink-0"
          >
            <div className="aspect-square overflow-hidden bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0].url}
                alt={lt(p.name, locale)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100"
              />
            </div>
            <p className="mt-1.5 truncate text-xs font-bold uppercase text-navy transition-colors group-hover:text-brand">
              {lt(p.name, locale)}
            </p>
            <Price
              basePrice={p.basePrice}
              salePrice={p.salePrice}
              locale={locale}
              size="sm"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
