import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import { btn } from "@/components/ui/Button";
import { formatEGP, lt } from "@/lib/format";
import type { Locale, Product } from "@/lib/types";

// Promo lifestyle shot (ROMZ BRANDING VOL1 campaign photography).
const PROMO_IMAGE = "/brand/lifestyle/track-cap.webp";

/**
 * "Complete the Fit" — full-bleed promo band pairing a lifestyle image with a
 * single highlighted product (matches the ROMZ Figma homepage).
 */
export default async function CompleteTheFit({
  product,
}: {
  product?: Product;
}) {
  if (!product) return null;

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const tp = await getTranslations("product");

  const price = product.salePrice ?? product.basePrice;
  const hasSale = product.salePrice != null && product.salePrice < product.basePrice;
  const discountPct = hasSale
    ? Math.round((1 - product.salePrice! / product.basePrice) * 100)
    : null;
  const image = product.images[0]?.url ?? PROMO_IMAGE;

  return (
    <section className="relative overflow-hidden border-y-2 border-brand bg-page py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 md:grid-cols-[1.4fr_1fr] md:gap-10">
        {/* Lifestyle image with overlaid headline */}
        <Reveal direction="start">
          <div className="relative aspect-[16/10] overflow-hidden md:aspect-[16/11]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PROMO_IMAGE}
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/20 to-transparent"
            />
            <h2 className="absolute bottom-6 start-6 font-display uppercase leading-[0.9] text-white text-4xl md:text-6xl">
              {t("completeTheFit")}
            </h2>
          </div>
        </Reveal>

        {/* Featured product card */}
        <Reveal delay={0.15}>
          <div className="relative border-2 border-navy/10 bg-white p-6 shadow-xl">
            {discountPct != null && (
              <span className="skew-cta absolute -top-3 end-4 bg-brand px-4 py-1.5 font-display text-lg text-white">
                <span>{discountPct}%</span>
              </span>
            )}
            <div className="aspect-square overflow-hidden bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={lt(product.name, locale)}
                className="h-full w-full object-cover"
              />
            </div>
            <h3 className="mt-4 font-display uppercase text-2xl text-navy">
              {lt(product.name, locale)}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {lt(product.description, locale)}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl text-brand">
                {formatEGP(price, locale)}
              </span>
              {hasSale && (
                <span className="text-muted line-through">
                  {formatEGP(product.basePrice, locale)}
                </span>
              )}
            </div>
            <Link
              href={`/product/${product.slug}`}
              className={btn("primary", "lg", "mt-5 w-full")}
            >
              <span>{tp("addToCart")}</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
