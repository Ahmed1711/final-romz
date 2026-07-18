import { setRequestLocale } from "next-intl/server";
import PaymentCallbackClient from "./PaymentCallbackClient";

export default async function PaymentCallbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PaymentCallbackClient />;
}
