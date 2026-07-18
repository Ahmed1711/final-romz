import { useLocale, useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/motion/Reveal";
import Rating from "@/components/ui/Rating";
import { lt } from "@/lib/format";
import type { Locale, Review } from "@/lib/types";

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("sections");
  const locale = useLocale() as Locale;

  // No public testimonials endpoint yet — hide the strip when there are none.
  if (!reviews.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <Reveal direction="start">
        <SectionHeading title={t("reviews")} ghost="REVIEWS" />
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
        {reviews.map((review, i) => (
          <Reveal
            key={review.id}
            delay={i * 0.12}
            className="border border-navy/10 bg-white p-6"
          >
            <Rating value={review.rating} />
            <p className="mt-4 text-sm leading-relaxed text-navy/80">
              &ldquo;{lt(review.comment, locale)}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-extrabold text-navy">
                {review.name}
              </span>
              {review.isVerifiedPurchase && (
                <span className="flex items-center gap-1 bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
                  <BadgeCheck size={12} />
                  {t("verified")}
                </span>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
