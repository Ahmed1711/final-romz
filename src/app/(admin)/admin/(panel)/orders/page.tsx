import { getOrders } from "@/lib/api";
import { adminCall } from "@/lib/adminAuth";
import OrdersClient from "./OrdersClient";

export default async function AdminOrdersPage() {
  const orders = await adminCall((token) => getOrders(token));
  return <OrdersClient orders={orders} />;
}
