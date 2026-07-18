import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { lt } from "@/lib/format";
import type { Category, Locale } from "@/lib/types";
import Logo from "./Logo";

export default function Footer({ categories = [] }: { categories?: Category[] }) {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const locale = useLocale() as Locale;

  return (
    <footer className="relative overflow-hidden border-t-[6px] border-brand bg-navy text-white">
      <span
        aria-hidden
        className="absolute -bottom-10 end-0 font-display text-[10rem] uppercase leading-none text-white/5 md:text-[16rem]"
      >
        ROMZ
      </span>
      <div className="relative mx-auto grid max-w-[1280px] gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <Logo light className="text-5xl" withMark={false} />
          <p className="mt-6 max-w-48 text-sm font-semibold uppercase text-white/65">
            {t("tagline")}
          </p>
          <div className="mt-6 flex gap-2">
            {["VISA", "MC", "MEEZA", "COD"].map((p) => (
              <span
                key={p}
                className="border border-white/20 px-2 py-1 text-[10px] font-bold text-white/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-extrabold uppercase text-brand">
            {t("shop")}
          </h3>
          <ul className="space-y-4 text-sm font-bold uppercase text-white/75">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/category/${cat.slug}`} className="hover:text-white">
                  {lt(cat.name, locale)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/track-order" className="hover:text-white">
                {tn("trackOrder")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-extrabold uppercase text-brand">
            {t("help")}
          </h3>
          <ul className="space-y-4 text-sm font-bold uppercase text-white/75">
            <li>
              <Link href="/contact" className="hover:text-white">
                {t("contact")}
              </Link>
            </li>
            <li><span className="cursor-pointer hover:text-white">{t("support")}</span></li>
            <li><span className="cursor-pointer hover:text-white">{t("shipping")}</span></li>
            <li><span className="cursor-pointer hover:text-white">{t("returns")}</span></li>
            <li><span className="cursor-pointer hover:text-white">{t("privacy")}</span></li>
            <li><span className="cursor-pointer hover:text-white">{t("terms")}</span></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-6 py-5 text-xs font-bold uppercase text-white/45">
        <div className="mx-auto max-w-[1280px]">
        {t("rights")}
        </div>
      </div>
    </footer>
  );
}
