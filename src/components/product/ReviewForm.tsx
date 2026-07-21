"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import clsx from "clsx";
import { ApiError, createReview } from "@/lib/api";
import Button from "@/components/ui/Button";

const inputCls =
  "w-full border-b-2 border-navy/30 bg-transparent py-2 text-sm text-navy outline-none focus:border-brand transition-colors placeholder:text-muted";

export default function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations("product");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    if (rating < 1) {
      setError(t("reviewPickRating"));
      return;
    }
    if (!name.trim()) {
      setError(t("reviewNameRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createReview(productId, {
        rating,
        name: name.trim(),
        comment: comment.trim() || undefined,
      });
      setDone(true);
      // Re-fetch the server component so the new review appears in the list.
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("reviewFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="border-2 border-brand bg-white px-6 py-5 text-sm font-bold text-navy">
        {t("reviewThanks")}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border-2 border-brand px-6 py-3 text-center font-display uppercase tracking-wider text-brand transition-colors hover:bg-brand hover:text-white cursor-pointer sm:w-auto"
      >
        {t("writeReview")}
      </button>
    );
  }

  const shownRating = hover || rating;

  return (
    <div className="border-2 border-navy/10 bg-white p-6">
      <h3 className="font-display uppercase text-lg text-navy">
        {t("reviewFormTitle")}
      </h3>

      {/* Star rating */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy">
          {t("reviewRatingLabel")}
        </p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              aria-label={`${star}`}
              className="cursor-pointer p-0.5 text-brand transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={clsx(
                  star <= shownRating ? "fill-brand" : "fill-transparent"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("reviewNameLabel")}
          className={inputCls}
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviewCommentLabel")}
          rows={3}
          maxLength={2000}
          className={clsx(inputCls, "resize-none")}
        />
      </div>

      {error && <p className="mt-3 text-xs font-bold text-brand">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={submit} disabled={submitting} aria-busy={submitting}>
          {submitting ? "…" : t("reviewSubmit")}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="text-xs font-extrabold uppercase tracking-wider text-muted hover:text-navy transition-colors cursor-pointer"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
