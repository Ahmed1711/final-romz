import Link from "next/link";
import { getShippingZones } from "@/lib/api";
import { getStorefrontSettings } from "@/lib/storefrontSettings";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const [zones, settings] = await Promise.all([
    getShippingZones(),
    getStorefrontSettings(),
  ]);

  return (
    <div className="p-6">
      <h1 className="font-display uppercase text-2xl text-navy">
        Store Settings
      </h1>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b-2 border-navy pb-2">
            <h2 className="font-display uppercase text-xl text-navy">
              Shipping Zones
            </h2>
            <Link
              href="/admin/shipping"
              className="text-xs font-extrabold uppercase tracking-wider text-brand hover:text-brand-dark"
            >
              Manage -&gt;
            </Link>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="py-2 text-start">Governorate</th>
                <th className="py-2 text-end">Fee</th>
                <th className="py-2 text-end">Est. Days</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-b border-navy/5">
                  <td className="py-2.5 font-bold text-navy">
                    {z.governorate.en}{" "}
                    <span className="text-xs text-muted">({z.governorate.ar})</span>
                  </td>
                  <td className="py-2.5 text-end font-extrabold text-navy">
                    {z.fee} EGP
                  </td>
                  <td className="py-2.5 text-end text-muted">{z.estimatedDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="border-t-4 border-brand bg-white p-6 shadow-sm">
            <h2 className="font-display uppercase text-xl text-navy">
              Free Shipping Threshold
            </h2>
            <p className="mt-2 font-display text-3xl text-brand">
              {settings.freeShippingThreshold === null
                ? "Disabled"
                : `${settings.freeShippingThreshold.toLocaleString()} EGP`}
            </p>
            <p className="mt-1 text-xs text-muted">
              {settings.freeShippingThreshold === null
                ? "Every order uses its matching shipping-zone fee."
                : "Eligibility is checked after the coupon discount."}
            </p>
          </div>

          <div className="bg-white p-6 shadow-sm">
            <h2 className="font-display uppercase text-xl text-navy">
              Category Order
            </h2>
            <p className="mt-2 text-sm text-muted">
              Control the order of header links and home category tiles from
              the category editor.
            </p>
            <Link
              href="/admin/categories"
              className="skew-cta mt-4 inline-flex bg-navy px-5 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand transition-colors"
            >
              <span>Manage Categories</span>
            </Link>
          </div>

          <SettingsClient settings={settings} />
        </div>
      </div>
    </div>
  );
}
