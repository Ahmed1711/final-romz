import {
  AlertTriangle,
  Banknote,
  CalendarRange,
  ClipboardList,
  Flame,
  Shirt,
  ShoppingCart,
  Tag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import {
  getAnalyticsOverview,
  getBestSellers,
  getCouponAnalytics,
  getLowStock,
  getOrders,
  getOrdersByStatus,
} from "@/lib/api";
import { adminCall } from "@/lib/adminAuth";
import RevenueChart from "@/components/admin/RevenueChart";
import { StatusPill } from "@/components/admin/StatusPill";

function KpiCard({
  label,
  value,
  change,
  alert = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: number;
  alert?: boolean;
  icon: LucideIcon;
}) {
  return (
    <div
      className={clsx(
        "border-2 bg-white p-4",
        alert ? "border-brand bg-brand/5" : "border-navy/10"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={clsx(
            "text-[11px] font-extrabold uppercase tracking-wider",
            alert ? "text-brand" : "text-muted"
          )}
        >
          {label}
        </p>
        <Icon size={16} className={alert ? "text-brand" : "text-navy"} />
      </div>
      <p
        className={clsx(
          "mt-2 font-display text-2xl",
          alert ? "text-brand" : "text-navy"
        )}
      >
        {value}
      </p>
      {change !== undefined && (
        <p
          className={clsx(
            "mt-1 flex items-center gap-1 text-xs font-bold",
            change < 0 ? "text-brand" : "text-success"
          )}
        >
          <TrendingUp size={12} /> {change >= 0 ? "+" : ""}
          {Math.round(change)}%
        </p>
      )}
    </div>
  );
}

const round = (n: number) => Math.round(n).toLocaleString();

export default async function AdminDashboard() {
  const [overview, ordersByStatus, bestSellers, lowStock, coupons, orders] =
    await adminCall((token) =>
      Promise.all([
        getAnalyticsOverview(token),
        getOrdersByStatus(token),
        getBestSellers(5, token),
        getLowStock(10, token),
        getCouponAnalytics(token),
        getOrders(token),
      ])
    );

  const maxStatusCount = Math.max(1, ...ordersByStatus.map((s) => s.count));
  const recentOrders = orders.slice(0, 6);

  return (
    <div className="p-6">
      {/* Topbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display uppercase text-2xl text-navy">
          Romz Athletic Wear
        </h1>
        <button className="flex items-center gap-2 border-2 border-navy/15 bg-white px-3 py-2 text-xs font-extrabold uppercase text-navy cursor-pointer hover:border-brand">
          <CalendarRange size={14} className="text-brand" />
          Last 30 Days
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Revenue"
          value={`EGP ${round(overview.revenue.value)}`}
          change={overview.revenue.changePercent}
          icon={Banknote}
        />
        <KpiCard
          label="Orders"
          value={String(overview.orders.value)}
          change={overview.orders.changePercent}
          icon={ShoppingCart}
        />
        <KpiCard
          label="Avg Order Value"
          value={`EGP ${round(overview.averageOrderValue.value)}`}
          change={overview.averageOrderValue.changePercent}
          icon={TrendingUp}
        />
        <KpiCard
          label="Items Sold"
          value={String(overview.itemsSold.value)}
          change={overview.itemsSold.changePercent}
          icon={Shirt}
        />
        <KpiCard
          label="Pending Orders"
          value={String(overview.pendingOrders.value)}
          alert
          icon={ClipboardList}
        />
        <KpiCard
          label="Low Stock"
          value={String(overview.lowStock.value)}
          alert
          icon={AlertTriangle}
        />
      </div>

      {/* Chart + status */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <RevenueChart />

        <div className="bg-white p-5 shadow-sm">
          <h2 className="font-display uppercase text-xl text-navy">
            Orders by Status
          </h2>
          <div className="mt-6 space-y-5">
            {ordersByStatus.length === 0 && (
              <p className="text-sm text-muted">No orders yet.</p>
            )}
            {ordersByStatus.map((s) => (
              <div key={s.status}>
                <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider">
                  <span className="text-navy">{s.status}</span>
                  <span
                    className={
                      s.status === "pending" ? "text-brand" : "text-navy"
                    }
                  >
                    {s.count}
                  </span>
                </div>
                <div className="h-2 w-full bg-surface">
                  <div
                    className={clsx(
                      "h-full",
                      s.status === "pending" ? "bg-brand" : "bg-navy"
                    )}
                    style={{ width: `${(s.count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best sellers + coupons */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-display uppercase text-xl text-navy">
            <Flame size={18} className="text-brand" /> Best Sellers
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-navy text-start text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="py-2 text-start">Product</th>
                <th className="py-2 text-end">Units</th>
                <th className="py-2 text-end">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-muted">
                    No sales yet.
                  </td>
                </tr>
              )}
              {bestSellers.map((p) => (
                <tr key={p.product} className="border-b border-navy/5">
                  <td className="flex items-center gap-3 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image || "/products/placeholder.svg"}
                      alt=""
                      className="h-10 w-10 bg-surface object-cover"
                    />
                    <span className="font-bold uppercase text-navy">
                      {p.name.en}
                    </span>
                  </td>
                  <td className="py-3 text-end font-display text-navy">
                    {p.qty}
                  </td>
                  <td className="py-3 text-end font-bold text-brand">
                    EGP {round(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-display uppercase text-xl text-navy">
            <Tag size={18} className="text-brand" /> Coupon Performance
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-navy text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="py-2 text-start">Code</th>
                <th className="py-2 text-end">Uses</th>
                <th className="py-2 text-end">Disc. Given</th>
                <th className="py-2 text-end">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-muted">
                    No coupon usage yet.
                  </td>
                </tr>
              )}
              {coupons.map((c) => (
                <tr key={c.code} className="border-b border-navy/5">
                  <td className="py-3">
                    <span className="bg-navy px-2 py-1 text-[11px] font-extrabold text-white">
                      {c.code}
                    </span>
                  </td>
                  <td className="py-3 text-end font-display text-navy">
                    {c.uses}
                  </td>
                  <td className="py-3 text-end font-bold text-brand">
                    EGP {round(c.totalDiscountGiven)}
                  </td>
                  <td className="py-3 text-end text-navy">
                    EGP {round(c.revenueGenerated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low stock + recent orders */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-display uppercase text-xl text-navy">
            <AlertTriangle size={18} className="text-brand" /> Low Stock Alerts
          </h2>
          <div className="mt-4 divide-y divide-navy/5">
            {lowStock.length === 0 && (
              <p className="py-4 text-sm text-muted">Everything is well stocked.</p>
            )}
            {lowStock.map((v) => (
              <div
                key={v.sku}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-bold uppercase text-navy">{v.name.en}</p>
                  <p className="font-mono text-xs text-muted">{v.sku}</p>
                </div>
                <span className="bg-brand/10 px-3 py-1 font-display text-brand">
                  {v.stock}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 shadow-sm">
          <h2 className="font-display uppercase text-xl text-navy">
            Recent Orders
          </h2>
          <div className="mt-4 divide-y divide-navy/5">
            {recentOrders.length === 0 && (
              <p className="py-4 text-sm text-muted">No orders yet.</p>
            )}
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href="/admin/orders"
                className="flex items-center justify-between py-3 text-sm hover:bg-surface"
              >
                <div>
                  <p className="font-extrabold text-navy" dir="ltr">
                    {o.orderNumber}
                  </p>
                  <p className="text-xs text-muted">{o.customer.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-navy">
                    EGP {round(o.total)}
                  </span>
                  <StatusPill status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
