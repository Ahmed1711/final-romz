"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Trash2, Truck, X } from "lucide-react";
import clsx from "clsx";
import {
  createShippingZone,
  deleteShippingZone,
  updateShippingZone,
} from "@/lib/adminApi";
import type { ShippingZone } from "@/lib/types";

const inputCls =
  "w-full border-2 border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-brand transition-colors";
const labelCls =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted";

interface FormState {
  governorate: string;
  fee: number;
  estimatedDays: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  governorate: "",
  fee: 0,
  estimatedDays: "1-3",
  isActive: true,
};

export default function ShippingClient({
  zones,
  freeShippingThreshold,
}: {
  zones: ShippingZone[];
  freeShippingThreshold: number | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  /** Id of the zone whose active-toggle is mid-request, for a per-row spinner. */
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCount = zones.filter((z) => z.isActive).length;

  const openNew = () => {
    setForm(emptyForm);
    setError(null);
    setEditing("new");
  };

  const openEdit = (zone: ShippingZone) => {
    setForm({
      // governorate is a plain string on the backend (mirrored into en/ar).
      governorate: zone.governorate.en,
      fee: zone.fee,
      estimatedDays: zone.estimatedDays,
      isActive: zone.isActive,
    });
    setError(null);
    setEditing(zone.id);
  };

  const close = () => {
    setEditing(null);
    setError(null);
  };

  const submit = async () => {
    if (!form.governorate.trim()) {
      setError("Governorate is required.");
      return;
    }
    if (form.fee < 0) {
      setError("Fee cannot be negative.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        governorate: form.governorate.trim(),
        fee: form.fee,
        estimatedDays: form.estimatedDays.trim() || undefined,
        isActive: form.isActive,
      };
      if (editing === "new") {
        await createShippingZone(payload);
      } else if (editing) {
        await updateShippingZone(editing, payload);
      }
      close();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (zone: ShippingZone) => {
    setTogglingId(zone.id);
    try {
      await updateShippingZone(zone.id, { isActive: !zone.isActive });
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (zone: ShippingZone) => {
    if (!window.confirm(`Delete shipping zone "${zone.governorate.en}"?`)) return;
    setBusy(true);
    try {
      await deleteShippingZone(zone.id);
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 font-display uppercase text-2xl text-navy">
            <Truck size={24} className="text-brand" /> Shipping Zones
          </h1>
          <p className="mt-1 text-sm text-muted">
            {zones.length} zone{zones.length === 1 ? "" : "s"} ·{" "}
            <span className="font-bold text-navy">{activeCount} active</span> at
            checkout
          </p>
        </div>
        <button
          onClick={openNew}
          className="skew-cta flex items-center gap-2 bg-brand px-5 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} /> New Zone
          </span>
        </button>
      </div>

      <p className="mt-3 border-l-4 border-brand/40 bg-brand/5 px-4 py-2.5 text-sm text-navy">
        {freeShippingThreshold === null ? (
          "Free shipping is disabled — every order is charged its zone fee."
        ) : (
          <>
            Free shipping applies after the coupon when the cart reaches{" "}
            <span className="font-extrabold text-brand">
              {freeShippingThreshold.toLocaleString()} EGP
            </span>
            . Only <span className="font-bold">active</span> zones appear in
            checkout.
          </>
        )}
      </p>

      {/* ── Editor ── */}
      {editing !== null && (
        <div className="mt-6 border-2 border-brand/30 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display uppercase text-lg text-navy">
              {editing === "new" ? "New Shipping Zone" : "Edit Shipping Zone"}
            </h2>
            <button
              onClick={close}
              aria-label="Close form"
              className="text-muted hover:text-brand cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Governorate</label>
              <input
                value={form.governorate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, governorate: e.target.value }))
                }
                placeholder="e.g. Cairo"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fee (EGP)</label>
              <input
                type="number"
                value={form.fee}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fee: Math.max(0, +e.target.value) }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Estimated Days</label>
              <input
                value={form.estimatedDays}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimatedDays: e.target.value }))
                }
                placeholder="e.g. 1-3"
                className={inputCls}
              />
            </div>
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider text-navy">
            <span
              className={clsx(
                "relative h-6 w-11 rounded-full transition-colors",
                form.isActive ? "bg-brand" : "bg-navy/20"
              )}
            >
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="peer sr-only"
              />
              <span
                className={clsx(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                  form.isActive ? "start-[22px]" : "start-0.5"
                )}
              />
            </span>
            {form.isActive ? "Active — shown at checkout" : "Inactive — hidden"}
          </label>
          {error && <p className="mt-3 text-xs font-bold text-brand">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className={clsx(
              "skew-cta mt-4 block bg-brand px-6 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer",
              busy && "opacity-60"
            )}
          >
            <span>{busy ? "Saving…" : editing === "new" ? "Create" : "Save"}</span>
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="mt-6 overflow-x-auto bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b-2 border-navy text-[11px] font-extrabold uppercase tracking-wider text-muted">
              <th className="px-4 py-3 text-start">Governorate</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-end">Fee</th>
              <th className="px-4 py-3 text-end">Est. Days</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No shipping zones yet. Add one to start charging shipping.
                </td>
              </tr>
            )}
            {zones.map((z) => (
              <tr
                key={z.id}
                className={clsx(
                  "border-b border-navy/5 hover:bg-brand/5",
                  !z.isActive && "opacity-60"
                )}
              >
                <td className="px-4 py-3 font-bold text-navy">
                  {z.governorate.en}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
                      z.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-navy/10 text-muted"
                    )}
                  >
                    <span
                      className={clsx(
                        "h-1.5 w-1.5 rounded-full",
                        z.isActive ? "bg-green-600" : "bg-muted"
                      )}
                    />
                    {z.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-end font-extrabold text-navy">
                  {z.fee.toLocaleString()} EGP
                </td>
                <td className="px-4 py-3 text-end text-muted">
                  {z.estimatedDays}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => toggleActive(z)}
                      disabled={togglingId === z.id}
                      aria-label={`${z.isActive ? "Deactivate" : "Activate"} ${
                        z.governorate.en
                      }`}
                      title={z.isActive ? "Deactivate" : "Activate"}
                      className={clsx(
                        "p-1.5 transition-colors cursor-pointer disabled:opacity-40",
                        z.isActive
                          ? "text-green-600 hover:text-green-700"
                          : "text-muted hover:text-navy"
                      )}
                    >
                      <Power size={15} />
                    </button>
                    <button
                      onClick={() => openEdit(z)}
                      aria-label={`Edit ${z.governorate.en}`}
                      className="p-1.5 text-muted hover:text-navy transition-colors cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(z)}
                      disabled={busy}
                      aria-label={`Delete ${z.governorate.en}`}
                      className="p-1.5 text-muted hover:text-brand transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
