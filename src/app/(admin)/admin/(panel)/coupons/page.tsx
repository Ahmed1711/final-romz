import { getCoupons } from "@/lib/api";
import { adminCall } from "@/lib/adminAuth";
import CouponsClient from "./CouponsClient";

export default async function AdminCouponsPage() {
  const coupons = await adminCall((token) => getCoupons(token));

  return <CouponsClient coupons={coupons} />;
}
