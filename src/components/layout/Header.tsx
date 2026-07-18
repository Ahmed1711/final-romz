"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { lt } from "@/lib/format";
import type { Category, Locale } from "@/lib/types";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";

export default function Header({ categories = [] }: { categories?: Category[] }) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-navy bg-page/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-3">
        <button
          className="lg:hidden text-navy cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link href="/" className="shrink-0">
          <Logo className="text-4xl text-brand md:text-5xl" />
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          <Link
            href="/"
            className="text-sm font-extrabold uppercase text-navy hover:text-brand transition-colors"
          >
            {t("newDrop")}
          </Link>

          {categories.map((cat) => (
            <div key={cat.id} className="group relative">
              <Link
                href={`/category/${cat.slug}`}
                className="flex items-center gap-1 text-sm font-extrabold uppercase text-navy hover:text-brand transition-colors"
              >
                {lt(cat.name, locale)}
                {cat.children && cat.children.length > 0 && (
                  <ChevronDown size={14} className="mt-0.5" />
                )}
              </Link>
              {cat.children && cat.children.length > 0 && (
                <div className="invisible absolute start-0 top-full z-50 min-w-44 border-2 border-brand bg-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                  {cat.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/category/${sub.slug}`}
                      className="block px-4 py-2.5 text-sm font-extrabold uppercase text-navy hover:bg-brand hover:text-white transition-colors"
                    >
                      {lt(sub.name, locale)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link
            href="/track-order"
            className="text-sm font-extrabold uppercase text-navy hover:text-brand transition-colors"
          >
            {t("trackOrder")}
          </Link>

          <Link
            href="/contact"
            className="text-sm font-extrabold uppercase text-navy hover:text-brand transition-colors"
          >
            {t("contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <LanguageSwitcher />
          <button className="hidden md:block text-brand hover:text-navy cursor-pointer" aria-label="search">
            <Search size={20} />
          </button>
          <Link
            href="/account"
            className="hidden md:block text-brand hover:text-navy"
            aria-label="account"
          >
            <User size={20} />
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="relative text-brand hover:text-navy cursor-pointer"
            aria-label="cart"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span
                key={count}
                className="animate-badge-pop absolute -top-2 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 }}
            animate={{ height: "auto", opacity: 1, paddingTop: 12, paddingBottom: 12 }}
            exit={{ height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="lg:hidden overflow-hidden border-t border-navy/10 bg-white px-4 py-3"
          >
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 font-display uppercase text-navy hover:text-brand"
            >
              {t("newDrop")}
            </Link>

            {categories.map((cat) => (
              <div key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 font-display uppercase text-navy hover:text-brand"
                >
                  {lt(cat.name, locale)}
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <div className="mb-1 ms-4 border-s-2 border-navy/10 ps-3">
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${sub.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-sm font-bold uppercase text-muted hover:text-brand"
                      >
                        {lt(sub.name, locale)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link
              href="/track-order"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 font-display uppercase text-navy hover:text-brand"
            >
              {t("trackOrder")}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 font-display uppercase text-navy hover:text-brand"
            >
              {t("contact")}
            </Link>
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 border-t border-navy/10 py-2.5 font-display uppercase text-navy hover:text-brand"
            >
              <User size={16} />
              {t("account")}
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
