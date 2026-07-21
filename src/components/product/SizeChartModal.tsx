"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { lt } from "@/lib/format";
import type { Locale, SizeChart } from "@/lib/types";

/** True when the chart has at least one column and one row to render. */
export function hasSizeChart(chart?: SizeChart): boolean {
  return (
    !!chart && chart.columns.length > 0 && chart.rows.length > 0
  );
}

export default function SizeChartModal({
  chart,
  onClose,
}: {
  chart: SizeChart;
  onClose: () => void;
}) {
  const t = useTranslations("product");
  const locale = useLocale() as Locale;

  // Close on Escape, and lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const { columns, rows, note } = chart;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg border-2 border-navy bg-white shadow-[10px_10px_0_0_var(--color-navy)]">
        <div className="flex items-center justify-between border-b-2 border-navy px-5 py-4">
          <h2 className="font-display uppercase text-xl text-navy">
            {t("sizeChart")}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-navy hover:text-brand transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto p-5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className="border-2 border-navy/15 bg-surface px-3 py-2 text-start font-extrabold uppercase tracking-wide text-navy"
                  >
                    {lt(c, locale)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {/* Render defensively against the column count — cells may be
                      missing on older data. */}
                  {columns.map((_, c) => (
                    <td
                      key={c}
                      className="border-2 border-navy/15 px-3 py-2 font-bold text-navy"
                    >
                      {row[c] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {note && lt(note, locale) && (
            <p className="mt-4 text-xs text-muted">{lt(note, locale)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
