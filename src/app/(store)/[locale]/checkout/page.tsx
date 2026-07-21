import { setRequestLocale } from "next-intl/server";
import { getGovernorates } from "@/lib/api";
import { getStorefrontSettings } from "@/lib/storefrontSettings";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [governorates, settings] = await Promise.all([
    getGovernorates(),
    getStorefrontSettings(),
  ]);

  return <CheckoutClient governorates={governorates} settings={settings} />;
}
