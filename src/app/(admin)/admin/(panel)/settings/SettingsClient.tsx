"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { updateStorefrontSettings } from "@/lib/adminApi";
import type { StorefrontSettings } from "@/lib/types";

const labelCls =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted";
const inputCls =
  "w-full border-2 border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-brand transition-colors";

export default function SettingsClient({
  settings,
}: {
  settings: StorefrontSettings;
}) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null
  );

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const settings = await updateStorefrontSettings(form);
      setForm(settings);
      setMessage({ kind: "ok", text: "Storefront settings saved." });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Settings save failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-navy pb-2">
        <h2 className="font-display uppercase text-xl text-navy">
          Promo Offer Bar
        </h2>
        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-navy">
          <input
            type="checkbox"
            checked={form.promoBar.active}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                promoBar: {
                  ...current.promoBar,
                  active: event.target.checked,
                },
              }))
            }
            className="h-4 w-4 accent-brand"
          />
          Active
        </label>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className={labelCls}>English Promo Text</label>
          <textarea
            value={form.promoBar.text.en}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                promoBar: {
                  ...current.promoBar,
                  text: { ...current.promoBar.text, en: event.target.value },
                },
              }))
            }
            rows={2}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Arabic Promo Text</label>
          <textarea
            value={form.promoBar.text.ar}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                promoBar: {
                  ...current.promoBar,
                  text: { ...current.promoBar.text, ar: event.target.value },
                },
              }))
            }
            rows={2}
            dir="rtl"
            className={inputCls}
          />
        </div>

        <div className="border-2 border-navy/10 bg-surface p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Preview
          </p>
          {form.promoBar.active ? (
            <div className="mt-2 bg-navy px-3 py-2 text-center">
              <p className="text-[11px] font-bold italic uppercase tracking-widest text-white">
                {form.promoBar.text.en || "Promo text"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm font-bold text-muted">Promo bar hidden</p>
          )}
        </div>

        <div className="border-t border-navy/10 pt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display uppercase text-lg text-navy">
                Payment Methods
              </h3>
              <p className="mt-1 text-xs text-muted">
                Control which payment options customers see at checkout.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-navy">
              <input
                type="checkbox"
                checked={form.payments.paymob.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    payments: {
                      ...current.payments,
                      paymob: {
                        ...current.payments.paymob,
                        active: event.target.checked,
                      },
                    },
                  }))
                }
                className="h-4 w-4 accent-brand"
              />
              Credit Card Active
            </label>
          </div>

          <div className="mt-3 border-2 border-navy/10 bg-white px-4 py-3">
            <p className="text-sm font-extrabold text-navy">
              Credit / Debit Card via Paymob
            </p>
            <p className="mt-1 text-xs text-muted">
              {form.payments.paymob.active
                ? "Customers can choose card payment at checkout."
                : "Card payment is hidden from checkout. COD stays available."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-t border-navy/10 pt-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Free Shipping Threshold (EGP)</label>
            <input
              type="number"
              min={0}
              value={form.freeShippingThreshold ?? ""}
              placeholder="Disabled"
              onChange={(event) => {
                const value = event.target.value;
                setForm((current) => ({
                  ...current,
                  freeShippingThreshold:
                    value === "" ? null : Math.max(0, Number(value)),
                }));
              }}
              className={inputCls}
            />
            <p className="mt-1 text-[10px] text-muted">
              Leave empty to always charge the matching shipping-zone fee.
            </p>
          </div>
          <div>
            <label className={labelCls}>Low Stock Threshold</label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.lowStockThreshold}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lowStockThreshold: Math.max(
                    0,
                    Math.trunc(Number(event.target.value))
                  ),
                }))
              }
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {message && (
        <p
          className={clsx(
            "mt-3 text-xs font-bold",
            message.kind === "ok" ? "text-success" : "text-brand"
          )}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className={clsx(
          "skew-cta mt-4 bg-brand px-6 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer",
          busy && "opacity-60"
        )}
      >
        <span>{busy ? "Saving..." : "Save Store Settings"}</span>
      </button>
    </div>
  );
}
