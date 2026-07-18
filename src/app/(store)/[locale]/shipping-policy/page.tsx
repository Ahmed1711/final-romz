import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/legal/LegalPage";
import { getPolicy } from "@/content/policies";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shipping Policy — ROMZ",
  description: "Delivery coverage, times and fees for ROMZ orders across Egypt.",
};

export default async function ShippingPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage content={getPolicy("shipping-policy", locale as Locale)} ghost="SHIPPING" />
  );
}
