import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getStorefrontSettings } from "@/lib/storefrontSettings";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us — ROMZ",
  description: "Get in touch with the ROMZ team. We usually reply within a day.",
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getStorefrontSettings();

  return <ContactClient contactInfo={settings.contactInfo} />;
}
