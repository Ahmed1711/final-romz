import { getContactMessages } from "@/lib/api";
import { adminCall } from "@/lib/adminAuth";
import ContactClient from "./ContactClient";

export default async function AdminContactPage() {
  const initial = await adminCall((token) =>
    getContactMessages({ page: 1, limit: 12 }, token)
  );

  return <ContactClient initial={initial} />;
}
