"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { updateFaqs } from "@/lib/adminApi";
import type { Faq, LocalizedText } from "@/lib/types";

// Backend limits.
const MAX_ITEMS = 50;
const MAX_ANSWER = 2000;

const labelCls =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted";
const inputCls =
  "w-full border-2 border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand transition-colors";

const cloneFaqs = (faqs: Faq[]): Faq[] =>
  faqs.map((f) => ({
    ...(f.id ? { id: f.id } : {}),
    question: { ...f.question },
    answer: { ...f.answer },
    isActive: f.isActive,
    order: f.order,
  }));

export default function FaqEditor({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Faq[]>(() => cloneFaqs(faqs));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null
  );

  const patchItem = (index: number, patch: Partial<Faq>) =>
    setItems((list) => list.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const patchLocalized = (
    index: number,
    field: "question" | "answer",
    lang: keyof LocalizedText,
    value: string
  ) =>
    setItems((list) =>
      list.map((f, i) =>
        i === index ? { ...f, [field]: { ...f[field], [lang]: value } } : f
      )
    );

  const addItem = () =>
    setItems((list) =>
      list.length >= MAX_ITEMS
        ? list
        : [
            ...list,
            {
              question: { en: "", ar: "" },
              answer: { en: "", ar: "" },
              isActive: true,
              order: list.length,
            },
          ]
    );

  const deleteItem = (index: number) =>
    setItems((list) => list.filter((_, i) => i !== index));

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await updateFaqs(items);
      setItems(cloneFaqs(saved));
      setMessage({ kind: "ok", text: "FAQ saved." });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "FAQ save failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-navy pb-2">
        <h2 className="font-display uppercase text-xl text-navy">FAQ</h2>
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= MAX_ITEMS}
          className="inline-flex items-center gap-1 border-2 border-navy px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-navy cursor-pointer"
        >
          <Plus size={14} /> Add question
        </button>
      </div>

      <p className="mt-3 text-xs text-muted">
        Shown on the home page. Only active questions appear, sorted by order.
        Max {MAX_ITEMS} questions.
      </p>

      {items.length === 0 ? (
        <p className="mt-4 border-2 border-dashed border-navy/20 bg-surface px-3 py-6 text-center text-xs text-muted">
          No questions yet. Add one to build the FAQ.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((faq, i) => (
            <div key={faq.id ?? i} className="border-2 border-navy/10 bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-navy">
                  <input
                    type="checkbox"
                    checked={faq.isActive}
                    onChange={(e) => patchItem(i, { isActive: e.target.checked })}
                    className="h-4 w-4 accent-brand"
                  />
                  Active
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted">
                    Order
                    <input
                      type="number"
                      value={faq.order}
                      onChange={(e) =>
                        patchItem(i, { order: Math.trunc(Number(e.target.value)) })
                      }
                      className="w-16 border-2 border-navy/15 bg-white px-2 py-1 text-sm text-navy outline-none focus:border-brand"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => deleteItem(i)}
                    aria-label={`Delete question ${i + 1}`}
                    className="p-1.5 text-muted hover:text-brand transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Question (English)</label>
                  <input
                    value={faq.question.en}
                    onChange={(e) => patchLocalized(i, "question", "en", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Question (Arabic)</label>
                  <input
                    value={faq.question.ar}
                    dir="rtl"
                    onChange={(e) => patchLocalized(i, "question", "ar", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Answer (English)</label>
                  <textarea
                    value={faq.answer.en}
                    maxLength={MAX_ANSWER}
                    rows={3}
                    onChange={(e) => patchLocalized(i, "answer", "en", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Answer (Arabic)</label>
                  <textarea
                    value={faq.answer.ar}
                    maxLength={MAX_ANSWER}
                    rows={3}
                    dir="rtl"
                    onChange={(e) => patchLocalized(i, "answer", "ar", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
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

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className={clsx(
          "skew-cta mt-4 bg-brand px-6 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer",
          busy && "opacity-60"
        )}
      >
        <span>{busy ? "Saving..." : "Save FAQ"}</span>
      </button>
    </div>
  );
}
