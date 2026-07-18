import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/legal/LegalPage";
import { getPolicy } from "@/content/policies";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Terms & Conditions — ROMZ",
  description: "The terms and conditions that govern your use of ROMZ and your purchases.",
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage content={getPolicy("terms", locale as Locale)} ghost="TERMS" />;
}
