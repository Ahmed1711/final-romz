import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
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

  return <ContactClient />;
}
