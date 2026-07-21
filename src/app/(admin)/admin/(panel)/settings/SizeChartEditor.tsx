"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { updateSizeChart } from "@/lib/adminApi";
import type { LocalizedText, StorefrontSizeChart } from "@/lib/types";

// Backend limits — enforced in the UI so a save never gets rejected.
const MAX_COLUMNS = 12;
const MAX_ROWS = 50;
const MAX_CELL = 120;

const labelCls =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted";
const inputCls =
  "w-full border-2 border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand transition-colors";
const cellCls =
  "w-full min-w-24 border-2 border-navy/10 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-brand transition-colors";

/** Deep-clone so edits never mutate the loaded prop. */
const cloneChart = (c: StorefrontSizeChart): StorefrontSizeChart => ({
  isActive: c.isActive,
  title: { ...c.title },
  note: { ...c.note },
  columns: c.columns.map((col) => ({ ...col })),
  rows: c.rows.map((row) => [...row]),
});

const clampCell = (value: string) => value.slice(0, MAX_CELL);

export default function SizeChartEditor({
  sizeChart,
}: {
  sizeChart: StorefrontSizeChart;
}) {
  const router = useRouter();
  const [chart, setChart] = useState<StorefrontSizeChart>(() => cloneChart(sizeChart));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null
  );

  const cols = chart.columns.length;

  // ── Field mutators (keep rows aligned to columns at all times) ──
  const setActive = (isActive: boolean) =>
    setChart((c) => ({ ...c, isActive }));

  const setLocalized = (
    field: "title" | "note",
    lang: keyof LocalizedText,
    value: string
  ) => setChart((c) => ({ ...c, [field]: { ...c[field], [lang]: value } }));

  const setHeader = (ci: number, lang: keyof LocalizedText, value: string) =>
    setChart((c) => ({
      ...c,
      columns: c.columns.map((col, i) =>
        i === ci ? { ...col, [lang]: clampCell(value) } : col
      ),
    }));

  const addColumn = () =>
    setChart((c) =>
      c.columns.length >= MAX_COLUMNS
        ? c
        : {
            ...c,
            columns: [...c.columns, { en: "", ar: "" }],
            rows: c.rows.map((row) => [...row, ""]),
          }
    );

  const deleteColumn = (ci: number) =>
    setChart((c) => ({
      ...c,
      columns: c.columns.filter((_, i) => i !== ci),
      rows: c.rows.map((row) => row.filter((_, i) => i !== ci)),
    }));

  const setCell = (ri: number, ci: number, value: string) =>
    setChart((c) => ({
      ...c,
      rows: c.rows.map((row, r) =>
        r === ri ? row.map((cell, i) => (i === ci ? clampCell(value) : cell)) : row
      ),
    }));

  const addRow = () =>
    setChart((c) =>
      c.rows.length >= MAX_ROWS
        ? c
        : { ...c, rows: [...c.rows, new Array(c.columns.length).fill("")] }
    );

  const deleteRow = (ri: number) =>
    setChart((c) => ({ ...c, rows: c.rows.filter((_, i) => i !== ri) }));

  // ── Persistence ──
  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      // Full save must send columns AND rows together (backend shallow-merges).
      const saved = await updateSizeChart(chart);
      setChart(cloneChart(saved));
      setMessage({ kind: "ok", text: "Size chart saved." });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Size chart save failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Quick hide without losing the table (partial patch of isActive only).
  const quickHide = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await updateSizeChart({ isActive: false });
      setChart((c) => ({ ...c, isActive: false }));
      setMessage({ kind: "ok", text: "Size chart hidden from the store." });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not hide the chart.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-navy pb-2">
        <h2 className="font-display uppercase text-xl text-navy">Size Chart</h2>
        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-navy">
          <input
            type="checkbox"
            checked={chart.isActive}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Show on store
        </label>
      </div>

      <p className="mt-3 text-xs text-muted">
        One store-wide size chart, shown via a &quot;Size Guide&quot; button on
        product pages. Max {MAX_COLUMNS} columns, {MAX_ROWS} rows, {MAX_CELL}{" "}
        characters per cell.
      </p>

      {/* Title + Note */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Title (English)</label>
          <input
            value={chart.title.en}
            maxLength={MAX_CELL}
            onChange={(e) => setLocalized("title", "en", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Title (Arabic)</label>
          <input
            value={chart.title.ar}
            maxLength={MAX_CELL}
            dir="rtl"
            onChange={(e) => setLocalized("title", "ar", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Note (English, optional)</label>
          <input
            value={chart.note.en}
            maxLength={MAX_CELL}
            onChange={(e) => setLocalized("note", "en", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Note (Arabic, optional)</label>
          <input
            value={chart.note.ar}
            maxLength={MAX_CELL}
            dir="rtl"
            onChange={(e) => setLocalized("note", "ar", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Column headers */}
      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-display uppercase text-sm text-navy">
          Columns ({cols}/{MAX_COLUMNS})
        </h3>
        <button
          type="button"
          onClick={addColumn}
          disabled={cols >= MAX_COLUMNS}
          className="inline-flex items-center gap-1 border-2 border-navy px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-navy cursor-pointer"
        >
          <Plus size={14} /> Add column
        </button>
      </div>

      {cols === 0 ? (
        <p className="mt-3 border-2 border-dashed border-navy/20 bg-surface px-3 py-4 text-center text-xs text-muted">
          No columns yet. Add a column to start building the table.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {chart.columns.map((col, ci) => (
            <div key={ci} className="flex items-end gap-2">
              <span className="w-6 pb-2 text-center text-xs font-extrabold text-muted">
                {ci + 1}
              </span>
              <div className="flex-1">
                <label className={labelCls}>Header EN</label>
                <input
                  value={col.en}
                  maxLength={MAX_CELL}
                  placeholder="e.g. Chest (cm)"
                  onChange={(e) => setHeader(ci, "en", e.target.value)}
                  className={cellCls}
                />
              </div>
              <div className="flex-1">
                <label className={labelCls}>Header AR</label>
                <input
                  value={col.ar}
                  maxLength={MAX_CELL}
                  dir="rtl"
                  placeholder="مثال: الصدر (سم)"
                  onChange={(e) => setHeader(ci, "ar", e.target.value)}
                  className={cellCls}
                />
              </div>
              <button
                type="button"
                onClick={() => deleteColumn(ci)}
                aria-label={`Delete column ${ci + 1}`}
                className="mb-1 p-1.5 text-muted hover:text-brand transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Body rows */}
      {cols > 0 && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-display uppercase text-sm text-navy">
              Rows ({chart.rows.length}/{MAX_ROWS})
            </h3>
            <button
              type="button"
              onClick={addRow}
              disabled={chart.rows.length >= MAX_ROWS}
              className="inline-flex items-center gap-1 border-2 border-navy px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-navy cursor-pointer"
            >
              <Plus size={14} /> Add row
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {chart.columns.map((col, ci) => (
                    <th
                      key={ci}
                      className="border-2 border-navy/15 bg-surface px-2 py-1.5 text-start text-[11px] font-extrabold uppercase tracking-wide text-navy"
                    >
                      {col.en || col.ar || `Col ${ci + 1}`}
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {chart.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={cols + 1}
                      className="border-2 border-dashed border-navy/15 px-3 py-4 text-center text-xs text-muted"
                    >
                      No rows yet. Add a row to fill in measurements.
                    </td>
                  </tr>
                ) : (
                  chart.rows.map((row, ri) => (
                    <tr key={ri}>
                      {chart.columns.map((_, ci) => (
                        <td key={ci} className="border border-navy/10 p-1">
                          <input
                            value={row[ci] ?? ""}
                            maxLength={MAX_CELL}
                            onChange={(e) => setCell(ri, ci, e.target.value)}
                            className={cellCls}
                          />
                        </td>
                      ))}
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => deleteRow(ri)}
                          aria-label={`Delete row ${ri + 1}`}
                          className="p-1.5 text-muted hover:text-brand transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {message && (
        <p
          className={clsx(
            "mt-4 text-xs font-bold",
            message.kind === "ok" ? "text-success" : "text-brand"
          )}
        >
          {message.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={clsx(
            "skew-cta bg-brand px-6 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer",
            busy && "opacity-60"
          )}
        >
          <span>{busy ? "Saving..." : "Save Size Chart"}</span>
        </button>
        {chart.isActive && (
          <button
            type="button"
            onClick={quickHide}
            disabled={busy}
            className={clsx(
              "border-2 border-navy px-6 py-2.5 text-sm font-display uppercase tracking-wider text-navy hover:bg-navy hover:text-white transition-colors cursor-pointer",
              busy && "opacity-60"
            )}
          >
            Hide from store
          </button>
        )}
      </div>
    </div>
  );
}
