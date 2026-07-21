import type { StorefrontSettings } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  promoBar: {
    active: true,
    text: {
      en: "2 ITEMS = FREE SHIPPING - 3 ITEMS = 15% OFF + FREE SHIPPING",
      ar: "قطعتين = شحن مجاني - 3 قطع = خصم 15% + شحن مجاني",
    },
  },
  payments: {
    paymob: {
      active: true,
    },
  },
  freeShippingThreshold: null,
  lowStockThreshold: 5,
};

const textValue = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

export const normalizeStorefrontSettings = (value: unknown): StorefrontSettings => {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const promoBar =
    input.promoBar && typeof input.promoBar === "object"
      ? input.promoBar as Record<string, unknown>
      : {};
  const nestedText =
    promoBar.text && typeof promoBar.text === "object"
      ? promoBar.text as Record<string, unknown>
      : promoBar;
  const payments =
    input.payments && typeof input.payments === "object"
      ? input.payments as Record<string, unknown>
      : {};
  const paymob =
    payments.paymob && typeof payments.paymob === "object"
      ? payments.paymob as Record<string, unknown>
      : {};

  return {
    promoBar: {
      active:
        typeof input.promoBarActive === "boolean"
          ? input.promoBarActive
          : typeof promoBar.active === "boolean"
          ? promoBar.active
          : DEFAULT_STOREFRONT_SETTINGS.promoBar.active,
      text: {
        en: textValue(nestedText.en, DEFAULT_STOREFRONT_SETTINGS.promoBar.text.en),
        ar: textValue(nestedText.ar, DEFAULT_STOREFRONT_SETTINGS.promoBar.text.ar),
      },
    },
    payments: {
      paymob: {
        active:
          typeof paymob.active === "boolean"
            ? paymob.active
            : DEFAULT_STOREFRONT_SETTINGS.payments.paymob.active,
      },
    },
    freeShippingThreshold:
      input.freeShippingThreshold === null
        ? null
        : typeof input.freeShippingThreshold === "number" &&
            Number.isFinite(input.freeShippingThreshold) &&
            input.freeShippingThreshold >= 0
          ? input.freeShippingThreshold
          : DEFAULT_STOREFRONT_SETTINGS.freeShippingThreshold,
    lowStockThreshold:
      typeof input.lowStockThreshold === "number" &&
      Number.isInteger(input.lowStockThreshold) &&
      input.lowStockThreshold >= 0
        ? input.lowStockThreshold
        : DEFAULT_STOREFRONT_SETTINGS.lowStockThreshold,
  };
};

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  if (!API_URL) {
    throw new Error("Backend is not configured (NEXT_PUBLIC_API_URL is missing).");
  }

  const response = await fetch(`${API_URL}/storefront-settings`, {
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? `Store settings request failed (${response.status}).`);
  }
  return normalizeStorefrontSettings(body?.data?.settings);
}
