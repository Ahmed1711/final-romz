"use client";

import { useTranslations } from "next-intl";
import SectionHeading from "@/components/ui/SectionHeading";
import Accordion from "@/components/ui/Accordion";
import Reveal from "@/components/motion/Reveal";

export default function FaqSection() {
  const t = useTranslations();

  const items = [1, 2, 3, 4, 5].map((i) => ({
    title: t(`faq.q${i}`),
    content: t(`faq.a${i}`),
  }));

  return (
    <section className="clip-diagonal-top-flip bg-surface pb-16 pt-24">
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
