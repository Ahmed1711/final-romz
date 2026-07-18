import { setRequestLocale } from "next-intl/server";
import { getShippingZones } from "@/lib/api";
import { getStorefrontSettings } from "@/lib/storefrontSettings";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [zones, settings] = await Promise.all([
    getShippingZones(),
    getStorefrontSettings(),
  ]);

  return <CheckoutClient zones={zones} settings={settings} />;
}
