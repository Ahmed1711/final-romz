import Link from "next/link";
import { getStorefrontSettings } from "@/lib/storefrontSettings";
import SettingsClient from "./SettingsClient";
import FaqEditor from "./FaqEditor";
import ShippingReturnsEditor from "./ShippingReturnsEditor";
import ContactInfoEditor from "./ContactInfoEditor";

export default async function AdminSettingsPage() {
  const settings = await getStorefrontSettings();

  return (
    <div className="p-6">
      <h1 className="font-display uppercase text-2xl text-navy">
        Store Settings
      </h1>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
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

        <div className="space-y-6">
          <ContactInfoEditor contactInfo={settings.contactInfo} />
          <ShippingReturnsEditor shippingReturns={settings.shippingReturns} />
          <FaqEditor faqs={settings.faqs} />
        </div>
      </div>
    </div>
  );
}
