"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Rating from "@/components/ui/Rating";
import Price from "@/components/ui/Price";
import Accordion from "@/components/ui/Accordion";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import { lt } from "@/lib/format";
import { productColors } from "@/lib/product";
import type { Locale, Product } from "@/lib/types";

export default function ProductView({ product }: { product: Product }) {
  const t = useTranslations("product");
  const locale = useLocale() as Locale;

  const colors = useMemo(() => productColors(product), [product]);
  const [activeColorHex, setActiveColorHex] = useState(colors[0]?.hex);
  // Desktop hover preview — falls back to the selected color for the image.
  const [previewHex, setPreviewHex] = useState<string | null>(null);
  const [priceOverride, setPriceOverride] = useState<number | null>(null);

  const salePercent =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    product.basePrice > 0 &&
    product.salePrice < product.basePrice
    ? Math.round(100 - (product.salePrice / product.basePrice) * 100)
    : undefined;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <ProductGallery
        images={product.images}
        alt={lt(product.name, locale)}
        saleLabel={salePercent ? `-${salePercent}%` : undefined}
        colorHex={previewHex ?? activeColorHex}
      />

      <div>
        <h1 className="font-display uppercase leading-[0.92] text-4xl md:text-6xl text-navy">
          {lt(product.name, locale)}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <Rating value={product.ratingAvg} count={product.ratingCount} size={16} />
        </div>
        <Price
          basePrice={product.basePrice}
          salePrice={product.salePrice}
          priceOverride={priceOverride}
          locale={locale}
          size="lg"
          className="mt-4"
        />

        <div className="mt-8">
          <ProductPurchase
            product={product}
            colors={colors}
            activeColorHex={activeColorHex}
            onSelectColor={setActiveColorHex}
            onHoverColor={setPreviewHex}
            onPriceOverrideChange={setPriceOverride}
          />
        </div>

        <Accordion
          className="mt-10 border-t border-navy/10"
          items={[
            { title: t("description"), content: lt(product.description, locale) },
            { title: t("fabricCare"), content: t("fabricCareBody") },
            { title: t("shippingReturns"), content: t("shippingReturnsBody") },
          ]}
        />
      </div>
    </div>
  );
}
