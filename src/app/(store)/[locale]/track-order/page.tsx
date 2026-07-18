"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import { trackOrder } from "@/lib/api";
import { formatDate, formatEGP, lt } from "@/lib/format";
import type { Locale, Order, OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const inputCls =
  "w-full border-0 border-b-2 border-navy/30 bg-transparent px-1 py-2.5 text-sm text-navy placeholder:text-muted outline-none focus:border-brand transition-colors";

export default function TrackOrderPage() {
  const t = useTranslations("track");
  const locale = useLocale() as Locale;

  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setSearched(true);
    const result = await trackOrder(orderNumber, contact);
    setOrder(result ?? null);
    setNotFound(!result);
  };

  const currentStep = order ? STEPS.indexOf(order.status) : -1;
  const isCancelled =
    order?.status === "cancelled" || order?.status === "returned";
  const canCancel =
    order && !isCancelled && ["pending", "confirmed"].includes(order.status);

  return (
    <div className="pb-20">
      {/* Search card */}
      <div className="relative px-4 pb-16 pt-14 md:pt-20">
        <span
          aria-hidden
          className="ghost-text absolute inset-x-0 top-10 text-center font-display uppercase leading-none text-7xl md:text-9xl"
        >
          TRACK
        </span>
        <div className="relative mx-auto max-w-md">
          <div className="-rotate-1 border-2 border-navy bg-white p-8 shadow-[8px_8px_0_0_var(--color-navy)]">
            <div className="rotate-1">
              <h1 className="text-center font-display uppercase text-2xl text-navy underline decoration-brand decoration-2 underline-offset-4">
                {t("title")}
              </h1>
              <div className="mx-auto mt-2 h-1 w-14 bg-brand" />

              <div className="mt-8 space-y-6">
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-navy">
                    {t("orderNumber")}
                  </label>
                  <input
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder={t("orderNumberPlaceholder")}
                    className={inputCls}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-navy">
                    {t("contact")}
                  </label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t("contactPlaceholder")}
                    className={inputCls}
                    dir="ltr"
                  />
                </div>
                <Button size="lg" className="w-full" onClick={search}>
                  {t("track")}
                </Button>
                {searched && notFound && (
                  <p className="text-center text-sm font-bold text-brand">
                    {t("notFound")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      {order && (
        <>
          <div className="clip-diagonal-top-flip -mt-6 h-16 bg-navy" />
          <div className="mx-auto max-w-5xl px-4 pt-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display uppercase text-3xl text-navy">
                  {locale === "ar" ? "طلب " : "Order "}
                  <span className="text-brand" dir="ltr">
                    {order.orderNumber}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {t("placedOn", { date: formatDate(order.createdAt, locale) })}
                </p>
              </div>
              {canCancel && (
                <div className="text-end">
                  <button className="skew-cta border-2 border-brand px-5 py-2.5 text-sm font-display uppercase tracking-wider text-brand hover:bg-brand hover:text-white transition-colors cursor-pointer">
                    <span>{t("cancelOrder")}</span>
                  </button>
                  <p className="mt-1 text-[11px] text-muted">{t("cancelNote")}</p>
                </div>
              )}
            </div>

            {isCancelled ? (
              <div className="mt-10 border-2 border-brand/30 bg-brand/5 p-6 text-center font-bold text-brand">
                {t("cancelled")}
              </div>
            ) : (
              <div className="mt-12 flex items-start">
                {STEPS.map((step, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="relative flex-1">
                      {i > 0 && (
                        <div
                          className={clsx(
                            "absolute top-3.5 h-1 w-full -translate-x-1/2 rtl:translate-x-1/2",
                            i <= currentStep ? "bg-navy" : "bg-navy/10"
                          )}
                          style={{ insetInlineStart: 0 }}
                        />
                      )}
                      <div className="relative flex flex-col items-center gap-3">
                        <div
                          className={clsx(
                            "flex h-8 w-8 rotate-45 items-center justify-center",
                            done && "bg-navy",
                            active && "bg-brand ring-4 ring-brand/25",
                            !done && !active && "bg-navy/10"
                          )}
                        >
                          {done && (
                            <Check size={14} className="-rotate-45 text-white" />
                          )}
                        </div>
                        <span
                          className={clsx(
                            "text-center text-[10px] md:text-xs font-extrabold uppercase tracking-wider",
                            active ? "text-brand" : done ? "text-navy" : "text-navy/30"
                          )}
                        >
                          {t(`status.${step}`)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Items */}
            <div className="mt-14 border-2 border-navy/10 bg-white p-6 shadow-[6px_6px_0_0_var(--color-navy)]">
              <h3 className="font-display uppercase text-lg text-navy">
                {t("itemsInShipment")}
              </h3>
              <div className="mt-2 h-0.5 w-full bg-navy/10" />
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {order.items.map((item) => (
                  <div key={item.sku} className="flex items-center gap-4">
                    <div className="h-20 w-20 shrink-0 bg-surface">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold uppercase text-navy">
                        {lt(item.name, locale)}
                      </p>
                      <p className="text-xs text-muted">
                        {item.colorName} | {item.size}
                        {item.qty > 1 ? ` × ${item.qty}` : ""}
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-brand">
                        {formatEGP(item.unitPrice * item.qty, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
