import type { PolicyContent } from "@/content/policies";

// Presentational template shared by all storefront policy / info pages
// (Terms, Refund, Privacy, Shipping, About). Content comes from
// src/content/policies.ts so the pages stay data-only.
export default function LegalPage({
  content,
  ghost,
}: {
  content: PolicyContent;
  /** Large faded background word behind the title. */
  ghost?: string;
}) {
  return (
    <div className="pb-24">
      <div className="relative overflow-hidden border-b-2 border-navy bg-navy px-4 py-16 md:py-20">
        {ghost && (
          <span
            aria-hidden
            className="ghost-text pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display uppercase leading-none text-white/5 text-7xl md:text-[9rem]"
          >
            {ghost}
          </span>
        )}
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="font-display uppercase text-3xl text-white md:text-5xl">
            {content.title}
          </h1>
          <div className="mx-auto mt-3 h-1 w-16 bg-brand" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/50">
            {content.updatedLabel}: {content.updated}
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-5 pt-12">
        {content.intro && (
          <p className="text-base leading-relaxed text-navy/80 md:text-lg">
            {content.intro}
          </p>
        )}

        <div className="mt-10 space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display uppercase text-xl text-navy md:text-2xl">
                {section.heading}
              </h2>
              <div className="mt-2 h-0.5 w-10 bg-brand/60" />
              <div className="mt-4 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-muted md:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
