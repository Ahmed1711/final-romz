import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProductBySlug, getProductReviews, getRelatedProducts } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import { lt } from "@/lib/format";
import type { Locale } from "@/lib/types";
import Rating from "@/components/ui/Rating";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductGrid from "@/components/product/ProductGrid";
import ProductView from "@/components/product/ProductView";
import { BadgeCheck } from "lucide-react";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("product");
  const ts = await getTranslations("sections");
  const tc = await getTranslations("common");
  const related = await getRelatedProducts(product);
  const productReviews = await getProductReviews(product.id);

  // Star distribution (5→1) for the reviews summary.
  const dist = [5, 4, 3, 2, 1].map(
    (star) => productReviews.filter((r) => Math.round(r.rating) === star).length
  );
  const reviewCount = productReviews.length;
  const avg =
    reviewCount > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : product.ratingAvg;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="mb-5 text-xs font-bold uppercase tracking-wider text-muted">
        <Link href="/" className="hover:text-brand">
          {tc("home")}
        </Link>
        <span className="mx-2 text-navy/30">/</span>
        <Link href={`/category/${product.category}`} className="hover:text-brand">
          {product.category}
        </Link>
        <span className="mx-2 text-navy/30">/</span>
        <span className="text-navy">{lt(product.name, locale)}</span>
      </nav>

      <ProductView product={product} />

      {related.length > 0 && (
        <section className="mt-20 md:mt-28">
          <SectionHeading title={t("related")} ghost="MORE" />
          <ProductGrid products={related} className="mt-10" />
        </section>
      )}

      {reviewCount > 0 && (
        <section className="mt-20 border-t-2 border-navy pt-12 md:mt-28">
          <h2 className="font-display uppercase text-3xl md:text-5xl text-navy">
            {t("customerReviews")}
          </h2>

          <div className="mt-8 grid gap-10 lg:grid-cols-[280px_1fr]">
            {/* Summary */}
            <div>
              <div className="flex items-end gap-3">
                <span className="font-display text-6xl leading-none text-navy">
                  {avg.toFixed(1)}
                </span>
                <div className="pb-1">
                  <Rating value={avg} size={16} />
                  <p className="mt-1 text-xs font-bold uppercase text-muted">
                    {t("basedOnReviews", { count: reviewCount })}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                {dist.map((n, i) => {
                  const star = 5 - i;
                  const pct = reviewCount ? (n / reviewCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 font-bold text-navy">{star} ★</span>
                      <div className="h-2 flex-1 bg-surface">
                        <div
                          className="h-full bg-navy"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-end font-bold text-muted">{n}</span>
                    </div>
                  );
                })}
              </div>

              <button className="mt-6 w-full border-2 border-brand px-6 py-3 text-center font-display uppercase tracking-wider text-brand transition-colors hover:bg-brand hover:text-white cursor-pointer">
                {t("writeReview")}
              </button>
            </div>

            {/* Review list */}
            <div className="space-y-4">
              {productReviews.map((review) => (
                <div
                  key={review.id}
                  className="border-2 border-navy/10 bg-white p-6"
                >
                  <Rating value={review.rating} size={14} />
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-extrabold uppercase text-navy">
                      {review.name}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-navy">
                        <BadgeCheck size={12} className="text-brand" />
                        {ts("verified")}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-navy/80">
                    {lt(review.comment, locale)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
