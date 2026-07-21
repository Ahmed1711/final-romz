"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Star, Trash2, BadgeCheck } from "lucide-react";
import clsx from "clsx";
import { approveReview, deleteReview } from "@/lib/adminApi";
import type { AdminReview } from "@/lib/types";

type Tab = "pending" | "approved" | "all";
const TABS: Tab[] = ["pending", "approved", "all"];

export default function ReviewsClient({ reviews }: { reviews: AdminReview[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Approvals/deletions applied this session, layered over server data so the
  // list updates instantly while router.refresh() catches up.
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const list = useMemo(
    () =>
      reviews
        .filter((r) => !removedIds.has(r.id))
        .map((r) => (approvedIds.has(r.id) ? { ...r, isApproved: true } : r)),
    [reviews, approvedIds, removedIds]
  );

  const counts = useMemo(
    () => ({
      pending: list.filter((r) => !r.isApproved).length,
      approved: list.filter((r) => r.isApproved).length,
      all: list.length,
    }),
    [list]
  );

  const filtered = list.filter((r) =>
    tab === "all" ? true : tab === "pending" ? !r.isApproved : r.isApproved
  );

  const approve = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      await approveReview(id);
      setApprovedIds((s) => new Set(s).add(id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not approve the review.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    setBusy(id);
    setError(null);
    try {
      await deleteReview(id);
      setRemovedIds((s) => new Set(s).add(id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the review.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="font-display uppercase text-2xl text-navy">Reviews</h1>
      <p className="mt-1 text-xs text-muted">
        Reviews are hidden from the store until you approve them.
      </p>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-1 border-b-2 border-navy/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "-mb-0.5 border-b-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer",
              tab === t
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-navy"
            )}
          >
            {t} {counts[t] ? `(${counts[t]})` : ""}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-xs font-bold text-brand">{error}</p>}

      {filtered.length === 0 ? (
        <p className="mt-8 border-2 border-dashed border-navy/20 bg-surface px-4 py-10 text-center text-sm text-muted">
          No {tab === "all" ? "" : tab} reviews.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="border-2 border-navy/10 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-brand">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={clsx(s <= r.rating ? "fill-brand" : "fill-transparent")}
                      />
                    ))}
                    <span className="ms-1 text-xs font-bold text-navy">
                      {r.rating}/5
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold uppercase text-navy">
                      {r.name}
                    </span>
                    {r.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-navy">
                        <BadgeCheck size={12} className="text-brand" /> Verified
                      </span>
                    )}
                    <span
                      className={clsx(
                        "px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                        r.isApproved
                          ? "bg-success text-white"
                          : "bg-brand text-white"
                      )}
                    >
                      {r.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!r.isApproved && (
                    <button
                      onClick={() => approve(r.id)}
                      disabled={busy === r.id}
                      className="flex items-center gap-1 border-2 border-success/40 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-success hover:bg-success hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check size={14} /> {busy === r.id ? "…" : "Approve"}
                    </button>
                  )}
                  <button
                    onClick={() => remove(r.id)}
                    disabled={busy === r.id}
                    aria-label="Delete review"
                    className="flex items-center gap-1 border-2 border-brand/30 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-brand hover:bg-brand hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {r.comment && (
                <p className="mt-3 border-s-2 border-navy/10 ps-3 text-sm text-navy/80">
                  {r.comment}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-4 text-[11px] text-muted">
                {r.productName && (
                  <span>
                    Product:{" "}
                    <span className="font-bold text-navy">{r.productName}</span>
                  </span>
                )}
                {r.createdAt && (
                  <span>{new Date(r.createdAt).toLocaleDateString("en-GB")}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
