import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/legal/LegalPage";
import { getPolicy } from "@/content/policies";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Privacy Policy — ROMZ",
  description: "How ROMZ collects, uses and protects your personal information.",
};

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage content={getPolicy("privacy-policy", locale as Locale)} ghost="PRIVACY" />
  );
}
