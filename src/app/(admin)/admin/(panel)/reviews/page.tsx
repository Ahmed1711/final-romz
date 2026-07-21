import { getAdminReviews } from "@/lib/api";
import { adminCall } from "@/lib/adminAuth";
import ReviewsClient from "./ReviewsClient";

export default async function AdminReviewsPage() {
  const reviews = await adminCall((token) => getAdminReviews(token));

  return <ReviewsClient reviews={reviews} />;
}
