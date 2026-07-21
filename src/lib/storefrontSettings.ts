import type { LocalizedText, StorefrontSettings, StorefrontSizeChart } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

/** Backend default (already seeded in the DB) — used as a fallback. */
export const DEFAULT_SIZE_CHART: StorefrontSizeChart = {
  isActive: true,
  title: { en: "Size Guide", ar: "دليل المقاسات" },
  note: { en: "", ar: "" },
  columns: [
    { en: "Size", ar: "المقاس" },
    { en: "Chest (cm)", ar: "الصدر (سم)" },
    { en: "Length (cm)", ar: "الطول (سم)" },
  ],
  rows: [
    ["S", "39", "60"],
    ["M", "42.5", "63"],
    ["L", "45", "67"],
    ["XL", "49.5", "67.5"],
  ],
};

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
  sizeChart: DEFAULT_SIZE_CHART,
};

const textValue = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const localizedValue = (value: unknown, fallback: LocalizedText): LocalizedText => {
  const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return { en: textValue(v.en, fallback.en), ar: textValue(v.ar, fallback.ar) };
};

/**
 * Normalize the store-wide size chart. Keeps every row aligned to the column
 * count (pads/truncates) so the table never drifts. An entirely absent chart
 * falls back to the seeded default; an explicitly emptied one stays empty
 * (the storefront hides an empty or inactive chart).
 */
export const normalizeSizeChart = (value: unknown): StorefrontSizeChart => {
  if (!value || typeof value !== "object") return DEFAULT_SIZE_CHART;
  const input = value as Record<string, unknown>;
  const columns: LocalizedText[] = (
    Array.isArray(input.columns) ? input.columns : []
  ).map((c) => localizedValue(c, { en: "", ar: "" }));
  const cols = columns.length;
  const rows: string[][] = (Array.isArray(input.rows) ? input.rows : [])
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => {
      const cells = row.map((cell) => (cell === null || cell === undefined ? "" : String(cell)));
      return cols === 0 ? cells : Array.from({ length: cols }, (_, i) => cells[i] ?? "");
    });
  return {
    isActive: typeof input.isActive === "boolean" ? input.isActive : true,
    title: localizedValue(input.title, DEFAULT_SIZE_CHART.title),
    note: localizedValue(input.note, { en: "", ar: "" }),
    columns,
    rows,
  };
};

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
    sizeChart: normalizeSizeChart(input.sizeChart),
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
