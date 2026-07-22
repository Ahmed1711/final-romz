"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { updateContactInfo } from "@/lib/adminApi";
import type { ContactInfo, LocalizedText } from "@/lib/types";

const labelCls =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted";
const inputCls =
  "w-full border-2 border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand transition-colors";

const cloneInfo = (c: ContactInfo): ContactInfo => ({
  isActive: c.isActive,
  email: c.email,
  phone: c.phone,
  address: { ...c.address },
  workingHours: { ...c.workingHours },
});

export default function ContactInfoEditor({
  contactInfo,
}: {
  contactInfo: ContactInfo;
}) {
  const router = useRouter();
  const [info, setInfo] = useState<ContactInfo>(() => cloneInfo(contactInfo));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null
  );

  const setField = (key: "email" | "phone", value: string) =>
    setInfo((c) => ({ ...c, [key]: value }));

  const setLocalized = (
    field: "address" | "workingHours",
    lang: keyof LocalizedText,
    value: string
  ) => setInfo((c) => ({ ...c, [field]: { ...c[field], [lang]: value } }));

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await updateContactInfo({
        isActive: info.isActive,
        email: info.email,
        phone: info.phone,
        address: info.address,
        workingHours: info.workingHours,
      });
      setInfo(cloneInfo(saved));
      setMessage({ kind: "ok", text: "Contact info saved." });
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
      await updateContactInfo({ isActive: false });
      setInfo((c) => ({ ...c, isActive: false }));
      setMessage({ kind: "ok", text: "Contact block hidden from the store." });
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
        <h2 className="font-display uppercase text-xl text-navy">Contact Info</h2>
        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-navy">
          <input
            type="checkbox"
            checked={info.isActive}
            onChange={(e) => setInfo((c) => ({ ...c, isActive: e.target.checked }))}
            className="h-4 w-4 accent-brand"
          />
          Show on contact page
        </label>
      </div>

      <p className="mt-3 text-xs text-muted">
        Shown on the contact page. Hidden when inactive; each line hides when
        left empty.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Email</label>
          <input
            value={info.email}
            dir="ltr"
            placeholder="support@romz.com"
            onChange={(e) => setField("email", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input
            value={info.phone}
            dir="ltr"
            placeholder="+20 100 000 0000"
            onChange={(e) => setField("phone", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Address (English)</label>
          <input
            value={info.address.en}
            onChange={(e) => setLocalized("address", "en", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Address (Arabic)</label>
          <input
            value={info.address.ar}
            dir="rtl"
            onChange={(e) => setLocalized("address", "ar", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Working hours (English)</label>
          <input
            value={info.workingHours.en}
            onChange={(e) => setLocalized("workingHours", "en", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Working hours (Arabic)</label>
          <input
            value={info.workingHours.ar}
            dir="rtl"
            onChange={(e) => setLocalized("workingHours", "ar", e.target.value)}
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
          <span>{busy ? "Saving..." : "Save Contact Info"}</span>
        </button>
        {info.isActive && (
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
