"use client";

import { useLocale, useTranslations } from "next-intl";
import SectionHeading from "@/components/ui/SectionHeading";
import Accordion from "@/components/ui/Accordion";
import Reveal from "@/components/motion/Reveal";
import type { Faq, Locale } from "@/lib/types";

export default function FaqSection({ faqs }: { faqs: Faq[] }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  // Backend-driven: only active FAQs, ordered ascending, localized with an
  // English fallback.
  const items = faqs
    .filter((f) => f.isActive)
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      title: f.question[locale] || f.question.en,
      content: f.answer[locale] || f.answer.en,
    }))
    .filter((item) => item.title);

  // No active FAQs → hide the whole section.
  if (items.length === 0) return null;

  return (
    <section
      className="clip-diagonal-top-flip bg-surface pb-16 pt-24"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-3xl px-4">
        <Reveal direction="start">
          <SectionHeading title={t("sections.faq")} ghost="FAQ" />
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion items={items} className="mt-8" />
        </Reveal>
      </div>
    </section>
  );
}
