"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { updateShippingReturns } from "@/lib/adminApi";
import type { LocalizedText, ShippingReturns } from "@/lib/types";

const MAX_BODY = 2000;

const labelCls =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted";
const inputCls =
  "w-full border-2 border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand transition-colors";

const cloneBlock = (sr: ShippingReturns): ShippingReturns => ({
  isActive: sr.isActive,
  title: { ...sr.title },
  body: { ...sr.body },
});

export default function ShippingReturnsEditor({
  shippingReturns,
}: {
  shippingReturns: ShippingReturns;
}) {
  const router = useRouter();
  const [block, setBlock] = useState<ShippingReturns>(() =>
    cloneBlock(shippingReturns)
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null
  );

  const setLocalized = (
    field: "title" | "body",
    lang: keyof LocalizedText,
    value: string
  ) => setBlock((b) => ({ ...b, [field]: { ...b[field], [lang]: value } }));

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await updateShippingReturns({
        isActive: block.isActive,
        title: block.title,
        body: block.body,
      });
      setBlock(cloneBlock(saved));
      setMessage({ kind: "ok", text: "Shipping & Returns saved." });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Save failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Quick hide without losing the text (partial patch of isActive only).
  const quickHide = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await updateShippingReturns({ isActive: false });
      setBlock((b) => ({ ...b, isActive: false }));
      setMessage({ kind: "ok", text: "Shipping & Returns hidden from product pages." });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not hide the block.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-navy pb-2">
        <h2 className="font-display uppercase text-xl text-navy">
          Shipping &amp; Returns
        </h2>
        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-navy">
          <input
            type="checkbox"
            checked={block.isActive}
            onChange={(e) => setBlock((b) => ({ ...b, isActive: e.target.checked }))}
            className="h-4 w-4 accent-brand"
          />
          Show on product pages
        </label>
      </div>

      <p className="mt-3 text-xs text-muted">
        Shown as an accordion block on every product page. Hidden when inactive
        or missing a title/body.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Title (English)</label>
          <input
            value={block.title.en}
            onChange={(e) => setLocalized("title", "en", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Title (Arabic)</label>
          <input
            value={block.title.ar}
            dir="rtl"
            onChange={(e) => setLocalized("title", "ar", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Body (English)</label>
          <textarea
            value={block.body.en}
            maxLength={MAX_BODY}
            rows={4}
            onChange={(e) => setLocalized("body", "en", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Body (Arabic)</label>
          <textarea
            value={block.body.ar}
            maxLength={MAX_BODY}
            rows={4}
            dir="rtl"
            onChange={(e) => setLocalized("body", "ar", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {message && (
        <p
          className={clsx(
            "mt-4 text-xs font-bold",
            message.kind === "ok" ? "text-success" : "text-brand"
          )}
        >
          {message.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={clsx(
            "skew-cta bg-brand px-6 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer",
            busy && "opacity-60"
          )}
        >
          <span>{busy ? "Saving..." : "Save Shipping & Returns"}</span>
        </button>
        {block.isActive && (
          <button
            type="button"
            onClick={quickHide}
            disabled={busy}
            className={clsx(
              "border-2 border-navy px-6 py-2.5 text-sm font-display uppercase tracking-wider text-navy hover:bg-navy hover:text-white transition-colors cursor-pointer",
              busy && "opacity-60"
            )}
          >
            Hide from store
          </button>
        )}
      </div>
    </div>
  );
}
