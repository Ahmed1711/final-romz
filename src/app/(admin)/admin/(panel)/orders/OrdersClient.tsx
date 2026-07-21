"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  ExternalLink,
  Eye,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Truck,
  User,
  X,
} from "lucide-react";
import clsx from "clsx";
import { PaymentPill, StatusPill } from "@/components/admin/StatusPill";
import {
  cancelMylerzPackage,
  createMylerzShipment,
  getMylerzCityZones,
  getMylerzExpectedCharges,
  getMylerzPackageDetails,
  getMylerzPackageStatus,
  getMylerzPackageTracking,
  getMylerzPackageTrackingUrl,
  getMylerzWarehouses,
  updateOrderStatus,
  type MylerzCharges,
  type MylerzCity,
  type MylerzShipmentPayload,
  type MylerzWarehouse,
} from "@/lib/adminApi";
import type { Order, OrderStatus } from "@/lib/types";

const TABS: ("all" | OrderStatus)[] = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const FULFILLMENT_STEPS: { key: OrderStatus; label: string; note?: string }[] = [
  { key: "pending", label: "Order Placed" },
  { key: "processing", label: "Pending Fulfillment", note: "Waiting for warehouse processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState<"all" | "paymob" | "cod">("all");
  const [selected, setSelected] = useState<Order | null>(null);
  // Status changes applied this session, layered over the server data so the
  // table updates instantly while router.refresh() catches up.
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, OrderStatus>
  >({});
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const list = useMemo(
    () =>
      orders.map((o) =>
        statusOverrides[o.id] ? { ...o, status: statusOverrides[o.id] } : o
      ),
    [orders, statusOverrides]
  );

  const applyStatus = async (order: Order, status: OrderStatus) => {
    setBusy(true);
    setActionError(null);
    try {
      await updateOrderStatus(order.id, status);
      setStatusOverrides((m) => ({ ...m, [order.id]: status }));
      setSelected((s) => (s && s.id === order.id ? { ...s, status } : s));
      setNextStatus("");
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Status update failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const o of list) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [list]);

  const filtered = useMemo(
    () =>
      list.filter((o) => {
        if (tab !== "all" && o.status !== tab) return false;
        if (payment !== "all" && o.paymentMethod !== payment) return false;
        if (query) {
          const q = query.toLowerCase();
          if (
            !o.orderNumber.toLowerCase().includes(q) &&
            !o.customer.name.toLowerCase().includes(q) &&
            !o.customer.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
          )
            return false;
        }
        return true;
      }),
    [list, tab, payment, query]
  );

  const stepIndex = (status: OrderStatus) => {
    if (status === "pending" || status === "confirmed") return 1;
    if (status === "processing") return 1;
    if (status === "shipped") return 2;
    if (status === "delivered") return 3;
    return -1;
  };

  return (
    <div className="relative p-6">
      <h1 className="font-display uppercase text-2xl text-navy">
        Orders
      </h1>

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

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="flex items-center gap-2 border-2 border-navy/15 bg-white px-3 py-2.5 text-xs font-extrabold uppercase text-navy cursor-pointer hover:border-brand">
          <CalendarRange size={14} className="text-brand" /> Last 30 Days
        </button>
        <select
          value={payment}
          onChange={(e) => setPayment(e.target.value as typeof payment)}
          className="border-2 border-navy/15 bg-white px-3 py-2.5 text-xs font-extrabold uppercase text-navy outline-none focus:border-brand"
        >
          <option value="all">Payment Method</option>
          <option value="paymob">Paymob</option>
          <option value="cod">COD</option>
        </select>
        <div className="flex min-w-64 flex-1 items-center gap-2 border-2 border-navy/15 bg-white px-3 py-2.5">
          <Search size={14} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Order # or Phone..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-x-auto bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b-2 border-navy text-[11px] font-extrabold uppercase tracking-wider text-muted">
              <th className="px-4 py-3 text-start">Order #</th>
              <th className="px-4 py-3 text-start">Customer</th>
              <th className="px-4 py-3 text-start">Items</th>
              <th className="px-4 py-3 text-start">Total</th>
              <th className="px-4 py-3 text-start">Payment</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-start">Date</th>
              <th className="px-4 py-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                onClick={() => {
                  setSelected(o);
                  setNextStatus("");
                  setActionError(null);
                }}
                className={clsx(
                  "cursor-pointer border-b border-navy/5 transition-colors hover:bg-brand/5",
                  o.status === "cancelled" && "opacity-60"
                )}
              >
                <td className="px-4 py-4 font-display text-navy" dir="ltr">
                  {o.orderNumber}
                </td>
                <td className="px-4 py-4">
                  <p className="font-extrabold text-navy">{o.customer.name}</p>
                  <p className="text-xs text-muted" dir="ltr">
                    {o.customer.phone}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-bold text-navy">
                    {o.items.reduce((s, i) => s + i.qty, 0)} Items
                  </p>
                  <p className="max-w-40 truncate text-xs text-muted">
                    {o.items.map((i) => i.name.en).join(", ")}
                  </p>
                </td>
                <td className="px-4 py-4 font-extrabold text-brand">
                  {o.total.toLocaleString()} EGP
                </td>
                <td className="px-4 py-4">
                  <PaymentPill method={o.paymentMethod} status={o.paymentStatus} />
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={o.status} />
                </td>
                <td className="px-4 py-4 text-xs text-muted">
                  {new Date(o.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                  ,{" "}
                  {new Date(o.createdAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2 text-navy">
                    <Eye size={16} className="hover:text-brand" />
                    {o.status !== "cancelled" && (
                      <Printer size={16} className="hover:text-brand" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
          <span>
            Showing 1 to {filtered.length} of {list.length} orders
          </span>
        </div>
      </div>

      {/* Detail side panel */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-navy/40"
            onClick={() => setSelected(null)}
          />
          <aside className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="border-b-2 border-navy p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl text-navy" dir="ltr">
                    {selected.orderNumber}
                  </h2>
                  <p className="mt-1 text-xs uppercase text-muted">
                    {new Date(selected.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    •{" "}
                    {new Date(selected.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-navy hover:text-brand cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 p-5">
              {/* Customer */}
              <section>
                <h3 className="flex items-center gap-2 font-display uppercase text-lg text-navy">
                  <User size={16} className="text-brand" /> Customer Info
                </h3>
                <div className="mt-3 border-s-4 border-navy bg-surface p-4 text-sm">
                  <p className="font-extrabold text-navy">
                    {selected.customer.name}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-muted" dir="ltr">
                    <Phone size={12} /> {selected.customer.phone}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-muted">
                    <Mail size={12} /> {selected.customer.email}
                  </p>
                  <p className="mt-3 text-xs font-extrabold uppercase text-navy">
                    Shipping Address:
                  </p>
                  <p className="text-muted">
                    {selected.shippingAddress.street},{" "}
                    {selected.shippingAddress.city}
                    {selected.shippingAddress.apartment
                      ? `, ${selected.shippingAddress.apartment}`
                      : ""}
                    <br />
                    {selected.shippingAddress.governorate}, Egypt
                  </p>
                </div>
              </section>

              {/* Fulfillment */}
              {selected.status !== "cancelled" && (
                <section>
                  <h3 className="flex items-center gap-2 font-display uppercase text-lg text-navy">
                    <Truck size={16} className="text-brand" /> Fulfillment
                  </h3>
                  <div className="mt-4 space-y-0">
                    {FULFILLMENT_STEPS.map((step, i) => {
                      const idx = stepIndex(selected.status);
                      const done = i < idx;
                      const active = i === idx;
                      return (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span
                              className={clsx(
                                "h-3.5 w-3.5 rounded-full",
                                done && "bg-navy",
                                active && "bg-brand ring-4 ring-brand/20",
                                !done && !active && "bg-navy/15"
                              )}
                            />
                            {i < FULFILLMENT_STEPS.length - 1 && (
                              <span
                                className={clsx(
                                  "w-0.5 flex-1 min-h-8",
                                  i < idx ? "bg-navy" : "bg-navy/10"
                                )}
                              />
                            )}
                          </div>
                          <div className="pb-6">
                            <p
                              className={clsx(
                                "text-sm font-extrabold uppercase",
                                active
                                  ? "text-brand"
                                  : done
                                    ? "text-navy"
                                    : "text-navy/30"
                              )}
                            >
                              {step.label}
                            </p>
                            {active && step.note && (
                              <p className="text-xs text-muted">{step.note}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <MylerzPanel
                key={selected.id}
                order={selected}
                onOrderPatch={(patch) => {
                  setSelected((s) => (s && s.id === selected.id ? { ...s, ...patch } : s));
                  router.refresh();
                }}
              />

              {/* Items */}
              <section>
                <h3 className="font-display uppercase text-lg text-navy">
                  Items ({selected.items.reduce((s, i) => s + i.qty, 0)})
                </h3>
                <div className="mt-3 space-y-3">
                  {selected.items.map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-center gap-3 bg-surface p-3"
                    >
                      <div className="h-14 w-14 shrink-0 bg-white">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-extrabold text-navy">
                          {item.name.en}
                        </p>
                        <p className="text-xs text-muted">
                          Color: {item.colorName} | Size: {item.size}
                        </p>
                        <p className="text-xs font-bold text-navy">
                          {item.qty} × {item.unitPrice.toLocaleString()} EGP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Totals */}
              <section className="space-y-1.5 border-t-2 border-navy/10 pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{selected.subtotal.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span>
                    {selected.shippingFee === 0
                      ? "0 EGP (Free)"
                      : `${selected.shippingFee.toLocaleString()} EGP`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-base font-extrabold">
                  <span className="text-navy">Total</span>
                  <span className="text-brand">
                    {selected.total.toLocaleString()} EGP
                  </span>
                </div>
              </section>
            </div>

            {/* Status controls */}
            <div className="space-y-3 border-t-2 border-navy/10 p-5">
              {selected.status !== "cancelled" && (
                <div className="space-y-3">
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                    className="w-full border-2 border-navy/15 bg-white px-3 py-2.5 text-xs font-extrabold uppercase text-navy outline-none focus:border-brand"
                  >
                    <option value="">Change status…</option>
                    {(
                      [
                        "pending",
                        "confirmed",
                        "processing",
                        "shipped",
                        "delivered",
                        "cancelled",
                        "returned",
                      ] as OrderStatus[]
                    )
                      .filter((s) => s !== selected.status)
                      .map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => {
                      if (!nextStatus) return;
                      if (
                        nextStatus === "cancelled" &&
                        !window.confirm(
                          `Cancel order ${selected.orderNumber}? Stock will be restored and the customer will be emailed.`
                        )
                      ) {
                        return;
                      }
                      applyStatus(selected, nextStatus);
                    }}
                    disabled={busy || !nextStatus}
                    className="skew-cta w-full bg-brand py-3.5 font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <span>{busy ? "…" : "Apply"}</span>
                  </button>
                </div>
              )}
              {actionError && (
                <p className="text-xs font-bold text-brand">{actionError}</p>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

const shipmentInputCls =
  "w-full border-2 border-navy/15 bg-white px-3 py-2.5 text-xs font-bold text-navy outline-none focus:border-brand";
const shipmentLabelCls =
  "mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-muted";

const optionLabel = (enName: string, arName: string) =>
  arName ? `${enName} — ${arName}` : enName;

// Mylerz rejects the shipment (INPUT_INVALID) unless the recipient mobile is a
// valid Egyptian number: 11 digits starting 01, optionally with a +20/20 prefix.
const isValidEgyptMobile = (raw: string) =>
  /^(?:\+?20|0)1[0125]\d{8}$/.test(raw.replace(/[\s()-]/g, ""));

const resultText = (value: unknown) =>
  typeof value === "string"
    ? value
    : JSON.stringify(value, null, 2) ?? String(value);

const trackingUrlFrom = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const direct =
    record.url ??
    record.trackingUrl ??
    record.trackingURL ??
    (record.data as Record<string, unknown> | undefined)?.url ??
    (record.data as Record<string, unknown> | undefined)?.trackingUrl;
  return typeof direct === "string" ? direct : null;
};

function MylerzPanel({
  order,
  onOrderPatch,
}: {
  order: Order;
  onOrderPatch: (patch: Partial<Order>) => void;
}) {
  // New orders carry the customer's picked Mylerz codes, so the destination is
  // auto-filled and shipping is one click. Legacy orders start blank.
  const orderGovCode = order.shippingAddress.governorateCode ?? "";
  const orderZoneCode = order.shippingAddress.zoneCode ?? "";
  const autoFilled = Boolean(orderGovCode && orderZoneCode);

  const [warehouses, setWarehouses] = useState<MylerzWarehouse[]>([]);
  const [cities, setCities] = useState<MylerzCity[]>([]);
  const [warehouseName, setWarehouseName] = useState("");
  const [cityCode, setCityCode] = useState(orderGovCode);
  const [zoneCode, setZoneCode] = useState(orderZoneCode);
  const [weight, setWeight] = useState(1);
  const [length, setLength] = useState(20);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(10);
  const [notes, setNotes] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [charges, setCharges] = useState<MylerzCharges | null>(null);

  const awb = order.courier?.trackingNumber ?? "";
  const isCod = order.paymentMethod === "cod";
  const selectedCity = cities.find((c) => c.code === cityCode);
  const zoneOptions = selectedCity?.zones ?? [];
  const phoneOk = isValidEgyptMobile(order.customer.phone);
  // Mylerz rejects free-text addresses and invalid mobiles, so a city + zone
  // code and a valid recipient phone are required before shipping.
  const canShip = Boolean(cityCode && zoneCode) && phoneOk;

  useEffect(() => {
    // The panel is keyed by order id and remounts per order, so the initial
    // loading/error state is already fresh — no synchronous reset needed here.
    let alive = true;
    Promise.all([getMylerzWarehouses(), getMylerzCityZones()])
      .then(([warehouseList, cityList]) => {
        if (!alive) return;
        setWarehouses(warehouseList);
        setCities(cityList);
        // Default to the account's warehouse (usually the only one).
        if (warehouseList[0]) setWarehouseName(warehouseList[0].name);
      })
      .catch((error) => {
        if (!alive) return;
        setConfigError(
          error instanceof Error
            ? `Could not load Mylerz cities/warehouses: ${error.message}`
            : "Could not load Mylerz cities/warehouses."
        );
      })
      .finally(() => {
        if (alive) setLoadingConfig(false);
      });
    return () => {
      alive = false;
    };
  }, [order.id]);

  // Reset the zone whenever the city changes so a stale zone is never sent.
  const selectCity = (code: string) => {
    setCityCode(code);
    setZoneCode("");
    setCharges(null);
  };

  const previewFee = async () => {
    if (!canShip || !warehouseName) return;
    setBusy("charges");
    setMessage(null);
    try {
      const result = await getMylerzExpectedCharges({
        codValue: isCod ? order.total : 0,
        warehouseName,
        customerZoneCode: zoneCode,
        packageWeight: weight,
        paymentTypeCode: isCod ? "COD" : "PP",
      });
      setCharges(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fee preview failed.");
    } finally {
      setBusy(null);
    }
  };

  const createShipment = async () => {
    if (!phoneOk) {
      setMessage("The order's recipient phone must be a valid Egyptian mobile.");
      return;
    }
    if (!canShip) {
      setMessage("Pick a city and zone before creating the shipment.");
      return;
    }
    setBusy("shipment");
    setMessage(null);
    setActionResult(null);
    try {
      // Send the real Mylerz codes for the destination; the backend fills the
      // customer contact and payment (COD/PP) from the order itself.
      const overrides: MylerzShipmentPayload = {
        warehouseName: warehouseName || undefined,
        cityCode,
        neighborhoodCode: zoneCode,
        totalWeight: weight,
        dimensions: { length, width, height },
      };
      if (notes.trim()) overrides.specialNotes = notes.trim();

      const result = await createMylerzShipment(order.id, overrides);
      onOrderPatch({ courier: result.courier });
      setMessage("Mylerz shipment created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Shipment creation failed.");
    } finally {
      setBusy(null);
    }
  };

  const runPackageAction = async (
    key: string,
    action: (trackingNumber: string) => Promise<unknown>
  ) => {
    if (!awb) return;
    setBusy(key);
    setMessage(null);
    setActionResult(null);
    try {
      const result = await action(awb);
      if (key === "tracking-url") {
        const url = trackingUrlFrom(result);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }
      setActionResult(resultText(result));
      if (key === "cancel") setMessage("Mylerz package cancel request sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mylerz request failed.");
    } finally {
      setBusy(null);
    }
  };

  const packageFields = [
    { label: "Weight", value: weight, setValue: setWeight, step: 0.1 },
    { label: "L", value: length, setValue: setLength, step: 1 },
    { label: "W", value: width, setValue: setWidth, step: 1 },
    { label: "H", value: height, setValue: setHeight, step: 1 },
  ];

  return (
    <section>
      <h3 className="flex items-center gap-2 font-display uppercase text-lg text-navy">
        <PackageCheck size={16} className="text-brand" /> Mylerz Shipment
      </h3>

      {(awb || order.courier?.pickupOrderCode) && (
        <div className="mt-3 grid gap-2 border-s-4 border-brand bg-brand/5 p-3 text-xs">
          {awb && (
            <p>
              <span className="font-extrabold uppercase text-navy">AWB:</span>{" "}
              <span className="font-mono text-brand" dir="ltr">
                {awb}
              </span>
            </p>
          )}
          {order.courier?.pickupOrderCode && (
            <p>
              <span className="font-extrabold uppercase text-navy">
                Pickup order:
              </span>{" "}
              <span className="font-mono text-brand" dir="ltr">
                {order.courier.pickupOrderCode}
              </span>
            </p>
          )}
        </div>
      )}

      {!awb && (order.status === "cancelled" || order.status === "returned") && (
        <p className="mt-3 border-s-4 border-navy/20 bg-surface p-3 text-xs text-muted">
          A {order.status} order cannot be shipped.
        </p>
      )}

      {!awb &&
        order.status !== "cancelled" &&
        order.status !== "returned" && (
          <div className="mt-4 space-y-3 bg-surface p-4">
            {autoFilled ? (
              <p className="border-s-4 border-green-500 bg-green-50 p-2 text-[11px] leading-tight text-green-700">
                <span className="font-extrabold uppercase">
                  Destination from order:
                </span>{" "}
                {order.shippingAddress.city}, {order.shippingAddress.governorate}{" "}
                — codes auto-filled. Just press Create.
              </p>
            ) : (
              <p className="text-[10px] leading-tight text-muted">
                Legacy order without Mylerz codes. Pick the city and zone that
                match the customer&apos;s address — Mylerz rejects the free-text
                address on its own.
              </p>
            )}

            {configError && (
              <p className="border-s-4 border-brand bg-brand/5 p-2 text-[11px] font-bold text-brand">
                {configError}
              </p>
            )}

            {!phoneOk && (
              <p className="border-s-4 border-brand bg-brand/5 p-2 text-[11px] leading-tight text-brand">
                <span className="font-extrabold uppercase">Invalid phone.</span>{" "}
                The recipient number{" "}
                <span className="font-mono" dir="ltr">
                  {order.customer.phone || "—"}
                </span>{" "}
                isn&apos;t a valid Egyptian mobile (01XXXXXXXXX). Mylerz will
                reject the shipment — fix the order&apos;s phone first.
              </p>
            )}

            <div>
              <label className={shipmentLabelCls}>Warehouse</label>
              <select
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                className={shipmentInputCls}
                disabled={loadingConfig}
              >
                {warehouses.length === 0 && (
                  <option value="">Server default warehouse</option>
                )}
                {warehouses.map((warehouse) => (
                  <option key={warehouse.name} value={warehouse.name}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={shipmentLabelCls}>City *</label>
                <select
                  value={cityCode}
                  onChange={(e) => selectCity(e.target.value)}
                  className={shipmentInputCls}
                  disabled={loadingConfig}
                >
                  <option value="">
                    {loadingConfig ? "Loading…" : "Select city"}
                  </option>
                  {cities.map((c) => (
                    <option key={c.code} value={c.code}>
                      {optionLabel(c.enName, c.arName)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={shipmentLabelCls}>Zone *</label>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="shrink-0 text-brand" />
                  <select
                    value={zoneCode}
                    onChange={(e) => {
                      setZoneCode(e.target.value);
                      setCharges(null);
                    }}
                    className={shipmentInputCls}
                    disabled={!selectedCity}
                  >
                    <option value="">
                      {selectedCity ? "Select zone" : "Pick city first"}
                    </option>
                    {zoneOptions.map((z) => (
                      <option key={z.code} value={z.code}>
                        {optionLabel(z.enName, z.arName)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {packageFields.map((field) => (
                <div key={field.label}>
                  <label className={shipmentLabelCls}>{field.label}</label>
                  <input
                    type="number"
                    min={0}
                    step={field.step}
                    value={field.value}
                    onChange={(e) => field.setValue(Number(e.target.value))}
                    className={shipmentInputCls}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className={shipmentLabelCls}>Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={shipmentInputCls}
                placeholder="Optional delivery notes"
              />
            </div>

            <button
              onClick={previewFee}
              disabled={!canShip || !warehouseName || busy === "charges"}
              className="w-full border-2 border-navy/15 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-navy hover:border-brand hover:text-brand transition-colors cursor-pointer disabled:opacity-50"
            >
              {busy === "charges" ? "Checking…" : "Preview shipping fee"}
            </button>

            {charges && (
              <div className="grid gap-1 border-s-4 border-navy bg-white p-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted">Shipping fee</span>
                  <span className="font-extrabold text-navy">
                    {charges.shippingFees.toLocaleString()} EGP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">VAT</span>
                  <span className="text-navy">
                    {charges.vat.toLocaleString()} EGP
                  </span>
                </div>
                {isCod && (
                  <div className="flex justify-between border-t border-navy/10 pt-1">
                    <span className="text-muted">Net transfer (COD)</span>
                    <span className="font-extrabold text-brand">
                      {charges.totalTransfer.toLocaleString()} EGP
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={createShipment}
              disabled={busy === "shipment" || !canShip}
              className="skew-cta w-full bg-navy py-3 text-xs font-display uppercase tracking-wider text-white hover:bg-navy-deep transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>
                {busy === "shipment"
                  ? "Creating..."
                  : !phoneOk
                    ? "Fix recipient phone first"
                    : canShip
                      ? "Create Mylerz Shipment"
                      : "Select city & zone"}
              </span>
            </button>
          </div>
        )}

      {awb && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MylerzButton
            busy={busy === "status"}
            label="Status"
            onClick={() => runPackageAction("status", getMylerzPackageStatus)}
          />
          <MylerzButton
            busy={busy === "details"}
            label="Details"
            onClick={() => runPackageAction("details", getMylerzPackageDetails)}
          />
          <MylerzButton
            busy={busy === "tracking"}
            label="Tracking"
            onClick={() => runPackageAction("tracking", getMylerzPackageTracking)}
          />
          <MylerzButton
            busy={busy === "tracking-url"}
            label="Tracking URL"
            icon={<ExternalLink size={13} />}
            onClick={() =>
              runPackageAction("tracking-url", getMylerzPackageTrackingUrl)
            }
          />
          <button
            onClick={() => runPackageAction("cancel", cancelMylerzPackage)}
            disabled={busy !== null}
            className="col-span-2 border-2 border-brand/30 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-brand hover:bg-brand hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {busy === "cancel" ? "Cancelling..." : "Cancel Mylerz Package"}
          </button>
        </div>
      )}

      {message && (
        <p className="mt-2 text-xs font-bold text-brand">{message}</p>
      )}
      {actionResult && (
        <pre className="mt-3 max-h-48 overflow-auto bg-navy p-3 text-[11px] leading-relaxed text-white">
          {actionResult}
        </pre>
      )}
    </section>
  );
}

function MylerzButton({
  label,
  busy,
  icon,
  onClick,
}: {
  label: string;
  busy: boolean;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex items-center justify-center gap-1 border-2 border-navy/15 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-navy hover:border-brand hover:text-brand transition-colors cursor-pointer disabled:opacity-50"
    >
      {busy ? <RefreshCw size={13} className="animate-spin" /> : icon}
      {busy ? "Loading..." : label}
    </button>
  );
}
