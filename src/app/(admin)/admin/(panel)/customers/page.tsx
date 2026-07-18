import { getOrders } from "@/lib/api";
import { adminCall } from "@/lib/adminAuth";
import CustomersClient from "./CustomersClient";

export default async function AdminCustomersPage() {
  const orders = await adminCall((token) => getOrders(token));
  return <CustomersClient orders={orders} />;
}
