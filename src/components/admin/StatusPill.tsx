import clsx from "clsx";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-surface text-navy border border-navy/20",
  confirmed: "bg-navy text-white",
  processing: "bg-navy/75 text-white",
  shipped: "bg-amber text-white",
  delivered: "bg-success text-white",
  returned: "bg-purple text-white",
  cancelled: "bg-brand text-white",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}

export function PaymentPill({
  method,
  status,
}: {
  method: PaymentMethod;
  status: PaymentStatus;
}) {
  if (method === "cod") {
    return (
      <span className="inline-block border border-navy/20 bg-surface px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-navy">
        COD
      </span>
    );
  }
  return (
    <span
      className={clsx(
        "inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white",
        status === "paid" ? "bg-navy" : "bg-muted"
      )}
    >
      {status}
    </span>
  );
}
